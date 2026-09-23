# Signed Agreement vs Repository: Implementation Gap Analysis

**Audit date:** September 22, 2026  
**Contract source:** `Complete_with_Docusign_Blundr_PassiveIncomeI.pdf`  
**Client-data source:** `Copy of Ultimate-DIY-Investing-Package-v8 DRAFT.xlsx`  
**Primary code snapshot:** `master` at `4dbf440122dac9505a123147f9f6c7fe313e118d`  
**Work-in-progress snapshot also reviewed:** `feat/portfolio-import` at `f3b65e22866a44a20332559af793a46d37ff5c42`

## Executive conclusion

No signed milestone is currently complete end-to-end on `master`, and none is ready for contractual acceptance on the reviewed feature branch.

The repository contains a polished, responsive front-end prototype for most of the product concept. It demonstrates the intended information architecture, charts, a screener, calculator-like interactions, goal questions, drift alerts, and rebalance screens. However, the active application on `master` is driven almost entirely by static data in `robo-advisor/src/data/dummy.js`. Authentication, persistence, live brokerage connections, workbook ingestion, administration, RAG, scheduled jobs, email, observability, deployment evidence, and mobile apps are missing.

The `feat/portfolio-import` branch materially improves the foundation: it adds routed demo/live portals, Google OAuth wiring, a Supabase migration with RLS, import parsing/normalization code, and 33 passing unit tests. That work is not merged. More importantly, the live provider is still an explicit passthrough stub, only health-check API routes exist, and the portfolio screen still imports `dummy.js` directly. The browser parser is therefore tested but not connected to the visible upload workflow.

The project should presently be described as a **front-end product prototype with partial foundation work**, not a production MVP.

## Status legend

| Status | Meaning |
| --- | --- |
| **Prototype** | The user interface exists, but it is backed by static/canned data or inert controls. |
| **Partial** | Some real implementation exists, but material acceptance requirements are absent or disconnected. |
| **Not started** | No meaningful implementation evidence was found. |
| **Blocked from acceptance** | The output cannot be demonstrated end-to-end in the audited repository state. |

## Contract scorecard

| Milestone | Signed result | `master` status | Feature-branch status | Principal acceptance gap |
| --- | --- | --- | --- | --- |
| M1 Foundations & Auth | Email and Google OAuth, schema, Vercel/Supabase, Sentry, CI/CD, onboarding | **Prototype** | **Partial** | Google OAuth and schema groundwork exist only on the branch; email auth, live data provider, Sentry, CI/CD, and deployment proof do not. |
| M2 Portfolio Sync & Visualization | SnapTrade, CSV fallback, manual entry, allocation chart, multiple portfolios | **Prototype** | **Partial / disconnected** | No SnapTrade endpoints or live persistence; parser/provider work is not consumed by the portfolio view; no manual-entry flow or real multi-portfolio experience. |
| M2.5a ETF Screener v1 | 140+ ETF schema/import, filters, up-to-three comparison, details, YouTube, fund admin | **Prototype** | **Prototype** | Only 69 hardcoded ETFs; no workbook import/schema/admin; comparison allows four; video cards have no URLs. |
| M2.5b Live Distribution Dashboard | 12–24 month history, yield/dates, validated admin upload, diff preview, sponsor normalization | **Prototype** | **Prototype** | Six hardcoded funds have six months of history; no live feed, validated ingestion, preview/diff, normalization, or working export. |
| M3 Passive Income Calculator | Reverse-engineered calculator, Canada/U.S. tax drag, inflation, milestones | **Prototype** | **Prototype** | UI math exists, but rates and portfolio inputs are hardcoded; no demonstrated workbook parity, persistence, validation, or test coverage. |
| M4 Goal Engine & Sample Portfolios | Wizard, AI generator, rationale, save/revisit | **Prototype** | **Prototype** | Four-question UI chooses from three hardcoded portfolios using simple rules; there is no AI generation or persistence. |
| M5 Robo AI Advisor | Content ingestion, transcription/chunking/embeddings, vector DB, chat, questionnaire, objectivity, tuning | **Prototype** | **Prototype** | Chat returns canned keyword responses after a timer; no ingestion, RAG, model call, evaluation, or objectivity controls. |
| M6 Monthly Check-In & Rebalance | Drift, monthly jobs, explanations, rebalance UI, Resend email | **Prototype** | **Prototype** | Static drift/trade data and local UI only; no scheduler, current holdings, AI explanation, persistence, or email. |
| M7 Polish, Beta & Web Launch | UX, basic admin, QA, 10–20-user beta, production web launch | **Partial UI** | **Partial foundation** | Polished UI and a passing branch build exist; no admin, beta evidence, production launch, monitoring, E2E/accessibility suite, or release pipeline. |
| M8 iOS + Android | React Native apps, push, store submissions/listings | **Not started** | **Not started** | No React Native application, native projects, push system, store assets, or submission evidence. |

