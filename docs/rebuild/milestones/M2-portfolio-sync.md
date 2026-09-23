# M2 — Portfolio Sync & Visualization

Status: proposed PRD and implementation plan; no acceptance claimed. Reviewed 2026-09-22.
Authority: signed agreement §2.1, PDF page 1; $4,500 CAD milestone.
Priority: first real product vertical slice after M1's identity, API, tenant isolation, CI, and job foundation.

## Outcome and scope

A signed-in user can create and revisit multiple portfolios, bring actual holdings in through a brokerage, CSV, or manual entry, and inspect an accurate interactive allocation chart with understandable freshness and currency.
The signed deliverables are SnapTrade integration naming WealthSimple, Questrade, Moomoo, Webull and 20+ brokerages; CSV fallback; manual entry; interactive pie chart; multi-portfolio support.
XLSX holdings import is a recommended continuation of the existing UI, not a separately stated M2 contractual deliverable; M2.5b explicitly requires XLSX for a different admin workflow.
Engineering recommendations below make those features reliable: preview/commit, immutable snapshots, decimal arithmetic, retry-safe jobs, and explicit missing-data states.
Non-goals: placing trades, tax reporting, computing investment performance from incomplete transactions, shared household permissions, continuous streaming quotes, and M6 rebalance advice.
Broker connectivity is read-only for this product. Existing trade-execution copy must not survive into a real holdings journey.

## Verified current evidence and salvage decisions

Paths beginning `feature/` below mean `.claude/worktrees/portfolio-import/` on `feat/portfolio-import`; other paths describe the current planning branch's unchanged application inherited from `master` at `4dbf440`.

| Evidence | Actual behavior | Decision |
| --- | --- | --- |
| `robo-advisor/src/views/Portfolio.jsx:5`, `:25`, `:92` | Static fixtures; file picker; Import button has no handler | Reuse visual design selectively; replace journey and data plumbing |
| `feature/robo-advisor/src/views/Portfolio.jsx:5`, `:92` | Still reads fixtures; Import button still has no handler | Do not mark UI import integrated |
| `feature/robo-advisor/src/context/DemoProvider.jsx:33`, `:58` | Callable preview/commit actions parse then replace in-memory rows | Salvage interface ideas and pure functions; not persisted import acceptance |
| `feature/robo-advisor/src/context/DemoProvider.jsx:73` | Connect/sync/disconnect return simulated results | Keep solely in explicitly isolated demo fixtures |
| `feature/robo-advisor/src/context/LiveProvider.jsx:1` | Passthrough stub | Replace with real API queries and mutation state |
| `feature/robo-advisor/src/lib/demoParse.js:5` | Reads entire first sheet; first row with two cells becomes header | Rework for bounds, explicit sheet/header selection, duplicate headers, and server validation |
| `feature/shared/mapping.js:5`, `:19`, `:95` | Header synonyms, five presets, numeric parsing and warnings | Salvage as test fixtures; migrate to typed, versioned adapters |
| `feature/shared/mapping.js:10`, `:121`, `:172` | `bookvalue` maps to per-share cost; absent currency becomes CAD; all rows become ETFs | Remove these guesses; distinguish total cost from unit cost and resolve currency/instrument explicitly |
| `feature/shared/mapping.js:144`, `:154` | Rejects nonpositive units; duplicates keyed by symbol alone | Specify short/cash/zero-position policy; identity includes account and listing |
| `feature/robo-advisor/src/lib/derive.js:36`, `:38` | Sums currencies without FX; invents equal-weight targets | Rewrite valuation; targets belong to an explicitly saved plan |
| `feature/robo-advisor/src/lib/derive.js:64`, `:78` | Trailing income has no future-date upper bound; `yieldOnCost` divides by market value | Replace metric definitions and missing-history behavior; do not preserve misleading labels |
| `feature/supabase/migrations/20260821000001_portfolio_import.sql:22`, `:32`, `:51`, `:87` | Portfolio/account/holding/import entities and decimal columns exist | Use as design input; migrations are not evidence of a live working application |
| Same migration `:34`, `:35`, `:53`, `:54`, `:75` | Separate ownership columns and FKs permit inconsistent tenant graphs; global activity external-ID uniqueness | Enforce tenant-consistent relationships; scope provider identities appropriately |
| Same migration `:100`, `:118`, `:137` | RLS and own-row SELECT; intended writes bypass RLS through service role | Reconcile with new server authorization and least-privilege repository policy before reuse |
| `feature/api/health.js`, `feature/api/_lib/env.js` | Only environment health/server-env helpers in API tree | No implemented connect, sync, import, or portfolio API |
| `feature/shared/mapping.test.js`, `feature/robo-advisor/src/lib/derive.test.js` | Useful pure-function tests; some assert defective defaults | Preserve valid cases, replace wrong expectations; not integration or tenant-safety proof |

