# Phase 3 UX — Explorer Dashboard Slimming (Proposal)

**Ref:** Follow-up to GitHub issue #2 · deferred from Phase 2
**Status:** Proposal for review · **no code yet**
**Scope guardrails:** No new features, no A/B tests, no admin dashboards, no streaming, no safety-system work. Only reshape existing Dashboard components.

---

## Problem restatement

An Explorer-mode user who just uploaded a genome lands on `/` and sees **~12 major widgets** simultaneously. The dashboard is a scope-creep menu, not a next-step. Goal: **top-3 findings + one clear action** above the fold.

---

## 1 · Current Dashboard section audit

Enumerating `components/Dashboard.jsx` (997 lines) in scroll order:

| # | Component / block | Role |
|---|---|---|
| 1 | Welcome header (name + intro copy) | Greeting |
| 2 | `<NextGenePrompt />` | "Explore this gene" — Up next card |
| 3 | `<Tier2WelcomeBanner />` | 7-day post-unlock celebration |
| 4 | `<ContinueJourneyPill variant="banner" />` | Explorer-mode "back to Path" banner |
| 5 | `<FeaturesProgressBar />` (Part 4) | Progress ring |
| 6 | `<LearningPath />` (Phase J) | 3-step guided journey |
| 7 | Pillar chip strip | 10 quick filters |
| 8 | `<DashSection title="Your Protocol Preview">` | First 3 recommendations |
| 9 | `<DashSection title="Your Strengths">` | Strengths carousel |
| 10 | `<DashSection title="Areas to Be Aware Of">` | Aware carousel |
| 11 | Recent activity / journal preview | Log stub |
| 12 | Achievement / streak widgets | Gamification |
| 13 | Footer strip inside Dashboard | Support links |

**~1200-1600px vertical density** above the fold on standard laptop.

---

## 2 · Proposed lean structure

**Hero row (always above fold):** Welcome + `<NextGenePrompt />` + `<Tier2WelcomeBanner />` (when active) + `<ContinueJourneyPill />` (when applicable). These already exist and each serves a distinct "next action" role.

**Below the fold:** everything else, but **collapsed** into 3 accordion sections:
1. **"Your Findings"** (default open) — top-3 findings only + "See all X findings →" link to `/genome`. Strengths + Aware + Pillar chips fold in here.
2. **"Your Protocol & Nutrition"** (collapsed) — Protocol preview + link to `/blueprint` and `/nutrition`. Learning Path collapses under here as "Study path (3 steps)".
3. **"Progress & Activity"** (collapsed) — FeaturesProgressBar + Journal preview + Achievements.

**Net:** 12 flat widgets → **1 hero + 3 collapsible groups**. Dashboard becomes a **launchpad** instead of a **feature list**.

---

## 3 · Files this PR will touch

**Only** `components/Dashboard.jsx` — restructure the JSX. All child components stay unchanged (`NextGenePrompt`, `Tier2WelcomeBanner`, `LearningPath`, `DashSection`, `FeaturesProgressBar`, etc. remain untouched — they get reused inside the accordion sections). No new components. No API changes. No state model changes.

Optional tiny addition: a small `<DashboardAccordion>` helper component (client-side, `<details>`-based, ~40 lines) if the inline accordion pattern feels too verbose.

---

## 4 · Explicit NON-scope (still deferred)

- Anything on `/my-path`, `/genome`, `/blueprint`, `/nutrition`, or any other route
- No component-level redesign — only the outer layout on `/` changes
- No mobile-nav changes (already unified via drawer)
- No changes to Tier 1 First Look (that pager already enforces "one at a time")

---

## 5 · Acceptance criteria for the PR

- [ ] Explorer-mode Dashboard renders **1 hero row + 3 collapsible sections** (was 12+ flat widgets)
- [ ] `<NextGenePrompt />`, `<Tier2WelcomeBanner />`, `<ContinueJourneyPill />` remain visible above the fold when active
- [ ] "Your Findings" section opens by default; other two collapsed by default
- [ ] Every widget that existed on the old Dashboard is still reachable (either in the hero row or inside an accordion) — nothing quietly deleted
- [ ] Tier-1 First Look experience unchanged
- [ ] `/my-path` unchanged
- [ ] All existing behaviours preserved: Explorer chip, Continue Journey glow, Tools tour pulse, Coach launcher, A/B quiz CTA
- [ ] Screenshot proof: Dashboard before/after in the PR description

---

## 6 · Questions I need answered before implementing

1. **Accordion default state** — approve "Your Findings open · other two collapsed"? Or open all three? Or open none?
2. **Learning Path placement** — I'd fold it into "Your Protocol & Nutrition" (it teaches the science behind the protocol). Alternative: keep it in the hero row as an equal-weight card next to NextGenePrompt.
3. **Achievements + Journal preview** — combine into "Progress & Activity" section as proposed? Or drop them from Dashboard entirely (they're each reachable from nav)?
4. **Pillar chip strip** — move it inside "Your Findings" accordion, or keep it as a sticky filter bar above the accordion (like a category tab strip)?
5. **Guided-mode users** — should the same Dashboard slimming apply to them, or does guided mode continue to route them to `/my-path` (as it does today) and this PR only touches the explorer landing?

Once you sign off, I'll implement in a single tight batch on `components/Dashboard.jsx` and hand back for Save-to-Github.
