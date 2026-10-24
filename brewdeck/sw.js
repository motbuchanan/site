/* The Brew Deck service worker
   RULE: CACHE version must match the index.html version badge on every deploy. */
const CACHE = 'brewdeck-v6.1';

const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
  '../fonts/fonts.css',
  '../fonts/playfair-display.woff2',
  '../fonts/playfair-display-italic.woff2',
  '../fonts/dm-sans.woff2',
  '../fonts/dm-mono-400.woff2',
  '../fonts/dm-mono-500.woff2',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;


  // Navigations: network-first so a cache-bumped deploy lands, offline falls back to shell
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Same-origin assets: cache-first, backfill from network
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(e.request).then(
        (hit) =>
          hit ||
          fetch(e.request).then((res) => {
            if (res && res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(e.request, copy));
            }
            return res;
          })
      )
    );
  }
});
