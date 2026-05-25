const STATIC_CACHE  = 's2b-static-v2';   // ← bumped; forces old cache eviction on deploy
const DYNAMIC_CACHE = 's2b-dynamic-v2';
const IMAGE_CACHE   = 's2b-images-v2';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/track.html',
  '/admin-login.html',
  '/offline.html',
  '/manifest.json',
  '/pwa-loader.css',
  '/image/logo.svg',
];

// ─── INSTALL ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ─── ACTIVATE ─────────────────────────────────────────────────────────────────
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
      self.clients.claim(),
    ])
  );
});

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Requests that must ALWAYS go straight to the network.
 * Returning true here means event.respondWith(fetch(request)) — never a cache.
 */
function shouldBypass(url, request) {
  return (
    // Supabase: REST, auth, storage, realtime
    url.hostname.includes('supabase.co') ||
    // CDN assets that may update frequently or have CORS quirks
    url.hostname.includes('cdn.jsdelivr.net') ||
    url.hostname.includes('cdnjs.cloudflare.com') ||
    url.hostname.includes('cdn.tailwindcss.com') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    // WebSocket upgrades — SW can't cache these
    request.headers.get('upgrade') === 'websocket' ||
    // Non-GET verbs
    request.method !== 'GET'
  );
}

// ─── FETCH ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ── BYPASS: pass straight to network, no caching ──────────────────────────
  //    Previously this block just did `return` — which left the request
  //    unanswered on mobile, causing the "network error" you were seeing.
  if (shouldBypass(url, request)) {
    event.respondWith(fetch(request));
    return;
  }

  // ── HTML NAVIGATION: network-first, fall back to cache, then offline ───────
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const clone = networkResponse.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match('/offline.html'))
        )
    );
    return;
  }

  // ── IMAGES: cache-first ────────────────────────────────────────────────────
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response && response.ok) {
            caches.open(IMAGE_CACHE).then((cache) => cache.put(request, response.clone()));
          }
          return response;
        })
      )
    );
    return;
  }

  // ── STATIC ASSETS (local CSS, JS, icons): stale-while-revalidate ──────────
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => cached); // offline: serve whatever we have

      return cached || networkFetch;
    })
  );
});

// ─── MESSAGE: allow the page to force SW update ───────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});