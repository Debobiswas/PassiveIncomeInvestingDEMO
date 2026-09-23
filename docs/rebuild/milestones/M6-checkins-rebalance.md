# M6 — Monthly Check-In & Rebalance

Status: proposed PRD and implementation plan; not implemented or accepted.
Authority: signed agreement page 2, §2.2; $5,000 CAD. The signed deliverables are drift detection, monthly cron jobs, AI plain-English explanations, rebalance UI, and email notifications via Resend.
Priority: after the M1–M5 release path, including M2.5a/b. Agree dependency contracts now; do not delay that path to build the full M6 scheduler or notification system.

## Outcome and boundaries

A member receives a monthly check-in, understands how actual holdings compare with the targets they explicitly adopted, and can review/save an educational rebalance plan on mobile or web. Returning later shows the same dated check-in and whether newer data has made it stale.
No order placement is included. Saving, acknowledging, copying, or viewing a plan does not modify holdings, apply targets, queue trades, or prove a rebalance occurred.
The contractual AI explanation requires an actual configured model in the accepted journey; deterministic arithmetic and a truthful non-AI fallback remain available during model failure.
Additional engineering requirements cover ownership, reliable scheduling/delivery, currency correctness, privacy and readable presentation. They are proposed acceptance protections, not changes to signed scope.
Non-goals: trading tools, automatic target adoption, guaranteed tax/fee optimization, intraday market monitoring, performance attribution without sufficient transaction/price history, and M8 push delivery implementation.
Mobile is primary; web offers equivalent behavior for members who prefer it, including older members. The beta assumption is 2,500 users and approximately 1,000 online simultaneously, not 1,000 simultaneous check-in generations.

## Verified current state

Reviewed prototype inherited from `master` at `4dbf440` and independent `feat/portfolio-import` at `f3b65e2`. Feature paths below are relative to `.claude/worktrees/portfolio-import/`.

| Evidence | Finding and treatment |
| --- | --- |
| `robo-advisor/src/views/Portfolio.jsx:105` | Hardcoded `TRADE_PLAN`; replace with a versioned calculation, preserving only useful visual layout |
| Same file `:152`, `:255`, `:269`, `:271`, `:475` | Claims trades are queued/executed through Questrade after local state changes; remove these claims and execution-shaped actions before any real member sees this flow |
| Same file `:427` | Hardcoded “outperformed/underperformed” explanation and 10% targets; neither establishes causal attribution or user intent; replace with supported observations |
| `robo-advisor/src/data/dummy.js:174`, `:187`, `:223`, `:239` | Fixture holdings, drift, past events and monthly check-in; retain only behind the explicit demo adapter |
| `robo-advisor/src/components/NotificationsPanel.jsx:3`, `:15`, `:18` | Fixture notifications and local read flags; not durable delivery or cross-device acknowledgement |
| Feature `robo-advisor/src/views/Portfolio.jsx:255`, `:271` | Same misleading queue/execution flow survives auth/import work; it must not be ported as production behavior |
| Feature `robo-advisor/src/lib/derive.js:38`, `:96` | Invents equal-weight targets then derives advice; replace with explicit adopted target input and documented drift units |
| Feature `robo-advisor/src/lib/derive.test.js:29` | Test enshrines equal-weight inference; rewrite its expected behavior instead of treating the passing assertion as correctness |
| Feature `robo-advisor/src/context/LiveProvider.jsx:1`; `api/health.js` | Live provider stub and health-only API do not implement scheduling, persistent check-ins, AI explanation or Resend delivery |

## Requirements and acceptance

`C` identifies signed deliverables; `E` identifies proposed engineering requirements. Evidence must link actual tests and demonstrations to these IDs.

