# Phase 2 UX — Final Approved Scope (v2)

**Ref:** GitHub issue #2 · "Phase 2 UX: reduce navigation/homepage density and scope creep cleanup"
**Status:** ✅ Decisions locked · awaiting explicit go-ahead to implement
**Supersedes:** `/app/memory/phase-2-ux-ia-proposal.md` (v1, still on disk for history)

---

## 1 · Final homepage composition

The homepage becomes a **narrative funnel**: see → understand → commit. First-time visitors identify their next action within one screen.

### KEEP on homepage

| # | Section | Change |
|---|---|---|
| 1 | **Hero** — teal, **~70vh** (not 100vh) | Search input · primary "Upload Your File" CTA · A/B secondary quiz CTA (unchanged). Existing `#genome-upload` anchor link is repurposed to jump to `/get-started` |
| 2 | **HomeStepsExplainer** — one short "how this works" block | Keep as-is (already short and scannable) |
| 3 | **Tiny "Prefer books? Visit the SelfScience Reading List →" text link** — one line, no cards | New minimal footer strip above the site footer, links to `/reading-list` |
| 4 | **Slim disclaimer line at the bottom** — one sentence | Replaces the full mission blockquote band |
| 5 | **Footer** | Unchanged |

### REMOVE from homepage (destination in parens)

| Section | New home | Notes |
|---|---|---|
| **StartHereBanner** | `/get-started` | Full removal from `/` |
| **Genome-upload deep-dive card** + `<GenomeFlowIllustration />` | `/get-started` | Full removal from `/`. The hero's primary CTA already sends people to `/genome`; the deep-dive belongs where kit selection lives |
| **Featured Research carousel** (`<EditorialFeatured limit={6} />`) | Move to `/search` (or `/reading-list` if `/search` doesn't already have it) | Full removal from `/` |
| **The Ten Pillars grid** (10 heavy cards) | `/pillars` (already exists) | Full removal from `/`. No compact 3-column stub needed |
| **Reading List carousel** | `/reading-list` (already exists) | Replaced by the single-line text link above |
| **Mission blockquote teal band** | `/about` | Full removal. Slim one-sentence disclaimer stays at homepage bottom |

**Net:** 9 sections → **4–5 tight sections**.

---

## 2 · Nav categories (final labels)

Top nav becomes **4 dropdowns**; marketing / legal / support live in the footer only.

| Top-level | Sub-items | Route mapping |
|---|---|---|
| **My Biology** | Dashboard · Genome · Ancestry · Biomarkers · PGx (Drug Check) · Journal · Achievements · Export | `/`(auth) · `/genome` · `/ancestry` · `/biomarkers` · `/drug-check` · `/journal` · `/achievements` · `/export` |
| **Explore Research** | Search · Pillars · Reading List · Featured Articles · Study | `/search` · `/pillars` · `/reading-list` · `/articles` · `/study` |
| **Tools** | Coach · Deep Research · Blueprint · Nutrition & Food Scanner · Supplements · Training · Habit Tracker · Alerts · Practitioner Report · Population Compare | `/coach` · `/research` · `/blueprint` · `/nutrition` · `/tools/supplements` · `/tools/training` · `/tracker` · `/support` · `/practitioner-report` · `/population-compare` |
| **My Path** | Onboarding Quiz · My Path · My Insights · Goals · Learn modules · Achievements | `/onboarding/quiz` · `/my-path` · `/my-insights` · `/goals` · `/learn/*` · `/achievements` (also linked from My Biology) |

**Notes on the changes from the original proposal:**
- `PGx (Drug Check)` moved into **My Biology** because pharmacogenomics is a data-view, not an action tool.
- `Habit Tracker` and `Journal` split — Journal stays in My Biology (reading your own log), Tracker sits in Tools (an action).
- **Community / Support / Guidelines / About / Mission / How-it-works / Privacy / Terms / Admin / Get-started / Onboarding-quiz landing pages / Pro chip** → **footer or settings dropdown only**, not top nav.
- Vestigial route `/explore` → redirect to `/reading-list`.

---

## 3 · Explicit non-scope (Phase 3 follow-up)

Per your call, these are **NOT** touched in this ticket and will be opened as a separate "Phase 3: Explorer Dashboard Slimming" issue:

- Slimming the Explorer-mode Dashboard from 12 widgets to a hero + accordion
- Post-onboarding `/my-path` "Start with this →" hero card
- Any Dashboard, Tier 2 welcome banner, or Continue-my-journey pill changes

---

## 4 · Files this PR will touch

**Homepage + explainer**
- `app/page.js` — remove sections 3-7, shrink hero, add reading-list text link + slim disclaimer
- `components/HomeStepsExplainer.jsx` — keep, possibly minor copy trim only
- `components/StartHereBanner.jsx` — **delete** (or leave file and just stop importing it — TBD during implementation)

**Absorbing pages (light additions only — no new features)**
- `app/get-started/get-started-client.jsx` — inline the StartHereBanner + genome deep-dive content
- `app/search/search-client.jsx` OR `app/reading-list/page.js` — receive the moved Featured Research carousel (I'll pick whichever is a cleaner fit during implementation)
- `app/about/page.js` — receive the moved mission block

**Nav**
- `components/site-nav.jsx` — rewrite the top-level dropdown structure per §2. Keep all pulse-glow / tour / Explorer-chip / Continue-my-journey logic intact (unchanged behaviours, only reshuffled labels).

**Vestigial route**
- `app/explore/page.js` (or its containing directory) — replace with a redirect to `/reading-list`

**Nothing else touched.** No API changes, no lib changes, no state changes, no visual design system tweaks.

---

## 5 · Acceptance criteria (for the PR review)

- [ ] Homepage renders **≤ 5 sections** total
- [ ] Hero section fits within ~70vh so the next section is visible on standard laptop viewport
- [ ] No `StartHereBanner`, no genome-upload deep-dive card, no Reading List carousel, no Featured Research carousel, no 10-pillar grid on `/`
- [ ] `/get-started` has the deep-dive genome content that used to be on `/`
- [ ] `/about` has the mission blockquote that used to be on `/`
- [ ] Featured Research is still reachable — just from `/search` (or `/reading-list`)
- [ ] Top nav has exactly **4 dropdowns**: My Biology · Explore Research · Tools · My Path
- [ ] `/explore` redirects to `/reading-list`
- [ ] Existing behaviours unchanged: Tier-1 FirstLook, Tier-2 Welcome banner, Continue-my-journey pill, Coach launcher, Explorer pulse tour, A/B quiz-CTA variants, Save-to-GitHub button
- [ ] No new features. No admin dashboards. No streaming/safety work.
- [ ] Screenshot proof: homepage before/after + top nav before/after included in the PR description

---

## 6 · What I need from you now

**One green light** — reply "**implement Phase 2**" (or any equivalent) and I'll:

1. Do the file edits above in a **single tight batch**
2. Verify with screenshots (homepage + top nav in both modes)
3. Not touch anything on the non-scope list in §3
4. Report back with a summary + a "Save to Github" nudge so you can push the branch and open the PR

If you want any last tweak to the scope in §1, §2, or §4, tell me before that green light.
