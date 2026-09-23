# PII web workspace

Run commands from the repository root; see [setup and checks](../../README.md).

`src/app` owns the typed route tree, readable shell and error handling. `src/features/auth` owns sign-in/recovery/session UX; `src/features/identity` owns API-backed onboarding/member presentation. `src/demo` is the lazy adapter around the prototype. Its legacy JSX/fixtures are not a production domain model.

Public routes are `/`, `/demo/home`, `/demo/portfolio`, `/demo/funds` and `/demo/plan`. Demo redirects remain canonical. Connected routes are `/login`, `/auth/callback`, `/auth/recovery`, `/app/onboarding` and `/app/home`; they require [Auth/API configuration](../../docs/runbooks/web-auth.md). Unknown routes show 404. Member screens never simulate authentication or show sample balances.

The old demo welcome overlay and state-only navigation are replaced. F5 onboarding uses actual API persistence; imports, AI and financial behavior are outside this slice. Legacy calculations remain unchanged/unverified. Charts/fixtures load only in demo routes; Auth packages are route-lazy too. Shared CSS still contains legacy styles.

New UI uses a 16px base, readable secondary text, visible keyboard focus, a skip link, route-focus management, wrapping navigation and at least 44px shell controls. Legacy screen typography, controls and modals do **not** yet meet the full product accessibility standard. Automated axe checks cover the new landing/shell, not all preserved financial screens.

## Boundaries and conventions

- New source files must be TypeScript. `allowJs`/`checkJs: false` temporarily admit only preserved legacy code; a repository test prevents JavaScript outside that directory.
- Only demo modules import legacy views/data. Only the router imports demo entry points. Browser code cannot import Node built-ins or server/API/worker modules. ESLint tests exercise static, dynamic and re-export boundaries.
- Route wrappers adapt old callback navigation to real links. New live features must not import these wrappers or substitute fixtures on errors.
- Future shareable filters, tabs and selections belong in validated URL search parameters; transient dialogs stay local. The old demo's local-state filters are an explicit exception, not the pattern for M2.5a.
- TanStack Query owns server state with identity/epoch keys, cancellation and clearing on account changes. No private response cache is persisted. Forms own unsaved drafts; runtime schemas come from `@pii/contracts`. Browser metadata does not authorize API calls.
- `vite.config.ts` disables module preloading because the recovery test reproduced WebKit's failed-preload cache issue. Native dynamic imports remain lazy. Reconsider only with recovery tests on supported mobile browsers passing.

Do not point this preview at production credentials. Client-owned reference documents remain outside the web output.
