// /app/app/how-it-works/print/page.js
// SelfScience — one-page, print-friendly summary of the /how-it-works
// orientation tour. All copy is a compressed restatement of what already
// lives on /how-it-works — no new content, no marketing embellishment.
//
// Design constraints:
//   • Fits comfortably on a single letter/A4 sheet (compressed two-column
//     body, small type, tight spacing).
//   • Print CSS forces black-on-white, hides the SiteNav and the print
//     button, removes shadows/gradients so the page ink-friendly.
//   • Diagrams are text/typography only (numbered blocks + arrows).
//   • On screen it still looks like a document preview so users can
//     eyeball it before hitting Cmd/Ctrl+P.

'use client'

import Link from 'next/link'
import { Printer } from 'lucide-react'

export default function HowItWorksPrintPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f4] py-8 print:bg-white print:py-0" style={{ colorScheme: 'light' }}>
      {/* Print stylesheet — kept inline so the file is self-contained
          and doesn't require touching globals.css. */}
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
      <div className="no-print mx-auto mb-4 flex max-w-[900px] items-center justify-between gap-3 px-4">
        <Link
          href="/how-it-works"
          className="text-sm font-semibold text-neutral-700 underline underline-offset-4 hover:text-neutral-900"
        >
          ← Back to the full tour
        </Link>
        <button
          type="button"
          onClick={() => typeof window !== 'undefined' && window.print()}
          className="inline-flex items-center gap-2 rounded-md border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          <Printer size={14} /> Print or save as PDF
        </button>
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
            SelfScience &middot; a plain-English tour
          </div>
          <h1 className="mt-1 text-2xl font-extrabold leading-tight text-neutral-900">
            How SelfScience helps you understand your health.
          </h1>
          <p className="mt-1 text-[11px] italic text-neutral-600">
            Educational only. Not a diagnosis, not medical advice, not a replacement for your doctor.
          </p>
        </header>

        {/* Two-column body */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* ==================== LEFT COLUMN ==================== */}
          <div className="space-y-5">
            {/* What you can do here */}
            <section className="avoid-break">
              <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-neutral-500">
                What you can do here
              </h2>
              <ul className="mt-2 space-y-1.5">
                <ListItem tool="Genome" body="Understand your 23andMe / AncestryDNA file in plain English." />
                <ListItem tool="Biomarkers" body="Make sense of bloodwork, matched to your genetics." />
                <ListItem tool="Search" body="Explore real research behind any symptom or topic." />
                <ListItem tool="Nutrition" body="See how foods, supplements, and products fit your biology." />
                <ListItem tool="Quiz + My Path" body="Build a short, calm, guided learning path." />
                <ListItem tool="AI Coach" body="Ask nuanced questions; every claim links to its study." />
              </ul>
            </section>

            {/* Three goals → tools */}
            <section>
              <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-neutral-500">
                Three common goals &amp; the flow for each
              </h2>

              <GoalFlow
                label="Goal 1"
                title="Understand my DNA results."
                steps={[
                  ['Genome', 'Upload your file — see Strengths and Things To Be Aware Of.'],
                  ['Findings', 'Read each finding as a tendency, not a verdict.'],
                  ['Blueprint', 'Turn findings into better questions for a clinician.'],
                ]}
                optional="Search — go deeper on any gene or topic."
              />

              <GoalFlow
                label="Goal 2"
                title="Improve energy, sleep, weight, or performance."
                steps={[
                  ['Quiz', 'Answer a 2-minute quiz about what you want to work on.'],
                  ['My Path', 'Follow a 3-module foundation, one idea per module.'],
                  ['Nutrition + Trackers', 'Align daily choices with what you learned.'],
                ]}
                optional="Search + Coach — always-on second opinion."
              />

              <GoalFlow
                label="Goal 3"
                title="Understand my child."
                steps={[
                  ['Search / Quiz', 'Start with the pattern, not the panic.'],
                  ['Data (Genome / Biomarkers)', 'Add data if you have it — don\u2019t rush to get it.'],
                  ['My Path', 'Read biology in context, not in crisis.'],
                ]}
                optional="Coach — turn worry into words a clinician can act on."
              />
            </section>
          </div>

          {/* ==================== RIGHT COLUMN ==================== */}
          <div className="space-y-5">
            {/* How it fits together — text diagram */}
            <section className="avoid-break">
              <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-neutral-500">
                How it fits together
              </h2>
              <div className="mt-2 rounded border border-neutral-300 p-3">
                <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                  <LaneMini letter="A" title="A question" body="Search a symptom." />
                  <LaneMini letter="B" title="A path" body="Take the quiz." />
                  <LaneMini letter="C" title="Your data" body="Upload genome / labs." />
                </div>
                <div className="my-2 text-center text-[9px] font-extrabold uppercase tracking-widest text-neutral-500">
                  &darr;&nbsp;&nbsp;all three converge on the loop&nbsp;&nbsp;&darr;
                </div>
                <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
                  <LoopMini n="1" title="Findings" />
                  <LoopMini n="2" title="Research" />
                  <LoopMini n="3" title="Path" />
                  <LoopMini n="4" title="Tools" />
                </div>
                <p className="mt-2 text-center text-[9.5px] italic text-neutral-600">
                  Then it loops back. New finding &rarr; new question &rarr; new adjustment.
                </p>
              </div>
            </section>

            {/* Tools quick-spec table */}
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
                    <ToolRow name="Genome" inputs="DNA raw file" outputs="Strengths + Things to Be Aware Of" time="~3 min" />
                    <ToolRow name="Biomarkers" inputs="A blood test" outputs="Values + relevant genome links" time="~5 min" />
                    <ToolRow name="Search" inputs="Any topic" outputs="Papers filtered by reliability" time="Your call" />
                    <ToolRow name="Nutrition" inputs="A food / product" outputs="Fit against your biology" time="&lt; 1 min" />
                    <ToolRow name="My Path" inputs="Quiz answers" outputs="3-module reading path" time="2 + 5–10 min each" />
                    <ToolRow name="AI Coach" inputs="Any question" outputs="Cited answers, no prescriptions" time="Ask & go" />
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-[9.5px] italic text-neutral-600">
                One rule everywhere: every claim links to its source. Nothing asks you to just trust it.
              </p>
            </section>

            {/* Fit / Not fit */}
            <section className="avoid-break">
              <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-neutral-500">
                Who this is for
              </h2>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <FitCol title="Great fits" symbol="✓" items={[
                  '23andMe / AncestryDNA holders.',
                  'Parents trying to understand focus, digestion, sleep or sensitivities.',
                  'People working on energy, sleep, weight, or performance.',
                  'Anyone who wants to read the actual research.',
                  'Sharpening questions before or after a doctor visit.',
                ]} />
                <FitCol title="Not for" symbol="✗" items={[
                  'Emergencies. Call your local emergency number.',
                  'Definitive diagnosis or prescriptions.',
                  'Getting exact doses from an AI.',
                  'Replacing a doctor, therapist, or specialist.',
                  'Chasing perfect health.',
                ]} />
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-6 border-t border-neutral-400 pt-3 text-[9.5px] text-neutral-600">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <strong className="font-semibold text-neutral-900">selfscience.io/how-it-works</strong>
              &nbsp;&middot;&nbsp; printable tour summary
            </div>
            <div className="italic">Your data stays on your device unless you say otherwise.</div>
          </div>
        </footer>
      </article>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Presentational sub-components — all monochrome, print-safe.
