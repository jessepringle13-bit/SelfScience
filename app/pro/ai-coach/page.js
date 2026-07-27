'use client'

// /app/app/pro/ai-coach/page.js
// This route used to be a Pro-gated placeholder. AI Coach is now shipped
// as a free-tier feature at /coach — this page auto-redirects there
// so any bookmarks / old links still work.

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bot, ArrowRight } from 'lucide-react'
import SiteNav from '@/components/site-nav'

export default function AICoachRedirect() {
  const router = useRouter()
  useEffect(() => {
    const t = setTimeout(() => router.replace('/coach'), 1500)
    return () => clearTimeout(t)
  }, [router])
  return (
    <div className="min-h-screen bg-ss-canvas">
      <SiteNav />
      <main className="container flex min-h-[calc(100vh-80px)] max-w-md items-center justify-center pt-24">
        <div className="w-full rounded-2xl border border-ss-border-warm/60 bg-ss-surface p-8 text-center shadow-lg">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-ss-orange/15 text-ss-orange ring-1 ring-ss-orange/40">
            <Bot size={20} />
          </div>
          <h1 className="mt-4 text-xl font-extrabold text-ss-text">AI Coach is now free.</h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-ss-muted">Taking you to the new home for the Coach chat — available to everyone, on the free tier.</p>
          <Link href="/coach" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-ss-orange px-5 text-[13px] font-bold text-white transition hover:bg-ss-orange-dark">
            Open AI Coach <ArrowRight size={13} />
          </Link>
        </div>
      </main>
    </div>
  )
}
