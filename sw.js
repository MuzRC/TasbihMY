const CACHE_NAME = 'tasbihmy-v1.0.1';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './sw.js',
  './icon-192.png',
  './icon-512.png',
  'https://cdn.tailwindcss.com'
];

// Fasa 1: Install & potong barisan (skipWaiting serta merta)
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[TasbihMY] Memuat aset baru ke cache:', CACHE_NAME);
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Fasa 2: Activate & bersihkan cache lama serta merta
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[TasbihMY] Menghapuskan cache usang:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fasa 3: Fetch - Network-First untuk fail halaman (HTML), Cache-First untuk aset statik
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const isHtml = req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html');

  if (isHtml) {
    // NETWORK-FIRST untuk HTML: Tarik kod terbaru dari GitHub/server dulu.
    // Jika tiada internet (offline), baru guna salinan cache.
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return networkRes;
        })
        .catch(() => caches.match('./index.html') || caches.match(req))
    );
  } else {
    // CACHE-FIRST untuk aset media, CSS & font
    event.respondWith(
      caches.match(req).then((cachedRes) => {
        if (cachedRes) return cachedRes;
        return fetch(req).then((networkRes) => {
          if (!networkRes || networkRes.status !== 200 || networkRes.type !== 'basic') {
            return networkRes;
          }
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return networkRes;
        });
      })
    );
  }
});
