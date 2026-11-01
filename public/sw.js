const CACHE_NAME = 'hoan-makeup-v30';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/fonts/fonts.css',
  '/fonts/hoan-5.ttf',
  '/fonts/tinos-Tinos-Regular.ttf',
  '/styles.css?v=2.5',
  '/couture.css?v=137.0',
  '/mobile-admin.css?v=1.2',
  '/scroll-enhancements.js?v=1.4',
  '/mobile-admin.js?v=1.4',
  '/app.js?v=171.0',
  '/client-bootstrap.js?v=5.7',
  '/app-version.json',
  '/location-experience.css?v=1.5',
  '/admin-location.css?v=1.0',
  '/admin-location.js?v=3.5',
  '/finance-admin.css?v=1.0',
  '/finance-admin.js?v=2.0',
  '/finance-utils.js?v=2.0',
  '/policy-navigation.css?v=1.0',
  '/policy-navigation.js?v=1.0',
  '/booking-location.js?v=9.3',
  '/location-utils.js?v=5.0',
  '/device-location.js?v=6.1',
  '/location-boundaries.js?v=3.0',
  '/location-boundary-worker.js?v=1.0',
  '/location-map.js?v=8.2',
  '/location-vector-map.js?v=2.2',
  '/location-raster-map.js?v=2.2',
  '/location-marker.js?v=1.0',
  '/location-map-tiles.js?v=1.0',
  '/vendor/maplibre/maplibre-gl.mjs?v=6.16.0',
  '/vendor/maplibre/maplibre-gl-worker.mjs?v=6.16.0',
  '/vendor/maplibre/maplibre-gl.css?v=6.16.0',
  '/vendor/leaflet/leaflet.js',
  '/vendor/leaflet/leaflet.css',
  '/data/vietnam-ward-aliases.json',
  '/data/administrative-boundaries/index.json',
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
    url.pathname.endsWith('.js') || url.pathname.endsWith('.mjs') ||
    url.pathname.endsWith('.css');

  if (isCodeOrHtml) {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match(event.request).then(cached => cached || (event.request.mode === 'navigate' ? caches.match('/') : Response.error())))
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
