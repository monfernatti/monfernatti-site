/* Service worker: deixa o site e o CRM abrirem rápido e funcionarem como aplicativo no celular.
   Páginas e scripts: busca na rede primeiro (sempre a versão nova) e usa a cópia guardada se estiver sem internet.
   Dados (Supabase) nunca passam por aqui. */
const CACHE = "mf-2026-11-18";
const BASE = ["/", "/js/config.js", "/js/dados.js", "/js/crm.js", "/favicon.png", "/icons/icon-192.png", "/manifest.webmanifest"];

self.addEventListener("install", e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(BASE)).catch(()=>{}).then(()=>self.skipWaiting()));
});
self.addEventListener("activate", e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch", e=>{
  const r = e.request;
  if(r.method !== "GET") return;
  const u = new URL(r.url);
  if(u.origin !== self.location.origin) return;
  if(u.pathname.startsWith("/fotos/") || u.pathname.startsWith("/icons/")){
    e.respondWith(caches.match(r).then(m=>m || fetch(r).then(resp=>{ if(resp.ok){ const c = resp.clone(); caches.open(CACHE).then(x=>x.put(r, c)); } return resp; })));
    return;
  }
  e.respondWith(fetch(r).then(resp=>{
    if(resp.ok){ const c = resp.clone(); caches.open(CACHE).then(x=>x.put(r.mode==="navigate" ? "/" : r, c)); }
    return resp;
  }).catch(()=>caches.match(r.mode==="navigate" ? "/" : r).then(m=>m || caches.match("/"))));
});
self.addEventListener("notificationclick", e=>{
  e.notification.close();
  const alvo = (e.notification.data && e.notification.data.url) || "/#crm";
  e.waitUntil(self.clients.matchAll({type:"window", includeUncontrolled:true}).then(cs=>{
    const c = cs.find(x=>new URL(x.url).origin === self.location.origin);
    if(c) return c.focus();
    return self.clients.openWindow(alvo);
  }));
});
