# M7 — Polish, Beta & Web Launch

Status: proposed PRD; no implementation or milestone acceptance is claimed. Authority: signed agreement page 2, section 2.2, M7 ($3,000 CAD). Dependencies and workload definitions follow `../DOMAIN_CONTRACTS.md`, `../PRODUCT_EXPERIENCE.md`, and `../CAPACITY_AND_RELIABILITY.md`.

## Outcome and scope

Members can use the released financial journeys, understand their values and freshness, recover from ordinary failures, and reach support. Operators can maintain published content and diagnose problems without unrestricted access to members' financial records. The release has evidence of correctness, usability, capacity and recovery.

The signed deliverables are the UX pass, basic admin console, QA, a closed beta with 10–20 members, and production web launch. The user's updated product direction adds a later private-beta expansion to 2,500 users, with approximately 1,000 online simultaneously. These are separate release stages: the small pilot validates comprehension and usability; it cannot establish the capacity of the expanded beta.

Mobile is primary, with equally capable readable web journeys for users who prefer web, including older users. M7 coordinates native readiness with M8; production web launch does not prove React Native, push, store submissions or listings are complete. If the expanded beta uses native apps, the relevant M8 distribution and client gates must pass before that cohort enters.

Security, test automation, readability, admin publishing and telemetry begin in M1 and their owning milestones. M7 assembles evidence and resolves integration problems; it is not their first implementation phase. The user's priority is through M5, including M2.5a/b. A gated M1–M5 preview can precede M6, but must state that check-ins/rebalancing are unavailable and must not be labelled full M7 contractual acceptance. Run a small feature-scoped pilot before that expansion, then repeat the required pilot journeys on full launch scope including M6 for M7-A06/full launch acceptance.

Non-goals: sponsorship admin, paper trading, social/community, gamification, trading execution, a generic business-intelligence console, unrestricted staff impersonation, or a guarantee of 300,000-active-user capacity. Proposed numerical gates below are engineering/product recommendations, not additional signed contract language.

## Existing evidence and disposition

Evidence covers `master@4dbf440` and `feat/portfolio-import@f3b65e2`; the latter lives in `.claude/worktrees/portfolio-import` and remains independent. Repository inspection does not establish production deployment or approved acceptance.

| Evidence | What it establishes | Treatment |
| --- | --- | --- |
| `robo-advisor/src/App.jsx:102` local `active` state; `:5` fixture notifications | Prototype navigation and demo behavior, not release routing | Replace with M1 routes, real request state and deep-link tests; reuse reviewed presentation assets |
| `robo-advisor/src/views/Portfolio.jsx:6`, `Plan.jsx:7` fixture imports | Visible screens can render without real member data | Release gate prohibits live fixture fallbacks |
| `robo-advisor/src/views/Portfolio.jsx:269` and `:271` claim queued/executing trades | UI promises behavior outside the planned product | Remove claims before real users; M6 outputs a non-executing plan |
| `robo-advisor/src/views/Plan.jsx:533`, `:543` use 9px labels | Concrete readability concern, not a completed accessibility audit | Replace unreadable labels; verify text alternatives and scaled layouts |
| `robo-advisor/package.json:6` scripts include build/lint but no tests | Current planning base has no runnable application test command | Add meaningful CI/test layers in M1, then extend per milestone |
| Feature `robo-advisor/package.json:11` adds Vitest; `src/context/LiveProvider.jsx:1` remains a stub | Narrow automated tests exist; persisted live journeys are incomplete | Salvage useful parser fixtures; do not use passing unit tests as release acceptance |
| Feature `api/health.js` and `api/_lib/env.js` are the API inventory | Health/config groundwork, not working product or admin APIs | Expand through domain slices; operational checks must exercise dependencies safely |

The earlier audit recorded master build passing, lint failing with nine errors; feature tests passing 33 cases, build/lint passing, and a 265.06 kB gzip main bundle. These are inherited results, not reruns or capacity evidence. This review re-read source/package files and the signed milestone text. No browser, provider, load, database restore or production checks were executed for this PRD. See `../EVIDENCE_AND_RISKS.md` for full audit limits.

## Requirements and acceptance mapping

