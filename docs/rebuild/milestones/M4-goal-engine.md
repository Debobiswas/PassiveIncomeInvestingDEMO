# M4 — Goal Engine & Sample Portfolios

Status: proposed PRD, not implemented or accepted. Authority: signed agreement page 2, §2.2, M4 ($2,500 CAD).
Contractual deliverables: goal wizard, AI portfolio generator, plain-English rationale, and save/revisit functionality.
Reviewed baselines: `master` at `4dbf440` and independent `feat/portfolio-import` at `f3b65e2`. Source documents remain unchanged.

## Outcome and scope

A member describes an income goal, reviews a constrained educational portfolio proposal with understandable reasons, saves it, and reopens the same version on another device. A proposal is not a brokerage order or a guaranteed income outcome.
The user now prioritizes mobile, with equivalent web behavior and especially readable presentation for older users. Private beta planning is 2,500 users with approximately 1,000 online simultaneously; launch/growth scenarios remain separately measured. Native delivery belongs to M8, but M4 contracts and journeys must work across both clients.
The contract's AI generator requires an actual model invocation in the accepted journey. A deterministic template selector alone does not fulfill it. Deterministic rules constrain and validate model proposals; AI supplies bounded candidate selection and explanation rather than authoritative arithmetic or unverified facts.
Engineering requirements below add reproducibility, tenant isolation, trustworthy math, failure handling and cost control. They are proposed release gates, not additional claims about the signed wording.
Non-goals: order execution, tax advice, unrestricted security research, a general autonomous investing agent, live market-data sourcing, full M5 retrieval infrastructure, and a second forecasting engine.

## Current implementation evidence

All paths below are relative to the repository root; feature paths are prefixed with `.claude/worktrees/portfolio-import/`.

| Evidence | Consequence | Treatment |
| --- | --- | --- |
| `robo-advisor/src/views/Plan.jsx:7` imports goals, portfolio totals and sample portfolios from fixtures | User-visible goals are not owned persisted records | Keep fixtures only in the explicit demo adapter |
| `robo-advisor/src/views/Plan.jsx:16` defines four local questionnaire prompts; `:663` stores answers in component state | No durable questionnaire/version or cross-device resume | Reuse language only after content review; implement versioned persisted answers |
| `robo-advisor/src/views/Plan.jsx:137` selects fixture index using only risk; `:155` calls this an AI match | No actual AI generator; other questionnaire answers do not influence matching | Replace selection and claim; retain useful presentation concepts |
| `robo-advisor/src/views/Plan.jsx:147` assumes 12% yield and $500/month contributions | Results do not follow user inputs or M3 assumptions | Remove this financial logic; consume M3 forecast snapshots |
| `robo-advisor/src/views/Plan.jsx:260` records timeline, but `:288` passes only risk/income into the result | Timeline choice is disconnected from output | Add tests demonstrating each material input affects validation/result or is explicitly informational |
| `robo-advisor/src/views/Plan.jsx:277` completes wizard by setting local state; `:209` always selects fixture goal zero | No save, revisit, revision or real progress | Implement private goal/plan persistence and direct routes |
| `robo-advisor/src/data/dummy.js:252` defines three sample fixtures and illustrative target yields | No validated workbook/model revision lineage | Consume M2.5a published templates; do not import these fixtures as production models |
| Feature `robo-advisor/src/views/Plan.jsx:137`, `:277`, `:288` retain the same behavior | Auth/routing work does not complete M4 | Port only reviewed route/auth foundations |
| Feature `robo-advisor/src/App.jsx:34` exposes one `plan` route; `robo-advisor/src/context/LiveProvider.jsx:1` is a passthrough | No directly addressable saved goal/plan journey | Add explicit goal and revision routes |
| Feature `supabase/migrations/20260821000001_portfolio_import.sql:5–87` defines profiles/broker portfolio tables but no goal/plan records | No persistence or ownership contract for M4 | Add reviewed M4 schema incrementally after foundation; do not modify the independent worktree |

## Requirements and acceptance

`C` denotes contracted output; `E` denotes proposed engineering acceptance. Record actual test/demo evidence against these stable IDs.

