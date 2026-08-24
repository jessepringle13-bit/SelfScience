// /app/app/how-it-works/print/parent/page.js
// SelfScience — one-page, print-friendly summary of the /how-it-works
// orientation tour, framed for a parent reading it about their kid.
//
// Same layout and constraints as the base /how-it-works/print sheet:
//   • Fits on a single letter/A4 sheet.
//   • Monochrome, print-safe.
//   • No new features invented.
//
// Only the copy is reframed:
//   • Hero swaps to a parent-focused headline and lede.
//   • "What you can do here" list is re-phrased around a child.
//   • Three goals become three parent worries (focus, digestion, sleep).
//   • Tool spec table's "Best for" gets a parent-facing phrasing.
//   • "Who this is for" reframed for family use.

'use client'

import Link from 'next/link'
import { useCallback } from 'react'
import { Printer, Download } from 'lucide-react'

const PDF_FILENAME_TITLE = 'SelfScience-Tour-for-Parents'

export default function HowItWorksPrintParentPage() {
  const openPrintDialog = useCallback(() => {
    if (typeof window === 'undefined') return
    const originalTitle = document.title
    document.title = PDF_FILENAME_TITLE
    const restore = () => {
      document.title = originalTitle
      window.removeEventListener('afterprint', restore)
    }
    window.addEventListener('afterprint', restore)
    try {
      window.print()
    } finally {
      setTimeout(() => {
        if (document.title === PDF_FILENAME_TITLE) document.title = originalTitle
      }, 3000)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#f5f5f4] py-8 print:bg-white print:py-0" style={{ colorScheme: 'light' }}>
      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          html, body { background: #fff !important; color: #000 !important; }
          .no-print { display: none !important; }
          .print-sheet {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            max-width: none !important;
            margin: 0 !important;
            background: #fff !important;
          }
          h1, h2, h3, h4 { color: #000 !important; }
          a { color: #000 !important; text-decoration: none !important; }
          .avoid-break { break-inside: avoid; page-break-inside: avoid; }
        }
        .print-sheet { color-scheme: light; }
        .print-sheet h2 { letter-spacing: 0.02em; }
      `}</style>

      {/* On-screen toolbar (hidden in print). */}
      <div className="no-print mx-auto mb-4 flex max-w-[900px] flex-col gap-2 px-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/how-it-works" className="text-sm font-semibold text-neutral-700 underline underline-offset-4 hover:text-neutral-900">
            ← Back to the full tour
          </Link>
          <span className="hidden text-neutral-400 sm:inline">·</span>
          <Link href="/how-it-works/print" className="text-sm font-semibold text-neutral-700 underline underline-offset-4 hover:text-neutral-900">
            General version →
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={openPrintDialog} className="inline-flex items-center gap-2 rounded-md border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800">
            <Download size={14} /> Download as PDF
          </button>
          <button type="button" onClick={openPrintDialog} className="inline-flex items-center gap-2 rounded-md border border-neutral-400 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 transition hover:border-neutral-800">
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      <div className="no-print mx-auto mb-6 max-w-[900px] px-4">
        <div className="rounded-md border border-neutral-300 bg-neutral-100 px-3 py-2 text-[11px] text-neutral-700">
          <strong className="font-semibold text-neutral-900">Tip:</strong> in the print dialog, choose <em>Save as PDF</em> as the destination and <em>A4</em> as the paper size for the cleanest export. The file will be named <code className="rounded bg-white px-1 py-0.5 text-neutral-900">SelfScience-Tour-for-Parents.pdf</code>.
        </div>
      </div>

      {/* The printable sheet. Explicit inline background/color to defeat
          any global dark-mode variables the app may apply. */}
      <article
        className="print-sheet mx-auto max-w-[900px] rounded-md border border-neutral-300 p-10 text-[11.5px] leading-snug shadow-sm print:text-[10.5px]"
        style={{ background: '#ffffff', color: '#171717' }}
      >
        {/* Header */}
        <header className="mb-5 border-b border-neutral-400 pb-3">
          <div className="text-[9px] font-extrabold uppercase tracking-[0.22em] text-neutral-500">
            SelfScience &middot; a plain-English tour for parents
          </div>
          <h1 className="mt-1 text-2xl font-extrabold leading-tight text-neutral-900">
            You&rsquo;re noticing patterns in your kid. Here&rsquo;s how to think them through.
          </h1>
          <p className="mt-1 text-[11px] italic text-neutral-600">
            Educational only. Not a diagnosis, not medical advice, not a replacement for your pediatrician.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* LEFT COLUMN */}
          <div className="space-y-5">
            <section className="avoid-break">
              <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-neutral-500">
                What this site helps you do for your child
              </h2>
              <ul className="mt-2 space-y-1.5">
                <ListItem tool="Search" body="Look up any pattern you&rsquo;re seeing &mdash; sleep, focus, gut, sensitivities &mdash; and read the real research on it." />
                <ListItem tool="Genome" body="If you already have their raw DNA file, understand what their variants suggest, in plain English." />
                <ListItem tool="Biomarkers" body="Log a recent blood test and see how numbers line up with their genetics and normal ranges for their age." />
                <ListItem tool="Nutrition" body="Check foods, supplements, and products against what a child that age actually needs." />
                <ListItem tool="Quiz + My Path" body="Answer a short quiz on their behalf; get a calm 3-module reading path." />
                <ListItem tool="AI Coach" body="Ask specific &ldquo;is this normal?&rdquo; questions. The Coach won&rsquo;t diagnose &mdash; it&rsquo;ll help you ask better ones." />
              </ul>
            </section>

            <section>
              <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-neutral-500">
                Three common worries &amp; the flow for each
              </h2>

              <GoalFlow
                label="Worry 1"
                title="&ldquo;My kid can&rsquo;t focus.&rdquo;"
                steps={[
                  ['Search', 'Look up focus, attention, and age-typical patterns.'],
                  ['Quiz on their behalf', 'Frame the site around what you&rsquo;re seeing.'],
                  ['My Path', 'Read the biology in context, not in crisis.'],
                ]}
                optional="Coach &mdash; turn worry into words a pediatrician can act on."
              />

              <GoalFlow
                label="Worry 2"
                title="&ldquo;Their digestion is off.&rdquo;"
                steps={[
                  ['Search', '&ldquo;Iron absorption in kids&rdquo;, &ldquo;lactose in children&rdquo;, etc.'],
                  ['Data (if any)', 'Add labs or DNA if you have them; don&rsquo;t rush to get them.'],
                  ['Nutrition', 'Line up meals with what the research actually supports.'],
                ]}
                optional="Coach &mdash; ask specific &ldquo;is this normal?&rdquo; questions."
              />

              <GoalFlow
                label="Worry 3"
                title="&ldquo;Their sleep is a mess.&rdquo;"
                steps={[
                  ['Search', 'Sleep timing, melatonin, and normal age patterns.'],
                  ['My Path', 'Three modules on how a kid&rsquo;s biology handles sleep.'],
                  ['Trackers', 'Log routines and see what actually correlates.'],
                ]}
                optional="Genome &mdash; if you have their DNA file, check any circadian variants."
              />
            </section>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-5">
            <section className="avoid-break">
              <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-neutral-500">
                How it fits together
              </h2>
              <div className="mt-2 rounded border border-neutral-300 p-3">
                <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                  <LaneMini letter="A" title="A worry" body="Search what you&rsquo;re seeing." />
                  <LaneMini letter="B" title="A path" body="Take the quiz for them." />
                  <LaneMini letter="C" title="Their data" body="Upload DNA or lab results." />
                </div>
                <div className="my-2 text-center text-[9px] font-extrabold uppercase tracking-widest text-neutral-500">
                  ↓&nbsp;&nbsp;all three converge on the loop&nbsp;&nbsp;↓
                </div>
                <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
                  <LoopMini n="1" title="Findings" />
                  <LoopMini n="2" title="Research" />
                  <LoopMini n="3" title="Path" />
                  <LoopMini n="4" title="Tools" />
                </div>
                <p className="mt-2 text-center text-[9.5px] italic text-neutral-600">
                  Loop back with your pediatrician. New pattern → new question → sharper visit.
                </p>
              </div>
            </section>

            <section className="avoid-break">
              <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-neutral-500">
                Tools, at a glance
              </h2>
              <div className="mt-2 overflow-hidden rounded border border-neutral-300">
                <table className="w-full text-left text-[10px]">
                  <thead className="bg-neutral-100 text-[9px] font-extrabold uppercase tracking-wider text-neutral-600">
                    <tr>
                      <th className="px-2 py-1.5">Tool</th>
                      <th className="px-2 py-1.5">You bring</th>
                      <th className="px-2 py-1.5">You get</th>
                      <th className="px-2 py-1.5">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 align-top">
                    <ToolRow name="Search" inputs="A pattern you noticed" outputs="Real research, ranked by reliability" time="Your call" />
                    <ToolRow name="Quiz" inputs="Answers on their behalf" outputs="A calm reading path" time="~2 min" />
                    <ToolRow name="My Path" inputs="Nothing (uses quiz)" outputs="3 short modules, one action each" time="5–10 min each" />
                    <ToolRow name="Genome" inputs="Their DNA file (optional)" outputs="Plain-English findings" time="~3 min" />
                    <ToolRow name="Biomarkers" inputs="A recent blood test" outputs="Values in context" time="~5 min" />
                    <ToolRow name="AI Coach" inputs="Any question" outputs="Cited answers, no dosing" time="Ask & go" />
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-[9.5px] italic text-neutral-600">
                Bring what you learn to your pediatrician. Better questions get better answers.
              </p>
            </section>

            <section className="avoid-break">
              <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-neutral-500">
                Who this is for
              </h2>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <FitCol title="Great fits" symbol="✓" items={[
                  'Parents noticing focus, gut, sleep, or sensitivity patterns.',
                  'Families who already ran a DNA test and want it to mean something.',
                  'Second-opinion prep before a pediatrician visit.',
                  'Explaining biology to a partner or grandparent without jargon.',
                  'Turning generic worry into a specific, well-framed question.',
                ]} />
                <FitCol title="Not for" symbol="✗" items={[
                  'Emergencies. Call your pediatrician or local emergency line.',
                  'Diagnosis or prescriptions for a child.',
                  'Getting exact doses from an AI &mdash; especially not for kids.',
                  'Replacing a pediatrician, therapist, or specialist.',
                  'Panic-Googling. That&rsquo;s what this page is here to slow down.',
                ]} />
              </div>
            </section>
          </div>
        </div>

        <footer className="mt-6 border-t border-neutral-400 pt-3 text-[9.5px] text-neutral-600">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <strong className="font-semibold text-neutral-900">selfscience.io/how-it-works/print/parent</strong>
              &nbsp;&middot;&nbsp; printable tour for parents
            </div>
            <div className="italic">Your data stays on your device unless you say otherwise.</div>
          </div>
        </footer>
      </article>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Presentational sub-components — identical to the base /print page so the
// two variants stay visually consistent.
// ---------------------------------------------------------------------------

function ListItem({ tool, body }) {
  return (
    <li className="flex gap-2 leading-snug">
      <span className="flex-shrink-0 font-extrabold text-neutral-900">{tool}</span>
      <span className="text-neutral-500">&mdash;</span>
      <span
        className="flex-1 text-neutral-800"
        dangerouslySetInnerHTML={{ __html: body }}
      />
    </li>
  )
}

function GoalFlow({ label, title, steps, optional }) {
  return (
    <div className="avoid-break mt-3 rounded border border-neutral-300 p-2.5">
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="rounded-sm border border-neutral-400 px-1.5 py-0.5 text-[8.5px] font-extrabold uppercase tracking-widest text-neutral-700">
          {label}
        </span>
        <div className="text-[12px] font-extrabold text-neutral-900" dangerouslySetInnerHTML={{ __html: title }} />
      </div>
      <ol className="mt-2 space-y-1">
        {steps.map(([tool, body], i) => (
          <li key={i} className="flex gap-2">
            <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border border-neutral-700 text-[8.5px] font-extrabold text-neutral-900">
              {i + 1}
            </span>
            <span className="text-[10.5px] leading-snug">
              <span className="font-extrabold text-neutral-900">{tool}.</span>{' '}
              <span className="text-neutral-800" dangerouslySetInnerHTML={{ __html: body }} />
            </span>
          </li>
        ))}
      </ol>
      {optional && (
        <p className="mt-1.5 border-t border-dashed border-neutral-300 pt-1.5 text-[9.5px] italic text-neutral-600">
          <span className="font-semibold not-italic text-neutral-800">Optional &middot;</span>{' '}
          <span dangerouslySetInnerHTML={{ __html: optional }} />
        </p>
      )}
    </div>
  )
}

function LaneMini({ letter, title, body }) {
  return (
    <div className="rounded border border-neutral-300 p-1.5">
      <div className="text-[10px] font-extrabold text-neutral-900">{letter}. {title}</div>
      <div className="text-[9.5px] text-neutral-700" dangerouslySetInnerHTML={{ __html: body }} />
    </div>
  )
}

function LoopMini({ n, title }) {
  return (
    <div className="rounded border border-neutral-400 bg-neutral-50 p-1.5 print:bg-white">
      <div className="text-[9px] font-extrabold text-neutral-600">Step {n}</div>
      <div className="text-[10.5px] font-extrabold text-neutral-900">{title}</div>
    </div>
  )
}

function ToolRow({ name, inputs, outputs, time }) {
  return (
    <tr>
      <td className="px-2 py-1 font-extrabold text-neutral-900">{name}</td>
      <td className="px-2 py-1 text-neutral-800">{inputs}</td>
      <td className="px-2 py-1 text-neutral-800">{outputs}</td>
      <td className="px-2 py-1 text-neutral-600">{time}</td>
    </tr>
  )
}

function FitCol({ title, symbol, items }) {
  return (
    <div>
      <div className="text-[10.5px] font-extrabold text-neutral-900">{title}</div>
      <ul className="mt-1 space-y-0.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-1 text-[9.5px] leading-snug text-neutral-800">
            <span className="flex-shrink-0 font-extrabold text-neutral-700">{symbol}</span>
            <span dangerouslySetInnerHTML={{ __html: it }} />
          </li>
        ))}
      </ul>
    </div>
  )
}
