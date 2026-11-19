import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { mkdir, mkdtemp, readFile, readdir, rmdir, unlink, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import * as sqlite from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const storage = resolve(root, '.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
const output = resolve(root, '.wrangler/recovery-backups');
const keyPath = resolve(root, '.wrangler/recovery-key.bin');
const signature = Buffer.from('HOAN-D1-1\n');
const tables = ['appointments', 'customers', 'schedule_slots', 'payment_transactions', 'site_content'];
const { DatabaseSync } = sqlite;

async function findDatabase() {
  const files = (await readdir(storage)).filter(name => /^[a-f0-9]{64}\.sqlite$/i.test(name));
  const matches = [];
  for (const file of files) {
    const path = resolve(storage, file);
    const database = new DatabaseSync(path, { readOnly: true });
    try {
      const names = new Set(database.prepare("SELECT name FROM sqlite_schema WHERE type = 'table'").all().map(row => row.name));
      if (tables.every(name => names.has(name))) matches.push(path);
    } finally {
      database.close();
    }
  }
  if (matches.length !== 1) throw new Error('Cần đúng một cơ sở dữ liệu D1 nghiệp vụ local để sao lưu.');
  return matches[0];
}

async function readKey(create = false) {
  try {
    const key = await readFile(keyPath);
    if (key.length !== 32) throw new Error('Tệp khóa sao lưu không hợp lệ.');
    return key;
  } catch (error) {
    if (!create || error.code !== 'ENOENT') throw error;
    // Losing a key must not silently start a new series of unrelated backups.
    if ((await readdir(output)).some(file => file.endsWith('.enc'))) {
      throw new Error('Thiếu khóa của bản sao lưu hiện có.');
    }
    const key = randomBytes(32);
    await writeFile(keyPath, key, { mode: 0o600, flag: 'wx' });
    return key;
  }
}

function seal(content, key) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(signature);
  const payload = Buffer.concat([cipher.update(content), cipher.final()]);
  return Buffer.concat([signature, iv, cipher.getAuthTag(), payload]);
}

function unseal(bytes, key) {
  if (!bytes.subarray(0, signature.length).equals(signature) || bytes.length <= signature.length + 28) {
    throw new Error('Định dạng bản sao lưu không hợp lệ.');
  }
  const offset = signature.length;
  const decipher = createDecipheriv('aes-256-gcm', key, bytes.subarray(offset, offset + 12));
  decipher.setAAD(signature);
  decipher.setAuthTag(bytes.subarray(offset + 12, offset + 28));
  return Buffer.concat([decipher.update(bytes.subarray(offset + 28)), decipher.final()]);
}

function inspect(path) {
  const database = new DatabaseSync(path, { readOnly: true });
  try {
    const integrity = database.prepare('PRAGMA integrity_check').get().integrity_check;
    if (integrity !== 'ok' || database.prepare('PRAGMA foreign_key_check').get()) {
      throw new Error('Không xác nhận được tính toàn vẹn của bản sao lưu.');
    }
    return Object.fromEntries(tables.map(table => [table, database.prepare(`SELECT COUNT(*) AS rows FROM ${table}`).get().rows]));
  } finally {
    database.close();
  }
}

async function withScratch(run) {
  const directory = await mkdtemp(resolve(root, '.wrangler/backup-check-'));
  const snapshot = resolve(directory, 'snapshot.sqlite');
  const verified = resolve(directory, 'verified.sqlite');
  try {
    return await run(snapshot, verified);
  } finally {
    for (const database of [snapshot, verified]) {
      for (const suffix of ['', '-wal', '-shm', '-journal']) {
        await unlink(database + suffix).catch(error => { if (error.code !== 'ENOENT') throw error; });
      }
    }
    await rmdir(directory);
  }
}

async function main() {
  const [command = 'backup', filename] = process.argv.slice(2);
  if (command === 'backup') {
    const source = await findDatabase();
    await mkdir(output, { recursive: true, mode: 0o700 });
    const key = await readKey(true);
    const target = resolve(output, 'hoan-' + new Date().toISOString().replace(/[:.]/g, '-') + '.sqlite.enc');
    await withScratch(async (snapshot, verified) => {
      const db = new DatabaseSync(source, { readOnly: true });
      try {
        if (typeof sqlite.backup === 'function') await sqlite.backup(db, snapshot);
        else db.prepare('VACUUM INTO ?').run(snapshot);
      } finally { db.close(); }
      const expected = inspect(snapshot);
      const encrypted = seal(await readFile(snapshot), key);
      await writeFile(verified, unseal(encrypted, key), { mode: 0o600, flag: 'wx' });
      const actual = inspect(verified);
      if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error('Số bản ghi thay đổi khi kiểm tra sao lưu.');
      await writeFile(target, encrypted, { mode: 0o600, flag: 'wx' });
    });
    console.log('Đã sao lưu và kiểm tra giải mã:', target);
    return;
  }
  if (!['verify', 'restore-copy'].includes(command) || !filename || basename(filename) !== filename || !/^hoan-[0-9TZ-]+\.sqlite\.enc$/.test(filename)) {
    throw new Error('Dùng backup, verify <tệp>, hoặc restore-copy <tệp>.');
  }
  const bytes = await readFile(resolve(output, filename));
  const key = await readKey();
  await withScratch(async (_, verified) => {
    const decrypted = unseal(bytes, key);
    await writeFile(verified, decrypted, { mode: 0o600, flag: 'wx' });
    inspect(verified);
    if (command === 'restore-copy') {
      const restoreDirectory = resolve(root, '.wrangler/recovery-restored');
      await mkdir(restoreDirectory, { recursive: true, mode: 0o700 });
      const restored = resolve(restoreDirectory, filename.replace(/\.enc$/, ''));
      await writeFile(restored, decrypted, { mode: 0o600, flag: 'wx' });
      console.log('Đã tạo bản phục hồi riêng:', restored);
      return;
    }
    console.log('Bản sao lưu giải mã và kiểm tra toàn vẹn thành công.');
  });
}

await main().catch(error => { console.error(error.message); process.exitCode = 1; });
