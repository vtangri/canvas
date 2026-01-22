// sw.js - Service Worker for Learning Journal PWA
const CACHE_VERSION = 'v4';
const STATIC_CACHE = `learning-journal-static-${CACHE_VERSION}`;
const API_CACHE = `learning-journal-api-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

const FILES_TO_CACHE = [
  OFFLINE_URL,
  '/manifest.json',
  '/css/styles.css',
  '/js/script.js',
  '/js/about.js',
  '/js/journal.js',
  '/js/browser.js',
  '/js/storage.js',
  '/js/thirdparty.js',
  '/img/icon-192x192.png',
  '/img/icon-512x512.png'
];

const cacheStaticAssets = async () => {
  const cache = await caches.open(STATIC_CACHE);
  try {
    await cache.addAll(FILES_TO_CACHE);
  } catch (error) {
    console.error('Error caching static assets:', error);
  }
};

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    cacheStaticAssets().then(() => {
      console.log('[SW] Static assets cached successfully');
    }).catch((error) => {
      console.error('[SW] Error caching static assets:', error);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((keys) => {
      console.log('[SW] Found caches:', keys);
      return Promise.all(
        keys.map((key) => {
          if (![STATIC_CACHE, API_CACHE].includes(key)) {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Service worker activated');
      return self.clients.claim();
    })
  );
});

// Network-first strategy for API calls
const networkFirst = async (request, cacheName) => {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    // Only cache successful responses
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // If network fails, try cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
};

// Cache-first strategy for static assets
const cacheFirst = async (request) => {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    throw error;
  }
};

// Stale-while-revalidate for pages (cache first, update in background)
const staleWhileRevalidate = async (request) => {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  
  // If we have a cached version, return it immediately
  if (cached) {
    // Try to update cache in background (don't wait)
    fetch(request).then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
    }).catch(() => {
      // Ignore fetch errors in background update
    });
    return cached;
  }
  
  // No cache, try to fetch
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // If fetch fails and it's a navigation request, return offline page
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match(OFFLINE_URL);
      if (offlinePage) return offlinePage;
    }
    throw error;
  }
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests
  if (url.origin !== location.origin) return;

  // Handle API calls with network-first strategy
  if (url.pathname.startsWith('/reflections') || url.pathname.startsWith('/add_reflection')) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // Handle navigation requests (HTML pages) - cache as visited
  const acceptHeader = request.headers.get('accept') || '';
  if (request.mode === 'navigate' || acceptHeader.includes('text/html')) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // All other GET requests: cache-first
  event.respondWith(cacheFirst(request));
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
