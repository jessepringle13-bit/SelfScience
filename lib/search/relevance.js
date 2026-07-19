// /app/lib/search/relevance.js
// Merge, dedupe, and relevance scoring across all search adapters.
// Extracted verbatim from the pre-refactor catch-all route.js.

const normalizeTitle = (t) =>
  (t || '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

// Provider priority when the same paper is found in multiple sources.
// Later sources fill in missing fields (e.g., abstract, oaUrl, citationCount).
const PROVIDER_RANK = { PubMed: 0, 'Semantic Scholar': 1, OpenAlex: 2, Crossref: 3 }

// Common English stopwords + a few generic academic filler words we don't want
// to inflate token overlap scores.
const STOPWORDS = new Set([
  'a', 'an', 'the', 'of', 'in', 'on', 'at', 'to', 'for', 'and', 'or', 'but',
  'is', 'are', 'was', 'were', 'be', 'as', 'by', 'with', 'from', 'that', 'this',
  'these', 'those', 'it', 'its', 'we', 'our', 'their', 'not', 'no', 'do', 'does',
  'has', 'have', 'had', 'can', 'may', 'might', 'will', 'shall', 'study',
  'research', 'paper', 'article',
])

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Turn a raw user query into { tokens, phrases, fullPhrase } where:
 *  - tokens = significant lowercase words (stopwords removed, min 2 chars OR digit)
 *  - phrases = the full query (if 2+ tokens) plus every adjacent bigram
 *  - fullPhrase = the full lowercased query string for exact-phrase matching
 */
export function parseQuery(q) {
  const clean = (q || '').toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim()
  if (!clean) return { tokens: [], phrases: [], fullPhrase: '' }
  const raw = clean.split(' ')
  const tokens = raw.filter((w) => w && !STOPWORDS.has(w) && (w.length >= 2 || /^\d+$/.test(w)))
  const phrases = new Set()
  if (tokens.length >= 2) {
    phrases.add(clean)
    for (let i = 0; i < raw.length - 1; i++) {
      if (STOPWORDS.has(raw[i]) || STOPWORDS.has(raw[i + 1])) continue
      const bigram = `${raw[i]} ${raw[i + 1]}`
      if (bigram.trim().length >= 3) phrases.add(bigram)
    }
  }
  return { tokens, phrases: [...phrases], fullPhrase: clean }
}

/**
 * Score a result against a parsed query. Higher score = more relevant.
 * Also returns a `keep` flag that decides whether to include the result at all.
 */
export function scoreRelevance(item, parsed) {
  const { tokens, phrases, fullPhrase } = parsed
  const title = (item.title || '').toLowerCase()
  const abstract = (item.abstract || '').toLowerCase()
  const journal = (item.journal || '').toLowerCase()

  let score = 0

  // Full-query phrase — strongest signal
  if (fullPhrase && title.includes(fullPhrase)) score += 20
  else if (fullPhrase && abstract.includes(fullPhrase)) score += 12

  // Bigram / phrase matches
  let phraseHitsTitle = 0
  let phraseHitsAbstract = 0
  for (const p of phrases) {
    if (p === fullPhrase) continue
    if (title.includes(p)) { score += 6; phraseHitsTitle++ }
    else if (abstract.includes(p)) { score += 3; phraseHitsAbstract++ }
  }

  // Individual token (whole-word) matches
  let titleTokenHits = 0
  let absTokenHits = 0
  for (const t of tokens) {
    const re = new RegExp(`\\b${escapeRegex(t)}\\b`, 'i')
    if (re.test(title)) { score += 2; titleTokenHits++ }
    else if (re.test(abstract)) { score += 1; absTokenHits++ }
    else if (re.test(journal)) score += 0.5
  }

  // ---- Keep / drop decision ----
  // Recall vs precision tuning is applied per token-count. Short queries
  // (0-2 tokens) get the tighter rules because a single stray token match
  // is often a false positive; long queries (3+ tokens) get progressively
  // looser rules because the more tokens a user throws in, the more likely
  // one of them is a peripheral hint (e.g. gene + pillar keywords in a
  // fan-out request) rather than a hard constraint.
  let keep
  if (tokens.length === 0) {
    keep = true
  } else if (tokens.length === 1) {
    keep = titleTokenHits + absTokenHits > 0
  } else if (tokens.length === 2) {
    const hasFullPhrase =
      fullPhrase && (title.includes(fullPhrase) || abstract.includes(fullPhrase))
    const hasStrongBigram = phraseHitsTitle > 0
    const allTokensInTitle = titleTokenHits === tokens.length
    const goodCoverage =
      (titleTokenHits + absTokenHits) === tokens.length &&
      titleTokenHits >= Math.min(2, tokens.length - 1)
    keep = hasFullPhrase || hasStrongBigram || allTokensInTitle || goodCoverage
  } else {
    // 3+ tokens: don't demand every token be present. Real-world
    // biomedical text rarely mentions every keyword a user throws at
    // search (especially when the query is gene + pillar-topic + user
    // text). Keep if ANY of:
    //   * the full phrase appears somewhere,
    //   * >= 2 tokens land in the title (strong topical signal), or
    //   * near-full coverage (all-but-one tokens found, >= 1 in title)
    const hasFullPhrase =
      fullPhrase && (title.includes(fullPhrase) || abstract.includes(fullPhrase))
    const twoInTitle = titleTokenHits >= 2
    const nearFullCoverage =
      (titleTokenHits + absTokenHits) >= (tokens.length - 1) && titleTokenHits >= 1
    keep = hasFullPhrase || twoInTitle || nearFullCoverage
  }

  return { score, keep }
}

export function mergeResults(arrays, parsedQuery) {
  const seen = new Map()
  const all = []
  for (const arr of arrays) for (const it of arr) all.push(it)

  // Sort so higher-priority providers land first and become the "base" record
  all.sort((a, b) => (PROVIDER_RANK[a.provider] ?? 9) - (PROVIDER_RANK[b.provider] ?? 9))

  for (const item of all) {
    const key = item.doi
      ? `doi:${item.doi.toLowerCase()}`
      : `title:${normalizeTitle(item.title)}`
    if (!key || key === 'title:') continue
    if (!seen.has(key)) {
      seen.set(key, { ...item, providers: [item.provider] })
    } else {
      const existing = seen.get(key)
      if (!existing.providers.includes(item.provider)) existing.providers.push(item.provider)
      if (!existing.abstract && item.abstract) existing.abstract = item.abstract
      if (!existing.oaUrl && item.oaUrl) existing.oaUrl = item.oaUrl
      if (!existing.oaStatus && item.oaStatus) existing.oaStatus = item.oaStatus
      if (!existing.citationCount && item.citationCount)
        existing.citationCount = item.citationCount
      if (!existing.journal && item.journal) existing.journal = item.journal
      if (!existing.doi && item.doi) existing.doi = item.doi
      if (!existing.pmid && item.pmid) existing.pmid = item.pmid
    }
  }

  let list = [...seen.values()]

  if (parsedQuery && parsedQuery.tokens.length > 0) {
    list = list
      .map((it) => {
        const r = scoreRelevance(it, parsedQuery)
        return { ...it, _relevance: r.score, _keep: r.keep }
      })
      .filter((it) => it._keep)
      .sort((a, b) => (b._relevance - a._relevance) || ((b.year || 0) - (a.year || 0)))
      .map(({ _keep, ...rest }) => rest)
  } else {
    list.sort((a, b) => (b.year || 0) - (a.year || 0))
  }

  return list
}
