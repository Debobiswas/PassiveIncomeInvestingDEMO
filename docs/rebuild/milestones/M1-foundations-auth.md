# M1 — Foundations & Auth

Status: proposed PRD and implementation plan; no acceptance claimed. Reviewed 2026-09-22.
Contract authority: signed agreement page 1, §2.1, M1 ($4,500 CAD).
Planning snapshots: `master@4dbf440`; `feat/portfolio-import@f3b65e2` in `.claude/worktrees/portfolio-import/`.
Paths prefixed `feature:` below are relative to that feature worktree; other source paths are relative to the repository root.

## Outcome and scope

A person can enter through a stable URL, create/access an account with email or Google, finish persisted onboarding, and return to their own empty or populated workspace. Engineers can add the next milestone through documented boundaries, deploy it reproducibly, and investigate failures without exposing user financial data.

Signed deliverables: email + Google OAuth; database schema; Vercel + Supabase hosting in North America; Sentry error tracking; CI/CD; user onboarding flow.
Engineering recommendations needed for this rebuild: strict TypeScript, route architecture, validated API contracts, ownership enforcement, module boundaries, meaningful tests, operational documentation and an initial capacity model.
An early AI adapter is a dependency-enabling recommendation, not an additional signed M1 product feature. Build its bounded interface before M4; do not delay basic M1 acceptance for the M5 retrieval pipeline.
Non-goals: implement portfolio import/sync, catalogue ingestion, financial formulas, goal generation, RAG, rebalance jobs or mobile screens in M1. No Kubernetes, independent service per milestone, or framework rewrite justified solely by user-count targets.

## Current evidence and disposition

| Evidence | Finding | Decision |
| --- | --- | --- |
| `robo-advisor/src/App.jsx:101` | Navigation is local `active` state; onboarding flag is session storage. | Replace navigation and persisted setup behavior; preserve useful visual primitives. |
| `feature:robo-advisor/src/App.jsx:27` and `:39` | Lazy routed `/demo` and `/app` shells already exist. | Salvage route shape and lazy loading; add real 404/error routes and typed route ownership. |
| `feature:robo-advisor/src/components/auth/RequireAuth.jsx:7` | Client route gate uses local session. | Keep UX gate, but require independent server authentication/authorization. |
| `feature:robo-advisor/src/context/SessionProvider.jsx:12` | Initial session request has no error recovery; Google sign-in exists at line 28. | Rework explicit auth state machine, bounded failure/retry, refresh and cancellation. |
| `feature:robo-advisor/src/views/Login.jsx:37` | Google-only UI; no email path or visible OAuth failure state. | Add email lifecycle and actionable errors. Invite copy at line 45 is not access enforcement. |
| `feature:robo-advisor/src/views/AuthCallback.jsx:14` | Callback always sends successful login to home. | Preserve a validated same-origin return destination across OAuth. |
| `feature:robo-advisor/src/components/layout/PortalLayout.jsx:21` | Onboarding intentionally runs only for demo users. | Replace with persisted authenticated onboarding and separate optional demo introduction. |
| `feature:robo-advisor/src/context/LiveProvider.jsx:1` | Live provider is explicitly a passthrough stub. | Remove this false boundary once feature hooks consume the real API. |
| `feature:robo-advisor/src/lib/supabase.js:6` | Missing auth environment throws at import, affecting public/demo shell too. | Validate deployments at startup while keeping public error recovery explicit. |
| `feature:robo-advisor/src/lib/api.js:10` | JSON parsing assumes every upstream response is JSON. | Rework typed errors, timeout/abort, request IDs and safe non-JSON failures. |
| `feature:supabase/migrations/20260821000001_portfolio_import.sql:5` | Profiles and private portfolio tables, numeric values, indexes, RLS and explicit grants exist. | Salvage concepts; reconcile domain ownership and migration history before adoption. |
| Same migration `:137`, `:157` | All API writes are planned with service-role bypass; trigger helper is public security-definer. | Prefer ordinary user-context writes under RLS; narrow privileged execution and audit helper exposure. |
| `feature:vercel.json:3` and `feature:api/health.js:3` | Build/rewrite and environment-presence health endpoint exist. | Rework deterministic install, NA placement, API 404 handling and safe liveness/readiness. |
| `feature:robo-advisor/package.json:6` | Unit-test script exists; no auth/route E2E or CI workflow was found. | Preserve parser/derivation tests; establish independent integration and browser suites. |

