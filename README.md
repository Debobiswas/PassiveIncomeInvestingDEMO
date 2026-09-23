# Passive Income Investing

Client project for a mobile-first investing education and portfolio application, with an equivalent readable web experience. The React/Vite app now lives in `apps/web`. The engineering foundation is being rebuilt; financial screens remain an explicitly labelled prototype, not a live product.

## Start here

- [Rebuild plan and milestone index](docs/rebuild/README.md)
- [Architecture](docs/rebuild/ARCHITECTURE.md)
- [Ordered implementation plan](docs/rebuild/REFACTOR_PLAN.md)
- [Capacity and reliability](docs/rebuild/CAPACITY_AND_RELIABILITY.md)
- [Shared readable mobile/web experience](docs/rebuild/PRODUCT_EXPERIENCE.md)
- [Contributor and agent rules](AGENTS.md)
- [Preserved source documents and workbook inventory](docs/reference/README.md)
- [Earlier implementation gap analysis](docs/reference/IMPLEMENTATION_GAP_ANALYSIS.md)

The signed agreement in `docs/reference/` is authoritative; earlier proposal-based milestone numbers are obsolete. M3 is the calculator; M5 is the AI/RAG advisor. Source documents contain confidential client IP and are not public application assets.

## Local setup

Use Node **24.16.0** (`nvm use`) and npm **11.13.0**. Runtime files, engines and the root lockfile pin the toolchain. All commands below run from the repository root. No environment variables, production credentials or database are required for this demo.

```sh
npm ci
npm run dev
```

Open the URL Vite prints, normally `http://localhost:5173`. `/` explains preview limitations; `/demo/home` opens the sample application. Member UI under `/app/*` remains unavailable until F5 connects sign-in and onboarding to the new backend.

Checks:

```sh
npm run check
npx playwright install chromium webkit
npm run test:e2e
```

`check` runs strict type checking, ESLint/import boundaries, unit/guardrail tests, formatting and the production build. `test:e2e` builds and runs real browser journeys in desktop Chromium and mobile-emulated WebKit. Linux may need `npx playwright install --with-deps chromium webkit`.

Individual commands: `npm run typecheck`, `npm run lint`, `npm test`, `npm run format:check`, `npm run build`. Use `npm run format` for formatting. The build gate limits initial compressed JS + CSS to 200 KiB and rejects private PDF/XLSX reference artifacts in the output. `npm run preview -- --host 127.0.0.1 --port 4173` serves the built app locally; it is not a production server.

## Structure and boundaries

```text
apps/web/src/app/          typed routing, shell and public states
apps/web/src/demo/         lazy demo adapters
apps/web/src/demo/legacy/  quarantined JSX/fixtures; not trusted financial logic
api/                      thin versioned HTTP entry points
packages/contracts/       runtime schemas and inferred client/server types
packages/server/          verified identity, HTTP boundary and user-scoped repository
supabase/migrations/      private identity schema, command functions, grants and RLS
scripts/                  import-boundary and build checks
tests/unit/               guardrail/source-integrity tests
tests/integration/        real local Auth, HTTP, PostgREST and database isolation tests
tests/e2e/                browser, failure-recovery and shell accessibility journeys
docs/reference/           confidential original source files and extraction evidence
docs/rebuild/             PRDs, architecture and implementation evidence
```

New production code is strict TypeScript. Legacy JSX remains deliberately untyped; passing checks do not validate its financial rules. Backend packages now implement their first tested identity use case; future domain/worker modules enter alongside actual workloads.

## Local identity backend

With Docker running, use `npm run db:start`, `npm run db:check`, then `npm run test:integration`. The isolated local project uses API port 55421 and database port 55422; it does not use another project's default ports. See the [identity runbook](docs/runbooks/local-identity.md) for API environment setup, endpoint contracts, security boundaries and **destructive local-only** migration replay. No remote database is needed or modified. The backend persists profiles/onboarding and enforces current staff authorization; the F5 browser lifecycle is still pending.

## CI and deployment boundary

The GitHub workflow runs install, type/lint/unit/format/build checks and browser tests, plus an isolated local database job for migration replay, Auth/API/RLS integration and schema/security checks, without production application secrets. Repository administrators still need to make its statuses required in branch protection. No hosted CI success or release-blocking policy is claimed until verified on GitHub.

`vercel.json` builds from the **repository root**, outputs `apps/web/dist`, and rewrites browser routes to the SPA without swallowing `/api/*` or missing `/assets/*`. Hosted rewrite/API behavior and North American environment configuration still require staging verification. Do not deploy as a member product or attach production secrets. Local identity integration is tested; hosted provider journeys and load capacity are not yet verified.

## Branches and planning status

- `codex/foundation-rebuild-plan`: planning branch from `master`; contains the rebuild documentation and AGENTS.md. Application refactoring has not started here.
- `codex/foundation-phase-1`: F1–F3 workspace, CI/test baseline and routed demo isolation. See [implementation evidence and remaining gates](docs/rebuild/evidence/F1-F3-foundation.md).
- `codex/foundation-identity`: F4 identity/profile/onboarding API and private database foundation. See [local verification and remaining gates](docs/rebuild/evidence/F4-identity.md).
- `feat/portfolio-import@f3b65e2`: independent worktree with auth/routing/schema/parser groundwork and 33 passing unit tests at audit time. Its live provider and visible import workflow are incomplete.
- `docs/superpowers/` and `PHASE_1_REQUIREMENTS.md`: historical prototype plans, with scope/numbering conflicts identified in the rebuild plan.

No production provisioning, remote database reset, shared history rewrite, or claim of 300,000-user capacity is implied by this documentation. Beta planning uses the user's stated 2,500 users and approximately 1,000 simultaneously online.
