CREATE TRIGGER IF NOT EXISTS protected_booking_insert
BEFORE INSERT ON appointments
WHEN NEW.archived_at IS NULL AND NEW.status IN ('pending', 'confirmed')
BEGIN
  SELECT CASE WHEN EXISTS (
    SELECT 1 FROM appointments a LEFT JOIN services s ON s.id = a.service_id
    WHERE a.archived_at IS NULL AND a.date = NEW.date AND a.status IN ('pending', 'confirmed')
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
  ) THEN RAISE(ABORT, 'PROTECTED_BOOKING_CONFLICT') END;
END;

CREATE TRIGGER IF NOT EXISTS protected_booking_move
BEFORE UPDATE OF date, time, service_id, status ON appointments
WHEN NEW.archived_at IS NULL AND NEW.status IN ('pending', 'confirmed')
  AND (OLD.date IS NOT NEW.date OR OLD.time IS NOT NEW.time OR OLD.service_id IS NOT NEW.service_id
    OR OLD.status NOT IN ('pending', 'confirmed'))
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
  ) THEN RAISE(ABORT, 'PROTECTED_BOOKING_CONFLICT') END;
END;

CREATE TRIGGER IF NOT EXISTS protected_archive_pending_payment
BEFORE UPDATE OF archived_at ON appointments
WHEN NEW.archived_at IS NOT NULL AND OLD.payment_status = 'pending_verification'
BEGIN SELECT RAISE(ABORT, 'PAYMENT_HISTORY_EXISTS'); END;
