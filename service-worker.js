// sw.js
const CACHE_VERSION = '20260314'; // ganti tiap deploy
const CACHE_NAME = `Equipment-cache-${CACHE_VERSION}`;

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './style.css',  
  './script.js',   
  './logo-harita-group.jpg'
];

// Install - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// Activate - hapus cache lama
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null)
      )
    )
  );
  self.clients.claim();
});

// Fetch
self.addEventListener('fetch', event => {
  const requestURL = new URL(event.request.url);

  // --- Network-first untuk index.html supaya selalu update ---
  if (requestURL.pathname === '/' || requestURL.pathname.endsWith('index.html')) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" }) // jangan pakai cache lama
        .then(resp => {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, resp.clone()));
          return resp;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // --- Cache-first untuk aset lain tapi update otomatis ---
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request).then(resp => {
        if (event.request.method === 'GET' && resp.status === 200) {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, resp.clone()));
        }
        return resp;
      }).catch(() => null);

      // Kembalikan cache dulu kalau ada, tapi tetap fetch untuk update cache
      return cached || fetchPromise;
    })
  );
});