No Sentry setup, production region evidence, onboarding persistence or repository AGENTS.md was found in these snapshots. Prior test results are useful baseline evidence, not evidence that M1 authentication works against a deployed project.

## Requirements and acceptance traceability

| Requirement | Source and implementation obligation | Acceptance |
| --- | --- | --- |
| M1-R01 | Signed: email authentication and Google OAuth, logout and session restoration. Recommend verified-email/password with recovery unless email-link/OTP is selected. | M1-A01 |
| M1-R02 | Signed: database schema. Ship migrations for identity/profile/onboarding and explicit contracts for downstream domains, not premature implementation of every future table. | M1-A02 |
| M1-R03 | Signed: Vercel/Supabase North American hosting; isolated local, staging and production configurations. | M1-A03 |
| M1-R04 | Signed: Sentry errors for browser/API/jobs, release association and source maps; sensitive data redaction. | M1-A04 |
| M1-R05 | Signed: CI/CD with mandatory checks, isolated previews, controlled production promotion and rollback. | M1-A05 |
| M1-R06 | Signed: versioned, persisted onboarding for first-time and returning users. | M1-A06 |
| M1-R07 | Rebuild: deep-linkable typed route tree, error boundaries, accessible loading/empty/forbidden/not-found states. | M1-A07 |
| M1-R08 | Rebuild: modular domain architecture, strict TypeScript, one versioned domain HTTP contract for web/mobile and explicit public/demo/live data boundaries. | M1-A08 |
| M1-R09 | Rebuild: API authorization plus database grants/RLS, cross-tenant relationship invariants, server-owned roles and auditable privileged work. | M1-A09 |
| M1-R10 | Rebuild: contributor/agent instructions, architecture decisions, commands, runbooks, dependency and ownership map. | M1-A10 |
| M1-R11 | Dependency recommendation: common job execution and AI adapter contracts, quotas, timeouts, idempotency and telemetry. | M1-A11 |
| M1-R12 | Rebuild: proposed workload assumptions, measurable latency/error targets, resource budgets and capacity evidence. | M1-A12 |

## Primary journey and states

1. Open a public page or protected deep link. An unknown URL shows a real not-found page; a protected URL retains a validated return path.
2. Choose email or Google. Show pending state; prevent duplicate submission; handle denied consent, expired links, invalid credentials, provider failure and rate limiting without an endless spinner.
3. Verify identity and load server-owned profile. Profile bootstrap is idempotent if callback delivery or refresh repeats.
4. Complete minimal onboarding: display name, country, preferred display currency, acknowledgement of approved educational disclosure, and completion/version state. Country is not tax residency evidence; M3/M4 collect their own necessary details.
5. Enter an honest empty workspace with an M2 connection/import/manual-entry next action once available. Do not show demo holdings or invented totals inside a live account.
6. Refresh or reopen on another device: persisted onboarding remains complete and route survives. Logout clears private query caches immediately; another user cannot see the previous user's screen data.

Onboarding saves per step and resumes after interruption. Concurrent edits use a version/conflict rule; duplicate completion is harmless. Stale profile data is visibly reloaded before sensitive changes. Disabled/expired sessions produce a recoverable sign-in path; staff-only routes return forbidden rather than hiding the only evidence of failure.
Accessible foundations include semantic links, page titles, route-change focus, labelled inputs, announced errors, keyboard-only navigation, visible focus, modal focus trapping/restoration and reduced-motion support. Test primary journeys at mobile and desktop widths and 200% zoom.

## Proposed ownership and architecture

Use a modular monolith: React/Vite web client, versioned HTTP API, domain services/repositories, Postgres, and independently runnable bounded workers. Existing hosting remains the baseline; select worker execution from real job duration/concurrency requirements before integrating M2 ingestion or M5 transcription.

```text
Route/UI -> feature query/action -> /api/v1 endpoint -> verified identity + authorization
         -> domain service -> repository with user context -> Postgres grants/RLS
         -> durable job request -> bounded worker -> authorized domain operation
```