| Requirement | Measurable acceptance |
| --- | --- |
| M6-R01 [C] Drift detection | M6-A01: a published M2 valuation plus explicitly adopted target revision yields independently verified percentage-point differences and dated values; missing targets produce “Set targets to track drift,” never equal weights |
| M6-R02 [C] Monthly cron jobs | M6-A02: an authenticated scheduler discovers eligible due members, creates one logical monthly run per member/period, and survives duplicate invocation, overlapping workers, a missed tick and crash/restart without missing or duplicating published check-ins |
| M6-R03 [C] AI plain-English explanation | M6-A03: actual model integration explains approved deterministic facts with recorded model/prompt/input versions; evaluation rejects invented causes, unsupported return claims, unapproved targets and trading claims; timeout leaves an explicitly non-AI summary |
| M6-R04 [C] Rebalance UI | M6-A04: member opens a check-in by direct link, reviews accessible current/target differences, saves a dated plan and reopens it after login on another device; every success state accurately says what persisted and none claims execution |
| M6-R05 [C] Resend email notifications | M6-A05: a verified test recipient receives a real Resend monthly notification linked to the owned check-in; status/callback evidence distinguishes accepted, delivered, bounced and suppressed; preferences and unsubscribe are honored before submission |
| M6-R06 [E] Ownership and target provenance | M6-A06: owner succeeds and a second user is denied through API and database; check-in/plan/source references cannot cross tenants; M4 draft/save never changes observed targets; target adoption is an explicit M2 operation |
| M6-R07 [E] Reliable effects and preferences | M6-A07: duplicate jobs/callbacks, timeout after provider acceptance, unsubscribe during queue wait, timezone change, disabled account and deletion all reach documented states with no uncontrolled resend or late private publication |
| M6-R08 [E] Financial and stale-state correctness | M6-A08: zero versus unknown values, missing FX, absent/zero target, cash, stale prices and changed source/target revision pass independent fixtures; incomplete data suppresses a misleading actionable plan |
| M6-R09 [E] Readability and parity | M6-A09: web journey passes keyboard/screen-reader review, 360px width and 200% zoom with no loss of essential content; mobile consumes identical facts/state contracts; older-member usability review finds no execution/persistence ambiguity |
| M6-R10 [E] Capacity and operation | M6-A10: shared beta API gates remain satisfied during a 2,500-member monthly enqueue exercise and provider outage; bounded queues/quotas, recovery and notification suppression have recorded evidence |

R01–R05 cover every signed output; E acceptance does not substitute for a missing contracted provider integration.

## Member journey and states

1. Member enables the monthly check-in schedule and email preference, reviews local delivery window, and sees which portfolios have adopted targets. Notification settings are distinct from security/account messages.
2. A scheduled run reads eligible portfolio references and captures current authoritative holdings/valuation and adopted-target revisions. Each portfolio reports ready, no targets, no holdings, incomplete valuation, or stale data separately.
3. A persisted check-in presents a short summary first, then a current-versus-target table and supporting chart. Show date, currency, valuation coverage, target version and threshold definition.
4. Member optionally reviews a rebalance plan calculated from that snapshot. Save/copy is explicit. “Plan saved” means the server acknowledged storage; “Copied” means the clipboard operation actually succeeded.
5. A later holdings update or target adoption marks the old plan stale. A new analysis creates a new version; historical results never silently change. Refreshing data does not imply any trade succeeded.
6. Member can acknowledge the check-in and manage notification preferences on either client. An email deep link opens the exact check-in after authentication and independent ownership verification.

Empty first-use and no-target states explain the next step without implying poor performance. A failed sync shows the last good snapshot and timestamp, not fabricated current data.
Generation states: scheduled, queued, running, ready, ready-without-AI, skipped-with-reason, failed, cancelled. Per-portfolio readiness can differ inside one member check-in.
Email states are separate: pending, submitting, provider-accepted, delivered, bounced, suppressed, failed, delivery-unknown. A published check-in remains readable when email or AI fails.
Expiry/session failure preserves the destination without exposing its contents. Offline clients show dated cached content under M8's storage policy; they cannot claim an unsent acknowledgement or preference change is saved.
Use readable body text (proposed 16px baseline), at least 44px primary targets, visible focus, simple headings and textual chart equivalents. Do not convey direction/severity only with color or hide essential assumptions in tiny copy.

