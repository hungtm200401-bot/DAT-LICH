# Contracts
- Admin operations: missing/wrong/absent-server key => 401, on localhost as well. Foreign Origin denied even with valid key. GET /api/data returns public scheduling data or authorized snapshot. UI verifies snapshot before entering admin.
- createRequest: consultation requires name/phone/subject/message; linked booking additionally requires matching code+phone unless admin. Unknown/mismatched linked booking => generic404; no writes. Receipt => request:{id,status}, no owner PII.
- createAppointment: malformed JSON/schema/date/time/window =>400. Past/conflicting/closed slot stays controlled error. Date window inclusive using Vietnam calendar; admin follows same default window. Server owns price/deposit/status.
- Upload: unsupported/mismatched/truncated/oversized dimensions/content =>400 before R2 writes. Correct JPEG/PNG/WebP succeeds with verified MIME.
- HTML responses: nosniff, same-origin referrer, frame restrictions allow only self. No HSTS promise without HTTPS hosting.
