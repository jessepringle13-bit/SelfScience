#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  SelfScience — a health research search engine (Next.js + MongoDB template).
  Current milestone: wire search functionality to real PubMed + Semantic Scholar
  APIs and render results in the Section E result-card format. No AI scoring yet.

backend:
  - task: "GET /api/search — query PubMed + Semantic Scholar and return unified results"
    implemented: true
    working: true
    file: "/app/app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
          agent: "main"
          comment: |
            New endpoint. Query params: q (required), source=all|pubmed|s2, limit (max 30), pillar.
            Uses NCBI E-utilities (esearch -> esummary + efetch abstract XML) with api_key from
            env NCBI_API_KEY. Runs Semantic Scholar /paper/search in parallel with fields:
            title,abstract,authors,year,journal,venue,openAccessPdf,publicationTypes,externalIds,url,citationCount.
            Dedupe by DOI (fallback normalized title). Response shape:
              { query, pillar, total, sources:{pubmed, semanticScholar}, results:[...] }
            Each result has: id, provider, source (peer-reviewed|preprint|editorial|blog),
            title, journal, year, authors, authorsShort, abstract, doi, url, pmid,
            reliability|reliabilityLabel|reliabilityNote|plain (all null placeholders),
            flags:[] (AI-populated later).
            Smoke test with curl for q=MTHFR folate returned 12 PubMed records + full abstracts;
            Semantic Scholar returned 0 in that test which is expected under the public rate limit.
            Please verify: 200 status, proper JSON shape, no ObjectID leaks, pubmed key working
            (should see requests succeed at ~10/s), empty query returns { results: [] } cleanly,
            preprint detection when journal is bioRxiv/medRxiv, dedupe when same DOI comes from both
            sources.
        -working: true
          agent: "testing"
          comment: |
            ✅ ALL TESTS PASSED (7/7). Comprehensive backend testing completed:
            1. Basic search (MTHFR C677T): Returns 200 with 12 PubMed results, all fields valid (id, provider, source, title, journal, year, url, abstract)
            2. PubMed-only filter (source=pubmed): Returns 200, semanticScholar count = 0, only PubMed results
            3. Semantic Scholar-only filter (source=s2): Returns 200 with 10 S2 results, pubmed count = 0
            4. Empty query: Returns 200 with empty results array as expected
            5. Pillar parameter: Returns 200, pillar "Genomics" correctly echoed in response
            6. NCBI API key usage: 3 rapid sequential calls all succeeded (0.55-0.72s each), confirming API key is working
            7. No MongoDB ObjectIds: JSON properly serialized, no ObjectId patterns found
            All result objects have correct structure with no undefined fields. Abstracts populated correctly.
  - task: "Catch-all API router still returns service metadata on GET /api"
    implemented: true
    working: true
    file: "/app/app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "low"
    needs_retesting: false
    status_history:
        -working: "NA"
          agent: "main"
          comment: "Default GET returns { status, service, version, endpoints[] }."
        -working: true
          agent: "testing"
          comment: "Verified during testing - GET /api returns service metadata correctly (status: ok, service: selfscience, version: 0.2.0, endpoints array present)."

