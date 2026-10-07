ALTER TABLE appointments ADD COLUMN refund_status TEXT NOT NULL DEFAULT 'none';
ALTER TABLE appointments ADD COLUMN refund_note TEXT NOT NULL DEFAULT '';