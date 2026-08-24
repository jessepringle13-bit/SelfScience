'use client'

// /app/app/get-started/get-started-client.jsx
// SelfScience — kit recommendations page (/get-started).
// Two sections: DNA kits (Tier 1 genotyping, Tier 2 WGS) + Blood tests.
// Includes a decision helper, an affiliate-transparency disclosure,
// and a per-kit accordion of step-by-step data-download instructions.

import { useState } from 'react'
import Link from 'next/link'
import {
  Dna, TestTube2, ArrowRight, ArrowDown, ExternalLink,
  ChevronDown, Info, ShieldCheck, Sparkles, Coins, Trophy, Rocket,
} from 'lucide-react'
import SiteNav from '@/components/site-nav'
import {
  GENOME_KITS_TIER1, GENOME_KITS_TIER2, BLOOD_KITS,
  DECISION_HELPER, DOWNLOAD_STEPS,
} from '@/lib/kits'

export default function GetStartedClient() {
  return (
    <main className="min-h-screen bg-ss-bg text-ss-text">
      <SiteNav variant="dark" />
      <Hero />

      <div className="container space-y-24 py-16 md:py-20">
        <TransparencyDisclosure />
        <GenomeSection />
        <BloodSection />
      </div>
    </main>
  )
}

/* ------------------------------- Hero ---------------------------------- */