frontend:
  - task: "AI evaluation speed optimisation (Groq primary + parallel + cache)"
    implemented: true
    working: true
    file: "/app/lib/ai.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: true
          agent: "main"
          comment: |
            Measured baseline latency (OpenRouter free tier):
              /api/score-reliability : 7-44s per call
              /api/translate-plain-language : 34-60s per call (many hitting 60s ceiling)
            After optimisation:
              /api/score-reliability : ~590-620ms per call  (Groq llama-3.1-8b-instant)
              /api/translate-plain-language : ~610-700ms per call (Groq llama-3.3-70b-versatile)
              First badge on /search : 1.26s (was ~30-40s)
              5 badges visible : 4.68s (was ~45-60s)
              Repeat search (cache hit) : first badge 0.26s, 5 badges 1.86s
            Changes:
              1. lib/ai.js: Swapped primary from OpenRouter free to Groq direct
                 (Groq inference is ~10-100x faster than OpenRouter free tier). Added a
                 3-tier fallback chain: Groq primary (fast small/large model) -> Groq
                 secondary (different model, separate rate-limit bucket) -> OpenRouter.
                 Under burst load (12 parallel requests) tested wall-time = 1.24s, ZERO
                 requests fell through to slow OpenRouter.
                 Reliability max_tokens 1024->512 (schema is tiny).
              2. search-client.jsx analyzeInPool:
                   - Reliability + plain-language now fire IN PARALLEL per item
                     (were previously chained; each item now takes ~1 round trip instead of 2)
                   - Concurrency bumped from 2 to 5 in-flight items
                   - localStorage cache keyed by doi/pmid/id with 7-day TTL and versioning
                     -> repeat searches for the same paper resolve without any AI call
              3. Fallback prompt no longer needs reliability context (plain-language works
                 standalone), so the parallelisation is safe.
  - task: "Microsoft Clarity with auto-masked inputs + 10th pillar (Pediatric & Youth Wellness)"
    implemented: true
    working: true
    file: "/app/components/analytics.jsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
        -working: true
          agent: "main"
          comment: |
            Clarity:
            - Loads via next/script when NEXT_PUBLIC_CLARITY_ID is set. Full no-op when empty.
            - Added dedicated clarity-mask script that runs a MutationObserver on
              document.documentElement, tagging every input/textarea/select/[contenteditable]
              with data-clarity-mask="True". Covers static + dynamic + attribute-changed cases.
            - Verified end-to-end: on /genome the file input is masked, on / the search bar
              is masked, dynamically injected inputs are masked within ~500ms of insertion.
            - Also fires clarity('set','maskAllInputs','true') and clarity('consent') as
              belt-and-braces if the Clarity project accepts those flags.

            Pillars:
            - Added 10th pillar "Pediatric & Youth Wellness" (short label: "Youth Wellness")
              in /app/components/site-nav.jsx PILLARS array with Baby icon.
            - Updated /app/app/page.js CATEGORY_PILLS + PILL_TO_PILLAR mapping so the
              hero category pill row + pillar grid + pillar dropdown all include it.
            - Homepage copy updated: "nine health pillars" -> "ten health pillars",
              "The Nine Pillars" -> "The Ten Pillars", grid heading now reads "from infancy
              through longevity".
  - task: "GA4 analytics with privacy-safe custom event tracking"
    implemented: true
    working: true
    file: "/app/lib/analytics.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
        -working: true
          agent: "main"
          comment: |
            Wired GA4 via next/script (no extra package required, but @next/third-parties compatible).
            Env var: NEXT_PUBLIC_GA_MEASUREMENT_ID (safe no-op when empty). IP anonymised,
            ad_storage/ad_personalization consent denied by default, allow_google_signals=false.
            Custom events fired via lib/analytics.js -> trackEvent(name, params).
            Params are sanitised through an ALLOWED_KEYS whitelist so PII/health data
            (search query text, genome contents, variant lists) can never leak — only
            event names, page paths, and generic metadata (source, tab, book_slug, pillar,
            file_format, variant_count) are ever sent.
            Events wired:
              search_performed          -> homepage submit, /search submit, autocomplete selection
              genome_upload_started     -> file drop/select (file_format only, never contents)
              genome_results_viewed     -> once when stage becomes 'results' + on Full/Roadmap tab switch
              reading_list_viewed       -> useEffect on /reading-list mount
              book_research_clicked     -> Find the Research button (both list + detail)
              plain_language_expanded   -> result-card Full Abstract toggle + study-page tab switch
            Verified end-to-end via Playwright: injected a test measurement ID, confirmed
            gtag script loaded, confirmed events landed in dataLayer with correct params,
            confirmed NO search query text or file contents appear in any payload.
  - task: "Final polish: static pages, metadata, error/loading states, analytics scaffold"
    implemented: true
    working: "NA"
    file: "/app/app/layout.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
        -working: "NA"
          agent: "main"
          comment: |
            Session 6 polish complete:
            - Root layout metadata expanded: title template, description, keywords, robots,
              openGraph, twitter card, canonical, viewport theme-color.
            - Conditional Analytics component (GA4 + Microsoft Clarity) via next/script,
              driven by NEXT_PUBLIC_GA_ID and NEXT_PUBLIC_CLARITY_ID env vars (empty = no-op).
            - New static pages with unique metadata each:
                /about, /how-it-works, /privacy, /terms
              Shared <StaticPageShell/> + <SiteFooter/> for consistency.
            - Global error.js (client) with digest ref + retry/home CTAs.
            - Custom not-found.js with 404 branded UI + search CTA.
            - Global loading.js fallback for suspense.
            - Per-page metadata added: /search, /genome, /study/[id] (generateMetadata),
              /reading-list (via layout.js), /reading-list/[slug] (generateMetadata pulling
              book title from READING_LIST).
            - Mobile responsiveness spot-checked at 390px (Terms page verified: hamburger nav,
              stacked layout, readable typography).
            - Env additions: NEXT_PUBLIC_GA_ID, NEXT_PUBLIC_CLARITY_ID, NEXT_PUBLIC_SITE_URL.
  - task: "Homepage hero search wiring and pillar navigation"
    implemented: true
    working: "NA"
    file: "/app/app/page.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
        -working: "NA"
          agent: "main"
          comment: |
            Hero search form + category pills + pillar-card topic buttons now push to
            /search?q=...&pillar=.... FEATURED cards still use hand-curated data with
            reliability + plain summaries populated to preview the eventual AI-populated state.
  - task: "/search page — persistent search band, filters, live results grid"
    implemented: true
    working: "NA"
    file: "/app/app/search/search-client.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        -working: "NA"
          agent: "main"
          comment: |
            Reads ?q, ?pillar, ?source from URL. Runs client-side fetch to /api/search.
            Renders responsive 2-col grid of shared <ResultCard/> with skeleton loader,
            empty state, and error state. Filters: source (all/pubmed/s2), date (any/1/5/10),
            pillar pills. Date filter is client-side. Reliability filter shown as disabled note.

