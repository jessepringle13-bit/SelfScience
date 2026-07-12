// /app/app/sw.js
// Serwist service worker entry — compiled into /public/sw.js at build time.
//
// PWA freshness strategy (2026-07 update):
//   * `skipWaiting` + `clientsClaim`  → a new SW takes over immediately.
//   * `NetworkOnly` for /api/*         → always hit the live server.
//   * `NetworkFirst` for HTML nav      → always try the latest deploy;
//                                        fall back to cache when offline.
//   * `defaultCache` for static assets → JS/CSS/images cached with hashes.
//   * A CACHE_VERSION suffix on our custom caches → old caches are purged
//     automatically when the SW rebuilds after a deploy.
//
// This is paired with `/components/PWAUpdater.jsx`, which listens for
// controllerchange on the client and reloads the tab so users on installed
// PWAs never see stale HTML more than one navigation after a redeploy.

import { defaultCache } from '@serwist/next/worker'
import {
  Serwist,
  NetworkOnly,
  NetworkFirst,
  ExpirationPlugin,
} from 'serwist'

// Bump manually if we ever want to nuke every client cache in one deploy.
const CACHE_VERSION = 'v2'

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // /api/* — never cache. Genome / search / AI responses must always be live.
    {
      matcher: ({ url }) => url.pathname.startsWith('/api/'),
      handler: new NetworkOnly(),
    },
    // Page navigations — try the network first so a fresh deploy is picked up
    // on the very next navigation. Falls back to cache only when offline.
    {
      matcher: ({ request }) => request.mode === 'navigate',
      handler: new NetworkFirst({
        cacheName: `pages-${CACHE_VERSION}`,
        networkTimeoutSeconds: 4,
        plugins: [
          new ExpirationPlugin({
            maxEntries: 60,
            maxAgeSeconds: 60 * 60 * 24, // 1 day — old HTML shells purged daily
          }),
        ],
      }),
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
