import type { Plugin } from "vite";

// Retire previously installed PWA workers, including on LAN/tunnel dev URLs.
export function devServiceWorker(): Plugin {
  return {
    name: "hoan-dev-service-worker",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split("?")[0] !== "/sw.js") return next();
        res.setHeader("Content-Type", "application/javascript");
        res.setHeader("Cache-Control", "no-store");
        res.end(`
          self.addEventListener('install', () => self.skipWaiting());
          self.addEventListener('activate', event => event.waitUntil((async () => {
            const keys = await caches.keys();
            await Promise.all(keys.filter(key => key.startsWith('hoan-makeup-')).map(key => caches.delete(key)));
            await self.registration.unregister();
            const clients = await self.clients.matchAll({ type: 'window' });
            await Promise.all(clients.map(client => client.navigate(client.url)));
          })()));
        `);
      });
    },
  };
}
