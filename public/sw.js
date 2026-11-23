const CACHE_NAME = 'hoan-makeup-admin-web-push-2';
const STATIC_ASSETS = [
  '/admin-security.css?v=1.2',
  '/admin-settings.js?v=1.0',
  '/admin-settings.css?v=1.0',
  '/admin-notifications.js?v=1.0',
  '/visitor-workspace.js?v=1.1',
  '/admin-operations.css?v=1.1',
  '/',
  '/manifest.json',
  '/fonts/fonts.css',
  '/fonts/hoan-5.ttf',
  '/fonts/tinos-Tinos-Regular.ttf',
  '/styles.css?v=2.5',
  '/couture.css?v=143.9',
  '/mobile-admin.css?v=1.6',
  '/scroll-enhancements.js?v=1.4',
  '/mobile-admin.js?v=2.10',
  '/admin-web-push.js?v=1.0',
  '/app.js?v=189.14',
  '/client-bootstrap.js?v=5.23',
  '/app-version.json',
  '/maps-settings.js?v=3.0',
  '/admin-overview.js?v=2.2',
  '/overview-utils.js?v=1.0',
  '/admin-overview.css?v=2.1',
  '/location-experience.css?v=1.9',
  '/admin-location.css?v=1.0',
  '/admin-location.js?v=4.0',
  '/finance-admin.css?v=2.2',
  '/finance-admin.js?v=3.4',
  '/payment-history.js?v=1.0',
  '/admin-readability.css?v=1.0',
  '/vietnam-date.js?v=1.2',
  '/vietnam-date.css?v=1.0',
  '/finance-utils.js?v=2.1',
  '/policy-navigation.css?v=1.0',
  '/policy-navigation.js?v=1.0',
  '/booking-location.js?v=10.4',
  '/location-utils.js?v=6.0',
  '/device-location.js?v=6.4',
  '/location-boundaries.js?v=3.0',
  '/location-boundary-worker.js?v=1.0',
  '/data/vietnam-ward-aliases.json',
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

function pushBookingCode(value) {
  return typeof value === 'string' && /^[A-Z0-9-]{3,80}$/.test(value) ? value : '';
}

self.addEventListener('push', event => {
  let message;
  try { message = event.data?.json(); } catch { message = null; }
  const kind = message?.kind;
  const code = pushBookingCode(message?.code);
  const title = kind === 'booking' ? 'Có lịch đặt mới'
    : kind === 'reminder' ? 'Nhắc lịch làm'
    : kind === 'test' ? 'Thông báo thử từ HOÀN' : 'Thông báo HOÀN';
  const body = kind === 'reminder' ? 'Bạn có lịch làm trong 24 giờ tới.'
    : kind === 'test' ? 'iPhone đã nhận được thông báo từ HOÀN.'
    : 'Mở HOÀN để xem.';
  const shown = self.registration.showNotification(title, {
    body,
    icon: '/assets/hoan-logo.png',
    tag: 'hoan-admin-' + (kind === 'test' ? 'test' : (kind === 'booking' ? 'booking-' : 'reminder-') + code),
    data: { code },
  });
  const refresh = self.clients.matchAll({ type: 'window' }).then(windows => {
    windows.forEach(client => client.postMessage({ type: 'hoan:admin-push' }));
  }).catch(() => {});
  event.waitUntil(Promise.all([shown, refresh]));
});

self.addEventListener('notificationclick', event => {
  if (!event.notification.tag.startsWith('hoan-admin-')) return;
  event.notification.close();
  const code = pushBookingCode(event.notification.data?.code);
  const target = new URL(code ? '/#/admin/appointments?code=' + encodeURIComponent(code) : '/#/admin/notifications',
    self.location.origin);
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const admin = windows.find(client => new URL(client.url).hash.startsWith('#/admin'));
    if (admin) {
      const opened = await admin.navigate(target.href).catch(() => null);
      if (opened) return opened.focus();
    }
    return self.clients.openWindow(target.href);
  })());
});
