# SelfScience — Platform Documentation

> A comprehensive reference for what SelfScience is, what it does, how it is built, and the principles that shape it.

Version: **v1.0** (2026-07)
Production: **[https://selfscience.io](https://selfscience.io)**
Status: **Live**

---

## 1. What is SelfScience?

SelfScience is a **privacy-first, evidence-based health research platform** that helps people understand their own biology through published science — their DNA, their blood work, the food they eat, the supplements they consider, and the way they train.

It is **not** a diagnostic tool. It is **not** a medical device. It does not prescribe, treat, or claim to cure. Instead, it is a **research literacy tool**: it makes the same kind of literature and label data used by clinicians and researchers legible and browsable to a curious adult, while surfacing the parts most relevant to *their* biology.

Everything sensitive — genome files, biomarker labs, journaled food, medications — stays in the browser. Nothing personal is uploaded to a server. That constraint shapes almost every architectural choice below.

---

## 2. Product Philosophy

Six principles run through every feature:

1. **No black boxes.** Every finding on the platform ties back to a specific gene, variant, study, or ingredient label. Nothing is invented; everything can be audited by a curious user.
2. **Educational, not prescriptive.** We surface *what the research says*. We never say "take this" or "your risk is X%". Users make their own decisions with their own clinicians.
3. **Client-side by default.** Genome files, biomarkers, medication lists, food journals never leave the device unless the user explicitly exports them. Server-rendered pages don't see any of it.
4. **Official sources only.** For food we use Open Food Facts. For supplements we link only to brand-direct websites (no marketplaces, no affiliate links). For research we use PubMed. For genes we use published literature curated in-repo.
5. **Progressive disclosure.** Beginners see one clean question ("Search the science"). Power users get filters, gene chips, pillar facets, and side-by-side comparisons.
6. **Own your own data.** Users can export their entire report (PDF, CSV, Markdown, print-ready practitioner sheet) any time.

---

## 3. The 10 Pillars

Everything on the platform is organized around 10 research **Pillars**. These are the top-level facets that shape search, dashboards, gene classification, and content taxonomy.

| # | Pillar                              | Focus |
|---|-------------------------------------|-------|
| 1 | **Genomics**                        | Understanding your genetic variants and what current research says about them |
| 2 | **Nutrition**                       | How genes influence how your body processes food, nutrients, and dietary patterns |
| 3 | **Sports Performance**              | Athletic ability, training adaptation, injury risk, and recovery |
| 4 | **Longevity**                       | Cellular aging, telomeres, NAD+ pathways, healthspan research |
| 5 | **General Wellness**                | Sleep, stress, gut health, and daily-habit research |
| 6 | **Pharmacogenomics**                | How genes affect the way your body processes medications and supplements |
| 7 | **Mental Health & Neurochemistry**  | Mood, stress response, dopamine, serotonin, brain chemistry |
| 8 | **Environmental Sensitivity**       | Response to environmental exposures, toxins, chemical sensitivity |
| 9 | **Hormones & Endocrine Health**     | Testosterone, estrogen, thyroid, cortisol, leptin |
| 10| **Pediatric & Youth Wellness**      | Growth, development, ADHD, allergies, adolescent research (dedicated hub at `/pillars/youth`) |

Pillars appear as the **primary filter** on the Dashboard, Genome page, and Search page. Selecting a pillar (`?pillar=Longevity`) filters the visible gene set, research matches, findings, and protocol picks to that pillar's context.

---

## 4. Core Features (User Journey)

### 4.1 Search — `/search`
The literal front door. A single search box that queries the scientific literature (PubMed + Semantic Scholar). Enhancements:

* **Pillar pills** — Narrow the corpus to a specific pillar (e.g., only Longevity papers).
* **Your genome chips** — When a genome is uploaded, the user's own gene symbols appear as tappable chips. Tapping a chip fans out cross-reference searches (up to 12 genes at once).
* **Date filter** — Last 10 years by default when a pillar is active; All time when a gene fan-out is running (older mechanistic papers matter for narrow queries).
* **Source-type filter** — All / Reviews / Trials / etc.
* **Reliability & plain-language layers** — Studies are scored for reliability (sample size, design, replication) and can be rendered in plain language (LLM-generated summary, cached).
* **Ancestry-aware highlighting** — Population frequencies displayed per-population when relevant.

### 4.2 Genome — `/genome`
Upload a raw genome file (23andMe, AncestryDNA, MyHeritage) — parsed entirely in the browser.

* **Parser** at `/app/lib/genome-parser.js` handles ~671 curated variants + haplotype-level classifiers (APOE, MTHFR, COMT, VDR, HLA, etc.).
* **Classifier** (`/app/lib/genomeClassifier.js` + `/app/lib/haplotypeClassifiers.js`) tags each variant with:
  * Pillar
  * Classification (Strength / Awareness / Neutral)
  * Evidence strength
  * Population frequency
  * Cross-references to youth content, biomarkers, supplements, drugs
* **Overview tab** — Your genetic strengths, areas to explore, filterable by pillar and classification.
* **Detail tabs** — Per-pillar breakdowns, protocol matches, share card generation.
* **Export** — Markdown report, CSV variants, print-ready practitioner report.
* **Sample data** — Try the platform without uploading anything.

### 4.3 Dashboard — `/`
When a genome is uploaded, the homepage becomes a personalized dashboard:

* **Pillar Score Overview** — 10-tile grid showing per-pillar summary counts
* **Explore Your Pillars** — Deep-link cards that pass pillar + your genes into a fan-out search
* **Your Top Findings**
* **Your Genetic Strengths / Areas to Explore**
* **Research Matched to You** — Live PubMed queries against your top genes
* **Your Protocol Preview** — Priority / lifestyle / awareness picks from the supplement protocol engine
* **Global pillar filter** at the top of the page — filters all of the above via `?pillar=<name>` (persisted in the URL)

### 4.4 Nutrition Hub — `/nutrition`
Three tabs:

* **Foods** — Curated searchable food catalogue with genome-aware annotations (e.g., "Contains gluten — you carry HLA-DQ2.5" or "High saturated fat — you carry APOE ε4"). Uses `/app/lib/nutritionGenomics.js` to score every food against your active rules.
* **Journal** — Log the day's meals; auto-summarised nutrition report at day-close. Stored client-side in localStorage.
* **Scanner** — Camera-based barcode scanner (html5-qrcode) that queries **Open Food Facts** for label data and analyzes each product against genome-derived rules.
  * "Browse by category" is a collapsible panel of aisle-grouped OFF category browses.
  * Genome-aware grade (A–D) and severity flags per product.
  * "Clean alternatives" suggestions for chips, protein bars, cereals, etc.

### 4.5 Biomarker Panel — `/biomarkers`
Log blood work (10+ common markers: HDL, LDL, HbA1c, hs-CRP, Homocysteine, Vitamin D, ALT, ferritin, TSH, etc.). Each marker is:

* Cross-referenced with your **genome** (which of your variants influence this marker's typical range).
* Cross-referenced with your **supplements & medications** (which drug or supplement may shift the value).
* Delivered as a printable clinician-friendly report at `/biomarkers/report`.

Biomarker data is stored in **sessionStorage only** — cleared on tab close by default (user opts in to persistence).

### 4.6 Supplement Discovery — `/tools/supplements`
A three-phase feature set for evidence-based supplement research. **Never prescribes. Never links to Amazon.**

**Phase 1 — Discovery**
* Choose by **goal** (Sleep, Methylation, Cognition, Cardio, Immune, Longevity, Stress & Mood, Energy).
* Powered by the **NIH DSLD** (Dietary Supplement Label Database) v9 — real label data for tens of thousands of US products.
* Products grouped into **variant families** (same product line, different doses) to prevent scroll fatigue.
* Brand-direct URLs only; each brand curated in `brandDirectory.js`.

**Phase 2 — Trust & Transparency**
* **Certifications** parsed from labels: NSF, USP, IFOS, ConsumerLab, Informed Sport.
* **Brand Profiles Drawer** — Every brand has a profile page with transparency score, CoA availability, sourcing statements.
* **Gold-tier filter** — Show only products meeting the strictest transparency + certification bar.
* **Brand Leaderboard** at `/tools/supplements/brands` — Every curated brand ranked by transparency score.

**Phase 3 — Personalisation**
* **Match to your variants** — Uses your uploaded genome to highlight supplements aligned with your gene set (e.g., methylfolate over folic acid if you carry MTHFR variants).
* **Compare Drawer** — Side-by-side comparison of up to 3 products (with a family-mismatch confirmation when comparing apples to oranges).
* **Budget swap-ins** — `$` / `$$` / `$$$` alternatives for each pick.
* **Cost sort** — Sort by cost-per-serving.
* All matching happens **client-side** — your genome never leaves your browser.

Additional views:
* `/tools/supplements/my-variants` — Which of your variants are driving which supplement recommendations.
* Related links from the Training Protocol and Practitioner Report.

### 4.7 Training Protocol — `/tools/training`
Personalized training zones and sport affinity based on your genome (ACTN3, ACE, PPARGC1A, IGF-1, MSTN, etc.). Cross-linked to supplement recommendations for recovery + performance.

### 4.8 Drug Check — `/drug-check`
Pharmacogenomic guidance for common medications. Uses `/app/lib/drugCatalog.js` + `/app/lib/pgxClassifier.js` for a small curated set (SSRIs, statins, blood thinners, common OTC drugs) matched against your variants.

**Not medical advice.** All results carry a `PgxDisclaimer` and CPIC-style guidance links.

### 4.9 Population Compare — `/population-compare`
Shows how each of your variants compares to global population frequencies (from `/app/lib/populationFrequencies.js` and `/app/lib/populationDetailFrequencies.js`).

### 4.10 Ancestry — `/ancestry`
A rough **educational** ancestry sketch from your uploaded genome. Explicitly not a substitute for 23andMe/AncestryDNA's professional pipelines.

### 4.11 Practitioner Report — `/practitioner-report`
Print-ready summary you can hand to a doctor / functional-medicine practitioner. Aggregates your genome, biomarkers, supplements, medications, and lifestyle notes into a clean single-page (or multi-page) PDF-ready sheet.

### 4.12 Get Started (Kits) — `/get-started`
Guidance on which DNA kits (23andMe, AncestryDNA, MyHeritage) and blood-work kits are compatible with SelfScience. No affiliate links.

### 4.13 Editorial / Articles
Full-featured CMS at `/admin/articles` for staff-written articles. Articles surface on:

* Homepage (`EditorialFeatured`)
* Search page (as "Editorial picks")
* Dedicated article pages at `/articles/[slug]`

Powered by **Supabase Postgres** with row-level publishing controls, cover images, and pillar tagging. Articles do NOT touch genome data — they are pure editorial.

### 4.14 Reading List — `/reading-list`
Curated book collection with per-book search queries that surface related genes + studies.

### 4.15 Youth Hub — `/pillars/youth`
A dedicated child-safety-conscious surface for the Pediatric & Youth Wellness pillar. Contains:
* `/pillars/youth/early-advantage` — Nutrition and development research for parents.
* `/pillars/youth/genome-for-parents` — Guidance on whether/how to genotype a child.

### 4.16 Mission / How It Works / Privacy / Terms / Support
Static content pages explaining the platform's philosophy, methodology, data handling, and legal terms.

---

## 5. Technology Stack

### 5.1 Frontend
* **Next.js 15.5** (App Router)
* **React 19**
* **TailwindCSS 3.4** + custom design tokens
* **shadcn/ui** (Radix primitives) — Dialog, Dropdown, Tabs, Popover, etc.
* **Lucide-react** icons
* **framer-motion** for micro-animations
* **recharts** for population-frequency charts
* **html5-qrcode** for barcode scanning
* **html2canvas** + `jszip` for shareable card images
* **Serwist** for PWA / offline / service-worker cache management
* **@tanstack/react-query** + `swr` for client-side data fetching

### 5.2 Backend
* **Next.js API routes** — single catch-all at `/app/app/api/[[...path]]/route.js` handles most endpoints, with dedicated routes for high-traffic paths (`/api/nutrition/product`, `/api/pubmed-search`, `/api/genome/generate`).
* All API routes are `export const dynamic = 'force-dynamic'` and return `Cache-Control: no-store` — nothing personal is ever cached.

### 5.3 Data Layer
* **MongoDB** — Reserved for editorial content persistence and future community features.
* **Supabase** — Editorial articles CMS. Row-level publishing + featured flags.
* **In-repo JSON/JS** — Brand curation, kit catalog, variant catalog, drug catalog, book library. Kept in code so the app can be deployed without a database round-trip for the vast majority of reads.

### 5.4 Third-Party APIs
| API | Purpose | Auth |
|-----|---------|------|
| **PubMed E-utilities** | Literature search + study details | API key (optional, higher rate limit) |
| **Semantic Scholar Graph API** | Study metadata enrichment | None required |
| **Open Food Facts** | Barcode → nutrition label lookup | None required |
| **NIH DSLD v9** | Supplement product labels | None required |
| **ExerciseDB (v1.exercisedb.io)** | Exercise catalogue for training protocols | None required |
| **OpenRouter / Together AI** | Reliability scoring + plain-language summaries + genome generation | API key required |
| **Supabase** | Editorial CMS storage | Service key + anon key |

### 5.5 PWA & Offline
* **Serwist** (Workbox-derived) service worker at `/app/app/sw.js`.
* Precache: HTML shells with `NetworkFirst` (24h), API GETs with `NetworkOnly`, images `CacheFirst`.
* **Auto-updater** at `/app/components/PWAUpdater.jsx` — polls for new SW every 30 minutes; when a new one is installed, reloads on `controllerchange`.
* Installable on iOS / Android home screens; standalone `/manifest.json`.
* `CACHE_VERSION` bumped manually to purge every client cache on breaking releases.

---

## 6. Architecture

### 6.1 Directory Layout
```
/app
├── app/                    Next.js App Router pages + API
│   ├── (marketing)/        Static content (mission, how-it-works, etc.)
│   ├── admin/              Article CMS + AI usage dashboard
│   ├── api/                Backend routes (catch-all + specific)
│   ├── articles/[slug]/    Individual editorial articles
│   ├── biomarkers/         Blood-work logger + report
│   ├── genome/             Upload, parse, browse variants
│   ├── nutrition/          Foods, journal, scanner
│   ├── pillars/youth/      Youth-wellness hub
│   ├── search/             Main research search
│   ├── tools/              Feature tools
│   │   ├── supplements/    Discovery, brands leaderboard, my-variants
│   │   └── training/       Training protocol engine
│   ├── layout.js           Root layout (SiteNav, MobileNav, PWAUpdater)
│   ├── page.js             Landing / Dashboard
│   └── sw.js               Serwist config
├── components/
│   ├── supplements/        Supplement UI (grouped cards, compare, brand drawer)
│   ├── training/           Training tab nav
│   ├── biomarkers/         Biomarker input + report renderers
│   ├── genome/             Genome supplement links, share cards
│   ├── admin/              Article editor components
│   ├── ui/                 shadcn primitives
│   ├── Dashboard.jsx       Personalised home
│   ├── PillarFilter.jsx    Shared pillar dropdown + banner
│   ├── BarcodeScanner.jsx  html5-qrcode wrapper
│   └── site-nav.jsx        Top nav + PILLARS export
├── lib/
│   ├── supplements/        NIH DSLD normaliser, brand profiles, personalisation
│   ├── genome-parser.js    23andMe/Ancestry/MyHeritage → variant array
│   ├── genomeClassifier.js Variant → pillar + severity + evidence
│   ├── haplotypeClassifiers.js  APOE, MTHFR, COMT, VDR, HLA logic
│   ├── nutritionGenomics.js     Food scoring against active rules
│   ├── pillars.js               Pillar canonical names + query mapping
│   ├── variant-catalog.js       671-variant curated table
│   ├── populationFrequencies.js Global + population-specific rsID freqs
│   └── supabase/                Supabase client factories
├── public/
│   ├── icons/              PWA icons
│   ├── manifest.json       PWA manifest
│   └── sw.js               Compiled service worker
├── memory/
│   └── PRD.md              Product requirements (evolving)
├── test_result.md          Testing agent runbook + history
└── package.json
```

### 6.2 Data Flow

```
┌────────────────────┐    ┌────────────────────┐    ┌────────────────────┐
│  User's Browser    │    │  Next.js Server    │    │  Third-party APIs  │
│  (all sensitive    │    │  (stateless proxy) │    │  PubMed, DSLD,     │
│   data lives here) │    │                    │    │  OFF, Supabase     │
└─────────┬──────────┘    └─────────┬──────────┘    └─────────┬──────────┘
          │                          │                          │
   Upload genome                     │                          │
   → parse in browser                │                          │
   → store in sessionStorage         │                          │
          │                          │                          │
   Search: "MTHFR" ─────────► /api/pubmed-search ─────────────► PubMed
          │                                                    ▼
          │◄─────────────── study results ◄────────────────────┘
          │                          │
   Scan barcode                      │                          
   → decode client-side              │                          
   → /api/nutrition/product?barcode= ► Open Food Facts ────────►
          │                                                    ▼
          │◄─────────────── product data ◄─────────────────────┘
          │
   Combine product + genome-derived rules → analyzeProduct() (client)
          ▼
   Show A/B/C/D grade + flags — never sends genome to server
```

### 6.3 Client-Side State Buckets
* **`sessionStorage`** — Genome results, biomarkers, journaled food (cleared on tab close by default).
* **`localStorage`** — User preferences, PWA install prompts, tour completion, saved reading list positions.
* **URL query params** — `?pillar=`, `?genes=`, `?q=` for deep-linkable state.
* **In-memory (React state)** — All UI transient state.

**Zero database writes contain genome, biomarker, or medication data.**

---

## 7. Privacy Model

SelfScience treats health data like a bank treats vault access:

1. **Client-side parse** — Genome files never touch our server. The `.txt` / `.zip` is opened by the browser's `FileReader`, parsed by `/app/lib/genome-parser.js`, and the raw file is discarded after parsing.
2. **Client-side classification** — All rule-matching (variant → pillar, food → flag, supplement → match) happens in the browser.
3. **Server as pass-through** — Our `/api/*` routes are stateless proxies to public research APIs. They log nothing user-identifying.
4. **No accounts by default** — Users can use every feature without signing up. Admin login (for editorial CMS) is separate.
5. **Clearable session** — A single "clear my data" action wipes sessionStorage + localStorage.
6. **Right to export** — Every report can be downloaded (MD, CSV, PDF-ready) at any time.

For details, see `/privacy` on the live site.

---

## 8. Deployment

### 8.1 Environments
| Env | URL | Purpose |
|-----|-----|---------|
| **Preview** | `*.preview.emergentagent.com` | Development sandbox |
| **Production** | `https://selfscience.io` | Live user-facing |

### 8.2 Environment Variables (protected)
```
MONGO_URL                 # MongoDB connection (editorial + future community)
NEXT_PUBLIC_BASE_URL      # Public URL for absolute-URL generation
SUPABASE_URL              # Editorial CMS
SUPABASE_SERVICE_KEY      # Editorial CMS (server-only)
SUPABASE_ANON_KEY         # Editorial CMS (public)
PUBMED_API_KEY            # Optional; higher rate limits
OPENROUTER_API_KEY        # Reliability + plain-language + genome-gen
```

### 8.3 Supervisor
Runs `next start` on `0.0.0.0:3000` via supervisor.
```
sudo supervisorctl restart nextjs
sudo supervisorctl status
```

### 8.4 Kubernetes / Ingress
All `/api/*` traffic routes to Next.js on port 3000. Frontend routes also go to 3000. No separate FastAPI backend.

### 8.5 PWA Deployment Notes
* Bump `CACHE_VERSION` in `/app/app/sw.js` on breaking changes to force a purge of stale mobile-PWA caches.
* Editorial API endpoints (`/api/editorial/*`) send `Cache-Control: no-store` so new articles appear on mobile immediately (without waiting for the 24h HTML NetworkFirst TTL).

---

## 9. Editorial / Admin

Admins at `/admin/login` (Supabase-authed) access:

* **`/admin/articles`** — List, search, publish/unpublish, feature/unfeature.
* **`/admin/articles/new`** — Create.
* **`/admin/articles/[id]/edit`** — Edit.
* **`/admin/articles/import`** — Bulk import from CSV / JSON.
* **`/admin/ai-usage`** — Dashboard of LLM call volume, cost, cascade tier hits.

Articles support:
* Cover image + alt text
* Pillar tagging
* Publish + feature flags
* Rich Markdown body
* SEO metadata

---

## 10. Testing & QA

* **`/app/test_result.md`** — Living test runbook. Every session adds a `main` or `testing` message with what was changed and what was verified.
* **`deep_testing_backend_nextjs`** — Automated backend API testing agent.
* **`deep_testing_frontend_nextjs`** — Playwright-driven end-to-end UI tester.
* **Manual regression checklist** kept in `test_result.md` (e.g., "dose text '1,000 mcg' still renders correctly," "mobile hamburger includes Supplements link").

---

## 11. Design System

### Colours (Tailwind tokens)
* `ss-teal` — Primary (buttons, links, active state)
* `ss-orange` — Secondary (highlights, active pills)
* `ss-amber` — "Areas to explore" / caution
* `ss-green` — "Strengths" / success
* `ss-bg` / `ss-bg-warm` — Page backgrounds
* `ss-muted` — Secondary text
* `ss-border-warm` — Card borders
* `ss-text` — Body text

### Typography
* Body: system-ui stack, 15–16px base
* Headers: Bold, tight tracking
* Small caps for section labels (`text-[10px] font-bold uppercase tracking-widest`)

### Components
* Cards: `rounded-2xl border border-ss-border-warm bg-white shadow-sm`
* Buttons: `rounded-full border-2 border-ss-teal ... hover:bg-ss-teal hover:text-white`
* Chips: `inline-flex items-center gap-1 rounded-full ...`
* Advisory banners: teal-tinted `bg-ss-teal/5 border-ss-teal/25`

---

## 12. Glossary

| Term | Meaning |
|------|---------|
| **Pillar** | One of the 10 top-level research categories (see §3). |
| **Variant** | A specific position in your DNA (e.g., rs1801133 = MTHFR C677T). |
| **Classification** | How the classifier tags a variant: Strength / Awareness / Neutral. |
| **Report** | The full parsed + classified result of a genome upload, stored in sessionStorage. |
| **Active Rule** | A supplement / food / drug interaction rule triggered by one of the user's variants. |
| **DSLD** | NIH Dietary Supplement Label Database — our primary supplement data source. |
| **OFF** | Open Food Facts — our barcode → nutrition label data source. |
| **PGx** | Pharmacogenomics — how genes affect drug response. |
| **Fan-out search** | Selecting multiple gene chips at once and searching all of them together. |
| **Family** (supplements) | A group of variants of the same product (e.g., Vitamin D3 in 1000/2000/5000 IU). |
| **Transparency score** | 0–100 rating we give brands based on certifications, CoAs, sourcing disclosure. |

---

## 13. Roadmap (as of this doc)

**Backlog**
* Family Comparison — Upload a second genome to run a side-by-side comparison.
* Weekly Digest / Newsletter — Curated new research and article roundup.
* Community Discussions — Moderated per-pillar conversation threads.
* `POST /api/supplements/prices` — Admin-token protected endpoint for the price scraper.
* Break `/app/app/api/[[...path]]/route.js` (~1600 lines) into modular route handlers.

**Recently shipped**
* Collapsible "Browse by category" on the Nutrition scanner.
* Pillar → gene filter (URL-persisted) across Dashboard, Genome, Search.
* Mobile nav Supplements + Brand Leaderboard entries.
* Barcode scanner crash-hardening (stable callback ref + format filter).
* Dose text truncation fix ("1,000 mcg" no longer renders as "000 mcg").
* No-store cache headers on editorial endpoints (mobile-PWA freshness).

---

## 14. Contact / Support

* **In-app support** — `/support` page contains contact form + FAQ.
* **Admin issues** — Emergent Support (deployment / env-var problems).
* **Editorial submissions** — Contact form → routed to admin queue.

---

## 15. Legal & Not-Medical-Advice Disclaimer

SelfScience is an educational research tool. It is **not a medical device** and does not diagnose, treat, cure, or prevent any disease. Every finding is a research-informed observation, not a medical recommendation. Users should consult qualified healthcare professionals before acting on anything they read on the platform. Full legal terms at `/terms`. Privacy policy at `/privacy`.

---

*Last updated: 2026-07. This document is versioned in the repo at `/app/docs/PLATFORM.md` — please update it whenever a major feature ships.*