## Milestone findings

### M1 — Foundations & Auth ($4,500)

What exists:

- `master` has a responsive React/Vite shell and a session-only welcome modal.
- The feature branch adds React Router, a public landing page, `/demo` and protected `/app` portals, a Supabase browser client, session handling, a callback route, and Google OAuth.
- The feature branch adds a Vercel health function and a Supabase migration for profiles, broker credentials, portfolios, accounts, holdings, distributions, and import jobs.
- The feature migration enables RLS and makes explicit grants rather than relying on legacy automatic Data API exposure.

Gaps:

- The signed agreement requires both email and Google authentication; the reviewed login screen exposes Google only.
- `LiveProvider.jsx` states that it is a passthrough stub. The authenticated portal therefore has no Supabase-backed product data.
- There is no Sentry dependency or initialization, no GitHub Actions or other CI configuration, and no production deployment record in the repository.
- The onboarding modal is marketing/onboarding UI, not a persisted user setup flow.
- `master` has no migrations at all; the migration exists only on the feature branch, and there is no evidence it has been applied to an intended North American Supabase project.

Assessment: **Partial on the feature branch; blocked from acceptance.**

### M2 — Portfolio Sync & Visualization ($4,500)

What exists:

- The prototype renders holdings, accounts, allocation, activity, and distribution views.
- The feature branch contains real in-browser CSV/XLSX parsing, column detection, normalization, and derived holding/stat/allocation/drift functions.
- The feature branch includes 21 mapping/normalization tests and 12 derivation tests.
- The feature database design anticipates multiple portfolios and portfolio sources (`snaptrade`, `csv`, `manual`).

Gaps:

- There are no `/api/snaptrade/*` endpoints. Only `/api/health.js` exists.
- The demo connection/sync/disconnect methods return `{ simulated: true }`; no SnapTrade login, account sync, webhook, refresh, error recovery, or credential lifecycle is implemented.
- The feature branch's `Portfolio.jsx` still imports holdings/accounts/drift directly from `dummy.js` and does not call `usePortfolio()`.
- The visible Import Holdings button has no click handler. Parsed uploads are held in memory only and are not connected to the screen or persisted.
- There is no manual holdings-entry workflow.
- The database can store multiple portfolios, but no live creation/switching/management UI was found.
- Portfolio values, dates, account names, and yields shown in the UI remain hardcoded.

Assessment: **Useful isolated groundwork, but the contracted workflow is not demonstrable.**

### M2.5a — ETF Screener v1 ($4,500)

What exists:

- Search and several category filters, ETF cards, detail overlays, featured funds, and comparison UI.
- The static objects contain manager, fee, yield, frequency, strategy/category, region, index, rating, and distribution-date fields.
- Three hardcoded sample portfolios are present.

Gaps and mismatches:

