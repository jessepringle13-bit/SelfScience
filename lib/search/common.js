// /app/lib/search/common.js
// Cross-adapter helpers used by multiple search sources.

export function yearFromPubdate(pubdate) {
  if (!pubdate) return null
  const m = String(pubdate).match(/(19|20)\d{2}/)
  return m ? parseInt(m[0], 10) : null
}

export function detectPreprint(paper) {
  const journalName = paper?.journal?.name || paper?.venue || ''
  const types = paper?.publicationTypes || []
  const isPreprintVenue = /biorxiv|medrxiv|arxiv|chemrxiv|ssrn|preprints\.org/i.test(journalName)
  const isPreprintType = types.some((t) => /preprint/i.test(t))
  return isPreprintVenue || isPreprintType
}

export const OPENALEX_MAILTO = process.env.CONTACT_EMAIL || 'contact@selfscience.io'