| Requirement | Acceptance |
| --- | --- |
| M4-R01 [C] Goal wizard | M4-A01: an authenticated member enters goal amount/currency, timeframe, capital/contributions and approved preference questions, reviews answers, saves a draft and resumes on a second authenticated device without losing committed values |
| M4-R02 [C] AI portfolio generator | M4-A02: a real configured model proposes from an explicitly supplied eligible catalogue/template snapshot; a successful result records provider/model/prompt version and passes every deterministic constraint; a provider stub or risk-only lookup cannot satisfy this acceptance |
| M4-R03 [C] Plain-English rationale | M4-A03: result explains why the proposal fits recorded preferences, its principal tradeoffs and unmet goals, using supported facts; no invented fund, return, guarantee or tax claim survives validation; Client reviews representative examples |
| M4-R04 [C] Save and revisit | M4-A04: save creates a durable immutable plan revision, reopen by direct URL after logout/login on another device reproduces its inputs/weights/rationale/versions, and the member can create a new revision without changing the prior one |
| M4-R05 [E] Shared deterministic rules | M4-A05: fixtures establish eligibility, exact weight totals, permitted currencies, exclusions and approved concentration limits; M3 independently calculated examples match the displayed forecast; infeasible requests return an explanation rather than relaxed constraints |
| M4-R06 [E] Provenance and stale state | M4-A06: catalogue publication, template change, archived constituent, changed questionnaire or new portfolio snapshot marks affected plans appropriately; viewing old plans never silently regenerates them |
| M4-R07 [E] Ownership and explicit adoption | M4-A07: user A can save/read their own goal and user B cannot read/write/generate/apply it through API or database; saving never overwrites portfolio targets; explicit adoption validates ownership and expected target revision |
| M4-R08 [E] Bounded reliable AI | M4-A08: repeated request key yields one logical result; malformed responses, timeout, throttling, budget exhaustion and worker retry end in observable states without creating duplicate saved revisions or exposing partial allocations |
| M4-R09 [E] Readable accessible journey | M4-A09: complete wizard/result/revisit with keyboard and screen reader, at 360px width and 200% zoom, without hidden essential content; readable body text, explicit currency, visible focus and adequately sized controls pass design QA |
| M4-R10 [E] Operability | M4-A10: workload/failure tests record API latency, queue wait, generation completion/failure and cost on declared infrastructure; quotas preserve existing saved-plan reads during provider saturation |

## Primary journey and states

1. Open `/app/goals` or create `/app/goals/new`; explain the educational purpose and distinguish goal amount from expected return. A brokerage connection is optional.
2. Enter explicit reporting currency, desired monthly income and date/horizon, starting capital, contribution assumptions, residency/account inputs needed by M3, and approved risk/preferences/exclusions. Numeric input accompanies any slider; never encode choices only through color.
3. Save/resume a draft. Review all assumptions before generating; show whether capital came from a dated M2 snapshot or explicit manual input. Do not infer tax residency from listing country.
4. Generate once on deliberate action. The result page tracks a resumable job; leaving/backgrounding the app does not cancel durable work or trigger another model call on return.
5. Review candidate constituents/weights, source/model dates, deterministic forecast and rationale. If the goal is infeasible, show which assumptions conflict and let the user edit them; never raise yield/risk silently.
6. Save the selected proposal as a plan revision. Revisit `/app/goals/:goalId/plans/:planId` to see the exact saved result; compare subsequent revisions as separate records.
7. If the user chooses to use the plan for tracking, show target changes and request an explicit confirmation. Adopt only after current eligibility/ownership/version checks; this changes tracked targets, not holdings or trades.

