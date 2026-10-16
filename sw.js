const CACHE_NAME = 'tasbihmy-v1.0.0';

// Senarai fail penting yang wajib disimpan untuk offline
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './sw.js',
  './icon-192.png',
  './icon-512.png',
  'https://cdn.tailwindcss.com'
];

// Fasa 1: Install & Simpan ke Cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[TasbihMY] Caching semua aset utama...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Fasa 2: Activate & Buang Cache Lama jika ada update baru
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[TasbihMY] Padam cache versi lama:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fasa 3: Fetch - Guna Cache dulu, kalau tiada baru tarik dari Network (Cache-First Strategy)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Simpan salinan response baru jika sah
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    }).catch(() => {
      // Fallback sekiranya offline dan data tiada dalam cache
      return caches.match('./index.html');
    })
  );
});