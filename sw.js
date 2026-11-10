/* Cuaderno de Entrenos · service worker: abre rápido y sin cobertura. Strava nunca se cachea. */
const VERSION = "entrenos-v3";
const BASE = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg"];
self.addEventListener("install", e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(BASE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.hostname.endsWith("strava.com") || u.hostname.endsWith("openfoodfacts.org")) return;
  if (r.mode === "navigate" || (u.origin === location.origin && /\/(index\.html)?$/.test(u.pathname))) {
    e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(VERSION).then(ca => ca.put("./index.html", c)); return res; })
      .catch(() => caches.match("./index.html")));
    return;
  }
  if (u.origin === location.origin || /cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com/.test(u.hostname)) {
    e.respondWith(caches.open(VERSION).then(async ca => {
      const hit = await ca.match(r);
      const red = fetch(r).then(res => { if (res.ok || res.type === "opaque") ca.put(r, res.clone()); return res; }).catch(() => hit);
      return hit || red;
    }));
  }
});
