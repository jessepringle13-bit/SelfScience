// /app/components/admin/ArticleForm.jsx
// Shared create/edit form for editorial articles. Handles slug auto-gen,
// live slug uniqueness check, pillar multi-select, tag input, and
// evidence-quality dropdown.

'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, X, Save, FileText, CheckCircle2, AlertCircle } from 'lucide-react'
import { slugify, isValidSlug } from '@/lib/slugify'
import { EDITORIAL_PILLARS } from '@/lib/supabase/pillar-map'

const EVIDENCE_OPTIONS = ['Settled', 'Emerging', 'Preliminary', 'Conflicting']

const BLANK = {
  title: '',
  slug: '',
  authors: '',
  journal: '',
  publish_date: '',
  cover_image_url: '',
  pillars: [],
  tags: [],
  ai_reliability_score: '',
  evidence_quality: '',
  abstract: '',
  plain_terms_summary: '',
  doi: '',
  source_url: '',
  is_published: false,
  is_featured: false,
}

export default function ArticleForm({ initial = null, mode = 'create' }) {
  const router = useRouter()
  const [form, setForm] = useState(() => ({ ...BLANK, ...(initial || {}) }))
  const [slugTouched, setSlugTouched] = useState(!!initial?.slug)
  const [slugStatus, setSlugStatus] = useState({ state: 'idle', message: '' })
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Auto-generate slug from title until the user touches it manually.
  useEffect(() => {
    if (slugTouched) return
    const s = slugify(form.title || '')
    if (s !== form.slug) setForm((p) => ({ ...p, slug: s }))
  }, [form.title, slugTouched]) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced slug uniqueness check.
  useEffect(() => {
    const slug = (form.slug || '').trim().toLowerCase()
    if (!slug) { setSlugStatus({ state: 'idle', message: '' }); return }
    if (!isValidSlug(slug)) {
      setSlugStatus({ state: 'invalid', message: 'Slug must be lowercase alphanumerics + hyphens (e.g. my-article).' })
      return
    }
    setSlugStatus({ state: 'checking', message: 'Checking availability…' })
    const t = setTimeout(async () => {
      try {
        const usp = new URLSearchParams({ slug })
        if (initial?.id) usp.set('excludeId', initial.id)
        const res = await fetch(`/api/admin/articles/check-slug?${usp.toString()}`)
        const j = await res.json()
        if (!res.ok || !j?.ok) {
          setSlugStatus({ state: 'idle', message: '' })
        } else if (j.taken) {
          setSlugStatus({ state: 'taken', message: `Already in use.` })
        } else {
          setSlugStatus({ state: 'available', message: 'Available.' })
        }
      } catch {
        setSlugStatus({ state: 'idle', message: '' })
      }
    }, 400)
    return () => clearTimeout(t)
  }, [form.slug, initial?.id])

  const update = (patch) => setForm((p) => ({ ...p, ...patch }))

  const togglePillar = (p) => {
    setForm((prev) => {
      const has = prev.pillars.includes(p)
      return { ...prev, pillars: has ? prev.pillars.filter((x) => x !== p) : [...prev.pillars, p] }
    })
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (!t) return
    if (form.tags.includes(t)) { setTagInput(''); return }
    update({ tags: [...form.tags, t].slice(0, 40) })
    setTagInput('')
  }
  const removeTag = (t) => update({ tags: form.tags.filter((x) => x !== t) })

  const canSubmit = useMemo(() => {
    return !!form.title.trim() && isValidSlug((form.slug || '').trim()) && slugStatus.state !== 'taken' && !saving
  }, [form.title, form.slug, slugStatus.state, saving])

  async function submit({ asDraft = false } = {}) {
    setError(null); setSaving(true)
    const payload = {
      ...form,
      slug: (form.slug || '').trim().toLowerCase(),
      ai_reliability_score: form.ai_reliability_score === '' ? null : Number(form.ai_reliability_score),
      is_published: asDraft ? false : !!form.is_published,
    }
    try {
      const url = initial?.id ? `/api/admin/articles/${initial.id}` : '/api/admin/articles'
      const method = initial?.id ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Save failed')
      router.replace('/admin/articles?saved=1')
    } catch (e) {
      setError(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (canSubmit) submit() }}
      className="space-y-6"
    >
      <SectionTitle text={mode === 'edit' ? 'Edit article' : 'New article'} />

      {/* Title */}
      <Field label="Title *">
        <input
          type="text"
          required
          value={form.title}
          onChange={(e) => update({ title: e.target.value })}
          className="input"
          placeholder="e.g. MTHFR C677T and folate metabolism"
        />
      </Field>

      {/* Slug */}
      <Field label="Slug *" hint="Lowercase letters, numbers, hyphens only.">
        <div className="flex items-center gap-2">
          <input
            type="text"
            required
            value={form.slug}
            onChange={(e) => { setSlugTouched(true); update({ slug: e.target.value.toLowerCase() }) }}
            className="input flex-1"
            placeholder="my-article-slug"
          />
          <SlugStatusBadge status={slugStatus} />
        </div>
        <div className="mt-1 text-xs text-slate-500">
          URL: <code className="rounded bg-slate-800/70 px-1.5 py-0.5 text-slate-300">/articles/{form.slug || '…'}</code>
        </div>
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Authors">
          <input className="input" value={form.authors} onChange={(e) => update({ authors: e.target.value })} placeholder="Chen L, Patel A, et al." />
        </Field>
        <Field label="Journal">
          <input className="input" value={form.journal} onChange={(e) => update({ journal: e.target.value })} placeholder="Cell Metabolism" />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Publish Date">
          <input type="date" className="input" value={form.publish_date || ''} onChange={(e) => update({ publish_date: e.target.value })} />
        </Field>
        <Field label="Cover Image URL">
          <input className="input" value={form.cover_image_url} onChange={(e) => update({ cover_image_url: e.target.value })} placeholder="https://…" />
        </Field>
      </div>

      {/* Pillars */}
      <Field label="Pillars">
        <div className="grid grid-cols-2 gap-1.5 md:grid-cols-3 lg:grid-cols-5">
          {EDITORIAL_PILLARS.map((p) => (
            <label key={p} className={`flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 text-xs ${
              form.pillars.includes(p)
                ? 'border-teal-500 bg-teal-500/15 text-teal-200'
                : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
            }`}>
              <input
                type="checkbox"
                className="h-3 w-3 accent-teal-500"
                checked={form.pillars.includes(p)}
                onChange={() => togglePillar(p)}
              />
              {p}
            </label>
          ))}
        </div>
      </Field>

      {/* Tags */}
      <Field label="Tags" hint="Type a tag and press Enter. Click × to remove.">
        <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900 p-2">
          {form.tags.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full bg-teal-500/20 px-2 py-0.5 text-[11px] font-semibold text-teal-200">
              {t}
              <button type="button" onClick={() => removeTag(t)} className="hover:text-white">×</button>
            </span>
          ))}
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() }
              if (e.key === 'Backspace' && !tagInput && form.tags.length) removeTag(form.tags[form.tags.length - 1])
            }}
            placeholder={form.tags.length ? '' : 'MTHFR, folate, methylation…'}
            className="flex-1 bg-transparent px-1 py-0.5 text-sm text-white placeholder:text-slate-500 focus:outline-none"
          />
        </div>
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="AI Reliability Score (0–100)">
          <input
            type="number"
            min="0" max="100" step="1"
            className="input"
            value={form.ai_reliability_score ?? ''}
            onChange={(e) => update({ ai_reliability_score: e.target.value })}
            placeholder="87"
          />
        </Field>
        <Field label="Evidence Quality">
          <select
            className="input"
            value={form.evidence_quality || ''}
            onChange={(e) => update({ evidence_quality: e.target.value })}
          >
            <option value="">— not set —</option>
            {EVIDENCE_OPTIONS.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Abstract">
        <textarea
          rows={8}
          className="input"
          value={form.abstract}
          onChange={(e) => update({ abstract: e.target.value })}
          placeholder="Full technical abstract…"
        />
      </Field>

      <Field label="In Plain Terms Summary (shown to users)" hint="Plain-language editorial takeaway. This is the most prominent section on the public page.">
        <textarea
          rows={8}
          className="input"
          value={form.plain_terms_summary}
          onChange={(e) => update({ plain_terms_summary: e.target.value })}
          placeholder="What this means for a real reader…"
        />
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="DOI">
          <input className="input" value={form.doi} onChange={(e) => update({ doi: e.target.value })} placeholder="10.1093/ajcn/nqad001" />
        </Field>
        <Field label="Source URL">
          <input className="input" value={form.source_url} onChange={(e) => update({ source_url: e.target.value })} placeholder="https://pubmed.ncbi.nlm.nih.gov/…" />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ToggleField label="Published" description="Visible on the public site."
          value={form.is_published} onChange={(v) => update({ is_published: v })} />
        <ToggleField label="Featured" description="Surfaces on homepage & tops search results."
          value={form.is_featured} onChange={(v) => update({ is_featured: v })} />
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md bg-rose-500/10 px-3 py-2 text-sm text-rose-300 ring-1 ring-rose-500/40">
          <AlertCircle size={14} className="mt-0.5" /> {error}
        </div>
      )}

      <div className="sticky bottom-0 -mx-6 flex flex-wrap items-center justify-end gap-2 border-t border-slate-800 bg-slate-950/95 px-6 py-3 backdrop-blur">
        <button
          type="button"
          onClick={() => submit({ asDraft: true })}
          disabled={!canSubmit}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-200 hover:border-slate-500 hover:text-white disabled:opacity-40"
        >
          <FileText size={14} /> Save as Draft
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center gap-1.5 rounded-md bg-teal-500 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-400 disabled:opacity-40"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
        </button>
      </div>
    </form>
  )
}

/* ------------------------------- primitives ------------------------------ */

function SectionTitle({ text }) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold text-white">{text}</h1>
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</label>
        {hint && <span className="text-[11px] text-slate-500">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function ToggleField({ label, description, value, onChange }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-800 bg-slate-900 p-3">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 accent-teal-500"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div>
        <div className="text-sm font-semibold text-white">{label}</div>
        <div className="text-xs text-slate-400">{description}</div>
      </div>
    </label>
  )
}

function SlugStatusBadge({ status }) {
  const map = {
    idle:      { text: '', cls: '' },
    checking:  { text: 'Checking…', cls: 'text-slate-400' },
    available: { text: 'Available', cls: 'text-teal-300', icon: <CheckCircle2 size={12} /> },
    taken:     { text: 'Taken',     cls: 'text-rose-300', icon: <X size={12} /> },
    invalid:   { text: 'Invalid',   cls: 'text-amber-300', icon: <AlertCircle size={12} /> },
  }
  const { text, cls, icon } = map[status.state] || map.idle
  if (!text) return null
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${cls}`}>
      {icon} {text}
    </span>
  )
}