The schema's one source per portfolio and one portfolio per account also prejudge product choices. A portfolio should group source accounts without duplicating source holdings; decide account membership rules explicitly.

## Requirements and measurable acceptance

| Requirement | Origin / required behavior | Acceptance |
| --- | --- | --- |
| M2-R01 | Signed: SnapTrade, named brokers, 20+ brokerages | M2-A01: dated client-enabled capability matrix contains at least 20 supported brokerages, explicitly resolves the four named brokers and country variants; connect/read/reconnect/disconnect evidence for each named integration available to the client; blocked access is an unresolved contractual dependency, not a passing fallback |
| M2-R02 | Signed: CSV fallback | M2-A02: visible upload → mapping → row errors/diff → commit persists only confirmed holdings; reload and a fresh session show identical quantities, values, currency, and source; malformed file changes nothing |
| M2-R03 | Signed: manual entry | M2-A03: create/edit/remove a holding in a manual account persists after reload, validates units/currency/instrument, rejects stale edits and cross-user IDs; synced positions are not silently overwritten |
| M2-R04 | Signed: interactive pie chart | M2-A04: selecting a segment or equivalent keyboard-accessible table row reveals its holdings/value/share; chart and table agree with the published snapshot, documented FX, and rounding tolerance; unknown valuations are disclosed |
| M2-R05 | Signed: multi-portfolio | M2-A05: create two portfolios, name/select/revisit them by route, assign allowed account memberships, and observe distinct totals; navigating/reloading never mixes selected portfolios or includes an account twice in one total |
| M2-R06 | Engineering: numeric/provenance correctness | M2-A06: CAD 100 plus USD 100 at 1.35 CAD/USD gives CAD 235 with rate source/time; missing FX yields an incomplete total rather than CAD 200; zero and unknown values remain distinct |
| M2-R07 | Engineering: atomic and idempotent ingestion | M2-A07: repeated commit/webhook/retry creates one publication; interrupted or partial provider pagination preserves last complete snapshot; delayed jobs cannot overwrite newer data |
| M2-R08 | Engineering: isolation and lifecycle | M2-A08: user B cannot read/change A's portfolio, account, preview, file, job or connection through any route/API; internal workers cannot publish a mismatched ownership graph; disconnect cancels future refresh and late publication |
| M2-R09 | Engineering: operation and truthful state | M2-A09: provider failure, stale data, revoked consent, empty portfolio and incomplete valuation are distinguishable; supported retry/reconnect paths recover without manual database edits |
| M2-R10 | Later dependency extension, not added signed M2 scope: authoritative target adoption before M4 adoption/M6 | M2-A10: explicit confirmation applies one owned validated plan/manual target revision atomically; stale revision, duplicate retry, changed eligibility and cross-user reference cannot corrupt or duplicate targets; M2 emits the single adoption event |

Each signed deliverable maps to R01–R05 and A01–A05. A06–A09 are release protections, not replacements for contracted features.

## Main journeys and exceptional states

1. An authenticated user reaches `/app/portfolios`, creates a named portfolio with base currency, then chooses connect, upload, or manual entry.
2. Connect opens a server-created SnapTrade portal session; browser completion is a navigation hint, not proof of synced data. Server verification schedules initial ingestion.
3. The user sees discovered accounts, their type/currency, selection or membership controls, progress, and last successful as-of time. Holdings appear after a complete validated publication.
4. Upload selects file/sheet/header, displays mapping and parse confidence, requires ambiguous currencies/cost fields to be resolved, and shows added/changed/removed rows before explicit commit.
5. Manual entry selects or identifies an instrument/listing, quantity, price/value and timestamp, currency, and optional cost basis; unknown instruments remain explicit, not guessed ETFs.
6. Portfolio switching updates route, query identity, table/chart, source summary and freshness together. A refresh survives navigation; returning displays persisted job status.

