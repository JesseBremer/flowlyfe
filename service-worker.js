const CACHE_VERSION = 'v32';
const CACHE_NAME = `flowlyfe-${CACHE_VERSION}`;
const APP_BASE = self.location.pathname.replace(/service-worker\.js$/, '');
const RESOURCES = [
  '',
  'index.html',
  'styles.css',
  'app.js',
  'journal.js',
  'manifest.json',
  'icons/icon-72x72.png',
  'icons/icon-96x96.png',
  'icons/icon-128x128.png',
  'icons/icon-144x144.png',
  'icons/icon-152x152.png',
  'icons/icon-192x192.png',
  'icons/icon-384x384.png',
  'icons/icon-512x512.png',
  'icons/shortcut-capture.png',
  'icons/shortcut-inbox.png',
  'icons/icon-surfing-i.svg'
];

const urlsToCache = RESOURCES.map(resource => `${APP_BASE}${resource}`);
const optionalAssets = ['assets/capture.mp3'].map(resource => `${APP_BASE}${resource}`);

// Install service worker and cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache).then(() => {
          return Promise.all(optionalAssets.map(asset =>
            cache.add(asset).catch(() => null)
          ));
        });
      })
  );
  self.skipWaiting();
});

// Fetch from cache, fallback to network
self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(APP_BASE + 'index.html')
        .then(response => response || fetch(event.request))
        .catch(() => caches.match(APP_BASE + 'index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
      .catch(() => caches.match(APP_BASE + 'index.html'))
  );
});

// Update service worker and clean old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});
