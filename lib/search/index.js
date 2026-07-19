// /app/lib/search/index.js
// Barrel re-export so callers can `import { searchPubmed, ... } from '@/lib/search'`.

export { fetchWithTimeout, safeJson, safeText } from './http'
export { yearFromPubdate, detectPreprint, OPENALEX_MAILTO } from './common'
export { searchPubmed } from './pubmed'
export { searchSemanticScholar } from './semanticScholar'
export { searchEuropePMC } from './europePMC'
export { searchClinicalTrials } from './clinicalTrials'
export { searchOMIM } from './omim'
export { searchDisGeNET } from './disgenet'
export { searchOpenAlex } from './openAlex'
export { searchCrossref } from './crossref'
export { llmExpandQuery, llmRerankResults } from './semantic'
export { parseQuery, scoreRelevance, mergeResults } from './relevance'
