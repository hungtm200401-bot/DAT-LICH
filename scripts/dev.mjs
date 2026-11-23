import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const project = new URL('../', import.meta.url);

function normalizePath(path) {
  const absolute = resolve(path);
  return process.platform === 'win32' ? absolute.toLowerCase() : absolute;
}

async function findRunningServer() {
  try {
    const lock = JSON.parse(await readFile(new URL('.vinext/dev/lock.json', project), 'utf8'));
    if (typeof lock.cwd !== 'string' || normalizePath(lock.cwd) !== normalizePath(fileURLToPath(project))) return;
    if (!Number.isInteger(lock.pid) || lock.pid <= 0) return;
    process.kill(lock.pid, 0);

    const url = new URL(lock.appUrl);
    if (url.protocol !== 'http:' || url.username || url.password ||
        !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) || Number(url.port || 80) !== lock.port) return;

    const versionUrl = 'app-version.json';
    const expected = JSON.parse(await readFile(new URL(`public/${versionUrl}`, project), 'utf8'));
    const response = await fetch(new URL(`/${versionUrl}`, url), {
      cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(2500),
    });
    if (response.ok && typeof expected.build === 'string' && (await response.json()).build === expected.build) {
      return { address: url.origin, pid: lock.pid };
    }
  } catch {
    // Vinext handles missing or stale locks and reports real startup failures.
  }
}

const reuseServer = process.argv.length === 2 && process.env.VINEXT_NO_DEV_LOCK !== '1';
const existing = reuseServer ? await findRunningServer() : undefined;
if (existing) {
  console.log(`HOÀN đang chạy tại ${existing.address} (PID ${existing.pid}).`);
  console.log(`Trang quản trị ${existing.address}/#/admin`);
} else {
  const cli = new URL('./bin/vite.js', import.meta.resolve('vite/package.json'));
  process.argv[1] = fileURLToPath(cli);
  await import(cli.href);
}
