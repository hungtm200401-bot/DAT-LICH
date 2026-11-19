# Data Model
Read-only snapshot from the existing API: appointments(code,date,time,status,serviceId,deposit,
paymentStatus,refundStatus,finance), services(id,name), paymentTransactions(id,appointmentCode,
kind,amount,occurredAt,createdAt), requests(id,code,subject,status), notifications(id,title,message,
entityType,entityId,createdAt,status). Build an ephemeral summary; never store derived totals.
Cash kinds deposit/balance add, refund subtracts; opening/opening_refund remain historical.
Open requests have pending/in_progress or absent status. Reschedule requires a booking code
and a subject matching the existing Vietnamese reschedule labels or reschedule. Cancelled bookings do not await income
reconciliation; their retained money belongs to the refund queue unless refund was rejected.