An empty catalogue or no eligible model is a distinct unavailable state, not a default equal-weight portfolio. Missing answers, unknown source attributes and expired sessions have actionable messages.
Generation states: queued, running, validating, succeeded, failed, cancelled or expired. Rationale failure leaves a labeled incomplete generation, never a fully accepted AI plan. Save draft remains available during provider outage.
User cancellation stops queued work and suppresses adoption of a late response; in-flight vendor work may still incur cost. A changed draft does not mutate the input snapshot already being generated.
Offline clients can read an approved locally cached saved result under the M8 storage policy and retain an unsent draft, clearly marked. Server acknowledgement is required for “saved”; do not optimistically claim persistence.
Use one focused question group per step, plain labels and a short result summary before detailed assumptions. Proposed baseline: 16px body text, 44px primary touch controls, textual chart equivalents and no tiny low-contrast financial caveats. Usability review must include representative older members; these are engineering targets, not evidence already collected.

## Responsibilities and data contracts

`goal UI → authenticated goal service → immutable input/source snapshot → eligibility/constraint service → bounded AI proposal → deterministic validator + M3 forecast → validated rationale → saved plan revision → optional explicit target adoption`

Goal module owns private goals, draft revisions, generation requests and proposal/rationale revisions; it retains only references to M2 adoption results. Catalogue module owns published fund/model identities; M3 owns forecasts; M2 owns portfolio targets, authoritative adoption records and snapshots. No UI reaches directly into another module's tables.

| Entity | Required responsibility |
| --- | --- |
| Goal / GoalDraftRevision | Owner, stable ID, label, status, explicit values/units, questionnaire schema and answer revision, optimistic version, created/updated timestamps |
| GoalInputSnapshot | Immutable normalized answers, capital/contribution assumptions, optional portfolio snapshot, currency/FX provenance where used, constraint-policy version and source release IDs |
| GenerationRequest | Owner/goal/input ID, idempotency digest, job state, attempts/deadline, quota reservation, actual provider/model identifier and prompt/schema versions |
| GeneratedPlanRevision | Ordered stable listing IDs and decimal weights; optional explicit cash; source/template revisions, constraint results, M3 forecast ID/formula version, generation provenance and selected/saved status |
| RationaleRevision | Approved text/structured explanation, evidence references and claim-validation results, source/model/prompt versions; private retention policy applies |
| AdoptionReference | M2-owned adoption ID/result, owned portfolio ID and new target version. M2 stores the authoritative prior/new targets, actor/confirmation and transaction result; M4 must not duplicate that writer. No brokerage-order identifier |

All member records enforce ownership through the verified actor, API authorization and database policies/constraints. Child rows cannot point at a different owner's goal/portfolio. Internal jobs and provider payloads remain server-only.
Keep generation input snapshots sufficient to explain/recompute deterministic results without promising identical model output on rerun. Model nondeterminism means saved validated output is the historical record.
Canonical listing IDs, exchange/currency and fund revisions come from M2.5a. Never resolve by ticker alone. Missing risk/eligibility attributes cannot be inferred by the model to bypass constraints.
Approved constraint policy defines eligible types, exposure/concentration bounds, exclusions, currency handling, cash convention and unsupported combinations. Version it. This is a small explicit rules/feasibility service initially, not a speculative generalized optimizer.
Model may propose only eligible IDs and schema-valid decimal weights. Validator rejects duplicates, negative/nonfinite weights, unsupported IDs and any hard constraint violation; total must equal the chosen exact unit (e.g. 10,000 basis points). Rounding/residual allocation follows a documented deterministic rule.
No weighted yield calculation from workbook marketing targets. Forecasts use M3 definitions and versioned assumptions, with M2.5b observations only where their coverage/date/currency support that use. Missing data stays unavailable.
Rationale receives the already validated plan and approved fact set. Numeric claims use structured references to deterministic facts rendered by the server; unsupported free-text factual/financial claims are rejected or rewritten within the bounded attempt budget.

## API and asynchronous boundary

Proposed `/api/v1` endpoints, finalized in the shared registry:

