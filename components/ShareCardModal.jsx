'use client'

// /app/components/ShareCardModal.jsx
// Modal wrapper for the share card. Handles:
//   - Live scaled preview (CSS transform on the fixed-size ShareCard)
//   - Download PNG button (html2canvas rasterization at 2x density)
//   - Share button (Web Share API on mobile, clipboard-copy fallback on desktop)
//   - Toast/snackbar confirmations
//   - Focus trap + Escape/backdrop-close accessibility

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { X, Download, Share2, Copy, Loader2, Check } from 'lucide-react'
import ShareCard from './ShareCard'
import {
  buildShareText,
  exportCardAsPng,
  downloadBlob,
  shareCardOrCopy,
} from '@/lib/shareCard'

export default function ShareCardModal({ open, onClose, genomeResults }) {
  const cardRef = useRef(null)              // Hidden, full-size 1080x1350 node used for export
  const dialogRef = useRef(null)
  const closeButtonRef = useRef(null)
  const previewWrapRef = useRef(null)
  const [scale, setScale] = useState(0.35)
  const [busy, setBusy] = useState(null)   // 'download' | 'share' | null
  const [toast, setToast] = useState(null) // { message, tone }

  const shareText = buildShareText(genomeResults)

  // Recompute the preview scale on open + on window resize so the 1080x1350
  // fixed card fits neatly inside the preview container.
  useLayoutEffect(() => {
    if (!open) return
    const recomputeScale = () => {
      const wrap = previewWrapRef.current
      if (!wrap) return
      const availW = wrap.clientWidth
      const availH = wrap.clientHeight
      if (availW <= 0 || availH <= 0) return
      const s = Math.min(availW / 1080, availH / 1350)
      // Cap scale so the preview never renders larger than 1:1 on huge screens.
      setScale(Math.max(0.15, Math.min(s, 0.6)))
    }
    recomputeScale()
    window.addEventListener('resize', recomputeScale)
    return () => window.removeEventListener('resize', recomputeScale)
  }, [open])

  // Focus trap + Escape close.
  useEffect(() => {
    if (!open) return
    const previouslyFocused = typeof document !== 'undefined' ? document.activeElement : null
    closeButtonRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose?.() }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    // Lock body scroll while modal is open.
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = originalOverflow
      if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus()
    }
  }, [open, onClose])

  const showToast = useCallback((message, tone = 'success') => {
    setToast({ message, tone })
    setTimeout(() => setToast(null), 2400)
  }, [])

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return
    setBusy('download')
    try {
      const { blob } = await exportCardAsPng(cardRef.current)
      downloadBlob(blob, 'selfscience-genome-profile.png')
      showToast('Downloaded selfscience-genome-profile.png', 'success')
    } catch (err) {
      console.error('[ShareCardModal] download failed:', err)
      showToast('Could not generate the image. Please try again.', 'error')
    } finally {
      setBusy(null)
    }
  }, [showToast])

  const handleShare = useCallback(async () => {
    if (!cardRef.current) return
    setBusy('share')
    try {
      const { blob } = await exportCardAsPng(cardRef.current)
      const result = await shareCardOrCopy({ blob, text: shareText })
      if (result.mode === 'native' && result.ok) {
        showToast('Shared successfully.', 'success')
      } else if (result.mode === 'native-text-only' && result.ok) {
        showToast('Shared text (image not supported on this device).', 'success')
      } else if (result.mode === 'clipboard' && result.ok) {
        showToast('Copied to clipboard!', 'success')
      } else if (result.mode === 'cancelled') {
        // No toast on user-cancel — expected UX.
      } else {
        showToast('Could not share. Try Download instead.', 'error')
      }
    } catch (err) {
      console.error('[ShareCardModal] share failed:', err)
      showToast('Could not generate the image. Please try again.', 'error')
    } finally {
      setBusy(null)
    }
  }, [shareText, showToast])

  const handleCopyText = useCallback(async () => {
    try {
      await navigator.clipboard?.writeText(shareText)
      showToast('Text copied to clipboard!', 'success')
    } catch {
      showToast('Could not copy text.', 'error')
    }
  }, [shareText, showToast])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-3 py-6 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.() }}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-card-title"
        className="relative flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-ss-border-warm bg-ss-bg px-5 py-4">
          <div>
            <h2 id="share-card-title" className="text-lg font-bold text-ss-text">Share your genome profile</h2>
            <p className="mt-0.5 text-xs text-ss-muted">Download as PNG, share to social, or copy the text.</p>
          </div>
          <button
            ref={closeButtonRef}
            onClick={() => onClose?.()}
            aria-label="Close"
            className="rounded-lg p-2 text-ss-muted transition hover:bg-ss-border-warm/40 hover:text-ss-text"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="grid flex-1 grid-cols-1 gap-0 overflow-hidden md:grid-cols-[1fr,320px]">
          {/* Live preview area — scales the 1080x1350 card down to fit */}
          <div
            ref={previewWrapRef}
            className="relative flex min-h-[420px] items-center justify-center overflow-hidden bg-[repeating-linear-gradient(45deg,#F7F6F2,#F7F6F2_10px,#EEEDE8_10px,#EEEDE8_20px)] p-4"
          >
            <div
              style={{
                width: 1080 * scale,
                height: 1350 * scale,
              }}
              className="relative shadow-2xl"
            >
              <div
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                  width: 1080,
                  height: 1350,
                }}
              >
                {/* Preview-only copy — CSS transform means html2canvas can't
                    reliably rasterize this node directly. The hidden full-size
                    copy below (cardRef) is what actually gets exported. */}
                <ShareCard genomeResults={genomeResults} />
              </div>
            </div>
          </div>

          {/* Action panel */}
          <div className="flex flex-col justify-between gap-4 border-t border-ss-border-warm bg-white p-5 md:border-l md:border-t-0">
            <div className="space-y-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-ss-muted">Share text</div>
                <div className="mt-2 rounded-lg bg-ss-bg p-3 text-xs leading-relaxed text-ss-text">
                  {shareText}
                </div>
                <button
                  onClick={handleCopyText}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-ss-teal hover:bg-ss-teal/5"
                >
                  <Copy size={12} /> Copy text
                </button>
              </div>
              <div className="rounded-lg border border-ss-border-warm/60 bg-ss-bg/50 p-3 text-[11px] leading-relaxed text-ss-muted">
                Rendered at 1080×1350 (Instagram / mobile). No data leaves your
                browser — everything is generated on your device.
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleShare}
                disabled={busy !== null}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ss-orange px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-ss-orange-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy === 'share' ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
                {busy === 'share' ? 'Preparing…' : 'Share'}
              </button>
              <button
                onClick={handleDownload}
                disabled={busy !== null}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-ss-teal bg-white px-4 py-2.5 text-sm font-semibold text-ss-teal transition hover:bg-ss-teal/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy === 'download' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                {busy === 'download' ? 'Rendering…' : 'Download PNG'}
              </button>
            </div>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div
            className={`pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full px-4 py-2 text-xs font-semibold text-white shadow-lg ${
              toast.tone === 'error' ? 'bg-ss-amber' : 'bg-ss-teal'
            }`}
            role="status"
            aria-live="polite"
          >
            <span className="inline-flex items-center gap-1.5">
              <Check size={12} /> {toast.message}
            </span>
          </div>
        )}

        {/* Hidden off-screen full-size (1080x1350) card used only for
            html2canvas export. Rendered inside the modal DOM so it inherits
            the same Tailwind CSS context but positioned off-screen (not
            display:none, which would prevent rasterization). */}
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: 0,
            left: '-10000px',
            width: 1080,
            height: 1350,
            pointerEvents: 'none',
            zIndex: -1,
          }}
        >
          <ShareCard ref={cardRef} genomeResults={genomeResults} />
        </div>
      </div>
    </div>
  )
}
