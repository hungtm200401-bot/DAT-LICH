# Decisions
- Individual read endpoint already exists with id. Reuse it; do not introduce a new read-all flow or local-only state.
- Mobile badge is fixed CSS content 1. Replace with actual unread count markup and hide at zero.
- Visitor API has summary over filtered set and 10-row pages; source and active filters run server-side, search is explicitly within displayed page. Remove charts inferred from current page.
- Preserve campaign link/QR generator via a collapsed tools area. New visitor controller uses its own data attributes, avoiding legacy handlers.
- Dirty workspace includes previous goals. Stage targeted function replacements against HEAD plus new modules; test staged snapshot independently, keep prior edits unstaged.
