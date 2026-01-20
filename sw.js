/**
 * Service Worker for Couples Game Hub
 * Provides offline support and caching
 */

const CACHE_NAME = 'couples-game-hub-v1';
const RUNTIME_CACHE = 'runtime-v1';

// Detect base path from SW scope
const BASE_PATH = new URL(self.registration.scope).pathname;

// App shell files (relative to base)
const APP_SHELL_FILES = [
  '',
  'index.html',
  'css/style.css',
  'manifest.webmanifest',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'assets/icons/icon-512-maskable.png'
];

// Build full paths
const APP_SHELL = APP_SHELL_FILES.map(file => BASE_PATH + file);

// Install event - precache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching app shell');
        return cache.addAll(APP_SHELL);
      })
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.error('[SW] Precache failed:', err);
      })
  );
});

// Activate event - clean old caches and notify clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        // Notify all clients that a new SW is active
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: 'SW_ACTIVATED' });
          });
        });
        return self.clients.claim();
      })
  );
});

// Fetch event - stale-while-revalidate for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests (except for Google Fonts)
  if (url.origin !== location.origin && !url.origin.includes('googleapis.com')) {
    return;
  }

  // Skip Firebase requests
  if (url.hostname.includes('firebase') || url.hostname.includes('firebaseio')) {
    return;
  }

  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirstWithCache(request)
    );
    return;
  }

  // Handle static assets (CSS, JS, images)
  if (isStaticAsset(url.pathname)) {
    event.respondWith(
      staleWhileRevalidate(request)
    );
    return;
  }

  // Default: network first, fall back to cache
  event.respondWith(
    networkFirstWithCache(request)
  );
});

// Check if URL is a static asset
function isStaticAsset(pathname) {
  return /\.(css|js|png|jpg|jpeg|gif|svg|woff2?|ttf|eot|ico|webp)$/i.test(pathname);
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await cache.match(request);

  // Start network fetch (don't await)
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => null);

  // Return cached response immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }

  // If no cache, wait for network
  const networkResponse = await fetchPromise;
  if (networkResponse) {
    return networkResponse;
  }

  // Fallback for images/assets
  return new Response('', { status: 404 });
}

// Network first with cache fallback
async function networkFirstWithCache(request) {
  const cache = await caches.open(RUNTIME_CACHE);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // For navigation, try to return cached index.html
    if (request.mode === 'navigate') {
      const indexCache = await caches.open(CACHE_NAME);
      const indexResponse = await indexCache.match(BASE_PATH + 'index.html');
      if (indexResponse) {
        return indexResponse;
      }
    }

    throw error;
  }
}

// Listen for skip waiting message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
