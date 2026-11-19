// Ravenmarrow service worker. Cache name changes every version so installed phones update.
const CACHE = 'ravenmarrow-v3.5';
const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './apple-touch-icon.png', './rm-title.webp', './rm-eye.webp', './rm-barrow.webp', './rm-hel.webp', './rm-realms.webp', './rm-squad.webp', './village-iso.js?v=3.5'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('ravenmarrow-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const isPage = req.mode === 'navigate' || req.url.endsWith('.html');
  if (isPage) {
    // network first: new chapters show up as soon as there is signal
    e.respondWith(fetch(req, {cache: 'no-store'}).then(r => { if (r.ok){ const copy = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); } return r; }).catch(() => caches.match('./index.html')));
  } else {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { if (res.ok){ const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; })));
  }
});