## Ownership, math and records

M4 owns goal proposals and saved plan revisions. M2 owns the authoritative adopted portfolio-target revision and actual valuation snapshots. M6 reads those immutable references; it never infers adoption from a saved goal or changes targets/holdings.
The M2 target contract must include portfolio/owner, stable listing identities, decimal weights including explicit cash if supported, calculation scope, proposal lineage, actor/confirmation time, effective revision and expected-version conflict behavior.
Drift is `current weight − target weight` expressed in percentage points. For CAD 10,000 valued holdings, a CAD 6,000 position has 60% weight; against an adopted 50% target its drift is +10 percentage points and its illustrative value difference is CAD 1,000.
Distinguish a missing target from an explicitly adopted zero target. Full target coverage, cash policy, denominator and unsupported holdings must be validated before describing a full-portfolio rebalance.
Use decimal arithmetic with explicit FX source/rate/date when currencies differ. Missing FX or incomplete valuation must not become zero or silently renormalize a partial portfolio into an authoritative plan.
Thresholds specify percentage points or relative percentages explicitly, along with inclusive/exclusive boundaries and policy version. Do not preserve the prototype's arbitrary threshold as a product decision.
Initially propose value-based adjustments. Share estimates, if approved, require dated listing prices, quantity precision and an explicit rounding/residual-cash policy. No promise of self-financing after fees, spreads, taxes or price changes.
Weight changes alone cannot establish price outperformance: deposits, withdrawals, target changes and missing holdings can also alter weights. Explain observed differences; attribute causes only from sufficient validated evidence.

| Conceptual record | Owned responsibility |
| --- | --- |
| CheckInPreference | Member schedule, IANA timezone, email choice, revision, suppression state and consent/change audit |
| CheckInRun | Member, local period, schedule-policy version, due UTC instant, lease/deadline, idempotency identity and terminal reason |
| PortfolioCheckInSnapshot | Owned portfolio, valuation/target revisions, FX/completeness, drift-policy/formula versions and deterministic findings |
| ExplanationRevision | Input fact digest, model/prompt version, validation status, approved text or explicitly non-AI fallback |
| RebalancePlan | Owner, source check-in, immutable proposed value adjustments and assumptions; saved/acknowledged timestamps, separate stale status |
| Notification / DeliveryAttempt | Logical member-period-channel notification, current preference check, private payload reference, provider ID/idempotency reference, timestamps and terminal result |

Store transactional publication and notification intent through M1's outbox. Internal attempts/provider payloads remain private; events contain resource/version identifiers, not portfolio amounts or recipient addresses.

## API and asynchronous flow

`due-member scanner → leased member-period job → M2 snapshot/target reads → deterministic drift → bounded AI explanation or fallback → atomic check-in + outbox → preference-aware Resend worker → verified delivery callback`

Proposed `/api/v1` contracts:

- `GET/PATCH /notification-preferences`: actor-scoped settings with expected revision; restrict writable fields and validate timezone.
- `GET /check-ins` and `GET /check-ins/:checkInId`: bounded owned history/detail, freshness and per-portfolio readiness; no client-supplied owner is authoritative.
- `POST /check-ins/:checkInId/acknowledgements`: idempotent acknowledgement only.
- `POST /check-ins/:checkInId/rebalance-plans`: owned snapshot/version plus idempotency key; `GET /rebalance-plans/:planId` returns the saved result and current stale status.
- Internal scheduler/worker/callback endpoints use their own authenticated mechanisms, payload limits and replay defenses; they are not public user-triggered “run everyone” routes.
- Email unsubscribe is a narrowly scoped revocable signed-token action that changes only the notification category. It reveals no balances or portfolio content and must tolerate repeats.

