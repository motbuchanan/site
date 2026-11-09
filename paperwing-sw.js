/* Paper Wing service worker. Cache name MUST match the app's version badge (v0.3 · Nov 8). */
const CACHE='paperwing-v0.3';
const FILES=['paperwing.html','paperwing-manifest.json','paperwing-icon-192.png','paperwing-icon-512.png','paperwing-icon-180.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('paperwing-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);if(u.origin!==location.origin)return;
  const name=u.pathname.split('/').pop();
  if(!name.startsWith('paperwing'))return; /* only Paper Wing's own files, never the rest of the site */
  if(r.mode==='navigate'){ /* page: network first so updates land, cache when offline */
    e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put('paperwing.html',cp));return res;}).catch(()=>caches.match('paperwing.html')));
    return;
  }
  e.respondWith(caches.match(r).then(hit=>hit||fetch(r)));
});