| Requirement | Required behavior | Acceptance |
| --- | --- | --- |
| M7-R01 — UX pass (signed) | Complete core journeys with readable values, accessible controls, honest progress/failure/freshness, and web/mobile-equivalent financial meaning | M7-A01, M7-A02 |
| M7-R02 — Basic admin (signed) | Assemble authorized fund/distribution/content operations supplied by M2.5a/b and M5; expose safe diagnostics and publication/job history | M7-A03 |
| M7-R03 — QA (signed) | Integrate domain, real database, API, browser and provider evidence; detect regressions and isolate tenants | M7-A04, M7-A05 |
| M7-R04 — Closed beta (signed) | Run documented 10–20-member pilot, record feedback and resolve blocking failures | M7-A06 |
| M7-R05 — Production web launch (signed) | Promote a reproducible checked artifact, verify deployed journeys and establish monitored support/recovery | M7-A07, M7-A09 |
| M7-R06 — Expanded private beta (user direction) | Admit up to 2,500 users only after testing the 1,000-online workload and cost/operations gates | M7-A08, M7-A09 |
| M7-R07 — Mobile-first parity (user direction) | Coordinate native cohort eligibility and test consistent shared facts across available clients | M7-A02, M7-A10 |

## Journeys and states

Member journey: invitation → email/Google sign-in → persisted onboarding → manual/import/broker portfolio → readable income and holding details → fund/distribution inspection → calculation → saved goal → cited advisor response → return on another session/device. Include M6 check-in and plan inspection for the full release, never an order-execution claim.

Each step has loading, empty, validation, session-expired, forbidden, stale, dependency-unavailable and retry states where applicable. Preserve safe drafts during transient errors; distinguish accepted work from completed work. Reopening a pending job shows the same owned job, not a second submission. Unknown data remains labelled unknown. Stale snapshots retain their source time and never silently become “live.”

Admin journey: trusted staff sign-in → permitted console area → bounded validation/diff preview → authorized publish → inspect recorded result → view published client output. Validation failures preserve the last valid release. Concurrent edits produce a conflict, not lost updates. Failed jobs offer bounded diagnostic information and authorized replay only where their owner supports it.

Support journey: user supplies a safe request/error reference → operator finds redacted status → identifies owner/runbook → pauses affected provider work or escalates → records recovery. No full chats, brokerage identifiers, secrets or raw portfolios are needed in the default support view.

## Architecture and ownership

M7 composes the existing `/admin/funds`, `/admin/distributions`, and `/admin/content` routes and their domain APIs; it does not introduce another publication database or bypass the use cases. Basic admin's minimum scope is navigation, trusted capability enforcement, publication/job status, audit access and safe recovery controls for these existing workflows. Member role administration or impersonation requires a separate explicit design and is not implied here.

M1 owns trusted staff capabilities and audit identity. Catalogue/distribution/content modules own validation, writes, publication versions and rollback rules. M2 owns private portfolio jobs; M4/M5 own their generation jobs. Operators cannot replay another domain's raw payload through an arbitrary endpoint. Server authorization applies to every action, with database constraints and relevant RLS tests beneath it.

Proposed release evidence records reference commit/artifact, environment, schema revision, requirement/acceptance IDs, executed scenario/command, expected/observed result, reviewer and evidence location. Store no production personal data in repository reports. Operational audit records identify actor, capability, action, resource/version, outcome and request/job reference; restrict retention/access deliberately.

Release configuration contains cohort eligibility and feature availability, enforced server-side where it gates access or paid work. A flag is not authorization. Changes are auditable and can pause new imports, sync or generation independently while saved read paths remain available. Existing jobs obey owner-specific cancellation and publication checks; pausing admission does not automatically erase or duplicate them.

Deployment sequence: checked artifact → isolated staging verification → internal cohort → signed pilot → expansion cohorts → production promotion appropriate to scope. Published reference versions can be reverted through owning modules; schema changes use expand/migrate/contract and forward repair. Keep API compatibility with already installed mobile versions during web rollback.

## Ordered implementation slices

