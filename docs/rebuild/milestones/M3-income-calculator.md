# M3 — Passive Income Calculator

Status: proposed PRD; no requirement below is accepted as implemented. Reviewed against `master` at `4dbf440` and the independent `feat/portfolio-import` worktree. See `../ARCHITECTURE.md` for shared boundaries.

## Authority, outcome, and scope

The signed agreement, page 2, §2.1, requires a reverse-engineering engine, a Canadian/U.S. tax-drag toggle, inflation adjustments, and milestone tracking. M3 is the calculator, regardless of the obsolete M5 labels in the prototype. The win condition is that a user can enter an income objective, understand the capital needed under explicit assumptions, and track when a modeled income milestone is reached without confusing estimates with actual receipts.

The supplied workbook is reference content, not a complete forecasting specification. `docs/reference/README.md` identifies 55 formulas in portfolio template 8a and 34 in 8b for allocations, book/current values, yields, income, and returns. Blank-template divide-by-zero values must become missing-input states. Those templates do not substantiate the prototype's national tax percentages, reinvestment assumptions, or guaranteed returns.

The user's current product direction is mobile first, with equivalent readable web functionality for older users. The private-beta planning scenario is 2,500 accounts and approximately 1,000 simultaneously online; that is not proof of request volume or supported capacity. Calculation previews can run on the device, while saves, identity, shared assumptions, and authoritative recomputation use the common API.

Contractual scope: the four deliverables above. Engineering requirements: deterministic decimal-safe math, explicit currency/provenance, reproducibility, tenant isolation for persisted tracking, accessible states, and verification. A small persisted calculation/track record is a proposed implementation of tracking; the agreement does not separately specify a scenario-library feature. M4 owns goal creation and save/revisit of generated portfolios.

Non-goals: tax filing, exact personal tax liability, automatic tax advice, tax optimization, securities trading, guaranteed milestone dates, Monte Carlo analysis, historical crash simulation, total-return forecasting, and an LLM-powered calculation engine. Reinvestment support is an optional separately reviewed model mode; it must not silently replace the initial cash-income model.

## Observed implementation and disposition

Evidence paths below are repository-relative; inspect the same paths under `.claude/worktrees/portfolio-import/` for feature-branch evidence.

| Evidence | Finding | Disposition |
| --- | --- | --- |
| `robo-advisor/src/views/Plan.jsx:7` | Calculator, goals, and chat share imported fixture data. | Separate M3 route and adapters; retain fixtures only in demo. |
| `Plan.jsx:78–94` | Simulator computes annual yield divided by 12, deflates income, adds contributions only, and rounds every displayed point before milestone search. | Preserve interaction concept; replace embedded math with independently tested domain functions. Label contributions-only behavior. |
| `Plan.jsx:148–149` | Another target estimate assumes 12% yield and $500 contributions independently of calculator controls. | Remove duplicated formula path; M4 consumes the same engine. |
| `Plan.jsx:211–213,370` | CA = 15%, US = 22%; future capital calculation uses fixture yield on cost. | Remove unsupported presets and mislabeled yield basis. Rebuild around approved assumptions. |
| `Plan.jsx:341` | Empty and invalid input becomes zero via `parseFloat(...) || 0`. | Keep empty, invalid, and explicit zero distinct. |
| `Plan.jsx:418–419,542` | Milestone uses rounded income; zero starting income satisfies a 2× target immediately; chart marker rounds month to year. | Detect on unrounded monthly values and show the exact month. |
| `Plan.jsx:397–425,435,505` | Hardcoded starting values, limited slider ranges, incorrect milestone label; no persistence. | Reuse selected presentation ideas; typed inputs and versioned assumptions replace defaults. |
| Feature `Plan.jsx:78,211,419` | Same financial formulas and dummy imports remain. | Feature branch provides no independently verified M3 completion. |

No finance-domain test suite, tax-assumption provenance, or persisted calculator journey was observed in these paths. A passing application build cannot establish financial correctness.

## Requirements and acceptance mapping

| Requirement | Scope | Acceptance |
| --- | --- | --- |
| M3-R01 Reverse engineer capital from desired monthly income and explicit yield basis. | Signed | M3-A01, A05 |
| M3-R02 Show tax drag with Canadian/U.S. selection and disclosed methodology. | Signed | M3-A02, A05 |
| M3-R03 Distinguish future nominal income from today's purchasing power. | Signed | M3-A03, A05 |
| M3-R04 Track income milestones with a date/month and current status. | Signed | M3-A04, A07 |
| M3-R05 Share one deterministic versioned financial engine across clients/API. | Engineering | M3-A05, A08 |
| M3-R06 Expose provenance, missing/stale data, currencies, and uncertainty. | Engineering | M3-A06 |
| M3-R07 Provide readable, keyboard/screen-reader usable equivalent flows. | Engineering/product direction | M3-A09 |
| M3-R08 Persist owned tracking inputs and reproduce saved results. | Proposed tracking design | M3-A07, A08 |

