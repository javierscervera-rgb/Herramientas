/* Service worker de epacta-hoy.html (solo controla esa página).
   Si cambias el PDF del calendario, sube la versión para que se descargue de nuevo. */
const VERSION = 'epacta-hoy-v2';
const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/';
const PRECACHE = [
  './epacta-hoy.html',
  './epacta-hoy.webmanifest',
  './date_to_page.json',
  './icon-epacta-192.png',
  './icon-epacta-512.png',
  PDFJS + 'pdf.min.mjs',
  PDFJS + 'pdf.worker.min.mjs'
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await Promise.all(PRECACHE.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('epacta-hoy-') && k !== VERSION) await caches.delete(k);
    await self.clients.claim();
  })());
});

// Red primero (para recibir cambios) y, sin conexión, lo guardado
async function networkFirst(req) {
  const c = await caches.open(VERSION);
  try {
    const res = await fetch(req);
    if (res.ok) c.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await c.match(req, { ignoreSearch: true });
    if (hit) return hit;
    throw err;
  }
}
// Lo guardado primero (PDF, pdf.js, iconos): no se vuelve a descargar
async function cacheFirst(req) {
  const c = await caches.open(VERSION);
  const hit = await c.match(req, { ignoreSearch: true });
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok && res.status === 200) c.put(req, res.clone());
  return res;
}

// La página pide guardar el PDF tras la primera carga
self.addEventListener('message', e => {
  if (!e.data || e.data.type !== 'cache') return;
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    for (const u of e.data.urls || []) {
      const abs = new URL(u, self.registration.scope).href;
      if (!(await c.match(abs, { ignoreSearch: true }))) { try { await c.add(abs); } catch (_) {} }
    }
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  if (url.href.startsWith(PDFJS) || (sameOrigin && /\.(pdf|png|svg)$/i.test(url.pathname))) {
    e.respondWith(cacheFirst(req));
  } else if (sameOrigin && (req.mode === 'navigate' || /\.(json|webmanifest|html)$/i.test(url.pathname))) {
    e.respondWith(networkFirst(req));
  }
});
