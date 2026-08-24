// /app/app/how-it-works/opengraph-image.js
// Dynamic OG image for the SelfScience orientation tour.
// Renders a 1200x630 preview card that iMessage, WhatsApp, Slack,
// LinkedIn, X and Facebook all consume when someone shares the link.
//
// No external images required — text and layout are drawn by
// @vercel/og / next/og. Ships with the tour's dark palette:
// dark teal bg, orange eyebrow, white headline, muted tagline.

import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'SelfScience — a plain-English tour of what this site is for and how it helps you'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0F2528 0%, #1B474D 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '70px 80px',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            color: '#F97316',
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 6,
            textTransform: 'uppercase',
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: '#F97316',
            }}
          />
          SelfScience &middot; A Plain-English Tour
        </div>

        <div
          style={{
            fontSize: 76,
            fontWeight: 800,
            marginTop: 40,
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            maxWidth: 1000,
          }}
        >
          Understand the science behind your health.
        </div>

        <div
          style={{
            fontSize: 30,
            marginTop: 30,
            color: 'rgba(255,255,255,0.72)',
            lineHeight: 1.35,
            maxWidth: 1000,
          }}
        >
          A visual tour of what SelfScience is for, who it helps, and
          how each tool fits your goals. No jargon &mdash; just orientation.
        </div>

        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 22,
            color: 'rgba(255,255,255,0.55)',
          }}
        >
          <div style={{ display: 'flex', gap: 22 }}>
            <span>Genome</span>
            <span>&middot;</span>
            <span>Biomarkers</span>
            <span>&middot;</span>
            <span>Search</span>
            <span>&middot;</span>
            <span>Nutrition</span>
            <span>&middot;</span>
            <span>My Path</span>
            <span>&middot;</span>
            <span>AI Coach</span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.65)' }}>selfscience.io/how-it-works</div>
        </div>
      </div>
    ),
    { ...size },
  )
}
