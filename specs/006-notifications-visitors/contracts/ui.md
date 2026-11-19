# Contracts
- Checkbox sends POST /api/data {action:markNotificationsRead,id}. No optimistic decrement; failures restore unchecked. Concurrent reads use live state after completion.
- GET /api/visits?days=7&source=&active=0&offset=0; list pagination based on summary.total/pageSize. Each session includes `session_code`, the displayed and searchable `HMA-` code.
- A session is active within the server's `activeSince` window when `left_at` is empty. When the departure time is unavailable, the UI uses the latest saved timestamp across `started_at`, `last_event_at`, and `last_seen_at`. If the session has recorded activity and no timestamp beyond the start second, the UI marks the last timestamp as unavailable.
- GET /api/visits?session=ID&offset=0; detail next page increments 100.
- CSV exports the displayed list and uses `session_code` in the “Mã phiên” column. Source strings, names, URLs and event content escaped.
- No tracker writes from admin screens. No mark-all buttons.