| Slice | Work and prerequisites | Win condition |
| --- | --- | --- |
| M7-S01 — Continuous readiness evidence | Start alongside M1: release evidence template, severity policy, CI gating, route/error-state and readability review criteria | A deliberate domain/integration failure blocks promotion; evidence distinguishes implementation from acceptance |
| M7-S02 — Admin assembly | After M1 authorization and each domain admin flow: common navigation, safe statuses, audit views, supported recovery controls | Authorized staff complete publication/recovery; ordinary/forged-role users cannot read or mutate admin state |
| M7-S03 — Integrated financial journeys | After relevant M1–M5 slices: persistent journey, cross-user isolation, source versions, real provider smoke, accessible failure paths | M1–M5 and M2.5a/b acceptance evidence links to one integrated candidate; no hidden fixtures |
| M7-S04 — Pilot UX and support | Recruit 10–20 members, including older web users and intended mobile users; rehearse support before invitation | Pilot thresholds below pass and blockers are fixed/retested; findings feed owning milestones |
| M7-S05 — Capacity/recovery campaign | Representative staging dataset, jobs/provider modes, telemetry and alert owners exist | Beta workload, provider-failure, rollback and isolated restore drills pass with raw evidence |
| M7-S06 — Cohort expansion | S03–S05 pass; native build/distribution gates pass when cohort is native | Small → intermediate → 2,500 admitted users with monitored stop/rollback decisions and no unresolved release blocker |
| M7-S07 — Full web launch evidence | Full intended scope, including M6, plus pilot/operational gates | Production journeys pass, support/alert ownership active, release record complete and client acceptance decision recorded |

Parallel usability recruiting/content preparation is useful, but admission must wait for working identity, tenant safety and the journeys being offered. Do not postpone admin uploads or test frameworks to S02/S03. Native enabling work begins after M1 as specified in `../REFACTOR_PLAN.md`, not after S07.

## Measurable acceptance and verification

**M7-A01 — Readable accessible journeys.** All core routes pass keyboard-only navigation, visible focus, names/labels, announced errors/progress, contrast and chart text/table alternatives. Verify 200% web zoom, 16px-equivalent ordinary body and 14px secondary text, and proposed 44×44 logical-pixel targets per `PRODUCT_EXPERIENCE.md`. Long names, missing values, negative/large CAD/USD amounts do not hide actions or meaningful amounts. Combine automated checks with screen-reader/manual testing; no unresolved blocker to a core task. Record device/browser/assistive technology versions.

**M7-A02 — Financial comprehension and parity.** Same saved snapshot/goal/input versions produce matching currency, totals, assumptions, timestamps and explanations in web and the tested native build. Users distinguish actual income from forecast income and data freshness without coaching. Refresh/deep links/account switching do not lose saved state or show another identity's cached data. When native is not yet available, mark native evidence pending rather than claiming parity complete.

**M7-A03 — Admin control.** Authorized staff add/edit/archive a fund, validate/publish distribution data and manage permitted knowledge content through owning flows. Failed validation and duplicate upload preserve valid published data. Ordinary user, unauthenticated user and forged role attempts fail at API/database boundaries with unchanged state. Audit records identify real actor/version/outcome without raw financial data; each supported retry is idempotent.

**M7-A04 — Reproducible checks.** Fresh lockfile install, strict typecheck, lint, build, domain fixtures, API contract, real disposable-database migration/ownership tests and critical E2E journeys pass for the candidate. Check own-user success as well as cross-user denial. Golden financial examples use independently derived expected answers. Names of proposed test commands become release instructions only after implemented; today's planning branch has no application test script.

**M7-A05 — Failure and provider evidence.** Test broker/AI 429/timeouts, expired sessions, denied callbacks, invalid/oversized uploads, concurrent imports, worker crash/retry, stale publication and unavailable dependencies. Preserve acknowledged writes and last valid data; jobs terminate or remain observably queued within their declared objective. Record representative real-provider smoke separately from deterministic stubs, including quotas/configuration and external prerequisites. Mock-only success cannot satisfy live-provider acceptance.

**M7-A06 — Signed pilot.** Enrol 10–20 members with consented, minimized feedback collection; proposed sampling includes at least five users who prefer web and have relevant reading/navigation needs. Measure unassisted completion of sign-in, finding monthly income/freshness, inspecting a holding and saving/reopening a goal. Proposed gate: at least 90% complete each offered task, at least 90% correctly interpret actual versus estimated income and freshness, and no unresolved task-blocking/accessibility or misleading-money issue. Record exact counts because this is a small sample; retest affected tasks after fixes, and never infer capacity from pilot satisfaction.