- `POST /goals`, `GET /goals`, `GET /goals/:goalId`, `PATCH /goals/:goalId`: bounded validated draft operations; writes require expected revision and return authoritative persisted version.
- `POST /goals/:goalId/generations`: explicit input revision and idempotency key; validates ownership, data readiness, quota and request digest, creates snapshot/job atomically, returns `202` and generation resource.
- `GET /goals/:goalId/generations/:generationId`: owned status/progress and safe terminal reason; bounded client polling backs off and pauses in background. Resume reads existing state.
- `POST /goals/:goalId/plans`: saves a validated owned generation outcome idempotently; `GET /goals/:goalId/plans/:planId` returns immutable output plus separately computed freshness status.
- `POST /portfolios/:portfolioId/target-adoptions`: M2-owned mutation accepts owned plan revision, explicit confirmation and expected current target revision; conflicts require review, never last-write-wins.
- Cancellation/archive/delete semantics follow M1 privacy/retention contracts; no client chooses another owner's ID as authority.

Queue execution is at-least-once. Lease claims, persisted stage completion and transactional finalization prevent duplicate database effects. A provider timeout can leave billing ambiguous; use provider idempotency if supported and a finite attempt budget, never claim exactly-once model charges.
Emit `goal.draft_saved.v1`, `goal.generation_completed.v1` and `goal.plan_saved.v1` through the shared outbox only where downstream work requires them. M2 alone emits `portfolio.targets_adopted.v1`; M4 consumes or references its result. Events carry IDs/versions, not personal answers or full rationale text.
The M1 AI adapter supplies authentication, secrets, deadline/cost/quota instrumentation and provider contracts. First genuine provider integration lands in the M4 implementation sequence before M4-A02 can pass. M5 later extends the same adapter with retrieval; no circular M4→M5 dependency.

## Dependencies and guarantees

- M1 gates production work: persisted identity/onboarding, typed API and client cache conventions, trusted jobs, migrations, telemetry and AI boundary. Do not implement another auth/queue/provider stack.
- M2 is optional for initial manual-input goal creation but required for importing an owned capital snapshot or adopting portfolio targets. Contract with M2 must identify target ownership and version checks before adoption is implemented.
- M2.5a is a hard dependency for validated catalogue/model revisions and eligibility attributes. M4 cannot treat fixture examples as source content.
- M2.5b supplies optional factual distribution inputs; M3 owns whether a forecast has sufficient data. Full M1–M5 completion still includes both M2.5 milestones.
- M3 is a hard dependency for forecast/goal arithmetic, tax/inflation assumptions and milestones. Goal progress is derived from an identified observation; a saved target is not evidence of progress.
- M4 establishes the first versioned goal-questionnaire/answer contract and owns its answers/snapshots. M5 extends it with advisor-specific questions and owns RAG corpus/content; it may explain a saved plan with explicit authorization. It must not silently change answers, plans or target allocations. M4 does not wait for unfinished M5 content to define its required questions.
- M6 consumes explicitly adopted target versions; unsaved/generated proposals are not target allocations. M8 consumes the same APIs and errors, without a second rules engine.

## Ordered implementation slices

| Order | Reviewable slice | Win condition |
| --- | --- | --- |
| 1 | Approve wizard fields, question ownership, constraint/fact definitions and source contracts | Concrete feasible/infeasible examples reviewed with M2/M2.5a/M3/M5; no unspecified high-yield defaults |
| 2 | Persist goals and drafts with routes and revision checks | A01 and own-user/cross-user portion of A07 pass; save/resume works before generation exists |
| 3 | Implement snapshot builder, eligibility/feasibility and M3 forecast integration | A05 passes against independent examples; incompatible/unknown inputs fail explicitly |
| 4 | Implement actual shared AI adapter, structured proposal and rationale validation | A02/A03 pass with real provider evidence plus deterministic adversarial fixtures; no M5 retrieval required |
| 5 | Add durable generation, quota/idempotency and terminal-state UX | A08 passes under retries, timeout, app background/resume and cancellation |
| 6 | Save/revisit immutable plans, stale state and readable result journey | A04/A06/A09 pass on second-device sessions and direct URLs |
| 7 | Add explicit M2 target adoption and operational release gates | Remaining A07/A10 pass; existing targets remain intact after every failed/conflicting adoption |

Schema changes and UI extraction stay separate from financial-rule changes where practical. Prompt tuning can proceed on approved synthetic snapshots after contracts stabilize; it cannot compensate for missing deterministic validation.
Do not ship the existing fixture matcher with a new AI label while the provider work waits. A disclosed non-AI sample browser is useful degraded behavior but does not close contractual A02/A03.

