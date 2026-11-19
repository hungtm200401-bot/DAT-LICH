CREATE TABLE IF NOT EXISTS booking_sms_challenges (
  ticket_hash TEXT PRIMARY KEY NOT NULL,
  phone TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('booking', 'recovery')),
  verification_sid TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  state TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'checking', 'approved'))
);
CREATE INDEX IF NOT EXISTS booking_sms_challenges_expiry ON booking_sms_challenges(expires_at);

CREATE TABLE IF NOT EXISTS booking_verified_phones (
  appointment_code TEXT PRIMARY KEY NOT NULL REFERENCES appointments(code),
  phone TEXT NOT NULL,
  verified_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS booking_verified_phones_phone ON booking_verified_phones(phone);

CREATE TRIGGER IF NOT EXISTS revoke_booking_phone_verification
AFTER UPDATE OF phone ON appointments
WHEN OLD.phone IS NOT NEW.phone
BEGIN
  DELETE FROM booking_verified_phones WHERE appointment_code = NEW.code;
END;
