// --- MetalTrack Streamlined Service Worker ---

const CACHE_NAME = 'metaltrack-v1-industrial';

// Define assets to be cached for offline use
const ASSETS_TO_CACHE = [
  'index.html',
  'manifest.json',
  // Localizing external scripts (highly recommended to save copies locally)
  // 'https://cdn.tailwindcss.com', // Caching the entire Tailwind CDN isn't feasible, so offline styling will be basic
  'icon-192.png',
  'icon-512.png'
];

// 1. Install Event: Cache Core Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('MetalTrack SW: Pre-caching Core Assets...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  // Force the waiting service worker to become active
  self.skipWaiting();
});

// 2. Activate Event: Clean up Old Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('MetalTrack SW: Clearing Old Cache...', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  // Take control of uncontrolled clients immediately
  self.clients.claim();
});

// 3. Fetch Event: Cache-First Strategy
// This serves the cached version of the page even when offline.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Serve from cache if available
        return cachedResponse;
      }
      // If not in cache, try fetching from the network
      return fetch(event.request).catch(() => {
        // If network fetch fails (offline) and not in cache, optionally serve an offline page/basic message
        // Since we are pre-caching index.html, it should always be served.
        if (event.request.mode === 'navigate') {
          return caches.match('index.html');
        }
      });
    })
  );
});
