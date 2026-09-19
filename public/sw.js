// Photo Bucket Nepal - Progressive Web App Service Worker (Live Sync Engine)
const CACHE_VERSION = 'photo-bucket-live-v2.5.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.svg',
  '/favicon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
];

// Install: Cache core shell and immediately take over
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Cache prefetch notice:', err);
      });
    })
  );
  // Force active state without waiting
  self.skipWaiting();
});

// Activate: Delete old caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_VERSION) {
            console.log('[SW] Purging outdated cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      // Notify all open windows (Web, iOS, Android, Windows) that latest version is active
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            version: CACHE_VERSION,
            timestamp: Date.now(),
          });
        });
      });
    })
  );
  self.clients.claim();
});

// Fetch: Network-First for HTML/Navigation, Stale-While-Revalidate for Assets
self.addEventListener('fetch', (event) => {
  // Only handle GET requests and skip API, WebSocket or non-HTTP protocols
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/ws') ||
    url.protocol === 'chrome-extension:' ||
    url.protocol.startsWith('ws')
  ) {
    return;
  }

  // 1. Navigation / HTML requests: NETWORK-FIRST
  // This guarantees that any live update on the website is immediately reflected
  // in installed Web-to-App versions (iOS Safari PWA, Android WebAPK, Windows Desktop App)
  const isNavigation = event.request.mode === 'navigate' || event.request.destination === 'document';

  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_VERSION).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Fallback to offline cached shell if user has no connectivity
          return caches.match('/index.html').then((cached) => cached || caches.match('/'));
        })
    );
    return;
  }

  // 2. Static Assets (JS, CSS, Images, Fonts): STALE-WHILE-REVALIDATE
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            (networkResponse.type === 'basic' || networkResponse.type === 'cors')
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_VERSION).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Network failed, nothing to do since cachedResponse was already returned or will fail
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// Handle incoming control messages from application
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'CHECK_VERSION') {
    event.ports[0]?.postMessage({
      version: CACHE_VERSION,
      active: true,
      timestamp: Date.now(),
    });
  }
});

