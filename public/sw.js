const CACHE_NAME = 'hoan-makeup-v5';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/fonts/fonts.css',
  '/fonts/hoan-5.ttf',
  '/fonts/tinos-Tinos-Regular.ttf',
  '/styles.css?v=2.5',
  '/couture.css?v=120.0',
  '/mobile-admin.css?v=1.2',
  '/scroll-enhancements.js?v=1.2',
  '/mobile-admin.js?v=1.2',
  '/app.js?v=145.0',
  '/data/vietnam-administrative-latest.json',
  '/data/vietnam-legacy-districts.json'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key.startsWith('hoan-makeup-') && key !== CACHE_NAME).map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Vite modules and RSC responses must never come from the PWA cache.
  if (url.origin !== self.location.origin ||
      /^\/(?:@|__|node_modules\/|app\/)/.test(url.pathname) ||
      url.searchParams.has('_rsc') ||
      event.request.headers.get('rsc') === '1' ||
      event.request.headers.get('accept')?.includes('text/x-component')) {
    return;
  }

  // Do not cache API requests or non-GET methods
  if (event.request.method !== 'GET' || url.pathname.startsWith('/api/')) {
    return;
  }

  // Network-first for HTML, JS and CSS so all visual/code updates apply immediately
  const isCodeOrHtml = event.request.mode === 'navigate' ||
    event.request.headers.get('accept')?.includes('text/html') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css');

  if (isCodeOrHtml) {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match(event.request).then(cached => cached || caches.match('/')))
    );
    return;
  }

  // Only static media may use cache-first; extensionless runtime modules may not.
  if (!/\.(?:png|jpe?g|webp|gif|svg|ico|avif|woff2?|ttf|otf)$/i.test(url.pathname)) return;

  // Cache-first for images and fonts
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
        return networkResponse;
      });
    })
  );
});
