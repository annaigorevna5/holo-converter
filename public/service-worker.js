const CACHE_NAME = 'holo-converter-v1.0.0';
const RUNTIME_CACHE = 'runtime-cache-v1';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/main.js',
  '/js/config.js',
  '/js/utils.js',
  '/js/api.js',
  '/js/globe.js',
  '/js/xr.js',
  '/js/voice.js',
  '/manifest.json',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Exo+2:wght@300;400;600&display=swap'
];

self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Pre-caching assets');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
    }).then(cachesToDelete => {
      return Promise.all(cachesToDelete.map(cacheToDelete => {
        console.log('[Service Worker] Deleting old cache:', cacheToDelete);
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return caches.open(RUNTIME_CACHE).then(cache => {
          return fetch(event.request).then(response => {
            if (response.status === 200) {
              cache.put(event.request.url, response.clone());
            }
            return response;
          }).catch(() => {
            // Return offline page if fetch fails
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            return new Response('Network error occurred', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
        });
      })
    );
  }
  
  // API calls 
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
  }
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('sync', event => {
  if (event.tag === 'sync-rates') {
    event.waitUntil(syncCurrencyRates());
  }
});

async function syncCurrencyRates() {
  const cache = await caches.open(RUNTIME_CACHE);
  const response = await fetch('/api/symbols');
  if (response.ok) {
    await cache.put('/api/symbols', response.clone());
  }
}

self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New currency rates available!',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'convert',
        title: 'Convert now',
        icon: '/assets/icons/convert-icon.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/assets/icons/close-icon.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Holo Converter', options)
  );
});

self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification click received.');
  
  event.notification.close();
  
  if (event.action === 'convert') {
    event.waitUntil(
      clients.openWindow('/')
    );
  } else {
    event.waitUntil(
      clients.matchAll({type: 'window'}).then(clientList => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});