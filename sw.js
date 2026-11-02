// --- MetalTrack Advanced Offline Service Worker ---

const CACHE_NAME = 'metaltrack-v2-industrial';

const ASSETS_TO_CACHE = [
  'index.html',
  'manifest.json'
];

// 1. Install Event: Cache App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 2. Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch Event: Network-First for Firebase & APIs, Cache-First for App Assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // If the request is going to Firebase Realtime Database
  if (url.origin.includes('firebaseio.com')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Clone and cache the fresh Firebase data response
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          // If offline, fall back to cached Firebase data
          return caches.match(event.request);
        })
    );
  } else {
    // Standard asset fetch (Cache-First)
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return cachedResponse || fetch(event.request).catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('index.html');
          }
        });
      })
    );
  }
});