One monthly run may contain multiple portfolio results; send one concise member digest rather than a separate email/model fan-out for every holding. Make all period boundaries explicit and exclude accidental cross-period aggregation.
Compute UTC due instants from the member's IANA timezone and a documented local schedule; define short-month/DST handling and a catch-up window. A timezone/preference edit must not produce a second digest for a period already completed.
Cron authenticates and performs bounded due-record scanning with a durable cursor/claim; it does not execute all provider calls inside one HTTP invocation. Duplicate scans converge on a unique member-period run.
Workers use renewable leases/fencing, finite deadlines, capped exponential backoff with jitter and terminal/dead-letter states. A reclaimed worker cannot publish over the current claimant or a newer completed revision.
Spread eligible runs across an approved delivery window using stable jitter and pagination. Separate interactive queues from monthly work; share provider budgets across all AI/email producers rather than inventing unlimited M6 concurrency.
Publish deterministic results even if AI quota/provider health prevents explanation; record degraded status and do not label the fallback AI. A later approved explanation can be a separately versioned enhancement without a duplicate notification.
Immediately before submission, recheck deletion, suppression, latest email preference and current verified destination. A preference edit during an already in-flight provider send cannot retract the email; record that boundary honestly.
Use a stable provider idempotency key where supported, scoped to logical notification and within verified provider retention constraints. A network timeout after send may be ambiguous; reconcile by provider reference/events before retrying, or retain delivery-unknown for controlled recovery.
Do not promise exactly-once external delivery. Transactional outbox publication prevents lost local intent; finite retries, stable IDs and ambiguity handling minimize duplicates without hiding uncertainty.
Validate callback authenticity with the provider's documented mechanism, deduplicate event IDs and handle out-of-order delivery/bounce events without regressing status incorrectly. Treat complaints/hard bounces as suppression inputs.
Use a privacy-minimized email by default: “Your monthly check-in is ready” and an authenticated link, no account numbers, holdings or balances in subject/body/URL. Avoid sensitive notification previews on locked devices.

## Dependencies and downstream guarantees

M1 supplies verified identity, runtime validation, ownership conventions, migrations, queue/outbox/leases, telemetry and shared AI/provider boundaries. M2 supplies authoritative versioned valuations and adopted targets; its refresh policy remains the only broker-sync authority.
M2.5a supplies stable listing identities; M2.5b and M3 supply any optional distribution/forecast facts under their definitions. A basic drift check must not require every optional enrichment to be available.
M4's target-adoption journey must be accepted before goal-generated targets drive M6. M5 can supply approved explanatory context later; M6 must not create another RAG corpus or delegate arithmetic to chat.
M7 uses M6 delivery/dead-letter/suppression runbooks. M8 reuses the same check-in, preference and deep-link contracts; push is a separate channel with its own permission/token lifecycle, not an assumed side effect of email enablement.
Missing future implementation does not block M1–M5 completion, but M2/M4 must settle target ownership/version semantics and M1 must support durable jobs before those contracts spread through the UI.

## Ordered implementation slices

| Order | Reviewable slice | Win condition |
| --- | --- | --- |
| 0 | Retire fake execution claims during foundation/prototype isolation; agree target contract | No live flow claims queued trades; M2/M4/M6 agree adopted-target identity and no-target behavior |
| 1 | Deterministic drift/plan module with snapshot contract | A01/A08 independent fixtures pass, with no provider/AI dependency |
| 2 | Owned persisted check-ins/plans and readable routes | A04/A06/A09 pass from actual UI across fresh sessions; saved/acknowledged never mutates holdings |
| 3 | Monthly scheduling and worker recovery | A02 passes duplicate, overlap, DST/short-month and missed-tick cases; bounded cohort rollout possible |
| 4 | Real shared AI explanation adapter and fallback | A03 passes genuine-provider evidence and unsupported-claim tests; deterministic check-in survives outage |
| 5 | Preferences, outbox and Resend lifecycle | A05/A07 pass verified test delivery, unsubscribe, bounce, callback replay and ambiguous-send handling |
| 6 | Cohort release, load/recovery drills and support handoff | A10 and shared release gates pass; alerts, pause/replay and rollback are demonstrated |

