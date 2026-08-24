// /app/app/how-it-works/print/opengraph-image.js
// OG image for the printable one-page summary. Same brand language as
// the full tour but leans into the "printable / shareable" angle so
// recipients know what they're clicking on. Ships a paper-white card
// on a dark backdrop to hint the print aesthetic.
//
// Satori constraint: every <div> with more than one child MUST declare
// display: 'flex' (or 'none'). We add flexDirection: 'column' anywhere
// the children stack vertically.

import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'SelfScience — a one-page printable tour summary'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0F2528',
          width: '100%',
          height: '100%',
          display: 'flex',
          padding: 60,
          fontFamily: 'sans-serif',
        }}
      >
        {/* Left column — copy */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', color: 'white' }}>
          <div
            style={{
              display: 'flex',
              color: '#F97316',
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: 5,
              textTransform: 'uppercase',
            }}
          >
            SelfScience &middot; One-Page Summary
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 62,
              fontWeight: 800,
              marginTop: 30,
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
            }}
          >
            The plain-English tour, on one printable page.
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 24,
              marginTop: 22,
              color: 'rgba(255,255,255,0.72)',
              lineHeight: 1.4,
            }}
          >
            Six tools, three goals, one loop &mdash; a shareable summary you can print, PDF, or hand to a family member.
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 'auto',
              fontSize: 20,
              color: 'rgba(255,255,255,0.55)',
            }}
          >
            selfscience.io/how-it-works/print
          </div>
        </div>

        {/* Right column — a stylised "printed sheet" */}
        <div
          style={{
            width: 380,
            marginLeft: 40,
            background: '#ffffff',
            color: '#171717',
            padding: 24,
            borderRadius: 6,
            boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 3,
              textTransform: 'uppercase',
              color: '#737373',
            }}
          >
            SelfScience &middot; A Plain-English Tour
          </div>
          <div style={{ display: 'flex', fontSize: 20, fontWeight: 800, marginTop: 6, lineHeight: 1.15 }}>
            How SelfScience helps you understand your health.
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: '#737373',
              marginTop: 16,
            }}
          >
            What you can do here
          </div>
          <div style={{ marginTop: 6, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex' }}>Genome &mdash; your DNA in plain English.</div>
            <div style={{ display: 'flex' }}>Biomarkers &mdash; bloodwork + genetics.</div>
            <div style={{ display: 'flex' }}>Search &mdash; real research, ranked.</div>
            <div style={{ display: 'flex' }}>Nutrition &mdash; foods fit your biology.</div>
            <div style={{ display: 'flex' }}>My Path &mdash; a calm 3-module read.</div>
            <div style={{ display: 'flex' }}>AI Coach &mdash; cited answers, no dosing.</div>
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: '#737373',
              marginTop: 14,
            }}
          >
            Three goals &middot; one loop
          </div>
          <div style={{ display: 'flex', marginTop: 6, fontSize: 12, color: '#171717' }}>
            Findings &rarr; Research &rarr; Path &rarr; Tools &mdash; then it loops.
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