## Primary journey and UI states

1. Open `/app/calculator` directly. Choose manual inputs or an authorized portfolio snapshot; manual mode works without a linked brokerage.
2. Enter reporting currency, invested capital, desired monthly income, nominal annual distribution-yield assumption, monthly contribution, and horizon. Select whether the target means future dollars or today's purchasing power.
3. Select Canada/U.S. assumption context and tax mode. Display an editable effective drag assumption or a client-approved versioned preset; expose the numeric rate and limitations. Changing country must not silently assert a universal rate.
4. Enable inflation, enter the annual assumption, and compare gross income, modeled drag, net income, and real net income. Show required capital, gap, and contribution-only path with plain-language assumptions beside the result.
5. Choose an explicit income milestone and inspect first modeled attainment, already reached, or not reached within the selected horizon. Save tracking inputs if enabled; revisit with original snapshot or deliberately refresh from a new snapshot.

Loading a portfolio does not replace manual inputs with zero. Missing valuation/yield/FX displays a named gap and manual-entry option. A stale snapshot remains visibly dated; refresh failure retains the saved scenario and reports failure. Session expiration preserves an unsaved draft in memory but does not claim it was saved. A version conflict offers reload/review rather than silently overwriting another device's edit.

Use a single primary result and progressive disclosure for assumptions. Body text targets at least 16px with text enlargement; controls target 44px touch areas. Labels spell out CAD/USD and percentage units. Provide numeric entry alternatives to sliders, visible focus, grouped radio semantics, table/text equivalents for charts, and debounced result announcements. Verify 200% zoom and narrow-screen reflow; don't encode nominal/real differences by color alone. Never render `NaN`, `Infinity`, a misleading success check, or microscopic caveats.

## Financial model contract — proposed baseline

Record model version, currency, valuation date, rate units, contribution timing, source versions, tax-assumption ID/version or explicit user rate, inflation basis date, and horizon. UI percentage inputs become normalized decimal rates once at the validated boundary. Money and quantity precision use the shared decimal policy; presentation rounding does not affect milestone comparisons.

Variables: `P0` initial capital, `c` end-of-month contribution, `y` nominal annual cash distribution yield on current modeled capital, `t` effective tax-drag fraction of gross distributions, `i` effective annual inflation, `m` elapsed months, and `T` desired net monthly income. This simplified model treats the cash yield as constant and does not assume distribution yield equals capital growth or total return.

- Net monthly income at capital `P`: `N(P) = P × y × (1 − t) / 12`; gross monthly income is `P × y / 12`; modeled drag is gross minus net.
- Capital required for a future-dollar target: `P_required = 12 × T / (y × (1 − t))`, when the denominator is positive.
- Today's-purchasing-power target at month `h`: first compute future target `T_future = T × (1 + i)^(h/12)`, then solve the same capital equation. Do not inflate twice.
- Cash-income, contributions-only path: `P_m = P0 + m × c`; distributions are taken as cash, no capital appreciation or reinvestment is implied. `N_m = N(P_m)` is the income run-rate at month `m`, not a receipt ledger.
- Real income at month `m`: `R_m = N_m / (1 + i)^(m/12)`. Deflation may increase purchasing power; do not clamp that difference to a loss.
- A milestone is the first integer month in `[0, horizon]` whose unrounded selected income measure meets its target. Compare real targets to real income and nominal targets to nominal income. Report exact month and optional calendar projection date.
- Capital gap is `max(0, P_required − P0)`; preserve an explicit already-reached status. A target is not promised achievable merely because it can be reached under assumptions.

If separately adopted, after-tax reinvestment uses `P_(m+1) = P_m + c + N(P_m)` under end-of-month contribution/reinvestment timing. The selected model must show that distributions are reinvested rather than spendable income. Do not add this reinvestment to a total-return rate that already includes distributions. No additional growth variable belongs in the initial baseline.

Tax context is not a tax engine: country alone cannot establish a person's effective drag. The client must approve whether launch uses user-specified rates, reviewed illustrative presets, or account/distribution-specific rules. Record scope, effective date and source for any preset, and distinguish withholding from final liability. No arbitrary national percentages are acceptable. If exact tax rules are later requested, their source review and independent test cases are additional prerequisites. This PRD asserts no current tax rates.

Validation: blank values remain absent; reject malformed/nonfinite numbers, negative capital/contributions/targets, negative cash yield, tax outside `[0,1]`, and inflation `<= −1`. Zero target is already reached; positive target with zero net yield is unattainable in this model. A negative-yield stress model is outside initial scope. Permit supported negative inflation explicitly. Bound horizon to a proposed 600 months and set documented product maxima for amounts/rates before implementation; exceedance is a validation error, not truncation. Extreme high yields require an assumption warning, not a suggestion to select them.

