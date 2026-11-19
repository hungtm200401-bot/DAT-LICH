# Implementation Plan: Compact Overview

## Summary
Refine the existing shared overview renderer into three metrics and two panels.
Retain the model, existing routes/search, CSV, refresh and error handling.

## Technical Context
Edit public/admin-overview.js and public/admin-overview.css for a compact list of
up to five bookings, positive-count work queues and a native details menu.
Use the same compact content for mobile; remove duplicated mobile action groups.
Version affected assets in app/layout.tsx, app/page.tsx, public/app.js and public/sw.js.
No dependency, API, migration or business data changes.

## Layout and stale-page repair
Consolidate the title, date, sync timestamp and actions into the shared overview
header. Limit desktop content to 1280px and align the two panels' top/bottom edges.
Load the matching overview stylesheet before rendering. Give app/layout, app.js,
client-bootstrap and app-version.json the same build identity. An idle overview
may reload a stale build; admin edit pages and open forms remain untouched.
Validate startup timing and old-build recovery with scripts/verify-overview-version.mjs.

## Constitution Check
Pass: user feedback supersedes earlier layout requirements. Genuine payment totals,
server authorization, existing routes and underlying booking behavior remain intact.

## Validation
Update tests/overview.test.mjs and scripts/verify-overview.mjs to the revised UI.
Check three KPIs, five-booking cap, nonzero queues, detail navigation, optional CSV,
search, refresh/error recovery, empty states and 390px layout. Run targeted tests
and production build; inspect both screenshots.
