# UI and API Contracts

- Canonical workspace: #/admin/payments; ?q=CODE shows that booking regardless of attention status. Existing status/month links remain supported.
- Outside this workspace, open(code, kind) navigates to the workspace without recording or opening a local payment dialog.
- recordPayment request and response unchanged. UI sends confirmAppointment=true for income on a pending booking; the database controls whether its threshold has been met.
- Preserve idempotency key and the exact submitted payload on uncertain failures. Lock fields until the original request has a definite outcome.
- On success update state, close dialog, then refresh; a later refresh failure cannot report the committed payment as failed.
- Transfer requires a bank reference. Cash may omit reference. Refund requires a reason and cannot exceed retained money.
