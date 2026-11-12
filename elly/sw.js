const CACHE='mupub-v2-4';
// Measure Up public edition (motbuchanan.com/measureup/). Deletes ONLY its own mupub-* caches.
const CORE=['./','./index.html','./manifest.json','./apple-touch-icon.png','./icon-192.png','./icon-512.png','./voice.js'];
const LATER=['./voice2.js']; // big (all the later lines): cached after install, never blocks it
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE).then(()=>{ c.addAll(LATER).catch(()=>{}); })).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('mupub-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(
    caches.match(e.request,{ignoreSearch:true}).then(hit=>hit||fetch(e.request).then(res=>{
      if(res.ok&&new URL(e.request.url).origin===location.origin){
        const cp=res.clone(); caches.open(CACHE).then(c=>c.put(e.request,cp));
      }
      return res;
    }))
  );
});