One scenario has one reporting currency. Mixed CAD/USD inputs require an explicit conversion source/rate/date and converted snapshot; otherwise calculation pauses or scenarios remain separate. Never use historical yield on cost to imply the return on new capital. A portfolio-derived yield includes its denominator, annualization method, source and `asOf`, owned by M2.5b; M3 accepts it as an explicitly selected estimate, not live guaranteed income. If fees are already reflected in a source yield, do not subtract them again.

## Architecture, ownership, and data

`packages/domain/forecasting` owns validation-independent deterministic math, statuses, decimal operations, and model versions. `packages/contracts` owns validated calculator/scenario request/response types. The web calculator and future native client own draft input/formatting/chart rendering, and call the same browser-safe engine. Server use cases authorize snapshots, resolve approved assumption versions, recompute saved results, and persist only through repositories. No UI/LLM/provider adapter owns arithmetic.

Proposed endpoints: `GET /api/v1/calculator/assumptions`, `POST /api/v1/calculator/scenarios`, `GET /api/v1/calculator/scenarios/:id`, and revision-checked `PATCH`/`DELETE` for a saved scenario. Add an authorized preview endpoint only for inputs that require server resolution; moving every slider must not trigger it. Endpoint names are proposed contracts, not existing routes.

Conceptual entities: versioned calculation model; approved tax/forecast assumptions; private calculation scenario with owner, immutable input/source versions and mutable title/revision; milestone definition with nominal/real basis; calculation result metadata. Store derived results only when needed to reproduce/audit them, alongside the engine version. A saved financial goal belongs to M4 and references the scenario ID/version; do not create a second goal store. Model-predicted attainment and observed progress are separate fields.

API resolves actor identity and ownership; clients cannot choose a trusted `user_id`, supply accepted totals, or attach another user's portfolio. RLS plus relational ownership constraints defend scenario and snapshot links. Two-user tests must prove both own-user success and cross-user denial. Duplicate create retries use an actor-scoped idempotency key; conflicting updates use revision checks. No scheduled job or AI call is needed to calculate a short bounded projection.

Source refresh creates a new scenario revision with new provenance; old saved results stay reproducible. Optional `calculator.scenario_saved.v1`/`calculator.scenario_updated.v1` events are added only when an actual consumer requires them; financial values do not belong in generic telemetry. User deletion includes scenarios and any derived saved artifacts.

## Dependencies and downstream guarantees

M1 provides identity, decimal/contracts conventions, API/migration/testing boundaries, and observability. M2 supplies authorized dated portfolio valuations; M2.5a supplies canonical fund/currency IDs; M2.5b owns yield/distribution definitions and freshness. Manual-input engine work can start once M1 boundaries are agreed, but portfolio-connected acceptance waits for these sources. Financial precision and yield definitions must be agreed before UI rewrites spread inconsistent formulas.

M4 consumes M3's deterministic capital/income projection and scenario references. M5 may explain validated outputs with their assumptions and dates but never recomputes amounts itself. M6 can use milestone progress only with authorized snapshots and an explicit nominal/real basis. M8 reuses contracts and math, with native presentation tests; a native client does not eliminate API/database/provider load.

Flow: explicit inputs + dated authorized snapshot → validated assumptions → shared deterministic engine → local preview → authenticated save + server recomputation → owned scenario revision → M4/M5 references.

## Ordered implementation slices

1. **M3-S01 — Definitions and independent examples.** Resolve yield basis, effective drag mode, inflation basis, contribution timing and tracking ownership; document formula/version and source acceptance. Win: product owner can explain every number in A01–A06 without code. No tax preset ships before its basis is approved.
2. **M3-S02 — Pure engine.** Implement bounded decimal-safe functions and statuses with independent expected values. Win: A01–A05 pass without React, network, database or LLM; invalid inputs cannot generate totals.
3. **M3-S03 — Manual calculator route.** Deliver the smallest complete accessible input/result/milestone journey. Win: A09 and manual A01–A04 work at a direct URL on narrow/wide screens; editing inputs does not call providers/API.
4. **M3-S04 — Portfolio and assumptions adapters.** Add authorized valuation/yield/FX source selection and stale/missing flows. Win: A06 passes using M2/M2.5 fixtures plus actual disposable integration; no fixture values leak into live state.
5. **M3-S05 — Persist tracking.** Add reviewed schema/API changes and scenario revisions, recomputation, conflicts and idempotency. Win: A07–A08 pass on two devices/two users; M4 receives a stable scenario contract.
6. **M3-S06 — Release evidence.** Run correctness, accessible browser, failure and capacity checks; record accepted IDs. Win: all signed requirements have executable proof, approved assumptions and a rollback exercise.

