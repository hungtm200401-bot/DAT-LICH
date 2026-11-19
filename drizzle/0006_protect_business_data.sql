ALTER TABLE appointments ADD COLUMN archived_at TEXT;

CREATE INDEX IF NOT EXISTS appointments_archive_date ON appointments(archived_at, date);

CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT PRIMARY KEY NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS admin_sessions_expiry ON admin_sessions(expires_at);

CREATE TABLE IF NOT EXISTS sensitive_request_limits (
  scope TEXT NOT NULL,
  client_hash TEXT NOT NULL,
  window_end INTEGER NOT NULL,
  attempts INTEGER NOT NULL,
  PRIMARY KEY (scope, client_hash)
);
CREATE INDEX IF NOT EXISTS sensitive_request_expiry ON sensitive_request_limits(window_end);

CREATE TABLE IF NOT EXISTS protected_record_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity TEXT NOT NULL,
  entity_key TEXT NOT NULL,
  previous_value TEXT NOT NULL,
  recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS protected_record_lookup ON protected_record_history(entity, entity_key, id);

CREATE TRIGGER IF NOT EXISTS protected_history_no_delete BEFORE DELETE ON protected_record_history
BEGIN SELECT RAISE(ABORT, 'PROTECTED_RECORD_HISTORY'); END;
CREATE TRIGGER IF NOT EXISTS protected_history_no_update BEFORE UPDATE ON protected_record_history
BEGIN SELECT RAISE(ABORT, 'PROTECTED_RECORD_HISTORY'); END;

CREATE TRIGGER IF NOT EXISTS protected_appointment_no_delete BEFORE DELETE ON appointments
BEGIN SELECT RAISE(ABORT, 'PROTECTED_BUSINESS_RECORD'); END;
CREATE TRIGGER IF NOT EXISTS protected_customer_no_delete BEFORE DELETE ON customers
BEGIN SELECT RAISE(ABORT, 'PROTECTED_BUSINESS_RECORD'); END;
CREATE TRIGGER IF NOT EXISTS protected_schedule_no_delete BEFORE DELETE ON schedule_slots
BEGIN SELECT RAISE(ABORT, 'PROTECTED_BUSINESS_RECORD'); END;
CREATE TRIGGER IF NOT EXISTS protected_business_content_no_delete BEFORE DELETE ON site_content
WHEN OLD.key GLOB 'booking:*' OR OLD.key GLOB 'request:*' OR OLD.key IN ('settings', 'brand')
BEGIN SELECT RAISE(ABORT, 'PROTECTED_BUSINESS_RECORD'); END;

CREATE TRIGGER IF NOT EXISTS protected_appointment_revision BEFORE UPDATE ON appointments
WHEN OLD.date IS NOT NEW.date OR OLD.time IS NOT NEW.time OR OLD.service_id IS NOT NEW.service_id
  OR OLD.customer IS NOT NEW.customer OR OLD.phone IS NOT NEW.phone OR OLD.email IS NOT NEW.email
  OR OLD.address IS NOT NEW.address OR OLD.district IS NOT NEW.district OR OLD.ward IS NOT NEW.ward
  OR OLD.note IS NOT NEW.note OR OLD.style IS NOT NEW.style OR OLD.total IS NOT NEW.total
  OR OLD.deposit IS NOT NEW.deposit OR OLD.payment_status IS NOT NEW.payment_status
  OR OLD.refund_status IS NOT NEW.refund_status OR OLD.refund_note IS NOT NEW.refund_note
  OR OLD.status IS NOT NEW.status OR OLD.archived_at IS NOT NEW.archived_at
BEGIN
  INSERT INTO protected_record_history(entity, entity_key, previous_value)
  VALUES ('appointment', OLD.code, json_patch(
    json_object('date', OLD.date, 'time', OLD.time, 'serviceId', OLD.service_id, 'status', OLD.status,
      'customer', OLD.customer, 'phone', OLD.phone, 'email', OLD.email,
      'address', OLD.address, 'district', OLD.district, 'ward', OLD.ward, 'note', OLD.note),
    json_object('locationType', OLD.location_type, 'style', OLD.style, 'total', OLD.total, 'deposit', OLD.deposit,
      'paymentStatus', OLD.payment_status, 'refundStatus', OLD.refund_status, 'refundNote', OLD.refund_note,
      'archivedAt', COALESCE(OLD.archived_at, ''), 'updatedAt', OLD.updated_at)));