## Verification, capacity and release

Domain tests: same ticker/different listing; excluded/archived fund; duplicate/negative weights; exact total and rounding; mixed CAD/USD without FX; missing risk attributes; infeasible limits; unknown distributions; zero contribution; already-met goal; stale source; changed answer revision. Use independent M3 examples, not formulas copied from the implementation.
Real isolated database integration proves owner success and cross-user denial for goals, child plans/jobs and target adoption; also forged ownership, concurrent edits, idempotency digest conflict, repeat job delivery, transaction failure and account deletion while a job is running.
Provider-contract fixtures include invented listing, out-of-range weight, malformed JSON, instruction-like catalogue text, guarantee/unsupported tax claim, response truncation, timeout and quota denial. A documented real-provider smoke/evaluation run establishes actual integration; mocks alone cannot satisfy A02.
Browser journey: create draft → reload → resume → generate → navigate away/resume → review → save → log out → reopen on second session → see original snapshot after catalogue update → explicitly adopt. Include no broker, no eligible candidates, denied second user, slow network and keyboard/screen-reader execution.
Beta assumption is 2,500 accounts and 1,000 simultaneous online sessions, not 1,000 simultaneous model calls. Mobile can produce foreground refresh/retry bursts; platform choice alone does not reduce server traffic. Coordinate a declared request mix with `CAPACITY_AND_RELIABILITY.md`.
Proposed M4 load cases: 1,000-session normal read mix; 50 generation submissions in one minute; a 1,000-submission overload burst proving bounded admission/queue/provider concurrency and responsive saved reads. Test with simulated provider timing for scale, then limited real-provider runs for latency/cost accuracy; do not spend on an unbounded live burst.
Initial proposed targets: saved-plan reads p95 <500ms under agreed normal load; generation admission/status p95 <750ms excluding network; admitted normal-load jobs reach terminal state within 60 seconds p95. Provider capacity and budget may require revising these targets before acceptance; record queue wait separately from inference time and never promise these numbers without evidence.
Budget policy must set per-user request limits, one active generation per goal, payload/token bounds, model concurrency, finite repair attempts, user/day and global/day cost caps. Repeated refresh/revisit never generates again. Reserve estimated budget before admission, reconcile actual usage and expose retry time for quota errors.
Observe generation stage latency, validation-rejection reasons, timeout/retry counts, queue age, saved-read p95/p99, adoption conflicts, provider token/cost totals and quota rejection. Log correlation IDs/version IDs, not personal balances, answers, broker identifiers or full prompts/rationale.
Data shared with the model is minimized to approved goal constraints, eligible facts and necessary forecast inputs; no identity, account credentials or unrelated holdings. Provider retention, region, consent/disclosure and deletion requirements must be resolved before using member financial inputs.
Release gate: every C acceptance demonstrated; E gates reviewed/passed; constraint/rationale examples approved; real-provider test recorded; privacy/operational prerequisites satisfied; user-facing plan claims match actual behavior. No coverage number, build success or screenshot substitutes for this journey.
Rollback disables new generation/adoption behind operational controls while saved goals/plans remain readable. Retain old schema/validator versions for historical reads; additive migrations and tested forward repair precede destructive cleanup. Reverting a prompt does not rewrite saved outputs.

## Decisions needed before implementation

Client/product owner must approve risk-question wording and selection constraints, eligible asset types, concentration/FX/cash rules, currency availability, and whether to show one candidate or alternatives. No risk label in the workbook alone establishes suitability.
Confirm how goal wizard fields and M5's guided questionnaire share one versioned answer contract without forcing users to answer twice. Confirm M2 ownership of target adoption and which portfolio snapshot drives progress.
Agree stale-plan thresholds, archived-constituent adoption policy, deletion/retention handling, provider policy/budget and supported real-model configuration. Conservative proposal: archived/ineligible constituents block new adoption but do not erase saved history.
Confirm proposed generation/latency budgets against measured provider throughput and the shared beta workload. None of these planned gates proves capacity for 300,000 active users.
