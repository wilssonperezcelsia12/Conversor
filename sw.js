const VERSION = 'v1.2';
const CACHE_NAME = `conversor-epsg-${VERSION}`;
const ASSETS = [
  '.',
  'index.html',
  'app.js',
  'proj4.js',
  'styles.css',
  'manifest.webmanifest',
  'icons/icon-192.svg',
  'icons/icon-512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      const deletions = keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : Promise.resolve()));
      return Promise.all(deletions).then(() => self.clients.claim());
    })
  );
});

// Listen for messages from the page (e.g., skipWaiting)
self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Only handle GET requests
  if (req.method !== 'GET') return;
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        // Respond with network response and cache a copy
        if (!res || res.status !== 200 || res.type !== 'basic') return res;
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        return res;
      }).catch(() => caches.match('index.html'));
    })
  );
});
