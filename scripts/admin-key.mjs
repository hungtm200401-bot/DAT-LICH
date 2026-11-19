import { randomBytes } from 'node:crypto';
import { open, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const path = fileURLToPath(new URL('../.dev.vars', import.meta.url));
if (!process.argv.includes('--init')) {
  console.log('Khởi tạo khóa admin local: node scripts/admin-key.mjs --init. Khóa lưu trong .dev.vars, không in ra terminal.');
} else {
  let source = ''; try { source = await readFile(path, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (/^\s*ADMIN_TOKEN\s*=/m.test(source)) console.log('Đã có ADMIN_TOKEN trong .dev.vars; giữ nguyên khóa hiện tại.');
  else {
    const file = await open(path, 'a', 0o600);
    try { await file.writeFile((source && !source.endsWith('\n') ? '\n' : '') + 'ADMIN_TOKEN=' + randomBytes(32).toString('hex') + '\n'); } finally { await file.close(); }
    console.log('Đã tạo khóa admin local trong .dev.vars. Mở file trên máy để lấy khóa, khởi động lại dev rồi đăng nhập quản trị.');
  }
}
