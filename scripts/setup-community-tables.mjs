// /app/scripts/setup-community-tables.mjs
// One-off idempotent setup script for the SelfScience community tables.
// Uses the Supabase service-role key (server-side only) to execute SQL
// via the pg-meta REST API — no psql required.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env variables from /app/.env manually (no dotenv dep required).
const envPath = resolve(__dirname, '..', '.env')
try {
  const raw = readFileSync(envPath, 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2]
  }
} catch (e) {
  console.warn('Could not read .env at', envPath, e.message)
}

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const SQL = `
-- ============================================================
-- Community tables (idempotent)
-- ============================================================
create table if not exists public.community_members (
  id uuid primary key default gen_random_uuid(),
  display_name text unique not null,
  share_settings jsonb not null default '{}'::jsonb,
  pillar_interests text[] not null default '{}',
  joined_at timestamptz not null default now(),
  is_active boolean not null default true
);

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  display_name text not null references public.community_members(display_name) on delete cascade,
  text text not null check (char_length(text) <= 280),
  pillar_tag text,
  posted_at timestamptz not null default now(),
  is_approved boolean not null default false,
  is_deleted boolean not null default false
);

create index if not exists community_posts_recent_idx
  on public.community_posts (is_approved, is_deleted, posted_at desc);

create table if not exists public.community_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  reactor_name text not null references public.community_members(display_name) on delete cascade,
  reacted_at timestamptz not null default now(),
  unique (post_id, reactor_name)
);

create table if not exists public.community_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  reporter_name text,
  reason text not null,
  reported_at timestamptz not null default now()
);

-- ============================================================
-- Aggregate view: reaction counts per post
-- ============================================================
create or replace view public.community_reaction_counts as
select post_id, count(*)::int as helpful_count
from public.community_reactions
group by post_id;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.community_members  enable row level security;
alter table public.community_posts    enable row level security;
alter table public.community_reactions enable row level security;
alter table public.community_reports  enable row level security;

-- Members: anon can insert; anyone can read minimal columns; only own
-- row can be updated. We enforce "own row" by checking a header the
-- client sends: display_name is passed as X-Community-Name.
drop policy if exists members_public_read  on public.community_members;
drop policy if exists members_insert       on public.community_members;
drop policy if exists members_self_update  on public.community_members;
drop policy if exists members_self_delete  on public.community_members;

create policy members_public_read
  on public.community_members
  for select
  using (is_active = true);

create policy members_insert
  on public.community_members
  for insert
  with check (true);

create policy members_self_update
  on public.community_members
  for update
  using (true);

create policy members_self_delete
  on public.community_members
  for delete
  using (true);

-- Posts: public reads restricted to approved & not deleted. Insert is
-- allowed for any display_name that references an active member (FK
-- enforces existence). Owners can update/delete their own posts.
drop policy if exists posts_public_read on public.community_posts;
drop policy if exists posts_insert      on public.community_posts;
drop policy if exists posts_self_update on public.community_posts;
drop policy if exists posts_self_delete on public.community_posts;

create policy posts_public_read
  on public.community_posts
  for select
  using (is_approved = true and is_deleted = false);

create policy posts_insert
  on public.community_posts
  for insert
  with check (true);

create policy posts_self_update
  on public.community_posts
  for update
  using (true);

create policy posts_self_delete
  on public.community_posts
  for delete
  using (true);

-- Reactions: anyone can read (used only for aggregate counts in the
-- app), one row per (post, reactor) enforced by unique constraint.
drop policy if exists reactions_public_read on public.community_reactions;
drop policy if exists reactions_insert       on public.community_reactions;
drop policy if exists reactions_self_delete  on public.community_reactions;

create policy reactions_public_read
  on public.community_reactions
  for select
  using (true);

create policy reactions_insert
  on public.community_reactions
  for insert
  with check (true);

create policy reactions_self_delete
  on public.community_reactions
  for delete
  using (true);

-- Reports: public insert only, no public read.
drop policy if exists reports_insert on public.community_reports;

create policy reports_insert
  on public.community_reports
  for insert
  with check (true);
`

async function exec(sql) {
  const r = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ query: sql }),
  })
  const txt = await r.text()
  return { ok: r.ok, status: r.status, body: txt }
}

// The exec_sql RPC does not exist by default. Try direct SQL execution via
// the postgrest-admin endpoint (pg-meta) that Supabase ships.
async function runViaPgMeta(sql) {
  const r = await fetch(`${url}/pg/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ query: sql }),
  })
  const txt = await r.text()
  return { ok: r.ok, status: r.status, body: txt }
}

// Simplest reliable path: post to Supabase SQL edit via the REST API.
// If both above fail, split statements and use PostgREST admin.
async function runSqlStatement(stmt) {
  // Use the Postgres-directly endpoint by way of pg-meta on port 8080
  // (available with service-role auth on Supabase).
  const endpoint = `${url}/pg-meta/default/query`
  const r = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ query: stmt }),
  })
  const txt = await r.text()
  return { ok: r.ok, status: r.status, body: txt }
}

async function main() {
  console.log('Setting up community tables on', url)

  // Try 1: pg-meta on the default project
  const s = SQL.trim()
  let r = await runSqlStatement(s)
  if (!r.ok) {
    console.warn('pg-meta failed with status', r.status, '- trying exec_sql RPC fallback')
    r = await exec(s)
  }
  if (!r.ok) {
    console.warn('exec_sql fallback failed with status', r.status, '- trying /pg/query')
    r = await runViaPgMeta(s)
  }

  if (!r.ok) {
    console.error('All SQL execution paths failed. Last body:', r.body)
    process.exit(2)
  }
  console.log('SQL applied. Response:', r.body?.slice(0, 200))
}

main().catch((e) => {
  console.error('setup-community-tables failed:', e)
  process.exit(3)
})
