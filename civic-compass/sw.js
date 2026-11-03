var CACHE = 'civic-compass-cc1.3';
self.addEventListener('install', function(e){ self.skipWaiting(); });
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.filter(function(k){ return k.indexOf('civic-compass-')===0 && k!==CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(function(r){ var c = r.clone(); caches.open(CACHE).then(function(ca){ ca.put(e.request, c); }); return r; })
    .catch(function(){ return caches.match(e.request).then(function(hit){ return hit || caches.match('./index.html'); }); })
  );
});
