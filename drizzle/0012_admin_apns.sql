CREATE TABLE IF NOT EXISTS admin_apns_installations (
  id TEXT PRIMARY KEY NOT NULL,
  generation TEXT NOT NULL,
  session_hash TEXT NOT NULL,
  device_token TEXT NOT NULL,
  environment TEXT NOT NULL CHECK (environment IN ('development', 'production')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE (device_token, environment)
);
CREATE INDEX IF NOT EXISTS admin_apns_installations_generation ON admin_apns_installations(generation);
CREATE INDEX IF NOT EXISTS admin_apns_installations_session ON admin_apns_installations(session_hash);
CREATE TABLE IF NOT EXISTS admin_apns_jobs (
  installation_id TEXT NOT NULL REFERENCES admin_apns_installations(id) ON DELETE CASCADE,
  event_key TEXT NOT NULL,
  appointment_code TEXT NOT NULL,
  next_attempt_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  done INTEGER NOT NULL DEFAULT 0,
  last_status INTEGER,
  last_reason TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (installation_id, event_key)
);
CREATE INDEX IF NOT EXISTS admin_apns_jobs_due ON admin_apns_jobs(done, next_attempt_at);
