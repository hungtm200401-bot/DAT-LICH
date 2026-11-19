# Existing Data
Notifications: id, title/message, type, entityType/entityId, status unread/read, createdAt/readAt stored in site_content. Read mutation sends exactly one id.
Visits: summary total/active/facebook/identified across filter, sessions page with serverTime/activeSince/pageSize. Detail endpoint supplies up to 100 events and supports offset. The session UUID links events and a unique serial in `visit_session_codes`. The serial formats as `HMA-000001` and continues increasing after deletion. Deleting a session removes its serial association. Retention is 90 days.

After migration 0005, `left_at` stores the time the tracker received the departure signal. Activity in the same session clears that field. `started_at` records the start and `last_event_at` identifies the most recent saved event when the session has no reliable departure time.
