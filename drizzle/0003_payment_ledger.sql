CREATE TABLE IF NOT EXISTS payment_transactions (
  id TEXT PRIMARY KEY NOT NULL,
  appointment_code TEXT NOT NULL REFERENCES appointments(code),
  kind TEXT NOT NULL CHECK(kind IN ('deposit','balance','refund','opening','opening_refund')),
  amount INTEGER NOT NULL CHECK(typeof(amount)='integer' AND amount>0),
  method TEXT NOT NULL CHECK(method IN ('bank','cash','legacy')),
  reference TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  occurred_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  confirm_appointment INTEGER NOT NULL DEFAULT 0 CHECK(confirm_appointment IN (0,1))
);
CREATE INDEX IF NOT EXISTS payment_appointment_idx ON payment_transactions(appointment_code,occurred_at);
CREATE INDEX IF NOT EXISTS payment_occurred_idx ON payment_transactions(occurred_at);
CREATE UNIQUE INDEX IF NOT EXISTS payment_bank_reference_unique ON payment_transactions(lower(trim(reference))) WHERE method='bank' AND reference<>'';

-- Preserve the old cumulative amount once, labelled as an opening balance,
-- without pretending it has a bank reference or a known historical cash date.
INSERT OR IGNORE INTO payment_transactions(id,appointment_code,kind,amount,method,note,occurred_at,created_at,idempotency_key)
SELECT 'OPEN-'||code,code,'opening',deposit,'legacy','Số dư đã ghi nhận trong hệ thống cũ; chưa có chi tiết giao dịch gốc.',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now'),'opening-'||code FROM appointments WHERE deposit>0 AND NOT EXISTS(SELECT 1 FROM site_content WHERE key='finance:ledger-migrated');
INSERT OR IGNORE INTO payment_transactions(id,appointment_code,kind,amount,method,note,occurred_at,created_at,idempotency_key)
SELECT 'OPEN-REFUND-'||a.code,a.code,'opening_refund',t.amount,'legacy','Trạng thái hệ thống cũ: đã hoàn toàn bộ cọc; cần đối chiếu chứng từ gốc.',t.occurred_at,t.created_at,'opening-refund-'||a.code FROM appointments a JOIN payment_transactions t ON t.id='OPEN-'||a.code WHERE a.refund_status='paid' AND NOT EXISTS(SELECT 1 FROM site_content WHERE key='finance:ledger-migrated');
INSERT OR IGNORE INTO site_content(key,value) VALUES('finance:ledger-migrated','true');

CREATE TRIGGER IF NOT EXISTS payment_no_update BEFORE UPDATE ON payment_transactions BEGIN SELECT RAISE(ABORT,'PAYMENT_IMMUTABLE'); END;
CREATE TRIGGER IF NOT EXISTS payment_no_delete BEFORE DELETE ON payment_transactions BEGIN SELECT RAISE(ABORT,'PAYMENT_IMMUTABLE'); END;
CREATE TRIGGER IF NOT EXISTS payment_validate BEFORE INSERT ON payment_transactions
WHEN NEW.kind IN ('deposit','balance','refund')
BEGIN
  SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM appointments WHERE code=NEW.appointment_code) THEN RAISE(ABORT,'PAYMENT_APPOINTMENT_MISSING') END;
  SELECT CASE WHEN NEW.kind<>'refund' AND (SELECT status FROM appointments WHERE code=NEW.appointment_code)='cancelled' THEN RAISE(ABORT,'PAYMENT_CANCELLED') END;
  SELECT CASE WHEN NEW.kind='refund' AND NEW.amount>COALESCE((SELECT SUM(CASE WHEN kind IN ('refund','opening_refund') THEN -amount ELSE amount END) FROM payment_transactions WHERE appointment_code=NEW.appointment_code),0) THEN RAISE(ABORT,'PAYMENT_REFUND_EXCEEDS_RECEIVED') END;
  SELECT CASE WHEN NEW.kind<>'refund' AND NEW.amount+COALESCE((SELECT SUM(CASE WHEN kind IN ('refund','opening_refund') THEN -amount ELSE amount END) FROM payment_transactions WHERE appointment_code=NEW.appointment_code),0)>(SELECT total FROM appointments WHERE code=NEW.appointment_code) THEN RAISE(ABORT,'PAYMENT_EXCEEDS_TOTAL') END;
END;
CREATE TRIGGER IF NOT EXISTS payment_sync_appointment AFTER INSERT ON payment_transactions
WHEN NEW.kind IN ('deposit','balance','refund')
BEGIN
  UPDATE appointments SET
    deposit=(SELECT SUM(CASE WHEN kind IN ('refund','opening_refund') THEN -amount ELSE amount END) FROM payment_transactions WHERE appointment_code=NEW.appointment_code),
    payment_status=CASE WHEN (SELECT SUM(CASE WHEN kind IN ('refund','opening_refund') THEN -amount ELSE amount END) FROM payment_transactions WHERE appointment_code=NEW.appointment_code)>0 THEN 'received' ELSE 'unverified' END,
    refund_status=CASE WHEN NEW.kind='refund' THEN CASE WHEN (SELECT SUM(CASE WHEN kind IN ('refund','opening_refund') THEN -amount ELSE amount END) FROM payment_transactions WHERE appointment_code=NEW.appointment_code)=0 THEN 'paid' ELSE 'partial' END ELSE refund_status END,
    status=CASE WHEN NEW.confirm_appointment=1 AND status='pending' AND NEW.kind<>'refund' AND (SELECT SUM(CASE WHEN kind IN ('refund','opening_refund') THEN -amount ELSE amount END) FROM payment_transactions WHERE appointment_code=NEW.appointment_code)>=MIN(total,COALESCE((SELECT json_extract(value,'$.depositRequired') FROM site_content WHERE key='booking:'||NEW.appointment_code),(SELECT CAST(json_extract(value,'$.deposit') AS INTEGER) FROM site_content WHERE key='settings'),200000)) THEN 'confirmed' ELSE status END,
    updated_at=NEW.created_at
  WHERE code=NEW.appointment_code;
END;
CREATE TRIGGER IF NOT EXISTS payment_preserve_appointment BEFORE DELETE ON appointments WHEN EXISTS(SELECT 1 FROM payment_transactions WHERE appointment_code=OLD.code) BEGIN SELECT RAISE(ABORT,'PAYMENT_HISTORY_EXISTS'); END;
CREATE TRIGGER IF NOT EXISTS payment_total_guard BEFORE UPDATE OF total ON appointments WHEN NEW.total<COALESCE((SELECT SUM(CASE WHEN kind IN ('refund','opening_refund') THEN -amount ELSE amount END) FROM payment_transactions WHERE appointment_code=OLD.code),0) BEGIN SELECT RAISE(ABORT,'PAYMENT_TOTAL_BELOW_RECEIVED'); END;

-- Align the compatibility amount after importing historical paid refunds.
UPDATE appointments SET deposit=COALESCE((SELECT SUM(CASE WHEN kind IN ('refund','opening_refund') THEN -amount ELSE amount END) FROM payment_transactions WHERE appointment_code=appointments.code),0),payment_status=CASE WHEN COALESCE((SELECT SUM(CASE WHEN kind IN ('refund','opening_refund') THEN -amount ELSE amount END) FROM payment_transactions WHERE appointment_code=appointments.code),0)>0 THEN 'received' ELSE payment_status END WHERE EXISTS(SELECT 1 FROM payment_transactions WHERE appointment_code=appointments.code);