// ---------------------------------------------------------------------------

function ListItem({ tool, body }) {
  return (
    <li className="flex gap-2 leading-snug">
      <span className="flex-shrink-0 font-extrabold text-neutral-900">{tool}</span>
      <span className="text-neutral-500">&mdash;</span>
      <span className="flex-1 text-neutral-800">{body}</span>
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
        <div className="text-[12px] font-extrabold text-neutral-900">&ldquo;{title}&rdquo;</div>
      </div>
      <ol className="mt-2 space-y-1">
        {steps.map(([tool, body], i) => (
          <li key={i} className="flex gap-2">
            <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border border-neutral-700 text-[8.5px] font-extrabold text-neutral-900">
              {i + 1}
            </span>
            <span className="text-[10.5px] leading-snug">
              <span className="font-extrabold text-neutral-900">{tool}.</span>{' '}
              <span className="text-neutral-800">{body}</span>
            </span>
          </li>
        ))}
      </ol>
      {optional && (
        <p className="mt-1.5 border-t border-dashed border-neutral-300 pt-1.5 text-[9.5px] italic text-neutral-600">
          <span className="font-semibold not-italic text-neutral-800">Optional &middot;</span> {optional}
        </p>
      )}
    </div>
  )
}

function LaneMini({ letter, title, body }) {
  return (
    <div className="rounded border border-neutral-300 p-1.5">
      <div className="text-[10px] font-extrabold text-neutral-900">{letter}. {title}</div>
      <div className="text-[9.5px] text-neutral-700">{body}</div>
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
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
