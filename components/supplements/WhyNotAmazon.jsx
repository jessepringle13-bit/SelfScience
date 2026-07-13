'use client'
import { useState } from 'react'
import { ExternalLink, ShoppingBag, ChevronDown } from 'lucide-react'

export default function WhyNotAmazon() {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-[#1B474D]/20 bg-[#EEF7F7] text-[#1B474D]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-3 p-4 text-left"
        aria-expanded={open}
      >
        <ShoppingBag className="h-5 w-5 shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="font-semibold">Why we only link to brand-direct stores</div>
          <div className="text-sm mt-0.5 text-[#1B474D]/80">
            We never link to Amazon or third-party marketplaces. Tap to read why.
          </div>
        </div>
        <ChevronDown className={`h-5 w-5 mt-1 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm space-y-3">
          <p>
            <strong>1. Counterfeits.</strong> Amazon commingles inventory from many sellers
            in the same warehouse bin. Studies have documented meaningful counterfeit and
            gray-market rates for high-value supplements, especially fish oil, curcumin, and
            NMN/NAD+ products. Buying direct means the bottle came from the brand&apos;s own
            supply chain.
          </p>
          <p>
            <strong>2. Cold chain.</strong> Probiotics, omega-3s, and enzymes degrade when
            stored in hot fulfillment warehouses or delivery trucks. Brand-direct shipping
            often uses temperature-controlled logistics for sensitive SKUs.
          </p>
          <p>
            <strong>3. Fresher lots.</strong> Marketplace bins can hold near-expiry stock for
            months. Brand direct usually rotates lot codes weekly.
          </p>
          <p>
            <strong>4. Better warranty &amp; recall handling.</strong> Buying from the brand
            gives you first-party support and immediate access to any batch-specific recall
            notices.
          </p>
          <p>
            <strong>5. No SelfScience affiliate revenue.</strong> We do not run affiliate
            programs on these links. The tradeoff for you (walk directly to the source) is
            the same tradeoff for us (no marketplace commission distorting our recommendations).
          </p>
          <a
            href="https://www.fda.gov/news-events/press-announcements/fda-continues-warn-consumers-purchasing-medical-products-online"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[#C45820] font-medium hover:underline"
          >
            FDA guidance on buying supplements online
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}
    </div>
  )
}
