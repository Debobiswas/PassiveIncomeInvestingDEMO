# Repository evidence and refactor risk register

Audit scope: working tree based on `master@4dbf440` and independent `feat/portfolio-import@f3b65e2`. Findings concern code and local verification, not an inspected production deployment. Prior audit results are retained; no benchmark supports calling the backend slow or proving any user capacity.

## What exists

The prototype has four active views, local state navigation, static data, charts and interaction concepts. Other legacy view files duplicate earlier product flows. There is no root AGENTS.md or README in the audited commit; these are added on the planning branch. Existing `PHASE_1_REQUIREMENTS.md` and `docs/superpowers/` documents are substantial but derive from obsolete scope assumptions. The problem is not literally zero documentation; it is missing authoritative, consistent requirements and implementable boundaries.

The feature branch adds meaningful routing, Google auth, database/RLS setup, mapping/derivation tests and import parser code. It is 13 commits ahead of master. The live provider and visible UI integration are unfinished. Passing isolated tests does not establish a complete product workflow.

## Prioritized findings

| Priority | Concrete evidence | Consequence | Planned resolution |
| --- | --- | --- | --- |
| P0 before real user data | Feature migration has repeated user IDs with independent FKs; planned API writes bypass RLS with service role | A server bug can construct inconsistent owner relationships; actual exploit not demonstrated | F4: ownership constraints, user-context repository, HTTP/DB positive and negative tests |
| P0 before financial output | Feature `src/lib/derive.js:38` invents equal targets; `:54` sums native currencies | False drift and invalid totals | P1: explicit adopted targets, decimal math, currency/FX completeness |
| P0 before financial output | Feature `src/lib/derive.js:79` labels market-value denominator as yield on cost | Financial metric misrepresentation | Shared metric dictionary and independent examples |
| P0 before real imports | Feature `shared/mapping.js` broker/cost/currency assumptions, `demoParse.js` simplistic header/first-sheet selection | Wrong positions can look successfully imported | P2: mapped semantics, selectable sheets, row diagnostics and reviewed commit |
| P0 before public beta | `Portfolio.jsx:255–271` claims queued/executed trades | User believes an order exists when none is sent | Remove execution claim; M6 generates an explicitly non-executing plan |
| P1 delivery blocker | `Portfolio.jsx:92` Import button lacks action, including feature snapshot | No working visible import despite parser code | Wire a complete persisted upload journey; browser E2E |
| P1 delivery blocker | Feature `context/LiveProvider.jsx:1` is a passthrough; active views import fixtures | Authenticated users see sample data | Feature query/API path, live fixture prohibition |
| P1 foundations | Master `App.jsx:101` uses state navigation; feature callback/session failures incomplete | Broken deep-link/recovery experience | F3/F5 route/auth state machine |
| P1 scope conflict | Old plans Google-only/single-portfolio UI; signed email + Google/multiple portfolios | Work can appear complete against wrong checklist | Signed requirement IDs in every PRD |
| P1 reference truth | `dummy.js:53` acknowledges estimated yields; Discover limits comparison to 4 | Unsupported facts and contract mismatch | C2/C3 provenance, shared metrics and max-three validation |
| P1 maintainability | Plan 922 lines, Portfolio 668, Discover 576; rendering/formulas/fixtures co-located | Small changes cross multiple unrelated behaviors | Domain extraction and complete feature slices, not file splitting alone |
| P1 correctness | Plan hardcoded tax rates/yield; zero-start double-income milestone; rounding before comparison | Misleading forecast and milestones | K1 independent financial model and golden tests |
| P1 AI claims | Plan keyword responses behind timer; risk-only sample selection | No implemented RAG or AI generator | M4 real bounded generator; M5 corpus/retrieval/evaluations |
| P1 readiness | No CI/real integration/E2E in audited branch; master lint fails | Regressions not blocked before deployment | F2 gates; test actual database/auth and browser workflows |
| P2 measured frontend risk | Feature build main JS 866.07 kB minified / 265.06 kB gzip | Heavy initial download; not proof of backend slowness | Route-lazy parsers/charts, bundle budget and device measurements |
| P1 mobile delivery | No native project in either snapshot | Mobile-primary beta cannot use native app yet | Early native compatibility slice, full M8 acceptance later |
| P1 data prerequisite | Workbook inventory has catalogue/templates, no demonstrated full distribution event history | Dashboard cannot fabricate its contracted data | D1 source/history/price contract and source acquisition |

Priorities are engineering triage, not severity claims from a penetration test. P0 here means fix before the relevant real-data feature is enabled.

## Verification baseline

The preceding local audit ran these checks at the listed snapshots:

| Snapshot | Verification | Result |
| --- | --- | --- |
| master | `cd robo-advisor && npm run build` | Pass |
| master | `cd robo-advisor && npm run lint` | Nine errors: unused imports/variable and synchronous setState in effect |
| master | Test command inventory | No test script |
| feature | `cd robo-advisor && npm test` | 33 passing: 21 mapping, 12 derivation |
| feature | `npm run build && npm run lint` | Pass; bundle warning |
| feature | Live RLS verification script | Present but not run; creates test users/data and needs selected environment |
| either | Real brokerage/AI/mobile/production/load acceptance | Not established |

This planning turn re-read relevant sources and validated document consistency/source hashes. It does not rerun unchanged application tests as a substitute for implementation proof. No actual service credentials, database state or broker accounts were inspected or mutated.

## Correcting overstatements in the earlier gap report

- Export buttons are inert, but CSV export is not listed as a signed M2.5b deliverable. Do not expand acceptance scope solely to make every prototype control functional; remove or deliberately defer it.
- Calculator scenario saving is a proposed design for milestone tracking, not a separately enumerated signed scenario-library feature.
- “Live distribution dashboard” explicitly includes admin uploads; a premium automatic feed is not automatically required. Current yield still needs a real compatible dated price and a disclosed freshness policy.
- A missing explicit UPDATE `WITH CHECK` is not proof of owner reassignment; PostgreSQL/Supabase can reuse `USING`. Explicit policies and real isolation tests are the evidence.
- A public trigger-only security-definer function is a hardening concern; do not assert it is directly exploitable as an ordinary RPC without verifying execution semantics and grants.
- No verified production inspection occurred, so state “not evidenced in the repository” for deployment/region/acceptance claims.
- Calendar arithmetic from the agreement does not prove an overdue project without knowing approved pauses, changes and payment gates. Replan from measured work and confirmed external dependencies.
- Native implementation should no longer be postponed until all web work is finished: the user clarified mobile-first product priority after the earlier audit.

## Implementation risk controls

1. Keep a source-preserving planning branch and independent feature worktree; port useful changes by reviewed slice.
2. Establish behavioral tests before changing finance/import logic, using examples whose expected results are independent of current code.
3. Make each slice usable through actual UI/API/persistence before broadening it; avoid a repository full of unconnected abstractions.
4. Preserve immutable source/input/plan versions; new defaults or model outputs cannot silently rewrite history.
5. Set explicit provider and beta capacity budgets before opening cohorts; a mobile app still shares the same constrained backend.
6. Keep the client aware of source/credential/product decisions at the point they affect acceptance, without blocking unrelated foundation work.
