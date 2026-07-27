'use client'

// /app/app/coach/page.js
// AI Coach chat surface. Multi-turn conversation, cited answers, chat
// history in sessionStorage (never sent to any server). Rate-limited
// via the /api/coach endpoint. Works out of the box for anyone — no
// genome required. When a genome is loaded we assemble a small slice
// of grounded context and send it alongside the message so the coach
// can reference the user's own variants.

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Bot, Send, Sparkles, Trash2, ShieldCheck, ArrowLeft, ExternalLink, AlertCircle } from 'lucide-react'
import SiteNav from '@/components/site-nav'
import { hasGenomeResults, getGenomeResults } from '@/lib/genomeSession'

const SS_KEY = 'ss_coach_chat_v1'
const SESSION_ID_KEY = 'ss_coach_session_id'

function ensureSessionId() {
  if (typeof window === 'undefined') return 'server'
  try {
    let id = window.sessionStorage.getItem(SESSION_ID_KEY)
    if (!id) {
      id = 'ss_' + Math.random().toString(36).slice(2, 10) + '_' + Date.now().toString(36)
      window.sessionStorage.setItem(SESSION_ID_KEY, id)
    }
    return id
  } catch { return 'anon' }
}

function loadHistory() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.sessionStorage.getItem(SS_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch { return [] }
}

function saveHistory(list) {
  try { window.sessionStorage.setItem(SS_KEY, JSON.stringify(list.slice(-30))) } catch {}
}

// Build a slim, non-identifying context payload from the client's
// genome results (if loaded). Only names + classifications — never
// raw file bytes.
function buildContext(activePillar) {
  const ctx = { activePillar: activePillar || null, userVariants: [], supplements: [], biomarkerFlags: [] }
  try {
    if (hasGenomeResults()) {
      const g = getGenomeResults()
      const vs = Array.isArray(g?.variants_recognized) ? g.variants_recognized : []
      ctx.userVariants = vs.slice(0, 8).map((v) => ({
        gene: v?.gene || v?.geneSymbol,
        rsid: v?.rsid,
        classification: v?.classification || v?.class,
      })).filter((v) => v.gene || v.rsid)
    }
  } catch {}
  return ctx
}

const DEFAULT_STARTERS = [
  'What does my genome actually tell me?',
  'How reliable is a single study? Explain like I’m new.',
  'What’s the difference between a strength and awareness variant?',
  'Give me a plain-English explanation of GWAS.',
]

function personalisedStarters(userVariants) {
  if (!userVariants?.length) return DEFAULT_STARTERS
  const seen = new Set()
  const out = []
  for (const v of userVariants) {
    const g = v?.gene
    if (!g || seen.has(g)) continue
    seen.add(g)
    out.push(`Ask about my ${g} result`)
    if (out.length >= 4) break
  }
  while (out.length < 4) out.push(DEFAULT_STARTERS[out.length])
  return out
}

