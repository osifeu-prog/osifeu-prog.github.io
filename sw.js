// SLH Spark Service Worker — Offline Support + Caching
const CACHE_NAME = 'slh-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/community.html',
  '/css/shared.css',
  '/js/shared.js',
  '/js/translations.js',
  '/assets/img/phoenix-icon.png',
  '/assets/img/cyberpunk-hero.png'
];

// Install — cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — network first, fallback to cache
self.addEventListener('fetch', event => {
  // Skip non-GET and API requests
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
