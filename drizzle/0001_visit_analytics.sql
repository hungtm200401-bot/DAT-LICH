CREATE TABLE IF NOT EXISTS visit_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  started_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  source TEXT NOT NULL,
  medium TEXT NOT NULL DEFAULT '',
  campaign TEXT NOT NULL DEFAULT '',
  referrer TEXT NOT NULL DEFAULT '',
  device TEXT NOT NULL DEFAULT '',
  browser TEXT NOT NULL DEFAULT '',
  landing_page TEXT NOT NULL,
  current_page TEXT NOT NULL,
  active_seconds INTEGER NOT NULL DEFAULT 0,
  display_name TEXT NOT NULL DEFAULT '',
  facebook_url TEXT NOT NULL DEFAULT '',
  declared_purpose TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS visit_sessions_seen ON visit_sessions(last_seen_at);
CREATE INDEX IF NOT EXISTS visit_sessions_source ON visit_sessions(source, started_at);
CREATE TABLE IF NOT EXISTS visit_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  type TEXT NOT NULL,
  page TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS visit_events_session ON visit_events(session_id, id);