Permission failure leads to a safe route and clear sign-in/access state; errors never disclose another user's record existence.
First-use empty, true zero balance, no history, unknown valuation, stale-but-usable data, and provider outage have different messages and allowed actions.
CSV preview reports row/column errors and exclusions; a file with no valid holdings cannot erase an account. Replacement mode must show deletions explicitly.
Sync partial failure displays the retained snapshot with stale status; reconnect preserves account mapping where provider identity is stable.
Disconnect explains the affected connection and all its accounts. Hiding one account is distinct from revoking an entire broker connection.
Dialogs trap/restore focus; all import controls have labels and keyboard operation, errors are announced, charts have table alternatives, and color is never the sole status cue.

## Architecture and ownership

Web/mobile → `/api/v1` portfolio endpoints → application services → tenant-scoped repositories.
Provider callbacks/import requests → bounded job queue → adapter/validation → atomic snapshot publication → read models and status events.
M1 owns authentication, API envelope/error conventions, authorization context, secrets, database migration tooling, queues, audit logging, and tracing.
M2 owns `portfolios`, `broker-connections`, `holdings-ingestion`, `valuation`, and their user-facing routes, domain invariants and worker handlers.
Web uses the auth SDK for identity; product reads/writes go through the versioned API. Do not leak privileged database or SnapTrade credentials to clients.
Application services derive tenant identity from the verified session, authorize every supplied resource ID and enqueue only validated tenant/resource references.
Repositories enforce the same ownership graph, including privileged background operations; use RLS where applicable as an additional protection, not a substitute for service checks.

Conceptual records:

- Portfolio: owner, name, base currency, lifecycle/version; account membership is explicit and governed by the chosen grouping rule.
- Brokerage connection: owner, provider identity, secret reference, consent/status, disabled reason; separate from each brokerage account.
- Account: owner, connection or manual/import source, external ID, type, currencies, visibility; a connection can contain multiple accounts.
- Instrument identity: provider ID/raw symbol plus exchange/listing/currency; optional mapping to M2.5a catalogue ID without requiring every holding to be a catalogue ETF.
- Holdings snapshot and positions: account, source version, quantities, original currency/value, cost semantics, as-of/received timestamps, validation completeness.
- Import job/preview: owner/account, file hash/private object reference, parser and mapping versions, validated rows, expiry, diff, commit token and result.
- Sync job: deduplication key, generation, cursor/checkpoint, retry state, attempt time, outcome; operational metadata is separate from public portfolio data.
- FX snapshot/valuation result: rate direction/source/as-of, original and base totals, missing constituents, computation version.

API proposals: portfolio list/create/detail/update; account-membership mutation; broker capability listing; connection portal/reconnect/disconnect; sync request/status; import preview/status/remap/commit; manual position mutation; paginated positions and allocation summary.

Before M4 target adoption/M6, add M2-owned `PortfolioTargetRevision` and `TargetAdoption` with owner-consistent portfolio/plan references, exact weight representation, explicit confirmation, expected prior revision, idempotency digest and audit result. `POST /api/v1/portfolios/:portfolioId/target-adoptions` authorizes, revalidates the proposed source and commits target revision plus `portfolio.targets_adopted.v1` outbox event atomically. M4 retains only the resulting reference. Direct Data API commands must enforce these invariants too; no unrestricted client writes to target state. This extension does not delay acceptance of the separately signed M2 deliverables.
Example resource roots: `/api/v1/portfolios`, `/api/v1/broker-connections`, `/api/v1/import-jobs`; stable contracts precede component rewrites.
Mutations carry an idempotency key; edits/commit require the expected account or preview version. Server revalidates persisted normalized rows rather than trusting a client-sent replacement payload.
Events include `PortfolioCreated`, `ImportPreviewReady`, `HoldingsSnapshotPublished`, `SyncFailed`, and `ConnectionDisabled`; downstream consumers process duplicates safely.

## Ingestion, math and provider policy

