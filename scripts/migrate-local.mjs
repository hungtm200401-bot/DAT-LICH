import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const projectDirectory = fileURLToPath(new URL('..', import.meta.url));
const wranglerCli = fileURLToPath(new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url));
const baseArgs = [
  wranglerCli, 'd1', 'execute', 'site-creator-d1',
  '--config', 'wrangler.local.json', '--local',
  '--persist-to', '.wrangler/state',
];

function execute(args, capture = false) {
  const result = spawnSync(process.execPath, [...baseArgs, ...args], {
    cwd: projectDirectory,
    encoding: 'utf8',
    stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
  return result.stdout || '';
}

// These migrations are already idempotent because their tables and indexes use
// IF NOT EXISTS, so they remain safe on both fresh and existing local databases.
execute(['--file', 'drizzle/0000_broken_jubilee.sql']);
execute(['--file', 'drizzle/0001_visit_analytics.sql']);

const schema = JSON.parse(execute(['--command', 'PRAGMA table_info(appointments);', '--json'], true));
const columns = new Set((schema[0]?.results || []).map(column => column.name));
const additions = [
  ['refund_status', "ALTER TABLE appointments ADD COLUMN refund_status TEXT NOT NULL DEFAULT 'none';"],
  ['refund_note', "ALTER TABLE appointments ADD COLUMN refund_note TEXT NOT NULL DEFAULT '';"],
];

for (const [name, sql] of additions) {
  if (columns.has(name)) {
    console.log(`Local migration: ${name} already exists, skipping.`);
  } else {
    execute(['--command', sql]);
    console.log(`Local migration: added ${name}.`);
  }
}

execute(['--file', 'drizzle/0003_payment_ledger.sql']);
execute(['--file', 'drizzle/0004_visit_session_codes.sql']);

const visitSchema = JSON.parse(execute(['--command', 'PRAGMA table_info(visit_sessions);', '--json'], true));
if (!visitSchema[0]?.results?.some(column => column.name === 'left_at')) {
  execute(['--file', 'drizzle/0005_visit_departure.sql']);
}

if (!columns.has('archived_at')) {
  execute(['--file', 'drizzle/0006_protect_business_data.sql']);
}
const scheduleSchema = JSON.parse(execute(['--command', 'PRAGMA table_info(schedule_slots);', '--json'], true));
if (!scheduleSchema[0]?.results?.some(column => column.name === 'end_time')) {
  execute(['--file', 'drizzle/0007_booking_commit_guard.sql']);
  execute(['--file', 'drizzle/0008_schedule_ranges.sql']);
}
execute(['--file', 'drizzle/0009_booking_sms_verification.sql']);
execute(['--file', 'drizzle/0010_booking_google_recovery.sql']);
