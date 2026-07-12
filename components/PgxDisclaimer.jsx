/**
 * PGxDisclaimer — pharmacogenomics-specific warning banner.
 *
 * Renders wherever pharmacogenomics content is surfaced (search results with
 * the Pharmacogenomics pillar active, the Pharmacogenomics cards in the
 * genome results view, and the top of the Drug Checker page) so users are
 * consistently reminded not to make medication changes based on genetic
 * information alone.
 *
 * The wrapper accepts an optional className to allow additional layout
 * spacing when placed inside dense grids.
 */
export default function PgxDisclaimer({ className = '' }) {
  return (
    <div
      role="note"
      style={{
        background: '#FFF8F0',
        border: '1px solid #C45820',
        borderRadius: 8,
        padding: '12px 16px',
        marginBottom: 16,
        fontSize: 13,
        color: '#28251D',
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
      }}
      className={className}
    >
      <span style={{ color: '#C45820', fontWeight: 700, flexShrink: 0 }}>⚠</span>
      <span>
        <strong>Pharmacogenomics content:</strong> Research on how genetic variants
        influence drug metabolism is for educational awareness only. Never adjust,
        start, or stop any medication based on genetic information alone. Discuss any
        pharmacogenomic findings with your prescribing physician or a licensed
        pharmacist before making any medication changes.
      </span>
    </div>
  )
}
