# HOAN Makeup Constitution

## Core Principles

### I. Specify user outcomes
For substantial features, define the affected customer/admin journey, scope,
acceptance scenarios and material edge cases before implementation. Use the
existing code as context. Document the requested change rather than writing a
retroactive specification for the entire application. Keep specs, plans and tasks
consistent when requirements change.

### II. Preserve booking and business data integrity
Cloudflare D1 is the source of business data. Do not replace it with mock data or
localStorage. Preserve booking conflict checks, customer/appointment consistency,
admin authorization and server-side validation. Any schema change must include a
reviewed migration and recovery approach that preserves existing records.

### III. Record real payments
Payment status and revenue must follow recorded transactions. A booking request
or displayed payment QR does not prove receipt of funds. Preserve duplicate
transaction protection, payment/refund validation and reconciliation behavior.
Automatic receipt verification requires an actual provider integration.

### IV. Reuse the architecture and design
Follow existing API, CMS, location and frontend conventions. Keep business logic
in reusable modules when it improves clarity. Preserve the established responsive
visual system and Vietnamese content. Changes should remain usable on mobile,
including loading, empty, error and denied-location states where relevant.

### V. Verify proportionately
Use existing tests relevant to the change, adding meaningful regression coverage
for changed business rules and API contracts. Run the build/core suite for broad
changes and browser checks for affected journeys when the environment supports
them. Report commands, actual results and verification gaps. A spec, checklist
or AI review is not evidence that runtime behavior passed tests.

## Development Workflow

Read AGENTS.md and README.md. For substantial changes, use the repository's
Spec Kit skills to specify, clarify material unknowns, plan, create tasks,
implement and verify acceptance criteria. Keep artifacts under specs/<feature>/.
Small isolated fixes use a concise plan and relevant checks without full SDD.
Continue through work already authorized by the owner; ask only about material
decisions that cannot be inferred. Preserve unrelated work and credentials.

## Governance

Explicit owner requirements take precedence over these defaults. Changes to
principles must describe their purpose and update affected plans/templates when
needed. Keep rules grounded in the repository's actual needs; avoid adding
unnecessary dependencies or process gates.

**Version**: 1.0.0 | **Ratified**: 2026-11-03 | **Last Amended**: 2026-11-03
