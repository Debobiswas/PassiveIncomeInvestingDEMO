# F6 local operations foundation — evidence and open acceptance

Date: 2026-09-23. Branch: `codex/foundation-operations`, based on F5 `76d16ef`. Scope: M1-A03/A04/A05/A10 supporting implementation. **F6 and M1 are not fully accepted.** No deployment, external Sentry transmission/upload, paid provisioning, remote migration, history rewrite or production promotion was performed.

## Implemented

- Separate public liveness and secret-gated, authenticated, read-only readiness; checks real Auth and owned profile/onboarding RPCs with a five-second deadline, safe 503s and no public dependency amplification.
- Pinned Sentry browser/Node SDK 11; positive-allowlist diagnostics, release/environment/request IDs, explicit automatic-data opt-outs, no default integrations/replay/logs/metrics/tracing. Browser route/global failures and failed member requests; API 5xx/readiness failures; bounded browser volume and awaited server flush. Safe browser build-asset stack locations; no original server error payload/stack.
- Hidden browser maps archived outside public output with SHA-256 manifests; artifact gate rejects public maps and client PDF/XLSX. Private archive denied by Vite and excluded from Vercel CLI upload. Signed originals remain untouched.
- Explicit Vercel `iad1` function configuration, bounded duration, private source/log visibility setting and basic browser security headers. This is configuration, not proof of hosted region/residency.
- Hosted build configuration consistency gate; matching API/browser release and Supabase target; explicit read-only HTTPS release smoke with no credential-bearing redirects. Added operations browser tests to CI and an [operations/release/rollback runbook](../../runbooks/operations.md).

## Verification performed locally

| Check | Observed result |
| --- | --- |
| `npm ci` / `npm run check` | Clean locked install (0 audit vulnerabilities reported), strict type checks, boundaries/lint, 86 unit tests, formatting and root production build pass |
| Sentry SDK transports | Actual browser/Node event envelopes preserve release/request ID and exclude injected credentials, holdings, prompts, user/URL/context/exception content |
| `npm run test:operations:e2e` | 6 Chromium/mobile-WebKit checks pass: browser error redaction/cap, failed-route recovery/reporting and denied access to private maps; all browser external traffic intercepted |
| `npm run test:integration` | 11 actual local Auth/API/Postgres tests pass, including ready success, invalid identity denial and a broken Data API never returning ready |
| `npm run db:check` | No schema lint/advisor issues; no F6 schema changes |
| Native Node HTTP adapter | Actual HTTP liveness 200 and unauthenticated readiness 404 through `scripts/dev-api.ts` |
| `npm run test:auth:e2e` | 18 real local email/Auth/onboarding browser checks pass |
| `npx playwright test` | 13 demo/route/accessibility checks pass; 1 desktop-only keyboard case skipped on mobile |
| Production artifact | Initial JS+CSS 144,189 gzip bytes against 204,800 budget; 29 browser maps archived privately, none in public output |
| Integrity | Unit tests retain exact PDF/XLSX hashes; independent portfolio-import worktree is not edited |

The new browser fault test initially targeted the wrong lazy-module path; corrected to the actual router import and rerun successfully. SDK 11 removed earlier privacy options; implementation uses current typed `dataCollection` options with envelope-level verification. Supabase changelog/current regions and official Sentry/Vercel docs were checked; the operations runbook links the relevant sources. Local tests use synthetic data, not client holdings.

## Acceptance still required

| Acceptance | Local support | Hosted/human gate still open |
| --- | --- | --- |
| M1-A03 | Region config and environment consistency checks | Approved Vercel/Supabase target IDs; actual NA compute/data placement; separate staging/production; redirects/provider-processing evidence |
| M1-A04 | Sanitized browser/API SDK envelopes, request/release correlation, browser map archive | Real Sentry ingestion/alert receipt; private upload job and browser symbolication; reviewed server-function stack/map adapter and symbolication; provider privacy/retention approval. Worker telemetry belongs to P2 |
| M1-A05 | Local CI-equivalent checks, build gates, read-only smoke implementation, rollback procedure | Actual hosted CI checks and enforcement, reproducible Vercel preview/API routing, A→B→A staging rollback and preserved synthetic data, approved production path |
| M1-A10 | Setup/operations/incident runbooks | Independent second-developer walkthrough and named owners |
| M1-A01/A06/A07 | F4/F5 evidence retained | Live Google success, hosted email/redirects, invite policy, approved disclosure and human AT/readability review |
| M1-A11/A12 | No new acceptance claimed | Worker/AI adapters when their workload arrives; measured load/soak/recovery/cost evidence before user-count capacity claims |

CLI authentication for Vercel/GitHub was available, but no linked staging target was established. The read-only GitHub branch-protection query returned 404; that does **not** prove either protected or unprotected status. Target selections were requested from the user. Do not mark hosted checks complete from these local results. The next step is target/owner confirmation, then explicitly authorized hosted configuration and evidence collection—not adding portfolio features on the assumption M1 is signed off.
