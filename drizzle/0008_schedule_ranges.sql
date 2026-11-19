ALTER TABLE schedule_slots ADD COLUMN end_time TEXT;

CREATE VIEW IF NOT EXISTS occupied_booking_intervals AS
SELECT a.date AS slot_date, a.code AS appointment_code,
  CAST(substr(a.time, 1, 2) AS INTEGER) * 60 + CAST(substr(a.time, 4, 2) AS INTEGER) AS starts,
  CAST(substr(a.time, 1, 2) AS INTEGER) * 60 + CAST(substr(a.time, 4, 2) AS INTEGER) + COALESCE(s.duration, 90) AS ends
FROM appointments a LEFT JOIN services s ON s.id = a.service_id
WHERE a.archived_at IS NULL AND a.status IN ('pending', 'confirmed')
UNION ALL
SELECT slot_date, NULL,
  CAST(substr(slot_time, 1, 2) AS INTEGER) * 60 + CAST(substr(slot_time, 4, 2) AS INTEGER),
  CASE WHEN end_time IS NULL OR end_time = ''
    THEN CAST(substr(slot_time, 1, 2) AS INTEGER) * 60 + CAST(substr(slot_time, 4, 2) AS INTEGER) + 1
    ELSE CAST(substr(end_time, 1, 2) AS INTEGER) * 60 + CAST(substr(end_time, 4, 2) AS INTEGER)
  END
FROM schedule_slots
WHERE status IN ('blocked', 'break', 'travel');

DROP TRIGGER IF EXISTS protected_booking_insert;
CREATE TRIGGER protected_booking_insert BEFORE INSERT ON appointments
WHEN NEW.archived_at IS NULL AND NEW.status IN ('pending', 'confirmed')
BEGIN
  SELECT CASE WHEN EXISTS (
    SELECT 1 FROM occupied_booking_intervals i WHERE i.slot_date = NEW.date
      AND (substr(NEW.time, 1, 2) * 60 + substr(NEW.time, 4, 2)) < i.ends
      AND (substr(NEW.time, 1, 2) * 60 + substr(NEW.time, 4, 2)
        + COALESCE((SELECT duration FROM services WHERE id = NEW.service_id), 90)) > i.starts
  ) THEN RAISE(ABORT, 'PROTECTED_BOOKING_CONFLICT') END;
END;

DROP TRIGGER IF EXISTS protected_booking_move;
DROP TRIGGER IF EXISTS protected_restore_schedule;
CREATE TRIGGER protected_booking_move BEFORE UPDATE OF date, time, service_id, status, archived_at ON appointments
WHEN NEW.archived_at IS NULL AND NEW.status IN ('pending', 'confirmed')
  AND (OLD.date IS NOT NEW.date OR OLD.time IS NOT NEW.time OR OLD.service_id IS NOT NEW.service_id
    OR OLD.status NOT IN ('pending', 'confirmed') OR OLD.archived_at IS NOT NULL)
BEGIN
  SELECT CASE WHEN EXISTS (
    SELECT 1 FROM occupied_booking_intervals i WHERE i.slot_date = NEW.date
      AND (i.appointment_code IS NULL OR i.appointment_code <> NEW.code)
      AND (substr(NEW.time, 1, 2) * 60 + substr(NEW.time, 4, 2)) < i.ends
      AND (substr(NEW.time, 1, 2) * 60 + substr(NEW.time, 4, 2)
        + COALESCE((SELECT duration FROM services WHERE id = NEW.service_id), 90)) > i.starts
  ) THEN RAISE(ABORT, 'PROTECTED_BOOKING_CONFLICT') END;
END;

DROP TRIGGER IF EXISTS protected_schedule_revision;
CREATE TRIGGER protected_schedule_revision BEFORE UPDATE ON schedule_slots
WHEN OLD.status IS NOT NEW.status OR OLD.note IS NOT NEW.note OR OLD.end_time IS NOT NEW.end_time
BEGIN
  INSERT INTO protected_record_history(entity, entity_key, previous_value)
  VALUES ('schedule', OLD.slot_date || 'T' || OLD.slot_time,
    json_object('status', OLD.status, 'note', OLD.note, 'endTime', OLD.end_time, 'updatedAt', OLD.updated_at));
END;
