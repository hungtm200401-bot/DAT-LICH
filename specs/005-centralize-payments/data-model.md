# Existing Data Model

No schema changes. Appointments link by code to immutable payment_transactions. Net retained amount is receipts minus refunds; remaining is max(total - net, 0). Required deposit is the booking snapshot, falling back to settings, capped by total. A transaction carries kind, method, real amount/time, bank reference, idempotency key and confirmAppointment. The existing trigger confirms only pending appointments after sufficient incoming payment; refunds do not confirm or reopen cancelled records.