export default function CoachPage() {
  const [history, setHistory] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [rateReset, setRateReset] = useState(null)
  const [genomeLoaded, setGenomeLoaded] = useState(false)
  const [ctxGenes, setCtxGenes] = useState([])
  const scrollRef = useRef(null)

  useEffect(() => {
    setHistory(loadHistory())
    const load = () => {
      const ok = hasGenomeResults()
      setGenomeLoaded(ok)
      if (ok) {
        const ctx = buildContext(null)
        setCtxGenes((ctx.userVariants || []).map((v) => v.gene).filter(Boolean))
      }
    }
    load()
    window.addEventListener('selfscience:genome-changed', load)
    return () => window.removeEventListener('selfscience:genome-changed', load)
  }, [])

  useEffect(() => {
    // Auto-scroll to bottom on new message.
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [history, sending])

  const send = async (text) => {
    const msg = (text || input).trim()
    if (!msg || sending) return
    setError('')
    setInput('')
    const nextHistory = [...history, { role: 'user', content: msg, at: Date.now() }]
    setHistory(nextHistory)
    saveHistory(nextHistory)
    setSending(true)
    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          conversationHistory: nextHistory.slice(-8).map((m) => ({ role: m.role, content: m.content })),
          context: buildContext(null),
          sessionId: ensureSessionId(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 429) {
          setRateReset(data.resetAt || null)
          setError(data.message || 'You’ve reached the free Coach limit for now.')
        } else {
          setError(data.message || 'The Coach is temporarily unavailable. Please try again.')
        }
        return
      }
      const reply = { role: 'assistant', content: data.reply || '', detectedGenes: data.detectedGenes || [], citations: data.citations || [], provider: data.provider, model: data.model, at: Date.now() }
      const finalHistory = [...nextHistory, reply]
      setHistory(finalHistory)
      saveHistory(finalHistory)
      if (data.rateLimit?.resetAt) setRateReset(data.rateLimit.resetAt)
    } catch (e) {
      setError('Network error. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const clear = () => {
    setHistory([])
    saveHistory([])
    setError('')
  }

  const starters = useMemo(() => personalisedStarters(ctxGenes.map((g) => ({ gene: g }))), [ctxGenes])

  return (
    <div className="min-h-screen bg-ss-canvas">
      <SiteNav />
      <main className="container flex min-h-[calc(100vh-80px)] max-w-3xl flex-col pt-24 pb-8">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ss-orange/15 text-ss-orange ring-1 ring-ss-orange/40">
              <Bot size={20} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-ss-text md:text-3xl">AI Coach</h1>
                <span className="inline-flex items-center gap-1 rounded-full border border-ss-teal/40 bg-ss-teal/[0.06] px-2 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-widest text-ss-teal">
                  <ShieldCheck size={9} /> Educational only
                </span>
              </div>
              <p className="text-[13px] text-ss-muted">Ask questions about your genome, biomarkers, or general research — grounded answers with citation chips.</p>
            </div>
          </div>
          <Link href="/" className="ss-hide-in-print inline-flex items-center gap-1 rounded-full border border-ss-border-warm/60 bg-ss-surface px-3 py-1.5 text-[12px] font-semibold text-ss-muted transition hover:text-ss-text">
            <ArrowLeft size={11} /> Dashboard
          </Link>
        </div>

        {/* Disclaimer strip */}
        <div className="mt-4 rounded-lg border border-ss-orange/20 bg-ss-orange/[0.05] px-3 py-2 text-[11.5px] leading-snug text-ss-text">
          <span className="font-mono font-bold text-ss-orange">EDUCATIONAL ONLY.</span> Not medical advice. Nothing about your genome or messages is stored on our servers. Chat history lives only in this browser tab.
        </div>

        {/* Chat area */}
        <div ref={scrollRef} className="mt-4 flex-1 space-y-4 overflow-y-auto rounded-2xl border border-ss-border-warm/60 bg-ss-surface p-4 shadow-sm">
          {history.length === 0 && !sending && (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ss-orange/10 text-ss-orange ring-1 ring-ss-orange/30">
                <Sparkles size={20} />
              </div>
              <div>
                <div className="text-[15px] font-bold text-ss-text">
                  {genomeLoaded ? 'Ready when you are.' : 'Ask me anything about research or genetics.'}
                </div>
                <div className="mt-1 text-[12.5px] text-ss-muted">
                  {genomeLoaded
                    ? `I can reference ${ctxGenes.length} of your variants. Try:`
                    : 'No genome loaded — I’ll answer general research questions. Upload a file for personalised answers.'}
                </div>
              </div>
              <div className="mx-auto grid max-w-md gap-2 sm:grid-cols-2">
                {starters.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="rounded-xl border border-ss-border-warm/60 bg-ss-canvas/40 px-3 py-2 text-left text-[12.5px] font-semibold text-ss-text transition hover:border-ss-orange/60 hover:text-ss-orange"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {history.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed ${
                m.role === 'user'
                  ? 'bg-ss-orange text-white'
                  : 'bg-ss-canvas/40 text-ss-text ring-1 ring-ss-border-warm/60'
              }`}>
                <div className="whitespace-pre-wrap">{m.content}</div>
                {m.role === 'assistant' && (m.detectedGenes?.length || m.citations?.length) ? (
                  <div className="mt-2 flex flex-wrap gap-1.5 border-t border-ss-border-warm/50 pt-2">
                    {(m.detectedGenes || []).map((g) => (
                      <span key={g} className="inline-flex items-center rounded-full bg-ss-teal/10 px-2 py-0.5 font-mono text-[10px] font-bold text-ss-teal">{g}</span>
                    ))}
                    {(m.citations || []).map((c, ci) => (
                      <a
                        key={ci}
                        href={`https://www.ncbi.nlm.nih.gov/snp/${encodeURIComponent(c.rsid)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-full border border-ss-orange/40 bg-ss-orange/[0.06] px-2 py-0.5 font-mono text-[10px] font-bold text-ss-orange hover:bg-ss-orange/[0.14]"
                      >
                        {c.rsid} <ExternalLink size={9} />
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-ss-canvas/40 px-4 py-3 text-[13px] text-ss-muted ring-1 ring-ss-border-warm/60">
                <span className="inline-flex items-center gap-2">
                  <span className="ss-typing-dot" /> Coach is thinking&hellip;
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Error strip */}
        {error && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/[0.05] px-3 py-2 text-[12.5px] text-red-500">
            <AlertCircle size={13} className="mt-0.5 shrink-0" />
            <div>{error}</div>
          </div>
        )}

        {/* Composer */}
        <form
          onSubmit={(e) => { e.preventDefault(); send() }}
          className="mt-3 flex flex-wrap items-end gap-2 rounded-2xl border border-ss-border-warm/60 bg-ss-surface p-2 shadow-sm"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            rows={1}
            placeholder="Ask about a gene, a supplement, or a study…"
            className="flex-1 min-w-[200px] resize-none bg-transparent px-3 py-2 text-[14px] text-ss-text placeholder:text-ss-muted focus:outline-none"
            maxLength={2000}
          />
          <div className="flex items-center gap-1.5">
            {history.length > 0 && (
              <button
                type="button"
                onClick={clear}
                className="inline-flex h-9 items-center gap-1 rounded-full border border-ss-border-warm/60 bg-ss-canvas/40 px-3 text-[12px] font-semibold text-ss-muted hover:text-ss-text"
                title="Clear chat"
              >
                <Trash2 size={12} /> Clear
              </button>
            )}
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className={`inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-bold transition ${
                sending || !input.trim()
                  ? 'cursor-not-allowed bg-ss-muted/30 text-ss-muted'
                  : 'bg-ss-orange text-white hover:bg-ss-orange-dark'
              }`}
            >
              <Send size={13} /> Send
            </button>
          </div>
        </form>

        {/* Model / rate limit footer */}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] text-ss-muted">
          <span>Free tier · shared budget across all users</span>
          <span>Chat stays in this tab only</span>
        </div>

        <style jsx>{`
          .ss-typing-dot::after {
            content: '•••';
            animation: ss-typing 1.4s infinite;
          }
          @keyframes ss-typing {
            0%, 100% { opacity: 0.4; }
            50%      { opacity: 1;   }
          }
        `}</style>
      </main>
    </div>
  )
}