function Hero() {
  const scrollTo = (id) => (e) => {
    e.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  return (
    <section className="bg-ss-teal pb-16 pt-24 text-white md:pt-28">
      <div className="container">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ss-orange">
          Get Your Data
        </div>
        <h1 className="mt-3 text-4xl font-extrabold leading-tight md:text-5xl">
          Everything starts with your data.
        </h1>
        <p className="mt-4 max-w-2xl text-white/85">
          SelfScience is most powerful when it knows your biology. This page shows you exactly which
          test kits work with the platform, what each one costs, and how to get your results in.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="#genome-kits"
            onClick={scrollTo('genome-kits')}
            className="inline-flex items-center gap-2 rounded-full bg-ss-orange px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ss-orange-dark"
          >
            <Dna size={14} /> Genome Kits <ArrowDown size={14} />
          </a>
          <a
            href="#blood-kits"
            onClick={scrollTo('blood-kits')}
            className="inline-flex items-center gap-2 rounded-full border-2 border-white/70 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <TestTube2 size={14} /> Blood Test Options <ArrowDown size={14} />
          </a>
        </div>

        {/* No-kit callout — surfaces the non-genetic onboarding path
            for visitors who landed here without a DNA kit yet.
            Requested in GitHub issue #1 so the quiz is discoverable
            even from the kit-shopping page. Kept visually secondary
            to the kit CTAs above. */}
        <div className="mt-6 flex flex-wrap items-start gap-3 rounded-xl border border-white/25 bg-white/[0.06] p-4">
          <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ss-orange/25 text-white ring-1 ring-white/30">
            <Sparkles size={15} />
          </span>
          <div className="min-w-0 flex-1 text-[13.5px] leading-relaxed text-white/90">
            <div className="font-bold text-white">No kit yet? You can still get started.</div>
            <p className="mt-1 text-white/80">
              You don&rsquo;t need your genome to use SelfScience. Take the 2-minute quiz and
              we&rsquo;ll curate a personalised research path around your goals — add your DNA
              file whenever you&rsquo;re ready.
            </p>
            <Link
              href="/onboarding/quiz"
              className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-3.5 py-1.5 text-[12.5px] font-bold text-white transition hover:bg-white/25"
            >
              Take the 2-minute quiz →
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------- Transparency panel -------------------------- */

function TransparencyDisclosure() {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-slate-100 p-4 text-sm text-slate-700 ring-1 ring-slate-200 md:p-5">
      <ShieldCheck size={18} className="mt-0.5 shrink-0 text-slate-500" />
      <p>
        <span className="font-semibold text-slate-900">No sponsorships. No affiliate fees.</span>{' '}
        SelfScience does not accept sponsored content, affiliate fees, or compensation from any of
        the companies listed on this page. These recommendations are based solely on data-format
        compatibility, data quality, and price.
      </p>
    </div>
  )
}

/* -------------------------- Genome section ----------------------------- */

function GenomeSection() {
  return (
    <section id="genome-kits" className="scroll-mt-24 space-y-10">
      <SectionHeader
        eyebrow="For the Genome Upload tool"
        title="Choose a DNA Kit"
        subtitle="These kits produce a raw data file you download and upload directly to SelfScience. Your file is read entirely in your browser — nothing is stored on our servers."
      />

      {/* Tier 1 — Genotyping */}
      <TierBlock
        heading="Genotyping Kits — Best Starting Point"
        description="Affordable, widely available, and produce a raw data file that works directly with SelfScience. Covers approximately 600,000–700,000 SNPs — more than enough for the variants SelfScience currently analyzes."
      >
        <KitGrid kits={GENOME_KITS_TIER1} type="genome" />
      </TierBlock>

      {/* Tier 2 — WGS */}
      <TierBlock
        heading="Whole Genome Sequencing (WGS) — Most Complete"
        description="WGS kits read 100% of your DNA — not just a chip of 700,000 selected SNPs, but every base pair. Produces a VCF file rather than a genotyping text file."
      >
        <VcfNote />
        <div className="mt-6">
          <KitGrid kits={GENOME_KITS_TIER2} type="genome" />
        </div>
      </TierBlock>

      <DecisionHelper />
      <DownloadInstructions />
    </section>
  )
}

function VcfNote() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border-l-4 border-ss-teal bg-[#EAF5F5] p-4 text-sm text-ss-teal md:p-5">
      <Info size={18} className="mt-0.5 shrink-0" />
      <p>
        <span className="font-semibold">Heads up on VCF files.</span>{' '}
        VCF files from WGS services are more complete but significantly larger than standard
        genotyping files. SelfScience accepts <code className="rounded bg-white/60 px-1">.txt</code>,{' '}
        <code className="rounded bg-white/60 px-1">.zip</code>, and{' '}
        <code className="rounded bg-white/60 px-1">.vcf</code> — so VCF files from services like
        Nebula Genomics should work directly. If you experience any issues uploading a WGS VCF,
        contact us and we’ll resolve it. WGS data unlocks a substantially larger portion of the
        SelfScience variant library than a genotyping chip.
      </p>
    </div>
  )
}

/* --------------------------- Blood section ----------------------------- */

function BloodSection() {
  return (
    <section id="blood-kits" className="scroll-mt-24 space-y-8">
      <SectionHeader
        eyebrow="For the Biomarkers tool"
        title="Get Your Bloodwork"
        subtitle="Once you have results from any of these services, enter them directly into the SelfScience Biomarkers tool. No file upload needed — just your numbers."
      />
      <KitGrid kits={BLOOD_KITS} type="blood" />

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl bg-white p-5 ring-1 ring-ss-border-warm/60">
        <TestTube2 size={18} className="text-ss-teal" />
        <div className="flex-1 text-sm text-ss-muted">
          Once your labs are back, plug them into the Biomarkers tool for evidence-tiered
          interpretation and pattern detection.
        </div>
        <Link
          href="/biomarkers"
          className="inline-flex items-center gap-1 rounded-full bg-ss-teal px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Open Biomarkers <ArrowRight size={12} />
        </Link>
      </div>
    </section>
  )
}

/* --------------------------- Reusable bits ----------------------------- */

function SectionHeader({ eyebrow, title, subtitle }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ss-orange">{eyebrow}</div>
      <h2 className="mt-2 text-3xl font-extrabold text-ss-teal md:text-4xl">{title}</h2>
      <p className="mt-2 max-w-2xl text-ss-muted">{subtitle}</p>
    </div>
  )
}

function TierBlock({ heading, description, children }) {
  return (
    <div>
      <h3 className="text-xl font-bold text-ss-teal md:text-2xl">{heading}</h3>
      <p className="mt-1 max-w-3xl text-sm text-ss-muted">{description}</p>
      <div className="mt-5">{children}</div>
    </div>
  )
}

function KitGrid({ kits, type }) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
      {kits.map((k) => <KitCard key={k.id} kit={k} type={type} />)}
    </div>
  )
}

