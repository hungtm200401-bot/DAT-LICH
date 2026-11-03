# HOAN Makeup development

Read `README.md` for the architecture and local commands. Communicate with the
owner in Vietnamese. Keep changes scoped to the requested outcome.

## Spec Kit

- For substantial features or changes spanning business rules, API, database and
  UI, use the repository's `.agents/skills/speckit-*` skills. Read
  `.specify/memory/constitution.md`, specify the change, resolve material unknowns,
  plan, create tasks, implement, and verify against acceptance criteria. Keep
  artifacts in `specs/<feature>/` current as requirements change.
- The owner can describe work in ordinary Vietnamese; select the relevant skills
  without requiring the owner to memorize commands. Continue through authorized
  work; ask only about decisions that cannot reasonably be inferred.
- Small fixes, copy edits and isolated visual changes need a short plan and
  relevant verification, without a full feature specification.
- Generated skills, scripts and templates come from Spec Kit v1.2.6. Put project
  rules in this file and the constitution; use supported template overrides for
  customization. See `docs/SPEC_KIT.md` for setup and reuse on other projects.

## Project boundaries and verification

- Preserve existing booking, admin, CMS, location and payment behavior unless the
  requested change explicitly alters it. Follow the existing design system.
- D1 is the business data source. Preserve server-side validation and admin
  authorization. Payment receipt requires a recorded real transaction.
- Core paths: `public/app.js`, `public/site-tools.js`, `app/api/`, `db/schema.ts`,
  `drizzle/`, `tests/` and `scripts/verify-*.mjs`.
- Use the existing checks relevant to the change. `npm test` includes the build
  and core tests; `npm run lint` needs Bash. On PowerShell, use `npm.cmd` if the
  npm script execution policy blocks `npm`. Browser verification scripts can
  require a running local server and the documented browser dependencies.
- Report which checks actually ran and their results. Never present a spec,
  checked task, or AI review as proof that runtime tests passed.
