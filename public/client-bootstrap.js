(() => {
  const initialBuild = window.__hoanAppBuild || (window.state ? 'legacy' : document.querySelector('meta[name="hoan-build"]')?.content);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  const ownWorker = worker => worker && new URL(worker.scriptURL).pathname === '/sw.js';
  async function retireDevelopmentCache() {
    if (!local || !('serviceWorker' in navigator)) return;
    const registrations = await navigator.serviceWorker.getRegistrations();
    const own = registrations.filter(registration => [registration.active, registration.waiting, registration.installing].some(ownWorker));
    if (!own.length && !ownWorker(navigator.serviceWorker.controller)) return;
    await Promise.all(own.map(registration => registration.update().catch(() => {})));
    await Promise.all(own.map(registration => registration.unregister()));
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('hoan-makeup-')).map(key => caches.delete(key)));
    const guard = 'hoan-development-cache-retired-location-auto-fill-1';
    if (ownWorker(navigator.serviceWorker.controller) && !sessionStorage.getItem(guard)) {
      sessionStorage.setItem(guard, '1');
      const url = new URL(location.href); url.searchParams.set('_hoan_update', 'location-auto-fill-1');
      location.replace(url.href);
    }
  }
  let checking = false;
  async function checkVersion() {
    if (checking || document.hidden || location.hash.startsWith('#/admin')) return;
    checking = true;
    try {
      const response = await fetch('/app-version.json', { cache: 'no-store' });
      if (!response.ok) return;
      const latest = await response.json();
      const current = window.__hoanAppBuild || initialBuild;
      const guard = 'hoan-build-reloaded-' + latest.build;
      if (current && latest.build !== current && !sessionStorage.getItem(guard)) {
        sessionStorage.setItem(guard, '1');
        const url = new URL(location.href); url.searchParams.set('_hoan_update', latest.build);
        location.replace(url.href);
      }
    } catch { /* The current form remains usable while offline. */ }
    finally { checking = false; }
  }
  retireDevelopmentCache().catch(() => {});
  window.addEventListener('focus', checkVersion);
  document.addEventListener('visibilitychange', checkVersion);
  window.addEventListener('load', checkVersion, { once: true });
  checkVersion();
})();