**M7-A07 — Deployed web readiness.** Promote the immutable CI-tested artifact; verify production hostname/deep links/auth callback/recovery, real-user persistence using controlled accounts, safe errors and admin denial. Prove preview/staging cannot use production secrets accidentally. Trace a controlled redacted error, confirm alert receipt and verify last-good artifact rollback against compatible schema/API. Production smoke must be non-destructive and must not place orders.

**M7-A08 — Expanded beta capacity.** Follow the shared benchmark protocol: 2,500 synthetic users and representative data; 1,000 virtual sessions; 100 read/10 ordinary write RPS for 30 minutes; 400-read-RPS reconnect burst; two-hour normal-demand soak with ingestion/sync; separately bounded AI baseline/stress. Ordinary read p95 ≤500 ms/p99 ≤1,500 ms, writes p95 ≤800 ms, unexpected 5xx <0.5%, no lost acknowledged writes or tenant leaks, pool ≤70% safe sustained budget, recovery to steady SLO within 60 seconds of burst. Record cold/cache state, environment and stubbed provider limits. Frontend/device budgets and queue-specific objectives also pass `CAPACITY_AND_RELIABILITY.md`; no 300,000-user guarantee follows.

**M7-A09 — Operating and recovery evidence.** Named people receive/test alerts and rehearse provider pause, poisoned-job diagnosis/replay, failed deploy and backup recovery. Restore into an isolated environment and verify auth/tenant integrity, owned records, reference versions, jobs and source eligibility before considering cutover; prevent restored outboxes from resending notifications or replaying paid/provider effects. Demonstrate proposed beta RPO ≤24h/RTO ≤4h and document actual service tier/restore limitations. If unattainable, resolve the recovery policy before cohort expansion, never claim it tested. Usage/cost limits and admission behavior are exercised; nominal 99.5% beta availability is a monitoring objective, not proven by a short load test.

**M7-A10 — Native cohort eligibility.** For a native beta, M8 provides installable controlled iOS/Android builds, secure sessions/deep links, readable scaled text, owned data/cache clearing, shared API compatibility and an approved test-distribution path. Verify the same key member journeys on physical representative devices. Record which native requirements remain incomplete, including push/store submissions/listings; web acceptance cannot close those IDs.

## Release operations and decision rules

Dashboards cover request errors/latency, database pool pressure, oldest job age, provider failures/quotas, AI tokens/cost, catalogue/distribution/corpus freshness and client task failure. Alert on missing/silent updates as well as explicit errors. Every threshold has a named responder, escalation path and runbook. Keep request/job correlation without logging full prompts, transcripts, credentials or portfolios.

Use proposed expansion cohorts of internal testers → 10–20 pilot → 100 → 500 → 2,500. Intermediate counts are operational recommendations; the final cohort must demonstrate the stated online workload, not merely account registrations. Hold each cohort through at least a representative peak and scheduled-job cycle, or exercise the future scheduled cycle safely in staging before advancing. Monthly work must not require waiting a full month to test scheduling semantics.

Any tenant leak, incorrect persisted financial result, lost acknowledged write, inaccessible core journey, uncontrolled paid-call fan-out or misleading action confirmation blocks promotion and pauses affected admissions immediately. Sustained common SLO failure pauses expansion; identify the limiting system and rerun failed evidence after remediation. Staff explicitly record go/hold/rollback with evidence and feature scope. M1–M5 preview acceptance, full M7 engineering readiness and client contractual approval remain separate records.

## Decisions and external prerequisites

- Confirm whether the 2,500-person beta begins in native clients, web, or both; this determines M8 distribution readiness, not backend traffic assumptions.
- Confirm pilot recruitment/access needs, supported device/browser matrix, support owner, support hours and incident responder. A staffed promise is not created by a dashboard alone.
- Confirm minimal staff capabilities and who can publish/revert each source; sponsorship admin remains excluded.
- Obtain actual provider quotas/credentials, source freshness expectations, infrastructure/backups/alert access and a reviewed operating budget before provider/capacity acceptance.
- Confirm production feature scope and client acceptance schedule; excluding M6 can enable an honestly labelled early preview but does not silently waive signed scope.
- Clarify 10,000-user and 300,000-active-user activity/concurrency definitions before later expansion campaigns. Mobile caching changes action rates; native clients still share the same backend and provider limits.

The M7 win condition is an observed, readable and recoverable product release with traceable acceptance evidence, followed by controlled expansion. This document itself closes no release gate.
