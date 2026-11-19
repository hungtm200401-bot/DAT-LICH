(() => {
  const win = /** @type {Window & typeof globalThis & { __hoanAppBuild?: string; state?: unknown }} */ (window);
  const readMetaBuild = () => document.querySelector('meta[name="hoan-build"]')?.getAttribute('content') || '';
  const initialBuild = win.__hoanAppBuild || (win.state ? 'legacy' : readMetaBuild());
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  /** @type {Set<string>} */
  const memoryGuards = new Set();
  /** @param {string} key */
  const hasGuard = key => {
    try { return Boolean(sessionStorage.getItem(key)); }
    catch { return memoryGuards.has(key); }
  };
  /** @param {string} key */
  const markGuard = key => {
    try { sessionStorage.setItem(key, '1'); }
    catch { memoryGuards.add(key); }
  };
  /** @param {ServiceWorker | null | undefined} worker */
  const ownWorker = worker => {
    try { return Boolean(worker?.scriptURL && new URL(worker.scriptURL, location.origin).pathname === '/sw.js'); }
    catch { return false; }
  };
  async function retireDevelopmentCache() {
    if (!local || !('serviceWorker' in navigator)) return;
    const registrations = await navigator.serviceWorker.getRegistrations();
    const own = registrations.filter(registration => [registration.active, registration.waiting, registration.installing].some(ownWorker));
    if (!own.length && !ownWorker(navigator.serviceWorker.controller)) return;
    await Promise.all(own.map(registration => registration.update().catch(() => {})));
    await Promise.all(own.map(registration => registration.unregister()));
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.filter(key => key.startsWith('hoan-makeup-')).map(key => caches.delete(key)));
    }
    const targetBuild = win.__hoanAppBuild || readMetaBuild() || initialBuild || 'current';
    const guard = 'hoan-development-cache-retired-' + targetBuild;
    if (ownWorker(navigator.serviceWorker.controller) && !hasGuard(guard)) {
      markGuard(guard);
      const url = new URL(location.href);
      url.searchParams.set('_hoan_update', targetBuild);
      location.replace(url.href);
    }
  }
  let checking = false;
  let startupChecks = 0;
  const isEditingControl = () => {
    if (document.querySelector('.modal, dialog[open]')) return true;
    const active = document.activeElement;
    return Boolean(active && typeof active.matches === 'function' && active.matches('input, textarea, select, [contenteditable="true"]'));
  };
  const safeToReload = () => {
    if (document.hidden || isEditingControl()) return false;
    if (!location.hash.startsWith('#/admin')) return true;
    // An idle overview can recover stale scripts/styles. Editing screens and
    // open forms must keep their current state until the user leaves them.
    const path = location.hash.split('?')[0].replace(/\/$/, '');
    return path === '#/admin' || path === '#/admin/visitors';
  };
  async function checkVersion() {
    if (checking || !safeToReload()) return;
    checking = true;
    try {
      const response = await fetch('/app-version.json', { cache: 'no-store' });
      if (!response.ok) return;
      const latest = await response.json();
      const latestBuild = typeof latest?.build === 'string' ? latest.build.trim() : '';
      const current = win.__hoanAppBuild || initialBuild || readMetaBuild();
      if (!latestBuild || !current) return;
      const guard = 'hoan-build-reloaded-' + latestBuild;
      if (latestBuild !== current && !hasGuard(guard) && safeToReload()) {
        markGuard(guard);
        const url = new URL(location.href);
        url.searchParams.set('_hoan_update', latestBuild);
        location.replace(url.href);
      }
    } catch { /* The current form remains usable while offline. */ }
    finally {
      checking = false;
      // afterInteractive scripts can start after window.load. Keep the initial
      // version check alive until the application has reported its real build.
      if (!win.__hoanAppBuild && startupChecks++ < 20) setTimeout(checkVersion, 500);
    }
  }
  retireDevelopmentCache().catch(() => {});
  window.addEventListener('focus', checkVersion);
  window.addEventListener('hashchange', checkVersion);
  window.addEventListener('hoan:app-ready', checkVersion);
  document.addEventListener('visibilitychange', checkVersion);
  window.addEventListener('load', checkVersion, { once: true });
  checkVersion();
})();
