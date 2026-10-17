// Offline support for Pemarkahan Hafazan.
// The page registers this as sw.js?v=<APP_VERSION>, so raising APP_VERSION in
// index.html installs a fresh copy automatically. Nothing to edit here.
const VERSION = new URL(self.location).searchParams.get('v') || '0';
const PREFIX = 'pemarkahan-hafazan-';
const CACHE = PREFIX + VERSION;
const SHELL = [
  './',
  './manifest.json',
  './fonts/fonts.css',
  './fonts/press-start-2p-latin-400-normal.woff2',
  './fonts/press-start-2p-latin-ext-400-normal.woff2',
  './fonts/vt323-latin-400-normal.woff2',
  './fonts/vt323-latin-ext-400-normal.woff2',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  // Remove only this app's older copies (other pages on the same site keep theirs).
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.endsWith('/version.json')) return;           // always ask the server

  // The page itself: newest from the network, saved copy when offline.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => {
          if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./', copy)); }
          return res;
        })
        .catch(() => caches.match('./'))
    );
    return;
  }

  // Fonts, icons, manifest: saved copy first.
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }))
  );
});
