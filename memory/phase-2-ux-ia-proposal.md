# Phase 2 UX — Information-Architecture Proposal

**Ref:** GitHub issue #2 · "Phase 2 UX: reduce navigation/homepage density and scope creep cleanup"
**Status:** Proposal for review — **no code yet**
**Author:** SelfScience code review agent
**Scope guardrails (per issue #2):**
- No new features, no A/B tests, no admin dashboards, no streaming, no safety-system work
- No commits or PRs at this stage
- Text/markdown only

---

## Goal restated

A **first-time visitor** should be able to identify their **one next action** within a **single screen of scrolling** on `/` — and a returning user should be able to reach any tool via a nav that never asks them to scan more than one dropdown of 6-ish items.

---

## 1 · Homepage section audit

Below is every section currently rendered on `/` for a visitor *without* a genome loaded (`DiscoverHome`) — enumerated in scroll order from the source (`/app/app/page.js`).

| # | Section (source line) | Purpose today | Recommendation | Why |
|---|---|---|---|---|
| 1 | **Hero** — teal full-viewport w/ primary "Start Here — Upload Your File" CTA + A/B secondary quiz CTA (line 385) | Get user into one of two onboarding paths | ✅ **Keep** — but **shrink** to ~70vh so the reader always sees the top of section 2 (the 3-step explainer) below the fold-line. Currently `min-h-[100vh]` pushes everything else off-screen | Directly serves the "one next action in one screen" goal |
| 2 | **HomeStepsExplainer** — 3-step "Start your way / We read your variants / You get plain answers" (line 517) | Reassure visitor the flow is short | ✅ **Keep as-is** — small, scannable, immediately reinforces the hero | Cheap density; helps commitment to CTA |
| 3 | **StartHereBanner** (line 524) | Second CTA banner reminding them to start | ⚠️ **Remove from home.** Move copy into the hero or into `/get-started`. It's a duplicate of the hero CTA on the same screen | Two "start" affordances 100vh apart is scope creep and dilutes the primary action |
| 4 | **Genome-upload card** with `<GenomeFlowIllustration />` (line 527, id=`genome-upload`) | Deep-dive on what the upload does | ⚠️ **Move off homepage → `/get-started` (or `/genome`)** | Anyone still on the homepage past the hero is browsing, not uploading. The `#genome-upload` anchor from the hero's "See which test to get →" link stays, but the section itself lives on a dedicated page |
| 5 | **Featured Research** carousel — `<EditorialFeatured limit={6} />` (line 577) | Show fresh content to signal an active, credible platform | 🔁 **Move lower** — after the pillars grid. First-time visitors don't yet care about individual articles; they care whether the platform is for them. Returning users can be served this via `/discover` (already exists) | Density killer above the fold. But moving it to /discover would be lossy for SEO / credibility signal, so keep on homepage — just later |
| 6 | **The Ten Pillars** grid (line 613, id=`pillars`) | Show the breadth of what the platform interprets | 🔁 **Move lower** — a compact 3-column grid (not the full 10 cards). Full grid moves to `/pillars` (which already exists) | 10 heavy cards is the biggest density offender. A "See all 10 →" link handles the discoverability |
| 7 | **Reading List** carousel (line 651, id=`reading-list`) | Curation signal, drives return visits | ⚠️ **Move off homepage → `/reading-list` (already exists)** | Anyone who wants a reading list will use the nav. On the homepage this is pure scope creep — third carousel of research links |
| 8 | **Mission statement** teal band (line 691) | Emotional close, brand voice | ✅ **Keep** — but slim to a **one-paragraph** version. Currently ~4 blocks of copy | Belongs at the bottom of the home story; just shorter |
| 9 | **Footer** (line 738+) | Standard footer | ✅ **Keep as-is** | Already minimal |

**Result:** From **9** homepage sections → **6** (Hero, Steps, [Featured lower], [Pillars-compact lower], Mission-slim, Footer). The homepage becomes a **narrative funnel** (see → understand → commit) instead of a **feature list**.

**Estimated impact:** First-visit visitor now sees Hero + top of Steps within 100vh. Next action ("Upload" or "Take the quiz") is unambiguous.

---

## 2 · Navigation tiering

### Current state

Scanning `/app/app/` shows **39 top-level routes** (excluding `api/`, `_next` internals, sitemap, etc.). The current top nav mixes 4-5 anchor links + a "Tools" dropdown with **~20 entries** plus a "Pillars" dropdown plus "About". Discovery cost is high; every session forces a scan through the dropdown.

**Full route inventory (39):**

```
about, achievements, admin, ancestry, articles, biomarkers, blueprint,
coach, community, community-guidelines, drug-check, explore, export,
genome, get-started, goals, how-it-works, journal, learn, mission,
my-insights, my-path, nutrition, onboarding, pillars, population-compare,
practitioner-report, privacy, pro, reading-list, research, search,
start, study, support, terms, tools (supplements, training), tracker
```

### Proposed 4-category top-level nav

The goal is: **one visible top nav, ≤ 5 items, each with ≤ 6 sub-items**. Anything that doesn't fit belongs in the footer or user settings.

| Top-level | Sub-items (dropdown) | Route mapping | Notes |
|---|---|---|---|
| **My Data** | Dashboard · Genome · Ancestry · Biomarkers · Journal · Achievements · Export | `/` (auth) · `/genome` · `/ancestry` · `/biomarkers` · `/journal` · `/achievements` · `/export` | All "the data belongs to me" surfaces. Only appears once a user has data. |
| **Explore Research** | Search · Reading List · Pillars · Featured Articles · Study | `/search` · `/reading-list` · `/pillars` · `/articles` (or `/explore`) · `/study` | Pure research consumption. |
| **Tools** | Coach · Deep Research · Blueprint · Protocol · Drug Check · Population Compare · Practitioner Report | `/coach` · `/research` · `/blueprint` · `/nutrition` + `/tools/supplements` + `/tools/training` · `/drug-check` · `/population-compare` · `/practitioner-report` | Everything that generates output from data. Split from "My Data" because these are actions, not readings. |
| **My Path** | My Path · My Insights · Goals · Habit Tracker · Learn modules | `/my-path` · `/my-insights` · `/goals` · `/tracker` · `/learn/*` | The guided-journey surfaces. Stays visible when `ss_mode==='guided'`; collapses to a single "Continue My Journey" pill when `ss_mode==='explorer'` (already implemented). |
| **Community** *(footer-first, top-nav only if enabled)* | Community · Community Guidelines · Support | `/community` · `/community-guidelines` · `/support` | Lower priority — currently in About dropdown; keep there. |

### Routes that leave the top nav entirely

Move to **footer, settings dropdown, or contextual entry points**:

| Route | New home | Why |
|---|---|---|
| `/about`, `/mission`, `/how-it-works` | Footer | Marketing pages; nobody needs them in the top nav |
| `/privacy`, `/terms` | Footer | Legal, footer-only |
| `/admin`, `/admin/**` | Hidden — direct URL only | Never in user nav |
| `/get-started`, `/start` | Only from the homepage hero + first-time flow | Not re-visited once onboarded |
| `/onboarding/quiz` | Only from CTAs (hero, PrefsMenu) | Not a persistent destination |
| `/pro` + `/pro/family-compare` | Small "Pro" chip in settings menu | Not a category, it's a tier gate |
| `/explore` | Redirect to `/reading-list` OR fold into "Explore Research" as landing | Vestigial |

**Net change:** From ~20 top-level items → **5 top-level dropdowns** (or 4 if Community stays in footer). Each dropdown holds ≤ 7 items.

**A quick visual tree:**

```
├── My Data           (visible when user has any data)
│   ├── Dashboard
│   ├── Genome
│   ├── Ancestry
│   ├── Biomarkers
│   ├── Journal
│   ├── Achievements
│   └── Export
├── Explore Research
│   ├── Search
│   ├── Reading List
│   ├── Pillars
│   ├── Featured
│   └── Study
├── Tools
│   ├── Coach
│   ├── Deep Research
│   ├── Blueprint
│   ├── Nutrition & Supplements
│   ├── Drug Check
│   ├── Population Compare
│   └── Practitioner Report
├── My Path           (visible when ss_mode === 'guided')
│   ├── My Path
│   ├── My Insights
│   ├── Goals
│   ├── Habit Tracker
│   └── Learn modules
└── [footer]
    ├── About / Mission / How it works
    ├── Community / Support / Guidelines
    ├── Get Started (kits)
    └── Privacy · Terms
```

---

## 3 · Post-onboarding "next step" audit

**Question:** After a user finishes the quiz OR uploads a genome, do they land on **one clear next action** or on **another large, undirected surface**?

### After the quiz — `/my-path`

**Current sections rendered on `/my-path`** (from `/app/app/my-path/page.js`):
1. Header — "Your Journey" eyebrow, big heading, subhead, **Exit My Path** ghost button
2. `<WhyYoureSeeingThis />` — explains the personalisation
3. `<UnknownsPanel />` — what we don't know about you yet
4. **Foundation modules** section (3 cards: Foundations / Genes / Interpretation)
5. **Your Path** section (goal-specific modules)
6. **Insight Ladder** cross-links
7. **Continue Reading** links
8. Big scroll to the bottom

**Assessment:** ⚠️ **Undirected surface.** The user just finished the quiz — the emotional expectation is "OK, tell me the first thing." Instead they see **7 sections** and must decide which module to click.

**Recommendation (for the follow-up implementation ticket, NOT this proposal):**
- Add a single **"Start with this →"** hero card at the top pointing at the very first module in the path (Foundations). Everything else stays but is subordinate.
- The rest of the page functions as a syllabus overview, not an equal menu.

### After genome upload — `/` (Dashboard) or `/my-path` (per current routing)

The post-summary redirect (from `/app/app/genome/genome-client.jsx` line 496-515) picks:
- No path yet → `/onboarding/quiz` ✅ single next action, clean
- Explorer mode → `/` (Dashboard) ⚠️ **undirected surface — see below**
- Guided w/ path → `/my-path` ⚠️ same problem as above

**Dashboard (`/app/components/Dashboard.jsx`)** currently renders **12 major blocks** including NextGenePrompt, Tier2WelcomeBanner, ContinueJourneyPill, PillarStrip, LearningPath, and multiple feature widgets. This is directly the scope-creep problem issue #2 exists to fix.

**Assessment:** ⚠️ Explorer-mode landing is the worst offender. A user who just watched their file analyse sees a dozen widgets simultaneously.

**Recommendation (for the follow-up implementation ticket):**
1. **Explorer-mode Dashboard** — collapse to a "top-3-findings hero" card + a "your first look" carousel of one variant at a time. Everything else moves below the fold or into an accordion.
2. `NextGenePrompt` + `Tier2WelcomeBanner` stay in the hero row (they already have the "next step" role) — every other widget defers.
3. Keep the **First Look** Tier 1 experience unchanged (it already enforces one-at-a-time).

---

## 4 · Summary of recommendations by "effort × impact"

| Recommendation | Effort | Impact | Priority |
|---|---|---|---|
| Shrink hero to ~70vh; remove `StartHereBanner`; move genome-upload deep-dive to `/get-started`; move Reading List off home | S | 🔴 High | P0 |
| Reorder homepage: Hero → Steps → Compact Pillars → Featured → Slim Mission | S | 🔴 High | P0 |
| Collapse top nav to 4-5 categories per §2 above; move marketing/legal to footer | M | 🔴 High | P0 |
| Add "Start with this →" hero card to `/my-path` | S | 🟡 Med | P1 |
| Slim Explorer Dashboard to a top-3-findings hero + accordion below | M | 🔴 High | P1 |
| Retire vestigial `/explore` route (redirect to `/reading-list`) | XS | 🟢 Low | P2 |

**Explicitly NOT in scope** (per issue #2):
- No streaming work
- No admin dashboards
- No A/B test infrastructure
- No Coach guardrail changes
- No new features

---

## 5 · What I need from you to proceed

Before writing any code, please confirm:

1. **Homepage section removals** — OK to remove `StartHereBanner` and move the genome-upload deep-dive section to `/get-started`? (Alternative: keep them but collapse into an accordion behind a single CTA.)
2. **Reading List** — remove from homepage entirely, or keep as a small "Latest reading →" 3-card row that links to `/reading-list`?
3. **Nav category names** — are "My Data / Explore Research / Tools / My Path" the right labels, or do you prefer different vocabulary (e.g. "Insights / Library / Actions / Journey")?
4. **Explorer-mode Dashboard slimming** — is it in scope for the same PR, or a separate follow-up ticket?
5. **Any section on the homepage I marked "Keep" that you actually want removed** — or vice-versa?

Once you sign off, I'll open a **new** scoped implementation ticket that references this proposal and only touches the files needed for the sections you approved.
