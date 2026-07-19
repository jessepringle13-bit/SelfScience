// /app/lib/researchMatchedCache.js
// SessionStorage cache for the Dashboard "Research Matched to You" section.
// Per-gene, session-scoped (cleared automatically when the tab closes so we
// respect the privacy-by-design contract).

const KEY_PREFIX = 'ss_research_matched_v1_'
const TTL_MS = 60 * 60 * 1000 // 1h within the session

function keyFor(gene) {
  return `${KEY_PREFIX}${String(gene).toUpperCase()}`
}

function hasWindow() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

export function readMatchedCache(gene) {
  if (!hasWindow()) return null
  try {
    const raw = window.sessionStorage.getItem(keyFor(gene))
    if (!raw) return null
    const { ts, papers } = JSON.parse(raw)
    if (!ts || Date.now() - ts > TTL_MS) return null
    return Array.isArray(papers) ? papers : null
  } catch {
    return null
  }
}

export function writeMatchedCache(gene, papers) {
  if (!hasWindow()) return
  try {
    window.sessionStorage.setItem(
      keyFor(gene),
      JSON.stringify({ ts: Date.now(), papers: papers || [] }),
    )
  } catch {
    /* quota — silent */
  }
}

// Simple concurrency-limited batch fetch.
export async function fetchMatchedResearch(genes, { perGene = 3, concurrency = 4 } = {}) {
  const unique = [...new Set((genes || []).filter(Boolean).map((g) => String(g).toUpperCase()))]
  const out = new Map()
  let i = 0
  async function worker() {
    while (i < unique.length) {
      const g = unique[i++]
      // Read cache first
      const cached = readMatchedCache(g)
      if (cached) {
        out.set(g, cached)
        continue
      }
      try {
        const r = await fetch(`/api/pubmed-search?gene=${encodeURIComponent(g)}&limit=${perGene}`)
        if (!r.ok) {
          out.set(g, [])
          continue
        }
        const data = await r.json()
        const papers = Array.isArray(data?.results) ? data.results : []
        writeMatchedCache(g, papers)
        out.set(g, papers)
      } catch {
        out.set(g, [])
      }
    }
  }
  const workers = Array.from(
    { length: Math.min(concurrency, Math.max(1, unique.length)) },
    worker,
  )
  await Promise.all(workers)
  return out
}
