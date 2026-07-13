// /app/components/practitioner/TellYourDoctorTips.jsx
// Screen-only tips box — coaches the patient on how to introduce the
// report to their clinician so the appointment goes smoothly.

import { MessageCircle, Lightbulb } from 'lucide-react'

const TIPS = [
  {
    heading: 'Lead with the ask, not the data.',
    body: 'Say: "I ran my raw 23andMe data through an educational tool and I have a few questions I\u2019d like to review with you." Frame it as questions — not conclusions.',
  },
  {
    heading: 'Point out this is not a clinical test.',
    body: 'The report is derived from consumer-grade SNP data. Any actionable finding will need confirmation with a proper clinical assay. Say this out loud so your clinician knows you understand it.',
  },
  {
    heading: 'Prioritize 1\u20133 concrete questions.',
    body: 'You have limited appointment time. Pick the 1\u20133 findings that matter most (e.g., "Should I confirm my CYP2C19 phenotype before we discuss clopidogrel?") rather than reviewing every row.',
  },
  {
    heading: 'Share the printed PDF, not the file.',
    body: 'The intent is a hand-off document, not a data dump. Hand over the printed report so the practitioner has a permanent, structured record to refer back to.',
  },
  {
    heading: 'Bring your medications list too.',
    body: 'PGx findings only make sense in the context of drugs you\u2019re actually taking. Your intake form already includes this — the practitioner will thank you for it.',
  },
]

export default function TellYourDoctorTips() {
  return (
    <div className="ss-screen-only rounded-2xl border border-ss-orange/40 bg-ss-orange/5 p-5 shadow-sm no-print">
      <div className="flex items-center gap-2">
        <MessageCircle size={16} className="text-ss-orange" />
        <div className="text-sm font-extrabold text-ss-orange">What to tell your doctor</div>
      </div>
      <div className="mt-1 text-[11px] text-ss-text">
        Bringing consumer genetic data into a clinical appointment can feel awkward. Here's how to do it well.
      </div>

      <ul className="mt-3 space-y-2.5">
        {TIPS.map((t) => (
          <li key={t.heading} className="flex items-start gap-2">
            <Lightbulb size={13} className="mt-0.5 shrink-0 text-ss-orange" />
            <div>
              <div className="text-[12px] font-semibold text-ss-teal">{t.heading}</div>
              <div className="text-[11.5px] leading-relaxed text-ss-text">{t.body}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