Retain native numeric precision through validation and decimal calculations; serialize decimal API fields consistently and round only at documented display/settlement boundaries.
Require explicit currency or a user-confirmed account default. Do not add native CAD and USD amounts, infer exchange from a ticker suffix alone, or equate missing history with zero income.
Book value is a total cost basis unless its documented format says otherwise; average cost is per unit. Preserve either independently and derive only with validated quantity/currency.
Track cash distinctly, reconcile it against broker totals without double counting, and specify whether allocation includes cash. Unsupported shorts/options/crypto remain visible as unsupported or excluded-with-reason.
Missing price is not zero. Allocation denominator includes only the documented eligible valued holdings, with coverage disclosed; no implied full-portfolio accuracy when coverage is incomplete.
Income metrics distinguish actual received cash, trailing distribution rate, estimated future income and yield on cost; M2 does not invent an M2.5b distribution feed or M4 target allocation.
Async imports have byte/row/expanded-archive/time limits, private short-lived source storage, resumable status, and parser isolation; do not load unlimited workbooks on the main UI thread.
Fetch all required provider pages before publication. A successful empty snapshot requires an explicit complete response, not a timeout/parse failure interpreted as empty.
Queue per-connection refreshes with bounded concurrency, backoff/jitter, provider-aware rate budgets, retry caps and dead-letter replay. Coalesce simultaneous refresh requests.
Validate provider callback authenticity using the selected provider mechanism; deduplicate delivery, reject replay/outdated generations, and never publish after consent revocation.
Refresh frequency is a product/cost decision based on the client's SnapTrade plan, not an unrestricted refresh button.

## Dependencies and downstream guarantees

M1 acceptance must cover session verification, private storage, tenant-safe repository conventions, API contract generation, job execution/retries, and operational visibility before live ingestion ships.
M2.5a supplies published instrument metadata and aliases; M2 starts with provider/manual identities and nullable catalogue matches, so work need not wait for every ETF to be normalized.
M2.5b owns public per-unit distribution history and scheduled dates. M2 owns a user's broker cash activities; do not merge these into one ambiguous `distributions` table.
M3 receives a versioned valuation and explicit assumptions; it must remain usable with manual inputs and cannot rely on fabricated yield figures.
M4 owns saved goals and proposed plan allocations. M2 owns authoritative portfolio target revisions and the explicit target-adoption operation; it also supplies actual positions, never an invented equal-weight target. M6 consumes actual-versus-adopted-target snapshots without trade execution.
M5 receives an authorized, minimal portfolio context with source/freshness and explicit unknowns; it must not query arbitrary user IDs or compute portfolio arithmetic in an LLM.
M8 reuses the same API, resource ownership and async status contracts; routing/UI implementations remain platform-specific.

## Ordered slices and win conditions

| Order | Reviewable slice | Win condition / prerequisite |
| --- | --- | --- |
| 0 | Broker capability and commercial-plan spike | Dated named-broker/20+ evidence, country/account coverage, required approvals, refresh limits and cost model; begin external dependencies while M1 is built |
| 1 | Typed portfolio/account/valuation domain and API contract | Financial golden cases and tenant graph invariants pass; M1 API/auth/repository conventions accepted |
| 2 | Real manual portfolio vertical slice | Create → manual holding → chart/table → reload → second portfolio works for two isolated users; no dummy data enters live routes |
| 3 | Persisted CSV preview and atomic commit | A02/A07/A08 pass from visible UI; replacement/merge behavior and audit trail are explicit; add XLSX adapter afterward if retained |
| 4 | SnapTrade adapter and connection lifecycle | Real enabled broker connects, ingests complete snapshot, reconnects and disconnects; credentials/callbacks stay server-side |
| 5 | Background refresh and named-broker expansion | Failure/retry/rate-budget tests pass; capability matrix and all contracted named-broker evidence resolved |
| 6 | Accessible allocation and freshness polish | A04/A06/A09 pass with mixed currencies, missing prices, long holdings lists and mobile layout |
| 7 | Acceptance, load and recovery demonstration | A01–A09 linked to reproducible evidence; operational runbook and rollback drill pass |
| 8, before M4 adoption/M6 | Authoritative target-revision and adoption extension | A10 passes with a reviewed M4 proposal/manual fixture; own-user success, repeat/conflict/cross-user/changed-eligibility tests pass; exactly one committed target revision/event, no trade |

