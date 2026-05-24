const STATIC_CACHE = 's2b-static-v1';
const DYNAMIC_CACHE = 's2b-dynamic-v1';
const IMAGE_CACHE = 's2b-images-v1';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/track.html',
  '/admin-login.html',
  '/offline.html',
  '/manifest.json',
  '/pwa-loader.css',
  '/image/logo.svg'
];

// Install: Precache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
      
  );
});



// Activate: Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => ![STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE].includes(key))
            .map((key) => caches.delete(key))
        )
      ),
      self.clients.claim()
    ])
  );
});

// Helper: check if request is for Supabase/API
function isApiRequest(url) {
  return (
    url.hostname.includes('supabase.co') ||
    url.pathname.startsWith('/rest/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/storage/')
  );
}

// Fetch handler
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // 1. API / Supabase: Network only (never cache live data)
  if (isApiRequest(url)) {
    return;
  }

  // 2. HTML Navigation: Stale-while-revalidate
  // HTML Navigation: Stale-while-revalidate + OFFLINE fallback
if (request.mode === 'navigate' || request.destination === 'document') {
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const clone = networkResponse.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          return cached || caches.match('/offline.html');
        });

      return cached || networkFetch;
    })
  );
  return;
}

  // 3. Images: Cache-first
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(IMAGE_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
      )
    );
    return;
  }

  // 4. CSS, JS, Fonts, CDN assets: Cache-first with background update
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});