-- SelfScience Community — Supabase schema
-- Run this once in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- Idempotent: safe to re-run.

-- ============================================================
-- Tables
-- ============================================================
create table if not exists public.community_members (
  id uuid primary key default gen_random_uuid(),
  display_name text unique not null,
  share_settings jsonb not null default '{}'::jsonb,
  pillar_interests text[] not null default '{}',
  joined_at timestamptz not null default now(),
  is_active boolean not null default true
);

-- Anonymized finding labels (plain-English names only, e.g. "MTHFR C677T").
-- Never includes rsID or genotype. Populated only when the user has
-- share_settings.finding_counts = true. Powers Section C aggregate stats.
alter table public.community_members
  add column if not exists finding_labels text[] not null default '{}';

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

-- Aggregate view: reaction counts per post (public read)
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

-- Members
drop policy if exists members_public_read  on public.community_members;
drop policy if exists members_insert       on public.community_members;
drop policy if exists members_self_update  on public.community_members;
drop policy if exists members_self_delete  on public.community_members;

create policy members_public_read on public.community_members for select using (is_active = true);
create policy members_insert      on public.community_members for insert with check (true);
create policy members_self_update on public.community_members for update using (true);
create policy members_self_delete on public.community_members for delete using (true);

-- Posts
drop policy if exists posts_public_read on public.community_posts;
drop policy if exists posts_insert      on public.community_posts;
drop policy if exists posts_self_update on public.community_posts;
drop policy if exists posts_self_delete on public.community_posts;

create policy posts_public_read on public.community_posts for select using (is_approved = true and is_deleted = false);
create policy posts_insert      on public.community_posts for insert with check (true);
create policy posts_self_update on public.community_posts for update using (true);
create policy posts_self_delete on public.community_posts for delete using (true);

-- Reactions
drop policy if exists reactions_public_read on public.community_reactions;
drop policy if exists reactions_insert       on public.community_reactions;
drop policy if exists reactions_self_delete  on public.community_reactions;

create policy reactions_public_read on public.community_reactions for select using (true);
create policy reactions_insert      on public.community_reactions for insert with check (true);
create policy reactions_self_delete on public.community_reactions for delete using (true);

-- Reports
drop policy if exists reports_insert on public.community_reports;
create policy reports_insert on public.community_reports for insert with check (true);