Full slices 1–6 wait behind the M1–M5 priority path. Email-domain setup and product schedule decisions can be prepared earlier without building independent competing infrastructure.

## Verification, operations and release

Domain cases include the CAD 10,000 example above; missing versus zero targets; cash and missing constituents; mixed CAD/USD with/without FX; stale snapshot; exact threshold; zero total; tiny fractional positions; altered target after plan save; rounding residuals. Expected outputs must come from independently worked examples.
Real disposable-database tests prove own-member reads/writes and cross-member denial, tenant-consistent child references, duplicate period insertion, concurrent lease claims, outbox atomicity and deletion during work. Both API and exposed database boundaries need evidence.
Clock-controlled tests cover February/day-31 policy, DST gaps/repeats, timezone edits across month boundaries, scheduler downtime/catch-up, opt-out after enqueue, overlapping cron, worker death after publication and provider success before local acknowledgement.
Provider fixtures cover malformed AI, injection-like retrieved text, unsupported causal/financial claims, quotas/timeouts, Resend throttling, callback forgery/replay/order and ambiguous submission. Limited authorized real AI/Resend tests demonstrate actual integrations; mocks do not satisfy A03/A05.
Browser journey: adopt target in M4/M2 → obtain scheduled check-in → open authenticated email link → review → save plan → reopen on second session → change source/target → see stale status → unsubscribe. Verify no brokerage order call exists and holdings stay unchanged.
Follow `../CAPACITY_AND_RELIABILITY.md`: sustain the beta read/write mix while 2,500 monthly runs enqueue, including users with multiple portfolios. Test reconnection, provider 429/outage and restart with bounded fake-provider load; measure representative real-provider latency/cost separately.
Proposed monthly objective: all eligible runs reach ready/degraded/skipped or actionable terminal failure within 24 hours of due time; email submission follows the approved local delivery window. Validate actual provider quota and worker budget before committing to a tighter promise.
Monitor due-to-start delay, oldest run age, completion/degraded/failure counts, stale coverage, lease loss/retries, AI tokens/cost, email submitted/delivered/bounced/unknown/suppressed, and interactive API p95/p99. Logs use IDs and reason codes, not raw holdings, recipients or prompts.
Budget for eligible members per month × permitted model calls plus delivery attempts. Set member/global AI caps, email rate limits, max attempts, retention and stop alerts before enabling cohorts. Never call a model or send mail on page refresh.
Release requires A01–A10 evidence, signed-output demonstrations, tested suppression/deletion, operator ownership and shared reliability/readability gates. A screenshot, SDK dependency or scheduled cron entry alone is insufficient.
Rollback independently pauses new scheduling, AI and email while preserving existing check-in reads. Retry/replay respects original logical keys and current preferences. Additive schema/API changes and historical formula versions preserve existing saved plans through rollback.

## Decisions and external prerequisites

Approve drift threshold/units, supported asset/cash scope, stale-data cutoff, value-only versus share-estimate plan, local delivery window, day-of-month/DST rule, catch-up limit and default preference behavior.
Confirm one digest per member across portfolios, retention/deletion rules, email body privacy, support owner, sender identity/domain setup, Resend access, callback verification and observed provider idempotency window/rate limits at implementation time.
Agree explanation evaluation examples, provider budget and whether a late AI enhancement is worth its cost. Deterministic fallback remains required, but it does not waive the signed AI explanation deliverable.
Native notification/deep-link implementation is coordinated with M8. Larger launch/growth capacity remains an independently measured workload; no monthly scheduler design establishes readiness for 300,000 active users.