function KitCard({ kit, type }) {
  return (
    <article className="flex flex-col rounded-2xl bg-white p-5 ring-1 ring-ss-border-warm/60 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-baseline justify-between gap-2">
        <h4 className="text-lg font-bold text-ss-teal">{kit.name}</h4>
        <span className="whitespace-nowrap font-mono text-xs text-ss-muted">{kit.price}</span>
      </div>

      {kit.formats && (
        <div className="mt-2 flex flex-wrap gap-1">
          {kit.formats.map((f) => (
            <span key={f} className="rounded-full bg-ss-teal/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-ss-teal">
              {f}
            </span>
          ))}
        </div>
      )}

      {kit.coverage && (
        <div className="mt-2 text-xs text-ss-muted">
          <span className="font-semibold text-ss-text">Coverage:</span> {kit.coverage}
        </div>
      )}
      {kit.biomarkers && (
        <div className="mt-2 text-xs text-ss-muted">
          <span className="font-semibold text-ss-text">Biomarkers:</span> {kit.biomarkers}
        </div>
      )}

      <div className="mt-3 text-[11px] italic text-ss-muted">
        <span className="font-semibold not-italic text-ss-text/85">Best for:</span> {kit.bestFor}
      </div>

      <p className="mt-3 text-xs leading-relaxed text-ss-text/85">{kit.quality}</p>

      <a
        href={kit.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full border-2 border-ss-teal px-4 py-1.5 text-xs font-semibold text-ss-teal transition hover:bg-ss-teal hover:text-white"
      >
        View Kit <ExternalLink size={11} />
      </a>
    </article>
  )
}

/* ------------------------- Decision helper ---------------------------- */

function DecisionHelper() {
  const icons = { a: Coins, b: Trophy, c: Rocket }
  return (
    <div>
      <h3 className="text-xl font-bold text-ss-teal md:text-2xl">Which kit is right for me?</h3>
      <p className="mt-1 text-sm text-ss-muted">Pick the option that matches your goal.</p>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        {DECISION_HELPER.map((opt) => {
          const Icon = icons[opt.id] || Sparkles
          return (
            <div key={opt.id} className="flex flex-col rounded-2xl bg-white p-5 ring-1 ring-ss-border-warm/60">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-ss-teal/10 text-ss-teal">
                <Icon size={18} strokeWidth={1.75} />
              </div>
              <div className="mt-3 text-sm font-semibold text-ss-text">{opt.label}</div>
              <div className="mt-4 inline-flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-ss-orange px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                  {opt.pick}
                </span>
                <span className="font-mono text-xs text-ss-muted">{opt.price}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ------------------- Download instructions accordion ------------------- */

function DownloadInstructions() {
  const [openIdx, setOpenIdx] = useState(null)
  return (
    <div>
      <h3 className="text-xl font-bold text-ss-teal md:text-2xl">
        How to get your data into SelfScience
      </h3>
      <p className="mt-1 max-w-2xl text-sm text-ss-muted">
        Step-by-step download instructions for each supported kit. Click a tab to expand.
      </p>

      <div className="mt-5 overflow-hidden rounded-2xl bg-white ring-1 ring-ss-border-warm/60">
        {DOWNLOAD_STEPS.map((entry, i) => {
          const open = i === openIdx
          return (
            <div key={entry.kit} className={i > 0 ? 'border-t border-ss-border-warm/60' : ''}>
              <button
                type="button"
                onClick={() => setOpenIdx(open ? null : i)}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-ss-bg/50"
                aria-expanded={open}
              >
                <span className="text-sm font-bold text-ss-teal">{entry.kit}</span>
                <ChevronDown size={14} className={`text-ss-muted transition ${open ? 'rotate-180' : ''}`} />
              </button>
              {open && (
                <div className="space-y-3 border-t border-ss-border-warm/60 px-5 py-4">
                  <div className="text-[11px] italic text-ss-muted">
                    <span className="font-semibold not-italic text-ss-text/85">File to look for:</span> {entry.file}
                  </div>
                  <ol className="list-decimal space-y-1.5 pl-5 text-sm text-ss-text/90">
                    {entry.steps.map((s, j) => <li key={j}>{s}</li>)}
                  </ol>
                  <Link
                    href="/genome"
                    className="inline-flex items-center gap-1 rounded-full bg-ss-teal px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-110"
                  >
                    Upload to SelfScience <ArrowRight size={11} />
                  </Link>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
