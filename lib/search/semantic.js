// /app/lib/search/semantic.js
// LLM-driven semantic query expansion + result reranking. Bails to null / []
// on any error so search never blocks on an LLM failure.

import { expandSemantic, rerankSemantic } from '@/lib/ai'

/** Ask the LLM for 3-5 semantically related biomedical terms for the query. */
export async function llmExpandQuery(query) {
  try {
    const prompt =
      `Expand this biomedical search query into 3-5 additional semantically related search terms. ` +
      `Focus on synonyms, related pathways, and clinically-linked concepts a research literature search would use. ` +
      `Return ONLY a JSON array of strings, no prose, no markdown, no wrapping object. ` +
      `Example: query="energy" -> ["ATP production","mitochondrial function","cellular respiration","fatigue","aerobic metabolism"]. ` +
      `Query: "${query}"`
    const result = await expandSemantic(prompt)
    if (!result?.text) return []
    let s = String(result.text).trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
    let arr = null
    try {
      const j = JSON.parse(s)
      if (Array.isArray(j)) {
        arr = j
      } else if (j && typeof j === 'object') {
        for (const v of Object.values(j)) {
          if (Array.isArray(v)) { arr = v; break }
        }
      }
    } catch { /* leave arr null */ }
    if (!Array.isArray(arr)) return []
    return arr
      .filter((x) => typeof x === 'string' && x.length && x.length < 80)
      .slice(0, 5)
  } catch (err) {
    console.warn('[semantic-expand] failed:', err?.message)
    return []
  }
}

export async function llmRerankResults(query, items) {
  try {
    if (!Array.isArray(items) || items.length < 2) return null
    // Limit to 40 to keep the prompt small.
    const truncated = items.slice(0, 40)
    const lines = truncated.map((it, i) => {
      const t = String(it.title || '').slice(0, 200)
      const j = it.journal ? ` [${String(it.journal).slice(0, 60)}]` : ''
      const y = it.year ? ` (${it.year})` : ''
      return `${i + 1}. ${t}${j}${y}`
    }).join('\n')
    const prompt =
      `Given the query "${query}", rank the following ${truncated.length} papers from most to least semantically relevant. ` +
      `Consider: exact topic match, methodology fit, and clinical/mechanistic relevance. ` +
      `Return ONLY a JSON array of integers (1-indexed) matching the input line numbers, in ranked order. Example: [3,1,7,2,4,...]. No prose. No markdown. No wrapping object.\n\n${lines}`
    const result = await rerankSemantic(prompt)
    if (!result?.text) return null
    let s = String(result.text).trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
    let arr = null
    try {
      const j = JSON.parse(s)
      if (Array.isArray(j)) {
        arr = j
      } else if (j && typeof j === 'object') {
        for (const v of Object.values(j)) {
          if (Array.isArray(v)) { arr = v; break }
        }
      }
    } catch { /* leave arr null */ }
    if (!Array.isArray(arr)) return null
    const seen = new Set()
    const ordered = []
    for (const n of arr) {
      const idx = parseInt(n, 10) - 1
      if (Number.isInteger(idx) && idx >= 0 && idx < truncated.length && !seen.has(idx)) {
        seen.add(idx)
        ordered.push(truncated[idx].id)
      }
    }
    for (let i = 0; i < truncated.length; i++) {
      if (!seen.has(i)) ordered.push(truncated[i].id)
    }
    return ordered
  } catch (err) {
    console.warn('[semantic-rerank] failed:', err?.message)
    return null
  }
}
