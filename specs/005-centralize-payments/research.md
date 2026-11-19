# Decisions

- Decision: reuse recordPayment and the existing database trigger. Rationale: it already confirms a pending appointment when a real transaction brings its retained amount to the booking-specific threshold. Alternative: separate approval endpoint would duplicate work.
- Decision: canonical /admin/payments?q=CODE links, with all results when a search is supplied. Rationale: paid/cancelled records remain reachable. Alternative: opening dialogs directly from appointment pages leaves scattered approval entry points.
- Decision: collapsed extra transaction details, editable real amount/time, visible bank reference. Rationale: short common path while preserving honest bookkeeping. Alternative: hiding bank identity would remove duplicate protection.
- Decision: no new provider or financial policy. All technical unknowns resolved from the local implementation; no external research required.
