CREATE TABLE IF NOT EXISTS booking_google_challenges (
  ticket_hash TEXT PRIMARY KEY NOT NULL,
  origin TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('link', 'recovery')),
  appointment_code TEXT REFERENCES appointments(code),
  phone_snapshot TEXT,
  expires_at INTEGER NOT NULL,
  CHECK ((purpose = 'link' AND appointment_code IS NOT NULL AND phone_snapshot IS NOT NULL)
    OR (purpose = 'recovery' AND appointment_code IS NULL AND phone_snapshot IS NULL))
);
CREATE INDEX IF NOT EXISTS booking_google_challenges_expiry ON booking_google_challenges(expires_at);
CREATE INDEX IF NOT EXISTS booking_google_challenges_appointment ON booking_google_challenges(appointment_code);

CREATE TABLE IF NOT EXISTS booking_google_links (
  appointment_code TEXT PRIMARY KEY NOT NULL REFERENCES appointments(code),
  subject_key TEXT NOT NULL,
  linked_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS booking_google_links_subject ON booking_google_links(subject_key);

CREATE TRIGGER IF NOT EXISTS revoke_booking_google_link
AFTER UPDATE OF phone ON appointments
WHEN OLD.phone IS NOT NEW.phone
BEGIN
  DELETE FROM booking_google_links WHERE appointment_code = NEW.code;
  DELETE FROM booking_google_challenges WHERE appointment_code = NEW.code;
END;
