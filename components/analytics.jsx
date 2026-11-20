'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'

/**
 * Analytics loader.
 * - Google Analytics 4 loads only when NEXT_PUBLIC_GA_MEASUREMENT_ID is set (starts with 'G-').
 * - Microsoft Clarity loads only when NEXT_PUBLIC_CLARITY_ID is set.
 * Both are safe no-ops when the env vars are empty, so we can ship without IDs.
 *
 * Privacy: IP is anonymised, ad-personalisation is disabled, and no PII is sent.
 * Custom event tracking is handled by lib/analytics.js (see trackEvent()).
 */
export default function Analytics() {
  // Admin screens show private stats; never record them in GA/Clarity.
  const pathname = usePathname() || ''
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return null
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID

  return (
    <>
      {gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('consent', 'default', {
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied',
                analytics_storage: 'granted'
              });
              gtag('config', '${gaId}', {
                anonymize_ip: true,
                allow_google_signals: false,
                allow_ad_personalization_signals: false
              });
            `}
          </Script>
        </>
      )}
      {clarityId && (
        <>
          <Script id="clarity-init" strategy="afterInteractive">
            {`
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${clarityId}");
            `}
          </Script>
          <Script id="clarity-mask" strategy="afterInteractive">
            {`
              (function(){
                // Selector for anything a user might type/select/pick — all masked in recordings.
                var SEL = 'input, textarea, select, [contenteditable="true"], [contenteditable=""]';

                function maskEl(el) {
                  if (!el || el.nodeType !== 1) return;
                  // Never override an explicit unmask.
                  if (el.getAttribute('data-clarity-unmask') === 'True') return;
                  el.setAttribute('data-clarity-mask', 'True');
                }

                function maskAll(root) {
                  var scope = root || document;
                  if (scope.querySelectorAll) {
                    scope.querySelectorAll(SEL).forEach(maskEl);
                  }
                }

                // Initial sweep as soon as DOM is available.
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', function(){ maskAll(document); });
                } else {
                  maskAll(document);
                }

                // Also mask inputs that get added later (SPA navigation, dialogs, dynamic UI).
                try {
                  var mo = new MutationObserver(function(mutations){
                    for (var i = 0; i < mutations.length; i++) {
                      var m = mutations[i];
                      for (var j = 0; j < m.addedNodes.length; j++) {
                        var n = m.addedNodes[j];
                        if (n.nodeType !== 1) continue;
                        if (n.matches && n.matches(SEL)) maskEl(n);
                        maskAll(n);
                      }
                      // Also handle new contenteditable / type=file attrs on existing elements.
                      if (m.type === 'attributes' && m.target && m.target.matches && m.target.matches(SEL)) {
                        maskEl(m.target);
                      }
                    }
                  });
                  mo.observe(document.documentElement, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['contenteditable', 'type']
                  });
                } catch (e) { /* older browsers: initial sweep still applied */ }

                // Belt-and-braces: tell Clarity to respect strict content masking mode.
                // Works only if the Clarity project has been configured to accept the flag;
                // safe no-op otherwise.
                if (typeof window.clarity === 'function') {
                  try { window.clarity('set', 'maskAllInputs', 'true'); } catch (e) {}
                  try { window.clarity('consent'); } catch (e) {}
                }
              })();
            `}
          </Script>
        </>
      )}
    </>
  )
}