- The contract calls for 140+ ETFs; the application contains 69 hardcoded ETF objects.
- The agreement's one-time import from workbook Tab 4 and the sample-portfolio tabs has not been implemented. There is no normalized ETF/reference-data schema.
- The workbook contains 144 U.S. covered-call rows in Tab 4, 497 rows in the broad ETF master sheet, and richer provenance fields that are absent from the app dataset.
- The contract permits comparison of up to three ETFs. The UI says “2–4 ETFs” and allows four.
- Video cards contain only hardcoded titles and durations. No YouTube URL, embed, or working outbound link is attached.
- No fund add/edit/remove administration exists. This basic fund administration is in scope even though the separate sponsorship admin dashboard is a Phase 2 exclusion.
- Hardcoded yield and date fields have no effective date, source URL, refresh pipeline, or validation state.

Assessment: **Strong visual prototype; core data and administration deliverables are missing.**

### M2.5b — Live Distribution Dashboard ($3,000)

What exists:

- Distribution cards, charts, current-looking yield/date fields, upcoming ex/record/pay events, and an Export CSV button.

Gaps:

- Distribution history is hardcoded for six featured ETFs and covers six months, not the contracted 12–24 months.
- “Current” yield and dates are static fixtures, not live or refreshable data.
- The client/admin CSV/XLSX ingestion flow, header and row validation, error handling, before/after diff preview, and sponsor-name normalization are absent.
- The Export CSV button has no handler.
- User brokerage distributions and product-level distribution history are not separated cleanly in the current product model.

Assessment: **Prototype only.**

### M3 — Passive Income Calculator ($4,000)

What exists:

- A required-portfolio calculation, Canada/U.S. selector, scenario sliders, inflation adjustment, projections, and a doubled-income milestone.

Gaps:

- The Canada and U.S. options use fixed effective rates of 15% and 22%, with no documented tax model, account-type handling, withholding logic, or configurable assumptions.
- The implementation does not demonstrate parity with the workbook's portfolio templates or show acceptance tests for representative workbook scenarios.
- It is based on static portfolio/yield data and cannot save or revisit scenarios.
- There are no unit tests for calculator formulas, edge cases, missing inputs, currency, or rounding.

Assessment: **Interactive prototype; financial logic is not acceptance-ready.**

### M4 — Goal Engine & Sample Portfolios ($2,500)

What exists:

- A four-question wizard, target/timeline controls, sample-portfolio presentation, and a plain-language card.

Gaps:

- Portfolio selection is a local rule choosing among three hardcoded samples, not an AI-generated portfolio.
- There is no model/API integration, guardrail logic, suitability/objectivity policy, or generated rationale tied to the user's full inputs.
- Goals, answers, outputs, and revisions cannot be saved or revisited.
- The workbook contains more sample strategies than the three represented in the app.

Assessment: **Prototype only.**

### M5 — Robo AI Advisor ($6,500)

What exists:

- A polished chat surface, suggested prompts, typing state, and questionnaire UI.

Gaps:

- Responses are selected from a local canned-response map after a 1.3-second timer.
- There is no model call, vector database, document/content schema, crawler, transcription, chunking, embedding, retrieval, citation, or source-freshness mechanism.
- The workbook's hundreds of source links and approximately 80 YouTube links have not been turned into an auditable knowledge pipeline.
- There is no objectivity layer, conflict/sponsorship disclosure mechanism, non-advice policy enforcement, evaluation dataset, prompt versioning, or evidence of the contracted two-week prompt-tuning period.

Assessment: **Chat UI only; essentially all substantive M5 work remains.**

### M6 — Monthly Check-In & Rebalance ($5,000)

What exists:

- Drift alerts, rebalance explanations, a staged trade-plan modal, and notification UI.

Gaps and risk:

- Drift and trade recommendations use hardcoded holdings and trade amounts.
- There is no monthly scheduler/cron, live recalculation, job log, idempotency, retry path, or user preference control.
- No AI explanation service or Resend email integration exists.
- The UI states that trades are “queued” and “will execute at next market open via Questrade,” although no execution integration exists and trade execution is not a signed Phase 1 deliverable. This is a material trust, scope, and regulatory-risk statement and should be removed or relabeled as a non-executing plan.

