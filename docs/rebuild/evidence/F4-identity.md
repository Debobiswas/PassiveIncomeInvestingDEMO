# F4 — Identity backend evidence

Implementation branch: `codex/foundation-identity`, based on F1–F3 commit `5e67ba5`. Verification date: 2026-09-22 America/Toronto (migration timestamp is UTC September 23). This record supports local engineering verification, not full M1 or client acceptance.

## Implemented slice

- Browser-safe runtime contracts and strict TypeScript server package; thin versioned HTTP entries share one handler with the local test server.
- Verified member identity, idempotent initialization, persisted profile edits and versioned onboarding acknowledgement/completion. Optimistic revisions reject competing writes; timestamps/owners/completion are database-controlled.
- Private, non-exposed tables with forced RLS, explicit table/column/function grants, invoker command functions and a narrow read-only live-session check. Direct Data API calls cannot bypass command validation.
- Current database-backed staff membership; user-editable metadata cannot grant access. Grant/revoke changes are audited with the database actor and take effect with the same existing token.
- Bounded bodies/deadlines, safe typed errors, no-store responses, request IDs, malformed/non-JSON upstream handling and returned-record ownership validation.
- Isolated local Supabase configuration, migration replay, real Auth/HTTP/PostgREST/Postgres tests, CI database job, and an [operational runbook](../../runbooks/local-identity.md).

The Supabase/Postgres skills informed explicit exposure/grants, safe search paths, ownership policies, indexed foreign keys, and mandatory actual-database verification. Existing framework/provider choices were retained. No new financial behavior, worker platform or UI auth flow was mixed into this slice.

## Verification environment and results

Local macOS, Node 24.16.0, npm 11.13.0, Supabase CLI 2.115.0, isolated Docker project `pii-foundation`; API 55421 / database 55422. The other local project's default-port stack was not changed. Runtime credentials are publishable-key plus member JWT; privileged test credentials stay inside the local harness.

| Command/scenario | Observed result |
| --- | --- |
| `npm ci` | Clean dependency installation succeeded; npm reported zero known vulnerabilities at verification time |
| `npm run db:start` | Isolated local target verified; unused services excluded |
| `npm run db:reset:local` | Initial migration recreated an empty disposable local database successfully |
| `npm run db:check` | No schema errors or database-advisor issues |
| `npm run test:integration` | 10 actual integration tests passed after replay |
| `npm run check` | Strict types, lint/import boundaries, 43 unit tests, formatting and build passed; initial JS + CSS remained 98,633 bytes gzip |
| `npm run test:e2e` | 13 passed, one desktop-only keyboard test intentionally skipped on mobile; existing shell/demo regression suite, not a test of unbuilt F5 identity UI |
| Source/worktree checks | Original PDF/XLSX integrity tests passed; independent `feat/portfolio-import@f3b65e2` worktree remained clean; `git diff --check` passed |

The integration matrix demonstrates own-user success and cross-user denial through actual roles, unchanged foreign state, forged/expired/anonymous/revoked identity rejection, owner/role/timestamp injection rejection, unavailable direct-table access, direct-command validation, competing revision conflicts, repeated bootstrap/completion, disclosure preconditions, and staff grant/revocation with stale tokens. Tests use synthetic confirmed accounts, not external email delivery or Google OAuth.

Failures found and corrected during development included Auth SDK mapping a missing/revoked session to status 400, gateway HTML obscuring auth failure status, and runtime output accepting a valid-shaped foreign profile. Regression cases preserve safe 401/403/503 semantics and reject foreign records. Migration replay was tested after generating the initial SQL from the local schema and adding explicit negative/default grants the generator omitted.

## Acceptance mapping and remaining gates

| Acceptance | Evidence supplied | Still required |
| --- | --- | --- |
| M1-A02 | Empty migration replay, repeat-safe bootstrap/onboarding, owned relationships | Discover any hosted schema/users; test supported upgrade path, not a reset |
| M1-A05 | Real local database CI job and reproducible commands | Hosted successful run, required statuses, controlled promotion and rollback |
| M1-A06 | Persisted API state, conflict handling, acknowledgement/completion preconditions | Approved disclosure, actual readable UI, interruption/cross-device browser journeys |
| M1-A08 | Shared runtime schemas/inferred types, strict boundaries, safe upstream failures | F5 client integration; no generated OpenAPI SDK is claimed |
| M1-A09 | Anonymous/member A/member B/staff matrix at HTTP and database/command boundaries | Hosted configuration review, operator human audit/approval, production session/rate policies |
| M1-A10 | Working local instructions and scoped database contributor rules | Second-developer walkthrough; hosted deployment/incident instructions in F6 |

F4 is a local backend slice, not full M1 acceptance. F5 implements email/Google lifecycle, protected UI, persisted onboarding screens and private-cache/session recovery. F6 establishes isolated North American staging, telemetry/redaction, hosted API smoke, required CI and rollback/restore evidence. The optional email-method question affects F5, not these backend results.

No approved disclosure is seeded; completion without one intentionally conflicts. Existing completed onboarding is not automatically invalidated when the current disclosure changes. Content-version immutability is currently an operator rule, not a trigger. No invitation-only registration policy or complete human operator workflow is implemented.

This is a fresh schema baseline and explicitly rejects legacy `public.profiles`. The independent feature worktree remains untouched; remote migration history is unknown. No production services were provisioned, no remote migration/push/deploy occurred, and no load capacity claim is made. Local reset removed only disposable test state and is not a recovery mechanism for valuable data. Prefer additive follow-up migrations and application rollback over dropping schema.

## Technical references checked during implementation

- [Supabase API security](https://supabase.com/docs/guides/api/securing-your-api): grants, exposed schemas and RLS are distinct controls.
- [Auth sessions](https://supabase.com/docs/guides/auth/sessions) and [verified getUser](https://supabase.com/docs/reference/javascript/auth-getuser): server verification and session-revocation handling.
- [Data API exposure change](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically) and [managed-schema restrictions](https://supabase.com/changelog/34270-restricting-access-on-auth-storage-and-realtime-schemas-on-april-21-2025): explicit exposure/grants; no modifications to managed Auth tables.
- [Vercel Node runtime](https://vercel.com/docs/functions/runtimes/node-js): Web Request/Response entry-point shape; hosted behavior remains unverified.
