// The Keep · sw.js · Nov 19 2026
// The Keep has no service worker of its own. This file replaces Ravenmarrow's, which was uploaded into thekeep/ by
// mistake and took over the page on phones that had opened it. On its next check the phone installs this one, which
// clears only the copies of thekeep/ pages that worker kept (Ravenmarrow's own offline copy is left alone),
// unregisters itself, and reloads any open Keep page straight from the site.
self.addEventListener('install', function(){ self.skipWaiting(); });
self.addEventListener('activate', function(e){
  e.waitUntil((async function(){
    try{ const keys=await caches.keys();
      for(const k of keys){ if(k.indexOf('ravenmarrow-')!==0) continue; const c=await caches.open(k), reqs=await c.keys();
        for(const r of reqs){ if(new URL(r.url).pathname.indexOf('/thekeep/')===0) await c.delete(r); } } }catch(err){}
    try{ await self.registration.unregister(); }catch(err){}
    try{ const cs=await self.clients.matchAll({type:'window'}); for(const c of cs){ try{ c.navigate(c.url); }catch(err){} } }catch(err){}
  })());
});
