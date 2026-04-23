// FormLedger Service Worker — v11
// Network-first strategy: always try to fetch fresh, fall back to cache
// Increment SW_VERSION with every deployment to force cache clear

const SW_VERSION  = 'fl-v11';
const CACHE_NAME  = 'formledger-' + SW_VERSION;
const URLS_TO_CACHE = ['/', '/index.html', '/analytics.html'];

// Install — cache core files
self.addEventListener('install', event => {
  self.skipWaiting(); // activate immediately, don't wait for old SW to die
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(URLS_TO_CACHE))
  );
});

// Activate — delete all old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim()) // take control of all open tabs immediately
  );
});

// Fetch — network first, cache fallback
self.addEventListener('fetch', event => {
  // Only handle GET requests for same-origin resources
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clone and cache the fresh response
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Network failed — serve from cache
        return caches.match(event.request);
      })
  );
});
