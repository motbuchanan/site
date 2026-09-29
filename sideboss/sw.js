/* Side Boss service worker */
var CACHE="sideboss-v0.8";
var ASSETS=["./","./index.html","./manifest.webmanifest","./version.json","./icon-192.png","./icon-512.png","./icon-512-maskable.png","./apple-touch-icon.png"];
self.addEventListener("install", function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(ASSETS).catch(function(){}); }));
});
self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.map(function(k){ if(k!==CACHE) return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener("fetch", function(e){
  var req=e.request;
  if(req.method!=="GET") return;
  var url;
  try{ url=new URL(req.url); }catch(err){ return; }
  if(url.origin!==location.origin) return;
  var isHTML = req.mode==="navigate" || (req.headers.get("accept")||"").indexOf("text/html")>-1;
  if(isHTML){
    /* network-first, no-store: a push shows up on next open */
    e.respondWith(
      fetch(req.url,{cache:"no-store"}).then(function(r){
        var cp=r.clone(); caches.open(CACHE).then(function(c){ c.put("./index.html", cp); });
        return r;
      }).catch(function(){
        return caches.match("./index.html").then(function(m){ return m || caches.match("./"); });
      })
    );
    return;
  }
  /* stale-while-revalidate for same-origin assets */
  e.respondWith(caches.match(req).then(function(cached){
    var net=fetch(req).then(function(r){
      if(r && r.status===200){ var cp=r.clone(); caches.open(CACHE).then(function(c){ c.put(req, cp); }); }
      return r;
    }).catch(function(){ return cached; });
    return cached || net;
  }));
});
