import { readFileSync } from "node:fs";
import type { Plugin } from "vite";

function currentBuildTag(): string {
  try {
    const parsed = JSON.parse(readFileSync(new URL("../public/app-version.json", import.meta.url), "utf8"));
    return typeof parsed?.build === "string" && parsed.build.trim() ? parsed.build.trim() : "dev-retired";
  } catch {
    return "dev-retired";
  }
}

// Retire previously installed PWA workers, including on LAN/tunnel dev URLs.
export function devServiceWorker(): Plugin {
  return {
    name: "hoan-dev-service-worker",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (/\.(?:js|css|json)(?:\?|$)/.test(req.url || "") || req.headers.accept?.includes("text/html")) res.setHeader("Cache-Control", "no-store");
        if (req.url?.split("?")[0] !== "/sw.js") return next();
        const buildTag = JSON.stringify(currentBuildTag());
        res.setHeader("Content-Type", "application/javascript");
        res.setHeader("Cache-Control", "no-store");
        res.end(`
          self.addEventListener('install', () => self.skipWaiting());
          self.addEventListener('activate', event => event.waitUntil((async () => {
            await self.clients.claim();
            const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
            const keys = await caches.keys();
            await Promise.all(keys.filter(key => key.startsWith('hoan-makeup-')).map(key => caches.delete(key)));
            await self.registration.unregister();
            await Promise.all(clients.filter(client => new URL(client.url).hash.startsWith('#/booking/')).map(client => {
              const url = new URL(client.url);
              url.searchParams.set('_hoan_update', ${buildTag});
              return client.navigate(url.href);
            }));
          })()));
        `);
      });
    },
  };
}