Do not fold chat/RAG, AI allocations, speculative tax optimization, mobile store builds, or a total-return engine into this milestone. Native presentation may follow contract scheduling; web and domain choices must support it now.

## Acceptance and verification

| Acceptance | Required observable evidence |
| --- | --- |
| M3-A01 | With `T=1,000`, `y=0.06`, `t=0.20`, required capital is exactly 250,000 in the selected currency; at that capital gross income = 1,250/month, modeled drag = 250, net = 1,000. Round only for display. |
| M3-A02 | Canada/U.S. selection changes disclosed context/preset version; a user-entered 20% drag produces the same arithmetic in either context. Tests assert approved preset fixtures, zero drag, 100% drag, and explicit missing assumptions. Country alone never invents a rate. |
| M3-A03 | `P0=120,000`, `c=1,000`, `y=0.06`, `t=0.20`: month 0 net = 480; month 12 capital = 132,000 and net = 528. With 10% annual inflation, month 12 real net = 480. A 1,000 real target at month 12 requires 275,000 capital. |
| M3-A04 | Same scenario with a 520 nominal target first attains it at month 10: month 9 net = 516, month 10 = 520. Already-met, unreachable, zero-start, zero-target, zero-contribution and real-basis targets have distinct tested outcomes. A 2× zero-start badge is never emitted as meaningful progress. |
| M3-A05 | Empty/invalid/negative/nonfinite inputs, zero yield, 100% drag, negative inflation, extreme bounds, month 0 and horizon limit are covered. Independent decimal examples and monotonicity/inverse checks catch rate-unit, off-by-one and early-rounding errors; chart downsampling cannot change attainment month. |
| M3-A06 | CAD + USD without FX cannot yield a summed total. A supplied dated rate produces independently checked converted inputs; absent yield remains absent. Stale portfolio/distribution assumptions retain their source dates and require deliberate refresh before changing a saved scenario. |
| M3-A07 | Save/reopen reproduces inputs, source/version and result. Own-user read/update succeeds; another user cannot read/update/delete/link the record through API or direct database access. Retry creates one record; conflicting revision returns a conflict; session failure never reports successful persistence. |
| M3-A08 | Server recomputes and rejects tampered result/ownership fields. Shared version gives equivalent results across browser/API and later native runtime. Old versions remain reproducible or explicitly require reviewed migration; new defaults do not rewrite old scenarios. |
| M3-A09 | Keyboard and screen-reader journey, 200% zoom, readable narrow/wide layouts, typed alternatives to sliders, accessible chart summary and meaningful errors pass review. Local preview completes within a proposed p95 100ms for 600 months on the selected baseline mobile device; record device and benchmark evidence. |

If reinvestment is adopted, independently verify `P0=1,000`, `c=100`, `y=0.12`, `t=0`: month 1 capital = 1,110; month 2 = 1,221; month 2 income run-rate = 12.21. This is an example of the optional recurrence, not a return promise or launch requirement.

Testing layers: pure domain cases above; schema/API contract validation; real disposable-database ownership and migration tests; browser save/reload/stale/session failure journey; later native numeric/input parity. Stub provider outages but also verify the real snapshot adapter contract. Do not count UI snapshots or the unrelated feature branch's 33 tests as finance acceptance.

## Operations, release, and unresolved decisions

Instrument model version, duration, safe error code, input-count/bounds category, assumption version and save outcome; never log portfolio amounts or full financial input payloads. Local preview costs no provider tokens and should make zero network calls per slider change. Benchmark the bounded engine; load-test initial reads/saves with measured usage rates and the shared 1,000-online-user workload, including reconnect bursts and retries. Online users are not requests per second, and no M3 benchmark alone proves overall capacity.

Release requires A01–A09 evidence, approved tax/forecast assumptions, source freshness behavior, two-user ownership proof, and recorded platform prerequisites. Default financial inputs must be explained or blank, not fabricated from demo data. Client demo approval uses reproducible examples and saved-state inspection, not screenshots alone.

Rollback: feature-flag the new route, preserve saved versions, and deploy only changes compatible with the prior API during rollout. An invalid preset is withdrawn from new use without rewriting historical inputs; show affected saved scenarios an explanation and deliberate recalculate option. Formula fixes create a new engine version and a documented correction path. Database rollback/forward-repair is separate from reverting a UI build.

Decisions required before the affected slice: client-approved tax mode/preset evidence; permitted source yield method and age; amount/rate maxima; baseline device/accessibility review criteria; whether tracking is forecast-only or includes observed progress; and whether optional reinvestment belongs in launch. These are bounded product/model decisions, not reasons to postpone M1 foundations or the pure-engine specification. No production tax accuracy or capacity is asserted by this PRD.
