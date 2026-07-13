'use client'
// Slide-in drawer showing a brand's transparency profile.
// Pure client-side; brand profile data ships with the JS bundle.
import { useEffect } from 'react'
import { X, ExternalLink, ShieldCheck, Building2, Factory, FileCheck2, FlaskConical, MapPin, Calendar } from 'lucide-react'
import { getBrandProfile } from '@/lib/supplements/brandProfiles'
import { CERT_REGISTRY } from '@/lib/supplements/certifications'
import CertBadges from './CertBadges'

export default function BrandProfileDrawer({ brandName, open, onClose }) {
  const profile = brandName ? getBrandProfile(brandName) : null

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  const certifications = (profile?.programmes || []).map((id) => CERT_REGISTRY[id]).filter(Boolean)
  const score = profile?.score ?? 0

  return (
    <div className="fixed inset-0 z-[60]" aria-modal="true" role="dialog">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <aside className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 backdrop-blur px-4 py-3">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Brand profile</div>
            <div className="text-lg font-semibold text-[#1B474D]">{profile?.name || brandName || 'Brand'}</div>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="px-4 py-4 space-y-4 text-sm text-slate-700">
          {!profile ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-600">
              <p className="font-semibold">No curated profile yet.</p>
              <p className="mt-1 text-xs">
                We haven’t built a transparency profile for <strong>{brandName}</strong> yet.
                Product cards still show any certifications detected on the NIH DSLD label.
              </p>
            </div>
          ) : (
            <>
              {/* Transparency score */}
              <section className="rounded-xl border border-[#1B474D]/15 bg-[#F8FBFB] p-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase tracking-wide text-[#1B474D] font-semibold">Transparency score</div>
                  <div className="text-[11px] text-slate-500">out of 5</div>
                </div>
                <div className="mt-2 flex items-center gap-1">
                  {[1,2,3,4,5].map((n) => (
                    <span
                      key={n}
                      className={`h-3 w-8 rounded-sm ${n <= score ? 'bg-[#1B474D]' : 'bg-slate-200'}`}
                    />
                  ))}
                  <span className="ml-2 text-lg font-semibold text-[#1B474D]">{score}</span>
                </div>
                <p className="mt-2 text-[11px] text-slate-500 leading-snug">
                  Combines manufacturing disclosure, CoA availability, absence of proprietary blends, third-party programme enrolment, and clinical-study track record.
                </p>
              </section>

              {/* Certifications */}
              {certifications.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Third-party programmes</h3>
                  <ul className="mt-2 space-y-2">
                    {certifications.map((c) => (
                      <li key={c.id} className="rounded-lg border border-slate-200 bg-white p-3">
                        <div className="flex items-start gap-2">
                          <ShieldCheck className={`h-4 w-4 mt-0.5 ${c.tier === 'gold' ? 'text-amber-600' : 'text-[#1B474D]'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-slate-900">{c.name}</div>
                            <div className="text-xs text-slate-500">{c.body}</div>
                            <p className="mt-1 text-xs text-slate-700">{c.what}</p>
                            <a
                              href={c.verifierUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-[#1B474D] hover:underline"
                            >
                              Verify at {c.body}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Company facts */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Company</h3>
                <dl className="mt-2 grid grid-cols-1 gap-1.5 text-xs">
                  <Row icon={Calendar} label="Founded" value={profile.founded} />
                  <Row icon={MapPin}   label="HQ"      value={profile.hq} />
                  <Row icon={Building2} label="Ownership" value={profile.ownership} />
                  <Row icon={Factory}  label="Manufacturing" value={profile.manufacturing} />
                  <Row icon={FlaskConical} label="Proprietary blends" value={profile.proprietaryBlends} />
                  <Row icon={FileCheck2} label="CoA policy" value={profile.coaPolicy} />
                </dl>
              </section>

              {/* Focus / partners */}
              {profile.focus && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Focus</h3>
                  <p className="mt-1 text-sm text-slate-700">{profile.focus}</p>
                </section>
              )}
              {profile.partners?.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Partners &amp; collaborators</h3>
                  <ul className="mt-1 list-disc list-inside text-xs text-slate-700 space-y-0.5">
                    {profile.partners.map((p) => <li key={p}>{p}</li>)}
                  </ul>
                </section>
              )}
              {profile.notableStudies?.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notable research</h3>
                  <ul className="mt-1 list-disc list-inside text-xs text-slate-700 space-y-0.5">
                    {profile.notableStudies.map((s) => <li key={s}>{s}</li>)}
                  </ul>
                </section>
              )}

              <div className="pt-2 flex flex-wrap items-center gap-2">
                <a
                  href={profile.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#C45820] hover:bg-[#a94a1a] text-white px-3 py-1.5 text-sm font-semibold"
                >
                  <ExternalLink className="h-4 w-4" /> Visit brand store
                </a>
              </div>

              <p className="pt-2 text-[10px] text-slate-400">
                Profile data is curated by SelfScience for educational purposes. It is not an endorsement; talk to a licensed clinician before starting any supplement.
              </p>
            </>
          )}
        </div>
      </aside>
    </div>
  )
}

function Row({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2 rounded-md bg-slate-50 border border-slate-200 px-2.5 py-1.5">
      <Icon className="h-3.5 w-3.5 mt-0.5 text-slate-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">{label}</div>
        <div className="text-xs text-slate-800 leading-snug">{value}</div>
      </div>
    </div>
  )
}