Canonical workspace boundaries are defined in `../ARCHITECTURE.md`: `apps/web`, root `api/` for thin Vercel entry points, `apps/worker`, `packages/contracts`, `packages/domain`, `packages/server`, and `packages/test-support`. Observability helpers live with their relevant runtime initially; separate folders do not require separate infrastructure.
Web owns rendering/navigation/session UX; API owns validation and public contract; domain modules own rules; repositories own storage/provider access; workers own long-running execution. Financial functions remain deterministic and independent of React, databases and LLM SDKs.
Prefer feature modules for identity, onboarding, portfolios, catalogue, distributions, projections, goals and advisor. Public exports are intentional; forbid deep imports and circular dependencies through lint rules. Do not replace large views with a single equally large global provider.
Server-state caching is keyed by authenticated identity and resource version; reset it on identity changes. Put shareable filters, selections and pagination in URLs. Keep transient presentation state local. Demo fixtures enter through an explicit adapter and are excluded from live domain paths.
Use one `/api/v1` domain surface for web/mobile. Supabase Auth protocol endpoints remain provider-owned; they are not duplicated inside the application API. Document runtime request/response validation and generate client types from the same contracts.
Initial endpoints: `GET/PATCH /api/v1/me`, `GET/PATCH /api/v1/me/onboarding`; internal health/readiness and authorized job status as needed. Use consistent problem responses, request IDs, pagination conventions, bounded payloads, deadlines and cancellation.
Conceptual M1 entities: identity reference, profile, onboarding progress/version, staff role/permission, security audit event. Later domain owners define portfolio, instrument, distribution, scenario and conversation entities; M1 supplies their common tenancy and migration rules.
Conceptual events: profile initialized, onboarding updated/completed, job accepted/completed/failed. Use transactions for state plus durable job/event publication where required; do not promise exactly-once delivery. Deduplicate side effects by stable request/job keys and test retries.

### Authorization and data rules

Treat UI guards as convenience only. Verify each API token using current provider guidance; derive user identity server-side, never from caller-supplied `user_id`. Check resource ownership and staff capability independently.
Normal private CRUD should run with the authenticated user's database context and matching RLS. Privileged imports, administration and system jobs get narrow, separately reviewed repository methods with explicit subject/owner and operation audit records. Service credentials never enter client bundles, fixtures or logs.
Shared published catalogue/content access differs from private portfolios and unpublished admin drafts. Do not stamp shared fund facts with individual user ownership or expose drafts through a public-read policy. Product visibility and entitlement decisions remain explicit.
Foreign-key relationships must enforce same-owner consistency where applicable; a valid portfolio ID belonging to another user must never attach to the caller's account, import or goal. Use explicit currency and decimal representation for money; M2/M3 own arithmetic semantics.
Roles come from server-controlled membership/claims, never editable profile metadata. Revocation/session-expiry policy is documented; test stale role claims for privileged actions. Restrict callable SQL helpers/views and exposed schemas intentionally.
Current Supabase docs confirm grants and RLS are separate controls; update policies without explicit `WITH CHECK` reuse `USING`, so the feature migration's omission alone does not prove owner reassignment. Write explicit policies and positive/negative tests rather than asserting an unverified vulnerability.

### Shared AI and job boundary

M1 defines task identity, authenticated caller, typed input/output, deadline, cancellation, model/prompt version, token/cost accounting, redacted telemetry and per-user/global quotas. Provider secrets and model invocation remain server-side.
M4 owns allocation constraints, catalogue eligibility and rationale evaluation. M5 owns transcription, embeddings, retrieval/citations, corpus permissions and prompt-tuning evaluation. Neither may ask the shared adapter to calculate monetary totals.
Before M4, ship one real provider smoke integration behind a feature flag plus deterministic fake adapter for tests. Validate structured outputs and bounded retries; provider outage produces a typed failure, not a fabricated recommendation. A schema-only adapter is not proof of production AI readiness.
Implement the minimal durable job path when the first M2 ingestion requires it. Define retry classes, exponential backoff, lease/heartbeat, dead-letter visibility, cancellation and dedupe. Avoid building a generic workflow platform before concrete handlers exist.

## Dependencies and downstream guarantees

