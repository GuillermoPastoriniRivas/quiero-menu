/* quiero.menu service worker - offline-first for the static export */
const VERSION = 'qm-v4';
const CACHE = `quiero-menu-${VERSION}`;
const PRECACHE = 'quiero-menu-precache';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
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
];

self.addEventListener('install', (event) => {
  // Install must never hang on a single failing request (e.g. slow mobile
  // network): cache each URL independently and resolve the install anyway.
  event.waitUntil(
    caches.open(PRECACHE)
      .then((cache) => Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url))))
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

  // Navigation requests: network-first so stale cached HTML never points to
  // hashed chunks that a new deploy removed (previously: stale HTML + 200 HTML
  // fallback from nginx for missing JS = "Unexpected token '<'" and the app
  // never boots). Fallback to cache, then offline page.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then((resp) => {
        if (resp && resp.ok) {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
        }
        return resp;
      }).catch(() =>
        caches.match(request).then((cached) => {
          if (cached) return cached;
          return caches.match('/offline.html');
        })
      )
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

/* ---- Push notifications ---- */

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'Notificacion' };
  }

  const title = data.title || 'quiero.menu';
  const options = {
    body: data.body || '',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    tag: data.tag || 'qm-notification',
    data: { url: data.url || '/' },
    vibrate: [100, 50, 100],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(target).catch(() => {});
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
