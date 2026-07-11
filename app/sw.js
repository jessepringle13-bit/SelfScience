// /app/app/sw.js
// Serwist service worker entry. Serwist compiles this into /public/sw.js at
// build time. Uses the default runtime cache set plus a network-only rule for
// /api/* so genome / search / AI endpoints never serve stale data.

import { defaultCache } from '@serwist/next/worker'
import { Serwist, NetworkOnly } from 'serwist'

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      // Never cache API responses — always hit the network.
      matcher: ({ url }) => url.pathname.startsWith('/api/'),
      handler: new NetworkOnly(),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      { url: '/offline', matcher: ({ request }) => request.destination === 'document' },
    ],
  },
})

serwist.addEventListeners()