External prerequisites: client-owned Vercel/Supabase access, approved North American regions, Google OAuth credentials/redirect allowlist, working email sender/domain, Sentry project, deployment permissions and secrets. Planning can finish without these; provider integration acceptance cannot.
M2 consumes stable user identity, ownership-aware persistence, API errors and job runtime. M2.5a/b consume audited staff permissions and upload/job boundaries. M3 consumes deterministic shared types and scenario ownership. M4 consumes profile/onboarding identity and AI boundary. M5 extends that boundary with retrieval. M8 eventually consumes the same domain API.
Do not couple M1 acceptance to full financial questionnaire design: persist an extensible onboarding version and let M4/M5 own their questionnaire data. Do not let M2's early schema become the owner of shared distributions or the ETF catalogue.
The contract's commercial milestone demo/payment sequencing remains separate from engineering dependency order; parallel planning does not waive an acceptance/payment gate.

## Ordered implementation slices

| Order | Reviewable slice | Win condition |
| --- | --- | --- |
| 1 | Record architecture, environment and ownership ADRs; root AGENTS.md, setup guide, scripts and canonical package manager. Preserve feature branch and app appearance baseline. | Fresh checkout runs documented commands; master/feature salvage map is explicit; no app behavior changed without intent. |
| 2 | Introduce strict TypeScript/contracts, route shell and module import rules. Port feature routing selectively. | Deep links/back/forward/refresh/404 work; CI catches forbidden imports/type errors; demo remains usable. |
| 3 | Add CI unit/integration/browser jobs, reproducible builds and isolated preview configuration before feature migration. | A deliberately failing check blocks promotion; preview has no production credentials or production writes. |
| 4 | Build identity/profile schema and server auth/ownership boundary with local integration tests. | Two real test identities can read/write their own profile and cannot access each other's; repeated signup creates one profile. |
| 5 | Implement email and Google flows with callback/recovery/logout states. | Both paths complete against staging; route return and expiry recovery pass browser tests; browser contains no server secret. |
| 6 | Implement persisted onboarding and honest live empty shell; separate demo data. | Refresh/device change resumes or preserves completion; sign-out/switch-user never flashes another user's data. |
| 7 | Integrate Sentry and safe health checks; stage NA deployment and exercise rollback/restore procedures. | Tagged test failures are traceable without tokens/financial payloads; documented deployment and rollback smoke succeeds. |
| 8 | Hand M2 a minimal durable job implementation when import begins; establish AI interface, then real bounded adapter before M4. | Retry/duplicate/crash tests preserve one committed effect; AI smoke request reports validated result, version, usage and bounded failure. |
| 9 | Run release acceptance and baseline load model; record evidence and residual risks. | All mandatory M1 acceptance records pass; capacity claim states measured workload/hardware, not user-count marketing. |

Wait until slices 1–4 establish boundaries before implementing multiple downstream domains. Route component decomposition can proceed with M2 after identity/ownership contracts stabilize. M4 requires M2.5a published data and M3 calculation semantics; M5 ingestion can be prepared after job and content ownership contracts are settled.

## Verification and measurable acceptance

