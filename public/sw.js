const STATIC_CACHE_NAME = 'moro-static-assets-v2';
const DYNAMIC_CACHE_NAME = 'moro-dynamic-cache-v2';
const ACHIEVEMENTS_CACHE_NAME = 'moro-achievements-v2';

const ESSENTIAL_ASSETS = [
  '/',
  '/index.html',
  '/index.css',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Fredoka+One&family=Quicksand:wght@400;700&family=Noto+Sans:wght@400;700&display=swap'
];

// Default offline achievements fallback dataset
const FALLBACK_ACHIEVEMENTS = [
  { id: 'first_run', title: 'First Wipeout', desc: 'Complete your first run on any map.', points: 10, category: 'Milestone', unlocked: true },
  { id: 'distance_500', title: 'Half Kilometer', desc: 'Reach 500 meters distance.', points: 15, category: 'Gameplay', unlocked: false },
  { id: 'morobux_100', title: 'Bux Collector', desc: 'Accumulate 100 MoroBux.', points: 10, category: 'Economy', unlocked: false }
];

// Install Event - Pre-cache essential static assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching essential game assets');
      return cache.addAll(ESSENTIAL_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] Pre-cache non-fatal warning:', err);
      });
    })
  );
});

// Activate Event - Clean up stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== STATIC_CACHE_NAME &&
            cacheName !== DYNAMIC_CACHE_NAME &&
            cacheName !== ACHIEVEMENTS_CACHE_NAME
          ) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Serve from Cache or Network with Fallback
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Special handler for virtual offline achievements API
  if (url.pathname === '/api/offline-achievements') {
    event.respondWith(
      caches.open(ACHIEVEMENTS_CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match('/api/offline-achievements');
        if (cachedResponse) {
          return cachedResponse;
        }
        return new Response(JSON.stringify(FALLBACK_ACHIEVEMENTS), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Handle standard GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached asset immediately, update dynamic cache in background
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          }
        }).catch(() => {/* Offline, ignore */});
        return cachedResponse;
      }

      // Fetch from network and store in dynamic cache
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Fallback for HTML page requests if totally offline
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/');
        }
      });
    })
  );
});

// Message Listener - Synchronize achievements and offline state from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_ACHIEVEMENTS') {
    const achievementsData = event.data.payload;
    caches.open(ACHIEVEMENTS_CACHE_NAME).then((cache) => {
      const response = new Response(JSON.stringify(achievementsData), {
        headers: { 'Content-Type': 'application/json' }
      });
      cache.put('/api/offline-achievements', response);
      console.log('[ServiceWorker] Cached latest achievements for offline use:', achievementsData.length);
    });
  }
});
