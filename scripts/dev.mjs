import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dataSourceMode, ONLINE_ORIGIN } from '../build/shared-online-data.mjs';

const project = new URL('../', import.meta.url);

const localFlag = process.argv.indexOf('--local');
if (localFlag >= 0) process.argv.splice(localFlag, 1);
const source = dataSourceMode(localFlag >= 0 ? 'local' : process.env.HOAN_DATA_SOURCE || 'online');
process.env.HOAN_DATA_SOURCE = source;
console.log(source === 'online'
  ? 'Dữ liệu ONLINE dùng chung với app iPhone. Đăng nhập bằng mật khẩu quản trị online.'
  : 'Bản thử nghiệm LOCAL: dữ liệu riêng trên máy, không phải dữ liệu app iPhone.');
console.log(`Máy chủ online: ${ONLINE_ORIGIN}`);

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
      let runtime;
      try {
        const descriptor = await fetch(new URL('/__hoan/runtime', url), { cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(2500) });
        if (descriptor.ok) runtime = await descriptor.json();
      } catch { /* An older server cannot be assumed to use the selected source. */ }
      return { address: url.origin, pid: lock.pid, mode: runtime?.mode,
        compatible: runtime?.version === 1 && runtime.mode === source && runtime.origin === (source === 'online' ? ONLINE_ORIGIN : null) };
    }
  } catch {
    // Vinext handles missing or stale locks and reports real startup failures.
  }
}

const reuseServer = process.argv.length === 2 && process.env.VINEXT_NO_DEV_LOCK !== '1';
const existing = reuseServer ? await findRunningServer() : undefined;
if (existing) {
  if (!existing.compatible) {
    console.error(`Máy chủ ${existing.address} (PID ${existing.pid}) đang dùng nguồn ${existing.mode || 'chưa xác định'}.`);
    console.error('Dừng máy chủ cũ trong terminal đang chạy, rồi chạy lại lệnh này để đổi nguồn dữ liệu.');
    process.exitCode = 1;
  } else {
    console.log(`HOÀN đang chạy tại ${existing.address} (PID ${existing.pid}).`);
    console.log(`Trang quản trị ${existing.address}/#/admin`);
  }
} else {
  const cli = new URL('./bin/vite.js', import.meta.resolve('vite/package.json'));
  process.argv[1] = fileURLToPath(cli);
  await import(cli.href);
}
