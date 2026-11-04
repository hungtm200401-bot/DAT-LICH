# Existing Data
Notifications: id, title/message, type, entityType/entityId, status unread/read, createdAt/readAt stored in site_content. Read mutation sends exactly one id.
Visits: summary total/active/facebook/identified across filter, sessions page with serverTime/activeSince/pageSize. Detail endpoint supplies up to 100 events and supports offset. Data retention 90 days unchanged.
