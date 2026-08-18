/* quiero.menu service worker - offline-first for the static export */
const VERSION = 'qm-v1';
const CACHE = `quiero-menu-${VERSION}`;
const PRECACHE = 'quiero-menu-precache';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/login',
  '/login.html',
  '/signup',
  '/signup.html',
  '/dashboard',
  '/dashboard.html',
  '/orders',
  '/orders.html',
  '/menu',
  '/menu.html',
  '/settings',
  '/settings.html',
  '/publicar',
  '/publicar.html',
  '/onboarding',
  '/onboarding.html',
  '/__dynamic__.html',
  '/tracking/__dynamic__.html',
  '/kitchen/__dynamic__.html',
  '/delivery/__dynamic__.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png',
  '/icon.svg',
  '/logo.svg',
  '/notification.wav',
];

const PREFIX = '/_next/';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PRECACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== PRECACHE && k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

function shouldCache(url) {
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith('/api/')) return false;
  if (url.pathname.startsWith('/socket.io/')) return false;
  return true;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || !shouldCache(new URL(request.url))) return;

  // Navigation requests: serve cached HTML, fallback to network
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((resp) => {
          if (resp && resp.ok) {
            const copy = resp.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return resp;
        }).catch(() => {
          // Offline: fallback to the generic __dynamic__ page for dynamic routes
          return caches.match('/__dynamic__.html');
        });
      })
    );
    return;
  }

  // Asset requests (_next, images): cache-first with network fallback
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((resp) => {
        if (resp && resp.ok && shouldCache(new URL(request.url))) {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
        }
        return resp;
      });
    })
  );
});