Assessment: **Prototype only, with a high-priority misleading-capability risk.**

### M7 — Polish, Beta & Web Launch ($3,000)

What exists:

- The current responsive UI is visually coherent across four top-level areas.
- `master` builds successfully.
- The feature branch builds, lints cleanly, and has 33 passing unit tests.

Gaps:

- `master` fails lint with nine errors and has no test script.
- The feature build produces an 866 kB minified main bundle (265 kB gzip) and triggers Vite's large-chunk warning.
- There are no end-to-end, integration, accessibility, visual-regression, performance, or security tests.
- There is no basic admin interface, beta roster/feedback evidence, launch checklist, monitoring, incident/runbook documentation, or production URL evidence.
- No Sentry or CI/CD implementation was found.

Assessment: **UI polish is underway; beta and launch are not evidenced.**

### M8 — iOS + Android ($2,500)

No React Native package, iOS/Android native projects, push-notification implementation, store metadata/assets, or submission evidence was found.

Assessment: **Not started.**

## Cross-cutting findings

### 1. Requirements governance is out of sync

`PHASE_1_REQUIREMENTS.md` names the earlier proposal as its source, incorrectly folds SnapTrade into M1, omits a distinct M2, and swaps the signed M3 and M5. It also labels real OAuth, SnapTrade, RAG, cron, export, and email as intentionally out of scope for the demo even though those are material signed deliverables. The signed agreement must replace this file as the acceptance baseline.

### 2. Critical source documents are present but not yet version-controlled

The PDF, workbook, source-document README, and this audit are in `docs/reference/`, but the directory is currently untracked on `master`. They are preserved in the project workspace, but they will not survive a fresh clone until intentionally added and committed. Because the files contain confidential Client IP, repository access and any Git LFS/hosting policy should be confirmed before committing them.

### 3. The workbook has not been operationalized

The workbook crawl found 14 sheets, a 497-row broad ETF master list, 144 U.S. covered-call rows, 148 Canadian covered-call rows, sample portfolios, formulas, and extensive source links. None of this is represented as a versioned ingestion artifact, normalized reference database, provenance record, or update workflow. The current 69-object JavaScript dataset is a hand-authored subset.

### 4. Demo and production truth are not clearly separated on `master`

Static portfolio values and dates appear as if current. The feature branch's demo/live routing is a good start, but the product views still bypass the provider and read fixtures directly. Until every live view gets data through an explicit provider/API contract, users can mistake sample data and simulated actions for real account state.

### 5. Database security groundwork is promising but needs hardening and proof

Positive findings on the feature branch:

- RLS is enabled on every user-facing table.
- `snaptrade_users` has no client policy or client grant.
- Explicit grants match the current Supabase direction in which new tables are not automatically exposed.
- User-scoped indexes and a real RLS verification script are present.

Remaining work:

- The RLS script was not executed during this audit because doing so requires an explicitly selected live/local Supabase environment and creates temporary users/data. Its presence is not proof that the deployed database matches the migration.
- `auth.uid()` policies should use the documented `(select auth.uid())` form where appropriate for better query planning at scale.
- The profile update policy should state an explicit `WITH CHECK` condition for clarity and defense in depth.
- The public `SECURITY DEFINER` trigger function should have its execute privileges reviewed/revoked and preferably live outside an exposed schema.
- Repeated `user_id` columns are not constrained to match the owner of the referenced portfolio/account. A service-layer bug could create a cross-tenant relationship even though client reads are filtered.
- `distributions.external_id` is globally unique rather than scoped to an account/provider/user.
- Nothing enforces only one primary portfolio per user.
- The schema has no normalized ETF, fund-source/provenance, distribution-history, content/chunk/embedding, goals, recommendations, check-in jobs, or notification tables.

