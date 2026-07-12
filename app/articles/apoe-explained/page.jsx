import SiteNav from '@/components/site-nav'
import Link from 'next/link'

export const metadata = {
  title: 'APOE4: What the Research Actually Says — SelfScience',
  description:
    'Curated summary of APOE variants and Alzheimer’s risk, with emphasis on lifestyle modifiers and what the evidence does and does not show.',
}

export default function APOEArticle() {
  return (
    <>
      <SiteNav />
      <main className="min-h-screen bg-ss-cream">
        <article style={{ maxWidth: 720, margin: '0 auto', padding: '60px 24px' }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 2,
              color: '#C45820',
              textTransform: 'uppercase',
            }}
          >
            Genomics · Editorial
          </span>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: '#28251D',
              margin: '16px 0 8px',
              lineHeight: 1.2,
            }}
          >
            APOE4: What the Research Actually Says
          </h1>
          <p style={{ color: '#7A7974', fontSize: 14, marginBottom: 32 }}>
            SelfScience Editorial · July 2026 · 5 min read
          </p>

          <div
            style={{
              background: '#F9F8F5',
              border: '1px solid #D4D1CA',
              borderRadius: 8,
              padding: '16px 20px',
              marginBottom: 32,
              fontSize: 13,
              color: '#7A7974',
              lineHeight: 1.6,
            }}
          >
            For educational purposes only. This is not medical advice or a clinical
            assessment. Discuss any genetic findings with a qualified healthcare provider.
          </div>

          <p
            style={{
              fontSize: 17,
              lineHeight: 1.7,
              color: '#28251D',
              marginBottom: 20,
            }}
          >
            APOE4 is one of the most studied genetic variants in human health research.
            It is also one of the most misunderstood. Here is what peer-reviewed research
            actually shows — and what it does not show.
          </p>

          <h2 style={{ fontSize: 22, fontWeight: 700, margin: '32px 0 12px', color: '#1B474D' }}>
            What APOE Is
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.7, marginBottom: 20, color: '#28251D' }}>
            APOE (apolipoprotein E) is a gene that produces a protein involved in lipid
            metabolism — specifically how your body transports and clears cholesterol and
            fats in the bloodstream and brain. There are three common variants, called
            isoforms: APOE2, APOE3, and APOE4. Most people carry two copies in some
            combination.
          </p>

          <h2 style={{ fontSize: 22, fontWeight: 700, margin: '32px 0 12px', color: '#1B474D' }}>
            What APOE4 Is Associated With
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.7, marginBottom: 20, color: '#28251D' }}>
            Carrying one copy of APOE4 is associated with higher LDL cholesterol and a
            statistically elevated risk for late-onset Alzheimer&rsquo;s disease in large
            population studies. Carrying two copies (APOE4/4) is associated with a higher
            statistical risk than one copy.
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.7, marginBottom: 20, color: '#28251D' }}>
            The key word in both sentences is &ldquo;associated.&rdquo; APOE4 is a risk
            modifier — not a deterministic cause. The majority of people who carry APOE4
            do not develop Alzheimer&rsquo;s disease. Conversely, the majority of people
            who develop late-onset Alzheimer&rsquo;s do not carry APOE4.
          </p>

          <h2 style={{ fontSize: 22, fontWeight: 700, margin: '32px 0 12px', color: '#1B474D' }}>
            What the Research Shows About Lifestyle Modifiers
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.7, marginBottom: 20, color: '#28251D' }}>
            A substantial body of research suggests that lifestyle factors — aerobic
            exercise, sleep quality, cardiovascular health, and dietary patterns —
            meaningfully influence health outcomes in APOE4 carriers. This is an active
            area of research with ongoing clinical trials.
          </p>

          <h2 style={{ fontSize: 22, fontWeight: 700, margin: '32px 0 12px', color: '#1B474D' }}>
            What APOE4 Does Not Mean
          </h2>
          <ul
            style={{
              fontSize: 16,
              lineHeight: 1.9,
              paddingLeft: 24,
              marginBottom: 20,
              color: '#28251D',
            }}
          >
            <li>It is not a diagnosis of any condition.</li>
            <li>It is not a certainty of any outcome.</li>
            <li>It does not predict when or whether any disease will develop.</li>
            <li>A negative result (no APOE4) does not mean zero risk.</li>
          </ul>

          <div
            style={{
              background: '#1B474D',
              borderRadius: 10,
              padding: '24px 28px',
              margin: '40px 0',
            }}
          >
            <p style={{ color: '#F7F6F2', fontSize: 15, lineHeight: 1.7, margin: 0 }}>
              <strong>SelfScience note:</strong> If your genome results show APOE3/E3
              (the most common combination), this means you do not carry APOE4. If you
              carry APOE4 in any combination, we strongly recommend discussing the
              research with a genetic counselor or your physician before drawing any
              conclusions about your personal health.
            </p>
          </div>

          <a
            href="https://pubmed.ncbi.nlm.nih.gov/?term=APOE4+Alzheimer+risk+lifestyle"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              background: '#C45820',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: 8,
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Explore APOE Research on PubMed →
          </a>

          <div style={{ marginTop: 48 }}>
            <Link
              href="/"
              style={{
                fontSize: 13,
                color: '#7A7974',
                textDecoration: 'none',
              }}
            >
              ← Back to SelfScience
            </Link>
          </div>
        </article>
      </main>
    </>
  )
}
