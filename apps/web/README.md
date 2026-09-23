# PII web workspace

Run commands from the repository root; see [setup and checks](../../README.md).

`src/app` owns the strict-TypeScript route tree, readable shell, landing page, unavailable-member state and error handling. `src/demo` is an explicit, lazy-loaded adapter around the old prototype. `src/demo/legacy` contains unverified JSX views and fixture data; it is not a production domain model.

Routes are `/`, `/demo/home`, `/demo/portfolio`, `/demo/funds` and `/demo/plan`. `/demo` redirects to its home. `/demo/discover` redirects to `/demo/funds`. Unknown URLs show a not-found page. `/app/*` and `/login` explicitly say member access is unavailable; they do not simulate authentication or show sample balances.

This slice intentionally removes the old session-storage welcome/onboarding overlay and state-only sidebar navigation. It does not implement real onboarding, imports, AI, trade execution or persistence. Financial calculations remain unchanged and unverified. Charts, fixture data and legacy screens load only after entering the demo; the shared CSS still contains legacy styles.

New UI uses a 16px base, readable secondary text, visible keyboard focus, a skip link, route-focus management, wrapping navigation and at least 44px shell controls. Legacy screen typography, controls and modals do **not** yet meet the full product accessibility standard. Automated axe checks cover the new landing/shell, not all preserved financial screens.

## Boundaries and conventions

- New source files must be TypeScript. `allowJs`/`checkJs: false` temporarily admit only preserved legacy code; a repository test prevents JavaScript outside that directory.
- Only demo modules import legacy views/data. Only the router imports demo entry points. Browser code cannot import Node built-ins or server/API/worker modules. ESLint tests exercise static, dynamic and re-export boundaries.
- Route wrappers adapt old callback navigation to real links. New live features must not import these wrappers or substitute fixtures on errors.
- Future shareable filters, tabs and selections belong in validated URL search parameters; transient dialogs stay local. The old demo's local-state filters are an explicit exception, not the pattern for M2.5a.
- No server cache has been added because no server-backed query exists. Adopt the single cache and identity-reset strategy with F4/F5, not a placeholder provider now.
- `vite.config.ts` disables module preloading because the recovery test reproduced WebKit's failed-preload cache issue. Native dynamic imports remain lazy. Reconsider only with recovery tests on supported mobile browsers passing.

Do not point this preview at production credentials. Client-owned reference documents remain outside the web output.