Supabase requires both table privileges and RLS policies for Data API access, and recommends enabling RLS for exposed-schema tables. Its documentation also warns against placing security-definer functions in exposed schemas. See the official [Row Level Security guide](https://supabase.com/docs/guides/database/postgres/row-level-security) and [Data API security guide](https://supabase.com/docs/guides/api/securing-your-api).

### 6. Schedule risk is critical

The agreement states a 16-week duration beginning May 30, 2026. Simple calendar arithmetic places 16 weeks at September 19, 2026; this audit is dated September 22, 2026. Contractual pauses, payment gates, approved changes, or a different mutually agreed schedule could change that interpretation, but none are documented in this repository. The December 2026 web-launch target remains possible only with immediate scope control and parallel execution across backend/data, product UI, AI, QA, and release work.

## Verification performed

### `master`

- `npm run build`: **passed**.
- `npm run lint`: **failed with 9 errors**.
- No application test script is defined.
- Active application dataset: **69 hardcoded ETFs** and **3 sample portfolios**.
- Git status: `docs/reference/` is untracked; no other working-tree change was introduced by this audit.

### `feat/portfolio-import`

- `npm test`: **33/33 tests passed** across 2 test files.
- `npm run build`: **passed**, with a large-chunk warning for an 866.07 kB main bundle.
- `npm run lint`: **passed**.
- Branch divergence: **13 commits** ahead of `master`, 42 changed files.
- API inventory: environment helper and health endpoint only.
- Live provider: explicit four-line passthrough stub.
- Portfolio UI: still fixture-backed; parser/provider not wired into the upload control.

## Recommended critical path

1. **Establish one acceptance baseline.** Replace the proposal-derived requirements map with a signed-agreement checklist, resolve the M1/M2/M3/M5 numbering, and track each contractual acceptance result with demo evidence.
2. **Decide and merge the foundation branch.** Review `feat/portfolio-import`, preserve its tests, fix the provider/view disconnect, and avoid parallel implementations diverging further.
3. **Finish M1 before feature expansion.** Implement email auth, apply and verify the schema in the intended Supabase region, harden ownership constraints/RLS, implement the live provider, add Sentry and CI, and document the deployment environments.
4. **Complete one real M2 vertical slice.** User signs in, imports a file, reviews mapping/warnings, commits it, reloads, and sees persisted holdings/allocation. Then add manual entry and SnapTrade connect/sync/disconnect with webhook/retry handling.
5. **Create the reference-data platform for M2.5a/b.** Normalize the contracted workbook sheets with source row, workbook hash/version, effective date, original value, normalized value, and URL provenance. Build the basic fund/distribution admin and diff-preview workflow before presenting data as current.
6. **Validate M3 with golden test cases.** Reproduce agreed workbook examples, document tax assumptions, handle empty/error states, and separate educational estimates from personalized advice.
7. **Persist M4 goals and constrain recommendations.** Save/revisit goals, make the generation method explicit, and test suitability/objectivity/non-advice behavior before calling it AI-generated.
8. **Build M5 as an auditable retrieval system.** Add crawler/transcription ingestion, versioned chunks/embeddings, citations, freshness, evaluation cases, conflict/objectivity policies, and prompt-release records.
9. **Make M6 operational but non-transactional.** Add idempotent scheduled check-ins and Resend notifications; remove all claims that trades are executed unless separately contracted and actually integrated.
10. **Run M7 launch gates, then M8.** Admin, observability, security/privacy review, accessibility/E2E tests, beta evidence, performance budget, production runbooks, then React Native/push/store work.

## Minimum acceptance evidence to collect

For every milestone demo, retain:

- the exact commit and deployed environment;
- an acceptance checklist mapped to the signed wording;
- automated test output plus any manual test script;
- screenshots/video of the live workflow using non-production test data;
- schema/migration version and rollback notes when applicable;
- source/version/provenance for imported financial content;
- known limitations and Client sign-off date.

This report is an engineering delivery assessment, not a legal opinion or a determination of contractual breach.
