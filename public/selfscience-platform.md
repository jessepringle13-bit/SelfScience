# SelfScience — Platform Documentation

> A comprehensive reference for what SelfScience is, what it does, how it is built, and the principles that shape it.

Version: **v1.1** (2026-07)
Production: **[https://selfscience.io](https://selfscience.io)**
Status: **Live**

---

## Status Legend

Throughout this doc, every feature is tagged with one of:

- 🟢 **Live** — Shipped and verified in production.
- 🟡 **Partial** — Core functionality ships; some sub-features are stubbed, mocked, or coverage-limited.
- 🔵 **Planned** — On the roadmap; not yet in the codebase or behind a flag.

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

## 3. Target Users (Personas)

SelfScience is not designed for one homogeneous audience. Five primary personas shape the UX decisions:

### 3.1 🧭 The Curious Adult (primary — ~50% of users)
- 30–55 years old, health-forward but not a specialist.
- Has taken a 23andMe / AncestryDNA test out of curiosity.
- Wants to understand *what their raw genome file actually means* beyond the vendor's interpretation.
- Doesn't want to read journal papers directly but *does* want the platform to link to real citations.
- **Journey:** Upload genome → Dashboard → click a "Strength" or "Area to explore" card → land in Search → read plain-language summaries of the cited papers.

### 3.2 🧪 The Quantified-Self Enthusiast (~20%)
- Tracks blood work, ring/watch metrics, macros. Knows the difference between HDL-P and HDL-C.
- Wants cross-references: "this gene predicts *why* my biomarker sits at this range."
- Willing to log a supplement stack and compare it to research.
- **Journey:** Uploads genome + biomarkers → Practitioner Report → adjusts supplement stack → uses Compare Drawer.

### 3.3 👪 The Parent-Researcher (~10%)
- Curious whether to genotype a child; researching ADHD, allergies, growth, sleep.
- Needs the **Youth Wellness pillar** and the "Genome for parents" content.
- Extra sensitive to any language that sounds diagnostic or medical.
- **Journey:** `/pillars/youth` → early-advantage → decides whether to test → returns with the child's data (or not).

### 3.4 🏋️ The Athlete / Coach (~10%)
- Endurance runner, powerlifter, or coach optimizing training zones.
- Uses ACTN3, ACE, PPARGC1A, MSTN variants + recovery genetics.
- Combines Training Protocol + Supplement Discovery for recovery stacks.
- **Journey:** Genome upload → Training Protocol tab → sport-affinity + zone recommendations → linked supplement recovery picks.

### 3.5 🩺 The Practitioner (client-facing) (~10%)
- Functional-medicine doctor, RD, chiropractor, health coach.
- Uses SelfScience as a **conversation tool** with clients — not a diagnostic engine.
- Wants a clean printable summary of a client's genome + biomarkers + supplements.
- **Journey:** Client uploads on the practitioner's tablet during the appointment → Practitioner Report → PDF printed and inserted into the client's file.

*Anti-persona (explicitly not a target):* Anyone seeking a diagnosis, cure, or medical recommendation. The disclaimer copy is written for that person, but the product is not.

---

## 4. The 10 Pillars

Everything on the platform is organized around 10 research **Pillars**. These are the top-level facets that shape search, dashboards, gene classification, and content taxonomy.

| # | Pillar                              | Focus | Status |
|---|-------------------------------------|-------|--------|
| 1 | **Genomics**                        | Understanding your genetic variants and what current research says about them | 🟢 Live |
| 2 | **Nutrition**                       | How genes influence how your body processes food, nutrients, and dietary patterns | 🟢 Live |
| 3 | **Sports Performance**              | Athletic ability, training adaptation, injury risk, and recovery | 🟢 Live |
| 4 | **Longevity**                       | Cellular aging, telomeres, NAD+ pathways, healthspan research | 🟢 Live |
| 5 | **General Wellness**                | Sleep, stress, gut health, and daily-habit research | 🟢 Live |
| 6 | **Pharmacogenomics**                | How genes affect the way your body processes medications and supplements | 🟡 Partial (curated small drug set) |
| 7 | **Mental Health & Neurochemistry**  | Mood, stress response, dopamine, serotonin, brain chemistry | 🟢 Live |
| 8 | **Environmental Sensitivity**       | Response to environmental exposures, toxins, chemical sensitivity | 🟢 Live |
| 9 | **Hormones & Endocrine Health**     | Testosterone, estrogen, thyroid, cortisol, leptin | 🟢 Live |
| 10| **Pediatric & Youth Wellness**      | Growth, development, ADHD, allergies, adolescent research | 🟢 Live (dedicated hub at `/pillars/youth`) |

Pillars appear as the **primary filter** on the Dashboard, Genome page, and Search page. Selecting a pillar (`?pillar=Longevity`) filters the visible gene set, research matches, findings, and protocol picks to that pillar's context.

---

## 5. Core Features (User Journey)

### 5.1 Search — `/search`  🟢 Live
The literal front door. A single search box that queries the scientific literature (PubMed + Semantic Scholar).

**Live today:**
- Pillar pills (all 10)
- Your-genome chip carousel with fan-out (up to 12 genes at once)
- Date filter (10-year default with pillar; All time with gene fan-out)
- Source-type filter (All / Reviews / Trials)
- Population-frequency chart on gene detail
- Plain-language summary layer (LLM-generated, cached)
- Reliability scoring (see §7)

**Partial:**
- 🟡 LLM plain-language layer occasionally cascades from Llama-3.3-70B to Llama-3.1-8B on rate-limit spikes (visible in logs; no user impact beyond slightly less nuanced phrasing).

**Planned:**
- 🔵 Save searches / follow a gene → get an email when new papers land.

### 5.2 Genome — `/genome`  🟢 Live
Upload a raw genome file (23andMe, AncestryDNA, MyHeritage) — parsed entirely in the browser.

**Live today:**
- Parser handles the three major consumer file formats
- 671-variant curated table + haplotype classifiers (APOE, MTHFR, COMT, VDR, HLA, ADH/ALDH, FUT2, more)
- Classification into Strength / Awareness / Neutral
- Evidence-strength chip per variant (Established / Emerging / Preliminary — see §7)
- Population-frequency chart per variant
- Full overview tab + per-pillar tabs
- Markdown, CSV, and print-ready export

**Partial:**
- 🟡 The variant catalog focuses on well-studied SNPs. Rare variants and CNVs are not covered.
- 🟡 Sample-data mode ("Try with sample data") exists but was flagged as intermittent in one testing session.

**Planned:**
- 🔵 Whole-genome (30x WGS) file parsing.
- 🔵 Family comparison — upload a second file to see side-by-side.

### 5.3 Dashboard — `/`  🟢 Live
When a genome is uploaded, the homepage becomes a personalized dashboard.

**Live today:**
- Pillar Score Overview (10-tile grid)
- Explore Your Pillars (deep-link cards with pillar + your genes hand-off)
- Your Top Findings, Strengths, Areas to Explore
- Research Matched to You (live PubMed against your top genes)
- Your Protocol Preview (supplement engine)
- Global pillar filter with `?pillar=` persistence

### 5.4 Nutrition Hub — `/nutrition`  🟢 Live
Three tabs: Foods, Journal, Scanner.

**Live today:**
- Foods: curated searchable catalogue with genome-aware annotations
- Journal: day-log meals; auto-summarised at day close (localStorage)
- Scanner: camera-based barcode → Open Food Facts lookup → genome-aware A–D grade
- Collapsible "Browse by category" panel
- Clean-alternatives suggestions for common categories

**Partial:**
- 🟡 The Clean-Alternatives catalog covers ~10 categories (chips, protein bars, cereals, yogurt, soda, ice cream, salad dressing, cooking oil, bread, crackers, protein powder). Any product outside those categories still gets full analysis but no swap suggestions.
- 🟡 Open Food Facts coverage is best for US, UK, EU brands. Coverage of Asian, South American, and African products can be sparse.

**Planned:**
- 🔵 Weekly / monthly nutrition trend view.
- 🔵 Meal-plan generator.

### 5.5 Biomarker Panel — `/biomarkers`  🟢 Live
Log blood work (10+ common markers).

**Live today:**
- HDL, LDL, HbA1c, hs-CRP, Homocysteine, Vitamin D, ALT, ferritin, TSH, and more
- Genome cross-reference per marker
- Supplement + medication interaction flags
- Printable clinician-friendly report at `/biomarkers/report`
- sessionStorage persistence (cleared on tab close by default)

**Partial:**
- 🟡 The marker list is intentionally curated — not a complete lab panel. Rare or specialty markers (e.g., LDL-P, ApoB, OMX, methylmalonic acid) are not currently in the catalog.

**Planned:**
- 🔵 Time-series charting across multiple lab draws.
- 🔵 PDF/JPEG lab-report OCR upload (currently: manual entry only).

### 5.6 Supplement Discovery — `/tools/supplements`  🟢 Live
Three-phase feature set. **Never prescribes. Never links to Amazon.**

**Phase 1 — Discovery**  🟢 Live
- Choose by goal (Sleep, Methylation, Cognition, Cardio, Immune, Longevity, Stress & Mood, Energy)
- Real NIH DSLD v9 label data
- Products grouped into variant families to prevent scroll fatigue
- Brand-direct URLs only (curated in-repo)

**Phase 2 — Trust & Transparency**  🟢 Live
- Certifications parsed from labels: NSF, USP, IFOS, ConsumerLab, Informed Sport
- Brand Profiles Drawer (transparency score, CoA availability, sourcing statements)
- Gold-tier filter (strictest transparency bar)
- Brand Leaderboard at `/tools/supplements/brands`

**Phase 3 — Personalisation**  🟢 Live
- Match to your variants (client-side genome matching)
- Compare Drawer (up to 3 products; family-mismatch confirmation)
- Budget swap-ins (`$` / `$$` / `$$$`)
- Cost sort

**Partial:**
- 🟡 **Price data is mocked.** `/app/lib/supplements/prices.json` is a hand-curated static file — no live scraper. Budget-tier ranks are correct in relative terms but absolute dollar amounts may lag real market prices.
- 🟡 DSLD coverage is US-market focused. Non-US brands may not appear.
- 🟡 Certification detection is regex-based on label text; brands that don't state their certifications in scanned label copy will be under-credited.

**Planned:**
- 🔵 `POST /api/supplements/prices` admin-token-protected endpoint for a live scraper.
- 🔵 EU / UK label sources beyond DSLD.
- 🔵 Community-verified certification uploads (photos of CoAs).

### 5.7 Training Protocol — `/tools/training`  🟢 Live
Personalized training zones and sport affinity based on your genome.

**Live today:**
- ACTN3, ACE, PPARGC1A, IGF-1, MSTN, ADRB2, IL-6, more
- Sport affinity scoring (endurance vs power)
- Recovery genetics flags
- Cross-linked to supplement recovery picks

**Partial:**
- 🟡 Injury-risk scoring is present but conservative; the underlying literature is heterogeneous.
- 🟡 Training-zone recommendations use a simple 5-zone HR model; no VO2max or lactate integration.

**Planned:**
- 🔵 Integration with wearable data (Whoop, Oura, Garmin — read-only).

### 5.8 Drug Check — `/drug-check`  🟡 Partial
Pharmacogenomic guidance for a small curated set of common medications.

**Live today:**
- Curated set: common SSRIs, statins, some blood thinners, common OTC drugs
- CPIC-style guidance links per gene
- Always paired with `PgxDisclaimer`

**Partial:**
- 🟡 **Not a full PGx panel.** The curated catalog is intentionally small (dozens of drugs, not the thousand-plus in a full CPIC/PharmGKB implementation).
- 🟡 Only covers common CYP variants (2C9, 2C19, 2D6, 3A4/5), plus SLCO1B1, VKORC1, TPMT. Rare star alleles are not resolved.

**Planned:**
- 🔵 CPIC guideline integration for the full covered list.
- 🔵 PharmGKB API sync for a broader drug catalog.

### 5.9 Population Compare — `/population-compare`  🟢 Live
Shows how each of your variants compares to global population frequencies.

**Partial:**
- 🟡 Population coverage: African, Amish, Ashkenazi Jewish, East Asian, European (Finnish + non-Finnish), Latino, South Asian. Groups missing from gnomAD (e.g., specific indigenous populations) are not represented.

### 5.10 Ancestry — `/ancestry`  🟡 Partial
A rough educational ancestry sketch from your uploaded genome.

**Live today:**
- Continental-level admixture estimate (Europe, East Asia, Sub-Saharan Africa, South Asia, Native American, Oceania)
- Based on a small marker panel — dozens of AIMs (ancestry-informative markers), not the tens of thousands used by professional pipelines.

**Partial / Limitations:**
- 🟡 **This is a sketch, not a report.** Do not expect the resolution of 23andMe/AncestryDNA. Confidence bands can be wide; the sub-regional breakdown many users expect from consumer tests is not offered.
- 🟡 We do NOT resolve sub-population differences (e.g., "Iberian vs French vs Italian") — only broad continental clusters.

**Planned:**
- 🔵 Larger AIM panel for tighter continental resolution.
- 🔵 Haplogroup (Y / mtDNA) inference where the file provides it.

### 5.11 Practitioner Report — `/practitioner-report`  🟢 Live
Print-ready summary you can hand to a doctor.

**Live today:**
- Aggregates genome + biomarkers + supplements + medications + lifestyle notes
- Print-optimised CSS (single or multi-page PDF via browser print dialog)
- Optional practitioner cover letter block

**Planned:**
- 🔵 Direct EHR export (FHIR).

### 5.12 Get Started (Kits) — `/get-started`  🟢 Live
Guidance on compatible DNA + blood kits. No affiliate links.

### 5.13 Editorial / Articles  🟢 Live
Full-featured CMS at `/admin/articles`.

**Live today:**
- Supabase-backed article store with publish/unpublish + feature flags
- Rich Markdown body, cover images, pillar tagging, SEO metadata
- Editorial Featured section on homepage
- Editorial Picks section on Search
- Dedicated article pages at `/articles/[slug]`
- No-store cache headers for mobile-PWA freshness

**Planned:**
- 🔵 Weekly digest email — subscribe on-site and receive curated new-research + editorial roundup.
- 🔵 Article commenting (moderated).

### 5.14 Reading List — `/reading-list`  🟢 Live
Curated book collection with per-book search queries.

### 5.15 Youth Hub — `/pillars/youth`  🟢 Live
Child-safety-conscious surface for the Pediatric & Youth Wellness pillar.

**Live today:**
- `/pillars/youth/early-advantage` — Nutrition/development research for parents
- `/pillars/youth/genome-for-parents` — Guidance on whether/how to genotype a child

### 5.16 Mission / How It Works / Privacy / Terms / Support  🟢 Live
Static content pages.

### 5.17 Community Discussions  🔵 Planned
Per-pillar moderated threads. Not in the codebase yet.

---

## 6. Cross-Feature Dependency Map

The biggest architectural insight of SelfScience: **the genome report is the "source of truth" that every other personalised surface reads from.** Once a genome file is parsed, its output feeds seven downstream features. Everything else reads from the same in-browser state — nothing is duplicated server-side.

### 6.1 Directional Dependency Graph

```
                                ┌─────────────────────────┐
                                │   Raw Genome File        │
                                │   (23andMe / Ancestry /  │
                                │    MyHeritage upload)    │
                                └────────────┬─────────────┘
                                             │  parseGenomeFile()
                                             ▼
                                ┌─────────────────────────┐
                                │  Parsed Variants Array   │
                                │  (in-browser only)       │
                                └────────────┬─────────────┘
                                             │  genomeClassifier + haplotypeClassifiers
                                             ▼
                                ┌─────────────────────────┐
                                │   GENOME REPORT          │◄──── stored in sessionStorage
                                │   (canonical object)     │◄──── read by every surface below
                                └───┬───┬───┬───┬───┬───┬──┘
                                    │   │   │   │   │   │
       ┌────────────────────────────┘   │   │   │   │   └────────────────────────────┐
       │                                │   │   │   │                                │
       ▼                                │   │   │   │                                ▼
┌──────────────┐                        │   │   │   │                       ┌──────────────┐
│  DASHBOARD   │                        │   │   │   │                       │  ANCESTRY    │
│  Pillar tiles│                        │   │   │   │                       │  AIM-based   │
│  Findings    │                        │   │   │   │                       │  admixture   │
│  Top Genes   │                        │   │   │   │                       └──────────────┘
└──────┬───────┘                        │   │   │   │
       │ deep-link                      │   │   │   │
       │ pillar+genes                   │   │   │   │
       ▼                                │   │   │   │
┌──────────────┐                        │   │   │   │
│   SEARCH     │◄───── ?pillar= + ?genes=   │   │   │
│   Chip row   │                            │   │   │
│   Fan-out    │                            │   │   │
└──────┬───────┘                            │   │   │
       │ per-study analysis                 │   │   │
       ▼                                    │   │   │
┌──────────────┐                            │   │   │
│  PubMed +    │                            │   │   │
│  Sem.Scholar │                            │   │   │
│  Reliability │                            │   │   │
└──────────────┘                            │   │   │
                                            ▼   ▼   ▼
                                    ┌───────────────────────┐
                                    │  NUTRITION HUB         │
                                    │  Foods scored          │
                                    │  Scanner grades A–D    │
                                    └───────────────────────┘
                                                │
                                                ▼
                                    ┌───────────────────────┐
                                    │  SUPPLEMENT DISCOVERY  │
                                    │  Match to variants     │
                                    │  Compare, Budget       │
                                    │  Brand transparency    │
                                    └───────────┬───────────┘
                                                │  (bidirectional)
                                                ▼
                                    ┌───────────────────────┐
                                    │  TRAINING PROTOCOL     │
                                    │  Sport affinity        │
                                    │  Recovery supplements  │
                                    └───────────┬───────────┘
                                                │
                                                ▼
                                    ┌───────────────────────┐
                                    │  DRUG CHECK           │
                                    │  PGx annotations      │
                                    └───────────┬───────────┘
                                                │
                                                ▼
              ┌───────────────────────┐   ┌───────────────────────┐
              │  BIOMARKER PANEL       │◄─►│  PRACTITIONER REPORT   │
              │  Gene ↔ marker links   │   │  Aggregates ALL of the │
              │  Supplement effects    │   │  above into one sheet  │
              └───────────────────────┘   └───────────────────────┘
```

### 6.2 Feature-by-Feature Data Reads

| Feature | Reads From | Adds |
|---------|-----------|------|
| **Dashboard** | Genome Report | — |
| **Search** | Genome Report (chip row + fan-out) | Live PubMed data |
| **Nutrition Hub** | Genome Report (active rules) + Journal (localStorage) | OFF product data |
| **Supplements** | Genome Report + Biomarker Panel (if present) | NIH DSLD + curated brand data |
| **Training** | Genome Report | Curated training rules + supplement links |
| **Drug Check** | Genome Report | Curated PGx catalog |
| **Biomarkers** | Genome Report + user-entered lab values | Curated marker↔gene map |
| **Practitioner Report** | Everything above | Client's practitioner note (free text) |
| **Ancestry** | Genome Report | AIM panel + population reference |

### 6.3 Bidirectional Loops
Two features form intentional feedback loops:

- **Biomarkers ↔ Supplements** — Biomarkers flag which supplements may shift a value; Supplements page shows which biomarker to re-check after adding a stack.
- **Training ↔ Supplements** — Training Protocol recommends recovery supplements; Supplement personalisation surfaces "you're training for endurance" context.

### 6.4 What Happens When There's No Genome
Every feature has a graceful "no-genome" degraded mode:

- Search still works (just no chip row, no pillar-aware weighting)
- Nutrition Scanner still shows universal grade (based on ingredient rules, not variants)
- Supplement Discovery still shows Phase 1 + 2 (goal + transparency filters), just no Phase 3 personalisation
- Dashboard shows a marketing homepage prompting upload
- Biomarker Panel still logs values, just without gene cross-reference

---

## 7. Data Confidence & Evidence Scoring Methodology

SelfScience surfaces confidence in three separate but coordinated ways. Each is deliberately transparent — the code paths are inspectable and the tiers are documented in this doc.

### 7.1 Variant Evidence Tiers (Genome)
Every variant card carries an **Evidence Strength chip** driven by `/app/lib/evidenceStrength.js`. Tiers:

| Tier | Study count (heuristic) | What it means |
|------|-------------------------|---------------|
| **Established** | 10+ | Extensively replicated in independent studies (GWAS meta-analyses, textbook variants). |
| **Emerging** | 2–9 | Well-supported but literature is still accumulating. |
| **Preliminary** | 1–2 | Exploratory context only. Do not act on this. |

**Important:** The study-count numbers are ranges, not exact citation counts. They are curator best-estimates as of build time. The tier is used purely to render the chip; **it does not change classification, filtering, or downstream recommendations**.

### 7.2 Variant Classification (Strength / Awareness / Neutral)
Separate from evidence strength, every classified variant is tagged with one of three classifications:

| Classification | Meaning |
|----------------|---------|
| **Strength** | This variant is generally associated with a favourable trait in the current literature. |
| **Awareness** | This variant is worth understanding — not a warning, not a diagnosis. |
| **Neutral** | Recognised variant with no directional interpretation in this pillar. |

**Awareness is deliberately not called "risk."** We do not use risk language because these classifications are educational context, not clinical risk scores.

### 7.3 Study Reliability Scoring (Search)
Studies returned by Search are annotated with a reliability signal computed by an LLM cascade against the study's abstract + metadata. The endpoint is `/api/score-reliability` and produces:

| Field | Values |
|-------|--------|
| **`reliability`** | Numeric score 1–5 |
| **`reliabilityLabel`** | "High" / "Moderate" / "Preliminary" / "Weak" |
| **`reliabilityNote`** | 1–2 sentence LLM rationale ("Large RCT, n=2400, pre-registered." vs "Small observational, n=42, mechanism paper.") |

**Model cascade**: primary is `meta-llama/llama-3.3-70b-instruct`, fallback is `meta-llama/llama-3.1-8b-instruct`. Fallback triggers on 429/rate-limit or 5xx. Both tiers are trained on public benchmarks; results are directional guidance, not systematic review.

Reliability scores are **cached per PMID** so the same study doesn't get re-scored on repeat views.

### 7.4 Supplement Transparency Score (Brand Leaderboard)
Every curated brand carries a **Transparency Score 0–100** built from:

| Component | Weight |
|-----------|--------|
| Third-party certification (NSF / USP / IFOS / Informed Sport / ConsumerLab) | 40 |
| Certificate of Analysis (CoA) availability / accessibility | 20 |
| Sourcing disclosure (country of origin, farm/lab) | 15 |
| Manufacturing disclosure (GMP, cGMP, in-house vs contract) | 10 |
| Label completeness (dose, form, other ingredients) | 10 |
| Contact / recall history clarity | 5 |

**Curator-scored**, not user-scored. See `/app/lib/supplements/brandTiers.js` and `/app/lib/supplements/brandProfiles.js`.

### 7.5 Personalisation Match Strength (Supplements)
When a supplement is "matched to your variants," the match is one of:

- **Priority** — Direct mechanistic link between variant → ingredient (e.g., MTHFR variants → methylfolate over folic acid).
- **Lifestyle** — Supporting research; not variant-mandated but relevant.
- **Awareness** — Ingredient your genotype should be *aware of* rather than pursue (e.g., limit iron supplementation if you carry HFE variants).

### 7.6 What Is NOT Scored
Deliberately unscored to avoid over-precision:

- **Individual food items** — Foods get a universal A–D grade + genome-derived flags, but not a numeric confidence score.
- **Overall genome "health score"** — We refuse to synthesise a single number from your genome. Reducing 671 curated variants to a headline number would misrepresent the data.
- **"Longevity age" / "biological age"** — Not offered.

---

## 8. Known Limitations

This section is important. Every honest health-tech product needs a limitations page. Ours:

### 8.1 Ancestry
- **Confidence is coarse.** Continental-level only (Europe / East Asia / SSA / South Asia / Native American / Oceania). No sub-regional resolution.
- **AIM panel size.** We use dozens of ancestry-informative markers vs the tens of thousands in a professional pipeline.
- **No sub-population differentiation.** We do not distinguish Iberian vs French, Han vs Korean, Yoruba vs Igbo.
- **Not a substitute** for 23andMe / AncestryDNA / GEDmatch admixture pipelines.

### 8.2 Pharmacogenomics (Drug Check)
- **Curated small drug catalog** — Dozens of drugs, not the thousand-plus in CPIC/PharmGKB.
- **Common CYP variants only** — CYP2C9, 2C19, 2D6, 3A4/5, plus SLCO1B1, VKORC1, TPMT. Rare star alleles are not resolved.
- **No dose-adjustment recommendations** — We surface published guidance links but do not tell a user or clinician to adjust a dose.
- **No drug-drug interaction engine** — Interactions with concurrent meds are not modelled; only gene → drug.

### 8.3 Biomarkers
- **Curated marker list** — 10+ common markers; specialty markers (LDL-P, ApoB, OMX panels, methylmalonic acid, organic acids, food-sensitivity panels) are not currently in the catalog.
- **Educational interpretation only** — Ranges shown are literature-derived; not tailored to your clinician's assay method or lab's reference range. Always defer to your lab's printed range.
- **No lab-report OCR yet** — Manual entry only. PDF/photo upload is a planned feature.
- **No time-series charting** — Currently one snapshot at a time.

### 8.4 Supplements
- **US-market bias** — NIH DSLD covers US-labelled products best. Non-US brands have partial coverage.
- **Pricing is curated/static** — `prices.json` is a hand-maintained snapshot, not a live scrape. Budget tier ranks are correct in relative terms; absolute dollars may lag reality.
- **Certifications from label text** — Regex-parsed. Brands whose certification is real but not on the scanned label copy will be under-credited.
- **"Match to your variants" ≠ prescribing.** Even Priority-tagged matches are educational. Nothing here says "take this."
- **Ingredient form ontology is deepening but not exhaustive** — Methylfolate vs folinic acid vs folic acid is well modelled; some more obscure ingredient-form distinctions are still in curation.

### 8.5 Search
- **Coverage** — PubMed + Semantic Scholar are excellent for biomedical literature but do not cover every book, textbook chapter, or industry white paper.
- **Reliability scoring is heuristic** — LLM-scored based on abstract + metadata, not a systematic-review methodology.
- **Plain-language layer is LLM-generated** — Cached, but subject to the usual LLM caveats (occasional oversimplification, no fact-checking layer).

### 8.6 Genome Parsing
- **Consumer SNP arrays only** — 23andMe / AncestryDNA / MyHeritage. Whole-genome (30x WGS), whole-exome (WES), and non-consumer file formats are not currently parsed.
- **Rare variants and CNVs not covered** — Our 671-variant catalog is well-studied common variants. Rare disease variants and copy-number variants are not analysed.
- **Read depth invisible to us** — Consumer arrays have decent but not clinical-grade read depth; we do not annotate call quality per SNP.

### 8.7 Overall
- **Not a medical device.** Nothing above should be read as diagnosis, treatment, or clinical guidance.
- **Not a replacement for a clinician.** The Practitioner Report is designed to *support* a conversation with a healthcare provider, not replace one.
- **Not a longitudinal health record.** SelfScience is a research literacy tool, not an EHR.
- **Sample-size bias.** Most of the underlying research skews to European-ancestry cohorts. Variant → trait associations may not generalise equally to all populations.

---

## 9. Technology Stack

### 9.1 Frontend
- **Next.js 15.5** (App Router)
- **React 19**
- **TailwindCSS 3.4** + custom design tokens
- **shadcn/ui** (Radix primitives) — Dialog, Dropdown, Tabs, Popover, etc.
- **Lucide-react** icons
- **framer-motion** for micro-animations
- **recharts** for population-frequency charts
- **html5-qrcode** for barcode scanning
- **html2canvas** + `jszip` for shareable card images
- **Serwist** for PWA / offline / service-worker cache management
- **@tanstack/react-query** + `swr` for client-side data fetching

### 9.2 Backend
- **Next.js API routes** — single catch-all at `/app/app/api/[[...path]]/route.js` handles most endpoints, with dedicated routes for high-traffic paths (`/api/nutrition/product`, `/api/pubmed-search`, `/api/genome/generate`, `/api/download/platform-doc`).
- All API routes are `export const dynamic = 'force-dynamic'` and return `Cache-Control: no-store` — nothing personal is ever cached.

### 9.3 Data Layer
- **MongoDB** — Reserved for editorial content persistence and future community features.
- **Supabase** — Editorial articles CMS. Row-level publishing + featured flags.
- **In-repo JSON/JS** — Brand curation, kit catalog, variant catalog, drug catalog, book library. Kept in code so the app can be deployed without a database round-trip for the vast majority of reads.

### 9.4 Third-Party APIs
| API | Purpose | Auth |
|-----|---------|------|
| **PubMed E-utilities** | Literature search + study details | API key (optional, higher rate limit) |
| **Semantic Scholar Graph API** | Study metadata enrichment | None required |
| **Open Food Facts** | Barcode → nutrition label lookup | None required |
| **NIH DSLD v9** | Supplement product labels | None required |
| **ExerciseDB (v1.exercisedb.io)** | Exercise catalogue for training protocols | None required |
| **OpenRouter / Together AI** | Reliability scoring + plain-language summaries + genome generation | API key required |
| **Supabase** | Editorial CMS storage | Service key + anon key |

### 9.5 PWA & Offline
- **Serwist** (Workbox-derived) service worker at `/app/app/sw.js`
- Precache: HTML shells with `NetworkFirst` (24h), API GETs with `NetworkOnly`, images `CacheFirst`
- **Auto-updater** at `/app/components/PWAUpdater.jsx` — polls for new SW every 30 minutes; when a new one is installed, reloads on `controllerchange`
- Installable on iOS / Android home screens; standalone `/manifest.json`
- `CACHE_VERSION` bumped manually to purge every client cache on breaking releases

---

## 10. Architecture

### 10.1 Directory Layout
```
/app
├── app/                    Next.js App Router pages + API
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
│   ├── evidenceStrength.js      Established / Emerging / Preliminary tiers
│   ├── pillars.js               Pillar canonical names + query mapping
│   ├── variant-catalog.js       671-variant curated table
│   ├── populationFrequencies.js Global + population-specific rsID freqs
│   └── supabase/                Supabase client factories
├── public/
│   ├── icons/              PWA icons
│   ├── manifest.json       PWA manifest
│   ├── sw.js               Compiled service worker
│   └── selfscience-platform.md  This file (downloadable)
├── docs/
│   └── PLATFORM.md         Source of truth for this file
├── memory/
│   └── PRD.md              Product requirements (evolving)
├── test_result.md          Testing agent runbook + history
└── package.json
```

### 10.2 Client-Side State Buckets
- **`sessionStorage`** — Genome results, biomarkers, journaled food (cleared on tab close by default).
- **`localStorage`** — User preferences, PWA install prompts, tour completion, saved reading list positions.
- **URL query params** — `?pillar=`, `?genes=`, `?q=` for deep-linkable state.
- **In-memory (React state)** — All UI transient state.

**Zero database writes contain genome, biomarker, or medication data.**

---

## 11. Privacy Model

SelfScience treats health data like a bank treats vault access:

1. **Client-side parse** — Genome files never touch our server. The `.txt` / `.zip` is opened by the browser's `FileReader`, parsed by `/app/lib/genome-parser.js`, and the raw file is discarded after parsing.
2. **Client-side classification** — All rule-matching (variant → pillar, food → flag, supplement → match) happens in the browser.
3. **Server as pass-through** — Our `/api/*` routes are stateless proxies to public research APIs. They log nothing user-identifying.
4. **No accounts by default** — Users can use every feature without signing up. Admin login (for editorial CMS) is separate.
5. **Clearable session** — A single "clear my data" action wipes sessionStorage + localStorage.
6. **Right to export** — Every report can be downloaded (MD, CSV, PDF-ready) at any time.

For details, see `/privacy` on the live site.

---

## 12. Deployment

### 12.1 Environments
| Env | URL | Purpose |
|-----|-----|---------|
| **Preview** | `*.preview.emergentagent.com` | Development sandbox |
| **Production** | `https://selfscience.io` | Live user-facing |

### 12.2 Environment Variables (protected)
```
MONGO_URL                 # MongoDB connection (editorial + future community)
NEXT_PUBLIC_BASE_URL      # Public URL for absolute-URL generation
SUPABASE_URL              # Editorial CMS
SUPABASE_SERVICE_KEY      # Editorial CMS (server-only)
SUPABASE_ANON_KEY         # Editorial CMS (public)
PUBMED_API_KEY            # Optional; higher rate limits
OPENROUTER_API_KEY        # Reliability + plain-language + genome-gen
```

### 12.3 Supervisor
Runs `next start` on `0.0.0.0:3000` via supervisor.
```
sudo supervisorctl restart nextjs
sudo supervisorctl status
```

### 12.4 Kubernetes / Ingress
All `/api/*` traffic routes to Next.js on port 3000. Frontend routes also go to 3000. No separate FastAPI backend.

### 12.5 PWA Deployment Notes
- Bump `CACHE_VERSION` in `/app/app/sw.js` on breaking changes to force a purge of stale mobile-PWA caches.
- Editorial API endpoints (`/api/editorial/*`) send `Cache-Control: no-store` so new articles appear on mobile immediately.

---

## 13. Editorial / Admin

Admins at `/admin/login` (Supabase-authed) access:

- **`/admin/articles`** — List, search, publish/unpublish, feature/unfeature.
- **`/admin/articles/new`** — Create.
- **`/admin/articles/[id]/edit`** — Edit.
- **`/admin/articles/import`** — Bulk import from CSV / JSON.
- **`/admin/ai-usage`** — Dashboard of LLM call volume, cost, cascade tier hits.

Articles support:
- Cover image + alt text
- Pillar tagging
- Publish + feature flags
- Rich Markdown body
- SEO metadata

---

## 14. Testing & QA

- **`/app/test_result.md`** — Living test runbook. Every session adds a `main` or `testing` message with what was changed and what was verified.
- **`deep_testing_backend_nextjs`** — Automated backend API testing agent.
- **`deep_testing_frontend_nextjs`** — Playwright-driven end-to-end UI tester.
- **Manual regression checklist** kept in `test_result.md`.

---

## 15. Design System

### Colours (Tailwind tokens)
- `ss-teal` — Primary (buttons, links, active state)
- `ss-orange` — Secondary (highlights, active pills)
- `ss-amber` — "Areas to explore" / caution
- `ss-green` — "Strengths" / success
- `ss-bg` / `ss-bg-warm` — Page backgrounds
- `ss-muted` — Secondary text
- `ss-border-warm` — Card borders
- `ss-text` — Body text

### Typography
- Body: system-ui stack, 15–16px base
- Headers: Bold, tight tracking
- Small caps for section labels (`text-[10px] font-bold uppercase tracking-widest`)

### Components
- Cards: `rounded-2xl border border-ss-border-warm bg-white shadow-sm`
- Buttons: `rounded-full border-2 border-ss-teal ... hover:bg-ss-teal hover:text-white`
- Chips: `inline-flex items-center gap-1 rounded-full ...`
- Advisory banners: teal-tinted `bg-ss-teal/5 border-ss-teal/25`

---

## 16. Glossary

| Term | Meaning |
|------|---------|
| **Pillar** | One of the 10 top-level research categories. |
| **Variant** | A specific position in your DNA (e.g., rs1801133 = MTHFR C677T). |
| **Classification** | How the classifier tags a variant: Strength / Awareness / Neutral. |
| **Evidence Tier** | How well-studied a variant is: Established / Emerging / Preliminary. |
| **Report** | The full parsed + classified result of a genome upload, stored in sessionStorage. |
| **Active Rule** | A supplement / food / drug interaction rule triggered by one of the user's variants. |
| **DSLD** | NIH Dietary Supplement Label Database — our primary supplement data source. |
| **OFF** | Open Food Facts — our barcode → nutrition label data source. |
| **PGx** | Pharmacogenomics — how genes affect drug response. |
| **AIM** | Ancestry-Informative Marker — a SNP whose allele frequencies differ sharply between populations. |
| **Fan-out search** | Selecting multiple gene chips at once and searching all of them together. |
| **Family** (supplements) | A group of variants of the same product (e.g., Vitamin D3 in 1000/2000/5000 IU). |
| **Transparency score** | 0–100 rating we give brands based on certifications, CoAs, sourcing disclosure. |
| **Priority / Lifestyle / Awareness** (supplements) | The three tiers of variant-to-supplement matching strength. |
| **Reliability score** | 1–5 numeric rating attached to a study, LLM-assessed. |

---

## 17. Roadmap Summary

**Backlog (🔵 Planned)**
- Family Comparison — Upload a second genome to run a side-by-side comparison.
- Weekly Digest / Newsletter — Curated new research and article roundup.
- Community Discussions — Moderated per-pillar conversation threads.
- `POST /api/supplements/prices` — Admin-token protected endpoint for the price scraper.
- Lab-report OCR upload (biomarkers).
- Time-series biomarker charting.
- Wearable integration (Whoop / Oura / Garmin read-only).
- Full CPIC / PharmGKB integration for Drug Check.
- Larger AIM panel for tighter ancestry resolution.
- Whole-genome (WGS) file parsing.
- EU / UK supplement label sources beyond DSLD.
- FHIR export for the Practitioner Report.
- Break `/app/app/api/[[...path]]/route.js` into modular route handlers (~1600 lines currently).

**Recently shipped (🟢 Live)**
- Collapsible "Browse by category" on the Nutrition scanner.
- Pillar → gene filter (URL-persisted) across Dashboard, Genome, Search.
- Mobile nav Supplements + Brand Leaderboard entries.
- Barcode scanner crash-hardening (stable callback ref + format filter).
- Dose text truncation fix ("1,000 mcg" no longer renders as "000 mcg").
- No-store cache headers on editorial endpoints (mobile-PWA freshness).
- Downloadable platform documentation (this file).

---

## 18. Contact / Support

- **In-app support** — `/support` page contains contact form + FAQ.
- **Admin issues** — Emergent Support (deployment / env-var problems).
- **Editorial submissions** — Contact form → routed to admin queue.

---

## 19. Legal & Not-Medical-Advice Disclaimer

SelfScience is an educational research tool. It is **not a medical device** and does not diagnose, treat, cure, or prevent any disease. Every finding is a research-informed observation, not a medical recommendation. Users should consult qualified healthcare professionals before acting on anything they read on the platform. Full legal terms at `/terms`. Privacy policy at `/privacy`.

---

*Last updated: 2026-07 (v1.1). This document is versioned in the repo at `/app/docs/PLATFORM.md` and served at `/api/download/platform-doc`. Please update it whenever a major feature ships.*
