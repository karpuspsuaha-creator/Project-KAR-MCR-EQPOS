// sw.js
const CACHE_VERSION = '20250905'; // ganti setiap deploy
const CACHE_NAME = `Equipment-cache-${CACHE_VERSION}`;

// ===== TAMBAHAN: fallback =====
const OFFLINE_URL = './';

// ===== ASSETS =====
const ASSETS_TO_CACHE = [
  './',
  './index.html', // WAJIB biar aman offline
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './style.css',
  './script.js',
  './Code_Unit.js',
  './logo-harita-group.jpg'
];

// ===== INSTALL =====
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// ===== ACTIVATE =====
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

// ===== FETCH =====
self.addEventListener('fetch', event => {
  const request = event.request;
  const requestURL = new URL(request.url);

  // ==============================
  // ✅ HANDLE NAVIGATION (REFRESH / BUKA HALAMAN)
  // ==============================
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          return caches.match(request)
            .then(res => res || caches.match(OFFLINE_URL));
        })
    );
    return;
  }

  // ==============================
  // ✅ INDEX.HTML (punya kamu + fallback)
  // ==============================
  if (requestURL.pathname === '/' || requestURL.pathname.endsWith('index.html')) {
    event.respondWith(
      fetch(request)
        .then(resp => {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return resp;
        })
        .catch(() => {
          return caches.match(request)
            .then(res => res || caches.match(OFFLINE_URL));
        })
    );
    return;
  }

  // ==============================
  // ✅ ASSETS (CACHE FIRST)
  // ==============================
  event.respondWith(
    caches.match(request).then(cached => {
      return cached || fetch(request)
        .then(resp => {
          if (request.method === 'GET') {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return resp;
        })
        .catch(() => cached || caches.match(OFFLINE_URL));
    })
  );
});
