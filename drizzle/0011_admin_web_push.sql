CREATE TABLE IF NOT EXISTS admin_push_subscriptions (
  id TEXT PRIMARY KEY NOT NULL,
  generation TEXT NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS admin_push_subscriptions_generation
  ON admin_push_subscriptions(generation);

CREATE TABLE IF NOT EXISTS admin_push_jobs (
  subscription_id TEXT NOT NULL REFERENCES admin_push_subscriptions(id) ON DELETE CASCADE,
  event_key TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('booking', 'reminder')),
  appointment_code TEXT NOT NULL,
  starts_at INTEGER,
  next_attempt_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  done INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (subscription_id, event_key)
);

CREATE INDEX IF NOT EXISTS admin_push_jobs_due
  ON admin_push_jobs(done, next_attempt_at);
