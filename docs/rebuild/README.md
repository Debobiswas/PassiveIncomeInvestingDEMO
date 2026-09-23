# Rebuild plan and milestone PRDs

This is the planning baseline for rebuilding Passive Income Investing on `codex/foundation-rebuild-plan`. It was created after inspecting `master@4dbf440`, the independent `feat/portfolio-import@f3b65e2` worktree, and the signed agreement. Ten dedicated milestone reviews informed these documents. None of the planned features is marked implemented or accepted by writing a PRD.

## Product direction

Mobile is primary. Web provides equivalent functionality with especially readable presentation for people who prefer a larger screen, including older users. The user specified a private beta of 2,500 users with approximately 1,000 online simultaneously. The 10,000-user launch and eventual 300,000-active-user targets require separate measured workload and cost plans.

Priority is completion through M5, which includes seven signed milestones: M1, M2, M2.5a, M2.5b, M3, M4 and M5. Plan M6–M8 now to ensure earlier foundations support them. Native compatibility starts after M1 because mobile is the primary product; full push/store delivery remains M8.

## Read in this order

1. [Refactor plan](REFACTOR_PLAN.md): dependency map, PR sequence, salvage decisions and delivery gates.
2. [Architecture](ARCHITECTURE.md): routes, module boundaries, API, persistence, asynchronous jobs and AI responsibilities.
3. [Shared domain contracts](DOMAIN_CONTRACTS.md): one source of truth for ownership, route/API names and inter-milestone data.
4. [Capacity and reliability](CAPACITY_AND_RELIABILITY.md): explicit 1,000-session workload assumptions, load/recovery protocol and cost controls.
5. [Mobile/web product experience](PRODUCT_EXPERIENCE.md): readability, accessibility and parity gates.
6. [Repository evidence and risks](EVIDENCE_AND_RISKS.md): concrete defects and careful corrections to the earlier gap analysis.
7. The assigned milestone PRD below, then [AGENTS.md](../../AGENTS.md) before implementation.

## Milestone index and win conditions

| Milestone and PRD | Win condition | Principal dependency |
| --- | --- | --- |
| [M1 Foundations & Auth](milestones/M1-foundations-auth.md) | Real email/Google sign-in, persisted onboarding, protected deep links, tenant isolation, CI, monitored NA deployment and repeatable developer setup | Signed scope, selected environments and identity credentials |
| [M2 Portfolio Sync](milestones/M2-portfolio-sync.md) | Multiple real portfolios survive reload; manual/CSV/SnapTrade journeys agree with source values and currency; broker failures preserve last good state | M1; provider access/capability evidence |
| [M2.5a ETF Screener](milestones/M2.5a-etf-screener.md) | Validated workbook/model import, >=140 distinct ETFs, real filters/details/three-way comparison/videos and authorized admin CRUD | M1 and shared listing identity |
| [M2.5b Distributions](milestones/M2.5b-distributions.md) | Source-backed history/yield/dates and validated sponsor uploads with reviewed atomic diff publication | Catalogue IDs, history files and dated price inputs |
| [M3 Income Calculator](milestones/M3-income-calculator.md) | Deterministic verified capital/tax-drag/inflation/milestone results with explicit assumptions and tracking | Shared math contracts; source data for connected mode |
| [M4 Goal Engine](milestones/M4-goal-engine.md) | Real bounded AI generates valid sourced allocations/rationale; saved goals/plans reopen consistently | Catalogue/models, M3, shared AI adapter |
| [M5 AI Advisor](milestones/M5-ai-advisor.md) | Real transcription/embedding/retrieval/chat/questionnaire, cited objective answers and completed two-week tuning/evaluation | M1 jobs, M4 AI/questionnaire contracts, permitted corpus and deterministic fact APIs |
| [M6 Check-Ins & Rebalance](milestones/M6-checkins-rebalance.md) | Idempotent monthly check-ins compare real snapshots to adopted targets and deliver useful explanations/email without claiming trades | M2 targets/snapshots, M4 goals, shared AI and notification foundations |
| [M7 Beta & Web Launch](milestones/M7-beta-launch.md) | Usability/QA/admin/operations gates, documented 10–20-person pilot and production web release | Accepted launch scope and measured recovery/capacity evidence |
| [M8 Mobile Apps](milestones/M8-mobile-apps.md) | Real iOS/Android parity, secure sessions, readable native UX, push and evidenced store submissions/listings | Early native slice after M1; ongoing domain parity; release readiness |

Each PRD includes signed coverage, current code evidence, stable requirement/acceptance IDs, journeys and failure states, data/API ownership, ordered implementation slices, verification, release/rollback and unresolved inputs. Requirement prefixes for the fractional milestones are `M25A` and `M25B`.

## Recommended sequence

Build M1 first, then prove a persisted manual/CSV portfolio journey. Stabilize shared fund identities and import the catalogue. Add full broker sync and distribution publication. Validate M3 math before M4 consumes it. Introduce real constrained generation in M4; extend the same AI adapter with ingestion/retrieval in M5. Prepare content/evaluation data early, but do not claim the signed two-week tuning period has happened until the real baseline exists.

After shared contracts stabilize, limited M2/catalogue/native work can proceed in parallel under clear ownership. Do not independently build ten feature backends. Reuse review agents for bounded PR verification, not competing architecture decisions.

The first implementation change is F1/F2: reproducible TypeScript workspace and meaningful CI baseline, followed immediately by real routing/identity and an end-to-end persisted journey. The current planning change adds documentation/governance; it does not migrate the app or database.

## Resolved integration decisions

- Keep React/Vite, Vercel and Supabase as the baseline; choose a different framework only for a demonstrated requirement.
- One modular backend and an independent bounded worker; one versioned product API shared by web/native.
- M2 owns applied target allocations; M4 owns generated proposals; M6 compares only explicitly adopted targets.
- M4 establishes the first questionnaire contract and real AI integration; M5 extends both with advisor-specific behavior and RAG.
- M2.5b owns sourced distribution metrics; M3 owns forecasts; AI explains validated outputs and never owns financial arithmetic.
- Catalogue admin, tests, identity/security, observability and readability start at their relevant early milestone, not as launch cleanup.
- The 10–20-person contractual pilot precedes expansion to the 2,500-user beta. A limited M1–M5 beta is explicitly feature-scoped and does not imply M6, full M7 or M8 acceptance.
- Mobile reduces network work only where local rendering/caching/math actually avoids requests; it does not establish lower server capacity needs by itself.

## Plan review and completion evidence

Source authority: [signed agreement and workbook inventory](../reference/README.md). The earlier proposal and prototype requirements remain historical reference only. Original source-file hashes are preserved.

Plan validation includes ten milestone reviews, parent synthesis, cross-review of contracts/dependencies, local link/acceptance-ID checks, and Git/source-integrity checks. Application tests reported in the evidence register are the preceding audit's baseline, not tests of an unbuilt refactor. No real provider, migration, production load or native acceptance is claimed.

During implementation, attach an evidence record to every acceptance ID: commit, environment/device, expected/observed behavior, command or manual scenario, report/artifact and reviewer. Open product/provider choices are listed at the affected slice in the refactor plan; they do not block unrelated foundation work.