| Acceptance | Required proof |
| --- | --- |
| M1-A01 | Staging email + Google success, denied consent, expired/used link, recovery, refresh, logout and expired-session tests; same-origin deep-link return; no indefinite loading. If passwordless selected, recovery semantics are documented and tested accordingly. |
| M1-A02 | Empty database migration replay succeeds; existing supported schema upgrade succeeds; profile creation and onboarding transactions are repeat-safe; two-user relationship tests reject cross-owner writes. |
| M1-A03 | Deployment evidence identifies Vercel compute and Supabase data regions in North America, environment isolation and redirect settings. Explain CDN/global auth/provider processing separately from selected origin location. |
| M1-A04 | Browser/API test error appears with release and request correlation; automated redaction fixtures prove credentials, holdings and prompts are omitted by default. Worker error/job correlation becomes mandatory in P2 when that runtime is introduced, before its dependent release. |
| M1-A05 | Clean CI installs from lockfile and passes type/lint/unit/DB/browser/build checks; failing required check blocks release; staging smoke and production rollback are rehearsed. |
| M1-A06 | First user completes onboarding, second session sees persisted completion, interrupted user resumes; invalid fields and duplicate submits are handled; skip policy is explicit. |
| M1-A07 | Each route loads by direct URL and browser history; unauthorized/unknown route behavior is correct; keyboard/screen-reader checks and mobile/200% zoom reveal no blocking issue. |
| M1-A08 | Boundary checks prohibit demo data in live modules and domain imports from UI/provider SDKs; API schema rejects invalid input; API failures preserve typed status including non-JSON upstream errors. |
| M1-A09 | Anonymous/A/B/staff matrix passes via HTTP and actual database roles; allowed operations prove returned/changed rows, forbidden operations prove unchanged state; stale/forged token and owner-ID injection fail. Direct Data API bypass attempts cannot forge protected computed fields, state transitions or ownership; grants/projections/transactional commands follow ARCHITECTURE's exposure boundary. |
| M1-A10 | A second developer follows setup, migration, test, deployment and incident instructions without private chat context; AGENTS.md identifies source authority, prohibited secret handling and completion checks. |
| M1-A11 | Before dependent release, duplicate/crashed jobs do not duplicate effects, exhausted retries are visible, and AI timeout/malformed output/quota exhaustion fail safely with recorded usage. |
| M1-A12 | Record load scripts, dataset size, deployment tier and measured latency/error/DB connection results; revise capacity assumptions from evidence and retain regression budgets. |

Use unit tests for policy/domain decisions, integration tests for real Postgres/RLS/API boundaries and browser tests for journeys. Mocks cannot establish OAuth, email delivery, database isolation or deployment readiness. Provider tests run against designated staging/test identities; no user data in fixtures.
User-confirmed beta: 2,500 users and approximately 1,000 online concurrently, mobile primary with equivalent readable web. Use `../CAPACITY_AND_RELIABILITY.md` as the canonical workload: proposed 100 reads/sec + 10 ordinary writes/sec for 30 minutes, reconnect burst and two-hour mixed-workload soak. Do not stress external identity providers without suitable test support.
Shared proposed targets: ordinary reads p95 <=500ms and p99 <=1.5s, ordinary writes p95 <=800ms, unexpected 5xx <0.5%, connection use <=70% of configured safe budget. These are acceptance proposals, not measured performance or contracted SLAs. Native compatibility starts after this foundation even though full native delivery remains M8; apply `../PRODUCT_EXPERIENCE.md` to route and onboarding design.
Route bundle budgets should be set from first measured build: keep parsers, charts and AI/admin code out of auth/landing entry chunks; enforce agreed compressed-byte regressions in CI. Measure p75 real-user web performance after release instead of relying on local development speed.
The 300,000-active-user scenario requires an explicit active-period/concurrency/task-frequency model and later sustained tests with representative portfolio sizes. Start with bounded queries, correct indexes, caching of shared published data and queue backpressure; add replicas/partitioning/services only for measured bottlenecks.

## Release, operations and unresolved choices

Release gate: M1-A01–A10 pass with attached evidence, baseline M1-A12 is agreed/measured, and M1-A11 is mandatory before the first dependent job/AI feature ships. A working demo login alone is not milestone acceptance.
Monitor auth failures, callback completion, onboarding abandonment, API latency/error/429, DB connections, job age/retries, and AI requests/tokens/cost. Define alert owner, response window and per-user/global budgets; the contract's approximate launch hosting estimate is not a capacity guarantee.
Use additive migrations and feature flags; retain backward-compatible API changes through client rollout. Revert application deployments without assuming schema rollback is safe. Record backup/restore rehearsal and proposed recovery objectives before storing meaningful user portfolios; deletion and account lifecycle policy must be settled before public launch.
Open product choices: email password versus magic-link/OTP; open registration versus enforced invitation; minimum onboarding fields/skip behavior; admin role approver; whether public users may read the catalogue; exact North American region and third-party data-processing expectations; workload/SLO/recovery and cost budgets.
Do not block architecture or local tests on those choices: use clearly recorded assumptions. Do block the affected staging/production acceptance when credentials, sender verification, region evidence or the product decision is missing.

References checked: [Supabase Data API security](https://supabase.com/docs/guides/api/securing-your-api), [RLS behavior and tests](https://supabase.com/docs/guides/database/postgres/row-level-security), [Data API exposure change](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically). These inform engineering recommendations; the signed agreement remains scope authority.