END;
CREATE TRIGGER IF NOT EXISTS protected_customer_revision BEFORE UPDATE ON customers
WHEN OLD.phone IS NOT NEW.phone OR OLD.name IS NOT NEW.name OR OLD.email IS NOT NEW.email OR OLD.note IS NOT NEW.note
BEGIN
  INSERT INTO protected_record_history(entity, entity_key, previous_value)
  VALUES ('customer', CAST(OLD.id AS TEXT), json_object('name', OLD.name, 'phone', OLD.phone, 'email', OLD.email, 'note', OLD.note));
END;
CREATE TRIGGER IF NOT EXISTS protected_schedule_revision BEFORE UPDATE ON schedule_slots
WHEN OLD.status IS NOT NEW.status OR OLD.note IS NOT NEW.note
BEGIN
  INSERT INTO protected_record_history(entity, entity_key, previous_value)
  VALUES ('schedule', OLD.slot_date || 'T' || OLD.slot_time, json_object('status', OLD.status, 'note', OLD.note, 'updatedAt', OLD.updated_at));
END;
CREATE TRIGGER IF NOT EXISTS protected_content_revision BEFORE UPDATE ON site_content
WHEN OLD.value IS NOT NEW.value AND (OLD.key GLOB 'booking:*' OR OLD.key GLOB 'request:*' OR OLD.key IN ('settings', 'brand'))
BEGIN
  INSERT INTO protected_record_history(entity, entity_key, previous_value) VALUES ('content', OLD.key, OLD.value);
END;

CREATE TRIGGER IF NOT EXISTS protected_archive_paid BEFORE UPDATE OF archived_at ON appointments
WHEN NEW.archived_at IS NOT NULL AND (
  OLD.deposit > 0 OR EXISTS (SELECT 1 FROM payment_transactions WHERE appointment_code = OLD.code)
)
BEGIN SELECT RAISE(ABORT, 'PAYMENT_HISTORY_EXISTS'); END;

CREATE TRIGGER IF NOT EXISTS protected_archived_payment BEFORE INSERT ON payment_transactions
WHEN EXISTS (SELECT 1 FROM appointments WHERE code = NEW.appointment_code AND archived_at IS NOT NULL)
BEGIN SELECT RAISE(ABORT, 'PROTECTED_ARCHIVED_APPOINTMENT'); END;

CREATE TRIGGER IF NOT EXISTS protected_restore_schedule BEFORE UPDATE OF archived_at ON appointments
WHEN OLD.archived_at IS NOT NULL AND NEW.archived_at IS NULL AND NEW.status IN ('pending', 'confirmed')
BEGIN
  SELECT CASE WHEN EXISTS (
    SELECT 1 FROM appointments a LEFT JOIN services s ON s.id = a.service_id
    WHERE a.code <> NEW.code AND a.archived_at IS NULL AND a.date = NEW.date AND a.status IN ('pending', 'confirmed')
      AND (substr(NEW.time, 1, 2) * 60 + substr(NEW.time, 4, 2)) <
        (substr(a.time, 1, 2) * 60 + substr(a.time, 4, 2) + COALESCE(s.duration, 90))
      AND (substr(NEW.time, 1, 2) * 60 + substr(NEW.time, 4, 2) + COALESCE((SELECT duration FROM services WHERE id = NEW.service_id), 90)) >
        (substr(a.time, 1, 2) * 60 + substr(a.time, 4, 2))
  ) OR EXISTS (
    SELECT 1 FROM schedule_slots slot
    WHERE slot.slot_date = NEW.date AND slot.status = 'blocked'
      AND slot.slot_time >= NEW.time
      AND (substr(slot.slot_time, 1, 2) * 60 + substr(slot.slot_time, 4, 2)) <
        (substr(NEW.time, 1, 2) * 60 + substr(NEW.time, 4, 2) + COALESCE((SELECT duration FROM services WHERE id = NEW.service_id), 90))
  ) THEN RAISE(ABORT, 'PROTECTED_RESTORE_CONFLICT') END;
END;
