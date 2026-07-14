'use client'

// /app/components/BarcodeScanner.jsx
// Camera-based barcode scanner backed by html5-qrcode. Loaded dynamically
// so it never breaks SSR and only pulls in the ~90KB scanner bundle when
// the user actually opens the scanner modal.
//
// IMPORTANT: The camera lifecycle MUST NOT depend on `onScan` / `onClose`
// callback identity — parents typically pass inline arrow functions, so
// every parent re-render would tear down + restart the video stream. That
// caused an intermittent "Something went wrong" crash on iOS Safari after
// a successful decode (html5-qrcode threw when it tried to re-attach to a
// still-running video element).
//
// The pattern below:
//   * Uses a ref to always call the LATEST `onScan` / `onClose`
//   * Runs the scanner setup effect exactly ONCE on mount
//   * Filters the recognised formats to only 1D product barcodes so a QR
//     code on a package doesn't accidentally get treated as a UPC/EAN.

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

export default function BarcodeScanner({ onScan, onClose }) {
  const scannerRef = useRef(null)
  const containerId = useRef(`ss-qr-reader-${Math.random().toString(36).slice(2, 8)}`)
  const [error, setError] = useState(null)
  const [scanning, setScanning] = useState(false)

  // Always call the freshest onScan/onClose without re-subscribing the
  // camera effect. This is the whole point of splitting the callbacks
  // into a ref — the effect below has `[]` deps and never re-runs.
  const onScanRef = useRef(onScan)
  const onCloseRef = useRef(onClose)
  useEffect(() => { onScanRef.current = onScan }, [onScan])
  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  useEffect(() => {
    let cancelled = false
    let qrCode = null

    import('html5-qrcode').then((mod) => {
      if (cancelled) return
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = mod

      // Restrict to 1D product barcodes so a QR code on a package label
      // doesn't get passed to /api/nutrition/product (which would 404 or
      // worse, hand a garbage string to downstream renderers).
      const formatsToSupport = Html5QrcodeSupportedFormats
        ? [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.UPC_EAN_EXTENSION,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.ITF,
          ]
        : undefined

      try {
        qrCode = new Html5Qrcode(containerId.current, { formatsToSupport, verbose: false })
      } catch (initErr) {
        setError('Scanner failed to initialise: ' + (initErr?.message || String(initErr)))
        return
      }
      scannerRef.current = qrCode

      let handledScan = false
      const onDecode = (decodedText) => {
        if (handledScan) return
        handledScan = true
        // Normalise: strip whitespace, keep digits only for 1D barcodes so
        // downstream API calls don't 404 on stray characters.
        const raw = String(decodedText || '').trim()
        // If it looks like a URL (QR code slipped through), bail with an
        // error rather than sending it to /api/nutrition/product.
        if (/^https?:\/\//i.test(raw)) {
          try { qrCode.stop().catch(() => {}) } catch { /* ignore */ }
          setError('That looked like a QR code, not a barcode. Try scanning the black-and-white striped barcode on the package.')
          return
        }
        const digits = raw.replace(/\D/g, '')
        const code = digits || raw
        try {
          qrCode
            .stop()
            .then(() => onScanRef.current?.(code))
            .catch(() => onScanRef.current?.(code))
        } catch {
          onScanRef.current?.(code)
        }
      }

      qrCode
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 260, height: 160 } },
          onDecode,
          () => { /* per-frame scan errors are noisy — ignore */ },
        )
        .then(() => { if (!cancelled) setScanning(true) })
        .catch((err) => {
          if (cancelled) return
          setError(err?.message || 'Camera access denied. Please allow camera access to scan barcodes.')
        })
    }).catch((err) => {
      if (cancelled) return
      setError('Scanner failed to load: ' + (err?.message || String(err)))
    })

    return () => {
      cancelled = true
      // Guarded stop — html5-qrcode throws if we call stop() on an already
      // stopped (or never-started) instance, so we swallow every error.
      try {
        if (qrCode && qrCode.getState && qrCode.getState() === 2 /* SCANNING */) {
          qrCode.stop().catch(() => {})
        } else if (qrCode) {
          qrCode.stop().catch(() => {})
        }
      } catch { /* ignore */ }
    }
    // Deliberately empty deps — camera lifecycle is bound to component
    // mount / unmount, not to callback identity. See the file header.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
            onClick={() => onCloseRef.current?.()}
            className="rounded-full bg-ss-teal px-5 py-2 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Cancel
          </button>
        </div>
      ) : (
        <>
          <div id={containerId.current} style={{ width: 300, borderRadius: 12, overflow: 'hidden' }} />
          <button
            onClick={() => onCloseRef.current?.()}
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
