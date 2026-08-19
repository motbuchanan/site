/* Reframe service worker - offline shell.
   Bump CACHE on every reframe.html change so old copies never stick. */
const CACHE = 'reframe-v1_7';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './reframe-icon-192.png',
  './reframe-icon-512.png'
];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); }).then(function(){ return self.skipWaiting(); }));
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var isPage = req.mode === 'navigate' || (req.headers.get('accept')||'').indexOf('text/html') > -1;
  if(isPage){
    // network-first so an updated page is never masked by a stale cache
    e.respondWith(
      fetch(req).then(function(res){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(req, copy); });
        return res;
      }).catch(function(){ return caches.match(req).then(function(m){ return m || caches.match('./index.html'); }); })
    );
  } else {
    // cache-first for icons and manifest
    e.respondWith(caches.match(req).then(function(m){ return m || fetch(req); }));
  }
});
