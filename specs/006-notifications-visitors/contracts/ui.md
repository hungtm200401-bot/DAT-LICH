# Contracts
- Checkbox sends POST /api/data {action:markNotificationsRead,id}. No optimistic decrement; failures restore unchecked. Concurrent reads use live state after completion.
- GET /api/visits?days=7&source=&active=0&offset=0; list pagination based on summary.total/pageSize.
- GET /api/visits?session=ID&offset=0; detail next page increments 100.
- CSV explicitly exports displayed list, not undisplayed records. Source strings, names, URLs and event content escaped.
- No tracker writes from admin screens. No mark-all buttons.