Do not implement all broker adapters, valuation, UI, and schema independently before agreeing entity/API semantics. Do not parallelize writes to the same account aggregate without ownership/version invariants.
Manual entry and CSV provide early real value but do not waive SnapTrade acceptance. M3–M5 may develop against agreed typed fixtures after slice 1, while production use waits for truthful input guarantees.

## Verification and release gate

Domain fixtures cover mixed currency, fractional quantities, total versus unit cost, zero versus unknown values, duplicate listings/accounts, cash, unsupported assets, rounding, stale FX, and dates at the trailing window's upper/lower boundary.
Import corpus covers actual authorized broker exports, delimiter/encoding variants, duplicate headers, title rows, multiple sheets, malformed values, formula cells, huge/zip-expanded files, and rows a user excludes.
Integration tests use the real API and a local/staging database to prove atomic publication, rollback on failure, optimistic concurrency, repeat commit, owner-consistent FKs and direct RLS behavior where exposed.
E2E tests use the visible controls and fresh sessions: two portfolios, manual edits, CSV mapping/preview/commit, refresh, reconnect, disconnect, keyboard navigation and denied cross-user deep links.
Provider tests combine deterministic recorded/synthetic failure fixtures with authorized real broker smoke tests. A mock provider alone cannot establish brokerage availability.
Failure drills cover 429s, expired secrets/consent, duplicate/out-of-order callbacks, partial pagination, worker death before/after publication and a revocation during active ingestion.
User-confirmed beta is 2,500 users with approximately 1,000 online. The canonical workload and seed cardinality are in `../CAPACITY_AND_RELIABILITY.md`: proposed 100 aggregate reads/s + 10 writes/s, reconnect burst and mixed-job soak. Add an M2-specific 1,000-job burst with provider calls bounded separately; this must not starve ordinary reads. These are planning inputs, not measured supported capacity. Apply the shared mobile/web readability requirements in `../PRODUCT_EXPERIENCE.md`.
Shared API objectives apply: p95 portfolio reads <=500ms and unexpected 5xx <0.5% under the declared beta profile, recording end-to-end and server latency separately. Measure queue age and completion against the chosen refresh promise, not an invented universal provider SLA.
For 300,000 active users, first define daily/monthly active versus concurrent users; benchmark with realistic account/position/history cardinality, indexes, pagination, worker throughput and provider economics before asserting readiness.
Release requires all A01–A09 evidence, no unresolved ownership or numeric correctness failures, accepted named-broker dependencies, and a usable support/recovery runbook.
Observe sync success and age by broker, missing valuation coverage, import reject/commit rates, queue retries/dead letters, p95 reads, provider requests and cost per connected user; redact account numbers/files/secrets from logs.
Roll out per broker and user cohort; disable new sync/import commits independently while preserving readable last-good snapshots. Keep backward-compatible API fields and replayable versioned import metadata through rollback.

## Open decisions and external prerequisites

Product must choose account-to-portfolio membership (exclusive or reusable grouping), default portfolio behavior, cash allocation, short/unsupported-asset presentation, import replacement versus merge, and disconnect retention/deletion policy.
Agree base currencies, authoritative FX source/licensing, FX freshness tolerance, precision/rounding, and allowed manual valuation age before acceptance arithmetic is finalized.
Obtain the client's SnapTrade commercial access, broker enablement, authorized test accounts, geographic scope and retention/cost budget. Do not ask users to supply brokerage passwords to this application.
The contract's “Webull” and “Moomoo” need specific regional entities; “20+” requires a dated enabled/available list, not merely installed SDK dependencies.
SnapTrade's official FAQ states certain brokers including Questrade require application enablement and explains that one connection can contain multiple accounts; therefore a per-account remove action cannot silently revoke the whole connection. [FAQ](https://docs.snaptrade.com/docs/faq)
Use the provider's supported-institution matrix plus authenticated capability verification for acceptance; this audit has not called the client's brokerage API or established the enabled count. [Support matrix](https://support.snaptrade.com/brokerages), [Get brokerages](https://docs.snaptrade.com/reference/Reference%20Data/ReferenceData_listAllBrokerages)
