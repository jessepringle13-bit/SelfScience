'use client'

// /app/components/BarcodeScanner.jsx
// Camera-based barcode scanner backed by html5-qrcode. Loaded dynamically
// so it never breaks SSR and only pulls in the ~90KB scanner bundle when
// the user actually opens the scanner modal.

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

export default function BarcodeScanner({ onScan, onClose }) {
  const scannerRef = useRef(null)
  const [error, setError] = useState(null)
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    let stopped = false
    let qrCode = null

    import('html5-qrcode').then(({ Html5Qrcode }) => {
      if (stopped) return
      qrCode = new Html5Qrcode('ss-qr-reader')
      scannerRef.current = qrCode
      qrCode
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText) => {
            qrCode.stop().then(() => onScan?.(decodedText)).catch(() => onScan?.(decodedText))
          },
          () => { /* per-frame scan errors are noisy — ignore */ }
        )
        .then(() => setScanning(true))
        .catch((err) => {
          setError(err?.message || 'Camera access denied. Please allow camera access to scan barcodes.')
        })
    }).catch((err) => {
      setError('Scanner failed to load: ' + String(err))
    })

    return () => {
      stopped = true
      if (qrCode) {
        qrCode.stop().catch(() => {})
      }
    }
  }, [onScan])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Barcode scanner"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/90 p-6"
    >
      <div className="mb-4 text-center text-sm font-semibold text-white/90">
        Point camera at barcode
      </div>

      {error ? (
        <div className="max-w-sm rounded-2xl bg-white/95 p-6 text-center text-sm text-ss-text shadow-xl">
          <p className="mb-4 font-semibold text-ss-orange">Camera unavailable</p>
          <p className="mb-4">{error}</p>
          <button
            onClick={onClose}
            className="rounded-full bg-ss-teal px-5 py-2 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Cancel
          </button>
        </div>
      ) : (
        <>
          <div id="ss-qr-reader" style={{ width: 300, borderRadius: 12, overflow: 'hidden' }} />
          <button
            onClick={onClose}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/30 bg-transparent px-6 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <X size={14} /> Cancel
          </button>
          {scanning && (
            <p className="mt-4 max-w-xs text-center text-xs text-white/60">
              Hold steady — EAN, UPC, and QR codes are supported.
            </p>
          )}
        </>
      )}
    </div>
  )
}
