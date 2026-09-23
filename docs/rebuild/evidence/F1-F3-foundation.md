# F1–F3 foundation implementation evidence

Date: 2026-09-22 (America/Toronto). Branch: `codex/foundation-phase-1`, from planning/source baseline `33f42db`. This is a local engineering slice, **not full M1 acceptance or a deployable member product**.

## Implemented scope

- F1: root npm workspace, one lockfile, pinned Node 24.16.0/npm 11.13.0, app relocated to `apps/web`; strict TypeScript for new app code; executable import boundaries; matching Vercel build/output configuration.
- F2 local baseline: zero-error lint/types, source-integrity and architecture tests, browser journeys, reproducible build/budget checks, formatting and a no-secret GitHub workflow. Hosted required-check enforcement remains open; real database replay/isolation tests land with F4's schema.
- F3 local route shell: explicit URLs, lazy screens, refresh/history/404 behavior, accessible loading/failure states, focus management, responsive readable navigation and demo isolation. Query-state convention documented; legacy demo filters remain local until replaced. No unused query-cache abstraction has been introduced.

The old state-based App and session-storage welcome overlay were replaced. Original financial screens/assets are preserved under `src/demo/legacy`, including unrouted historical views for reference. Only unused imports and simulated-trade wording changed inside those screens; financial formulas were not rewritten. No live authentication, import, advice or trade execution is implied. New landing/member-unavailable states do not import fixtures.

## Verification record

Environment: macOS, Node 24.16.0, npm 11.13.0; Playwright 1.63.0 desktop Chromium and mobile-emulated WebKit. No application secrets, remote database, brokerage or AI provider used.

| Check | Observed result |
| --- | --- |
| `npm run check` | Pass: strict app/tool types, zero lint errors, 23 unit/guardrail tests, formatting, production build |
| `npx playwright test` after build | 13 passed; one intentionally inapplicable desktop-keyboard case skipped in the touch/mobile project |
| Browser coverage | Every demo route direct-loads and refreshes; navigation/history/active link, canonical redirects, unknown/member paths, failed-chunk retry, keyboard focus, shell touch targets and large-text reflow |
| axe | No violations in tested new landing/header/demo notice/navigation. This is not a full legacy-screen or manual assistive-technology audit |
| Build budget | 98,633 bytes gzip initial JS + CSS, under the 204,800-byte gate. Lazy chart/financial code is outside the initial route. Not a runtime-speed or capacity measurement |
| Source integrity | Both original PDF/XLSX SHA-256 hashes match the preserved baseline; no PDF/XLSX/reference directory in web output |
| `npm audit --audit-level=high` | Zero reported vulnerabilities after Vite patch; point-in-time dependency audit, not a security assessment |
| `git diff --check` | Pass |
| Clean snapshot install/check/browser run | Pass in an isolated `git archive` export of staged tree `07452cf3f6fc6aa3d4245e5fab528ceed6d3e808`, with no copied node_modules/env files: `npm ci && npm run check && npx playwright test`; same 23 unit / 13 browser passes and identical initial bundle size |
| Root development command | `npm run dev` starts successfully; `/` and `/demo/portfolio` return HTML; direct dev-server filesystem access to the private reference PDF is denied (HTTP 403) |
| Visual and documentation review | Desktop/mobile landing screenshots inspected; updated setup/evidence links resolve; independent feature worktree remains clean at `f3b65e2` |

The architecture tests deliberately submit forbidden fixture/server/Node/reference imports to the actual ESLint configuration and assert rejection. They also reject eagerly bundling demo screens through the router. These are architectural guardrails, not a replacement for authorization/RLS or malicious-code review. No money, schema or provider behavior is being “proved” by these tests.

Local screenshot/trace/report outputs live in ignored `test-results/` and `playwright-report/`. CI retains browser failure diagnostics for seven days. No sensitive member data belongs in these artifacts.

## Decisions and defects caught during this slice

1. Keep React/Vite rather than a framework rewrite. Use npm's native workspace support and one reproducible root install ([npm workspaces](https://docs.npmjs.com/cli/v11/using-npm/workspaces/)). New code opts into strict TypeScript; legacy JS is an explicit quarantined exception enforced by a repository test ([TypeScript strict](https://www.typescriptlang.org/tsconfig/#strict)).
2. Pin tested Node 24 LTS, npm and dependencies. TypeScript 6.0.3 is within the installed ESLint TypeScript plugin's supported range; do not blindly select the newest major. Runtime upgrades are deliberate, tested changes ([Node release lifecycle](https://nodejs.org/en/about/previous-releases)).
3. Existing Vite 8.0.14 triggered an audit finding. Upgrade only to patched 8.0.16 rather than a broad dependency refresh ([Vite advisory](https://github.com/vitejs/vite/security/advisories/GHSA-fx2h-pf6j-xcff)). Remove unused client Supabase dependencies; retain the existing pinned CLI for later backend work.
4. Failure-injection tests reproduced WebKit's stuck failed-modulepreload behavior even after refresh, using both aborted requests and HTTP 503. Disable Vite module preloading; native dynamic imports remain lazy and both browser engines now recover after a user-requested reload. This trades speculative preload parallelism for verified recovery. Revisit when supported engines pass the same regression test with preloading enabled ([WebKit issue 270357](https://bugs.webkit.org/show_bug.cgi?id=270357)). No automatic reload loop or cache-busting code was added.
5. Remove the remote Google Fonts request and use the existing system fallback stack. This makes the shell independent of a font provider; typography can be self-hosted later if approved. New readable shell styling is not a full redesign of the preserved 9–11px financial labels.
6. Scope Vercel SPA rewrites so missing API/asset paths are not rewritten to HTML. Build from the repository root, not the old app directory. Hosted rewrite behavior still requires staging evidence ([Vercel rewrites](https://vercel.com/docs/routing/rewrites)). Browser tests currently use Vite preview, not Vercel.

## Acceptance mapping and open gates

- **M1-A05 partial:** local checks/workflow implemented. GitHub execution, branch-protection required status, actual DB tests, staging promotion and production rollback are not verified.
- **M1-A07 partial:** tested public/demo routes and honest unavailable-member state. Real protected-route/session behavior, real devices, browser zoom and manual screen-reader journeys remain open.
- **M1-A08 partial:** import/demo boundaries pass. No API schema, network error contract or backend domain surface exists yet; test those with F4.
- **M1-A10 partial:** accurate root setup, commands and scoped agent rules exist; second-developer onboarding and database/deployment/incident instructions await their implementations.
- **M1-A01/A02/A03/A04/A06/A09/A11/A12:** not accepted by this slice. No identity, schema, monitored NA deployment, persisted onboarding, tenancy isolation, durable jobs/AI or capacity result is claimed.

Before exposing a beta: finish F4 identity/profile/onboarding schema and real two-user authorization/RLS tests; F5 email/Google/session/onboarding lifecycle; F6 isolated staging, monitoring, deployment/recovery and acceptance evidence. Backend and native gates still apply to the 2,500-user/1,000-concurrent target. A mobile browser test is not a native application or a load test.

## Rollback and source protection

No database, deployment or published Git history was changed. Roll back this slice by reverting its implementation commit(s), restoring the old prototype layout and npm setup together; do not selectively restore only the entry point or lockfile. Reinstall from the corresponding lockfile. Never delete/reset the independent `feat/portfolio-import@f3b65e2` worktree. The original PDF and workbook remain byte-identical in `docs/reference/`.
