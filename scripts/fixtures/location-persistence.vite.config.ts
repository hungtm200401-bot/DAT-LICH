import { defineConfig } from 'vite';
import vinext from 'vinext';
import { cloudflare } from '@cloudflare/vite-plugin';

if (!process.env.HOAN_LOCATION_TEST_STATE) throw new Error('An isolated test state directory is required.');
export default defineConfig({
  // Keep optimized dependencies under node_modules so CommonJS transforms do
  // not process them a second time; use a cache separate from the running app.
  cacheDir: 'node_modules/.vite-location-persistence',
  plugins: [vinext(), cloudflare({
    configPath: 'wrangler.local.json',
    persistState: { path: process.env.HOAN_LOCATION_TEST_STATE },
    viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
    inspectorPort: false,
    config: { vars: { HOAN_LOCAL_DEV: '1' } },
  })],
  server: { host: '127.0.0.1', port: 5197, strictPort: true },
});