metadata:
  created_by: "main_agent"
  version: "1.2"
  test_sequence: 2
  run_ui: false

test_plan:
  current_focus: []
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
    -agent: "main"
      message: |
        Only backend testing needed right now. Please verify /api/search end-to-end:
        1) GET /api/search?q=MTHFR%20C677T (default source=all) returns 200 with a `results` array.
           Every item should have: id, provider, source, title, journal, year, url, and either
           an abstract string or empty string (never undefined).
        2) GET /api/search?q=zone%202%20training&source=pubmed returns only PubMed items
           (sources.semanticScholar should be 0).
        3) GET /api/search?q=rapamycin&source=s2 returns only Semantic Scholar items
           (sources.pubmed should be 0). Note: Semantic Scholar public tier is 429-prone; if
           empty results come back with 200 status that's acceptable — flag it but do not treat
           as failure of our endpoint.
        4) GET /api/search?q= (empty) returns 200 with results: [].
        5) GET /api/search?q=CRISPR&pillar=Genomics returns results and echoes pillar in response.
        6) Confirm NCBI_API_KEY is being sent (indirectly: request rate should not immediately 429).
        7) No JSON-serialization errors, no MongoDB ObjectIds leaking (we don't touch Mongo yet).
        Skip frontend testing — user will review the UI themselves.

    -agent: "testing"
      message: |
        ✅ BACKEND TESTING COMPLETE - ALL TESTS PASSED (7/7)
        
        Tested /api/search endpoint comprehensively with the following results:
        
        1. ✅ Basic search (MTHFR C677T): 200 OK, 12 PubMed results with all required fields
        2. ✅ PubMed-only filter: 200 OK, semanticScholar count = 0, only PubMed results
        3. ✅ Semantic Scholar-only filter: 200 OK, 10 S2 results, pubmed count = 0
        4. ✅ Empty query: 200 OK with empty results array
        5. ✅ Pillar parameter: 200 OK, pillar "Genomics" echoed correctly
        6. ✅ NCBI API key: 3 rapid calls succeeded (0.55-0.72s), no rate limiting
        7. ✅ No MongoDB ObjectIds: JSON properly serialized
        
        All result objects validated with correct structure:
        - Required fields present: id, provider, source, title, journal, year, url, abstract
        - No undefined fields
        - Abstracts properly populated (strings, can be empty)
        - Response shape matches specification
        
        The /api/search endpoint is fully functional and ready for production use.
        Both backend tasks marked as working=true, needs_retesting=false.
