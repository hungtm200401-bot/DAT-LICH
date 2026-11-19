import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';

const analytics = readFileSync(new URL('../drizzle/0001_visit_analytics.sql', import.meta.url), 'utf8');
const migration = readFileSync(new URL('../drizzle/0004_visit_session_codes.sql', import.meta.url), 'utf8');

test('migrates retained visitor sessions in start order and keeps their original journeys', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(analytics);
    const insert = db.prepare(`
      INSERT INTO visit_sessions (id, started_at, last_seen_at, source, landing_page, current_page)
      VALUES (?, ?, ?, 'direct', '/', '/')
    `);
    insert.run('later', '2026-11-19T02:00:00Z', '2026-11-19T02:00:00Z');
    insert.run('earlier', '2026-11-19T01:00:00Z', '2026-11-19T03:00:00Z');
    db.exec(`
      INSERT INTO visit_events (session_id, occurred_at, type, page)
      VALUES ('earlier', '2026-11-19T01:01:00Z', 'pageview', '/services')
    `);

    db.exec(migration);
    db.exec(migration);
    const codes = db.prepare('SELECT session_id, serial FROM visit_session_codes ORDER BY serial');
    assert.deepEqual(codes.all().map(({ session_id, serial }) => [session_id, serial]), [
      ['earlier', 1],
      ['later', 2],
    ]);
    assert.equal(db.prepare("SELECT page FROM visit_events WHERE session_id = 'earlier'").get().page, '/services');

    db.exec("DELETE FROM visit_sessions WHERE id = 'later'");
    insert.run('new', '2026-11-19T04:00:00Z', '2026-11-19T04:00:00Z');
    assert.deepEqual(codes.all().map(({ session_id, serial }) => [session_id, serial]), [
      ['earlier', 1],
      ['new', 3],
    ]);
  } finally {
    db.close();
  }
});
