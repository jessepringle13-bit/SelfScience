// /app/lib/geneTrialsCache.js
// SelfScience — Client-side helper + localStorage cache for gene-scoped
// ClinicalTrials.gov badges on the Dashboard gene chips.
//
// Design:
//   * 24h TTL — trial data changes slowly and we don't want to hammer
//     ClinicalTrials.gov on every dashboard revisit.
//   * Dedupes in-flight requests: if two chips ask for the same gene at
//     once, only one network call fires and both await the same promise.
//   * Returns null-safe payload on failure so consumers don't have to
//     defensively handle undefined.
//
// Payload shape:
//   { gene, total, recruiting, completed, terminated, other, active,
//     top: [{ nctId, title, status, phase, year, url }, ...] }

const CACHE_VERSION = 'v1'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const inflight = new Map()

function keyFor(gene) {
  return `ss_gene_trials_${CACHE_VERSION}_${String(gene).toUpperCase()}`
}

export function emptyTrialsPayload(gene = '') {
  return {
    gene: String(gene).toUpperCase(),
    total: 0,
    recruiting: 0,
    completed: 0,
    terminated: 0,
    other: 0,
    active: 0,
    top: [],
  }
}

export function readCache(gene) {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(keyFor(gene))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.ts || !parsed?.data) return null
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null
    return parsed.data
  } catch {
    return null
  }
}

export async function getGeneTrials(gene) {
  if (!gene) return emptyTrialsPayload('')
  const G = String(gene).toUpperCase()
  const cached = readCache(G)
  if (cached) return cached
  if (inflight.has(G)) return inflight.get(G)

  const p = (async () => {
    try {
      const r = await fetch(`/api/clinical-trials/gene?gene=${encodeURIComponent(G)}`)
      if (!r.ok) throw new Error(`http ${r.status}`)
      const data = await r.json()
      try {
        window.localStorage.setItem(
          keyFor(G),
          JSON.stringify({ ts: Date.now(), data }),
        )
      } catch {
        /* quota exceeded — degrade silently */
      }
      return data
    } catch (err) {
      return emptyTrialsPayload(G)
    } finally {
      inflight.delete(G)
    }
  })()

  inflight.set(G, p)
  return p
}

// Utility: batch fetch a set of genes. Simple concurrency limiter so we
// don't fire off 60 requests in parallel on dashboard mount.
export async function getGeneTrialsBatch(genes, concurrency = 4) {
  const unique = [...new Set((genes || []).filter(Boolean).map((g) => String(g).toUpperCase()))]
  const out = new Map()
  let i = 0
  async function worker() {
    while (i < unique.length) {
      const g = unique[i++]
      const data = await getGeneTrials(g)
      out.set(g, data)
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, Math.max(1, unique.length)) }, worker)
  await Promise.all(workers)
  return out
}
