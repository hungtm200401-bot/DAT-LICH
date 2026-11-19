# UI Contract
- The current overview contains three KPI links, a maximum of five booking rows,
  and positive-count reconciliation/reschedule/refund queues. No charts, service
  breakdown or activity feed are rendered on the overview.
- Appointment links accept date=YYYY-MM-DD, status=pending|confirmed|completed|cancelled,
  service=<id>, q=<text>. Filters compose; reset clears all. Today excludes cancelled.
- Finance links accept status=pending|refund and month=YYYY-MM or empty for all history.
- Finance links also accept q=<text> to locate a bank reference or booking code;
  a new overview link clears a previous search when no q is provided.
- Request links accept status=open and type=reschedule; open means pending/in_progress.
- Booking rows open appointments by code on desktop and the existing mobile
  detail path on mobile. The complete-day link remains visible when the list is capped.
- Overview refresh is read-only GET; export is a client-generated UTF-8 CSV of the summary,
  seven cash days and service distribution. No mutation endpoint is called by either action.
- Export is available in the secondary details menu. Desktop detail links open
  reports/payments; mobile links open the fully implemented ledger and appointment list.
- Header search submits with Enter and shows up to eight results per category.
  Customer results open the customer's booking history; transaction results open
  the ledger across all months with the relevant search term.
