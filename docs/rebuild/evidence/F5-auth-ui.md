# F5 — Connected web authentication and onboarding

Branch: `codex/foundation-auth-ui`, from F4 `cb952e8`. Verified locally 2026-09-23, macOS / Node 24.16.0 / npm 11.13.0. Status: implemented and locally exercised; live Google, hosted delivery/configuration and client acceptance remain open.

## Delivered and verified

Lazy member routes; verified email/password registration/sign-in; resend/reset/recovery; Google PKCE initiation and failure handling; persisted stepwise onboarding with edit/review/conflict recovery; honest empty member workspace. Missing configuration, pending disclosure, revoked identity, denied callback, provider outage and offline logout have explicit states. No schema migration was needed.

Browser-safe contracts validate API responses. One identity-scoped Query cache cancels/clears on account changes and rejects late responses/old query closures. Logout clears the device immediately and requests server revocation using the captured token; other tabs clear private views. A local session marker prevents a late refresh from overwriting a newer login. Browser metadata never authorizes records.

| Evidence | Observed scope |
| --- | --- |
| Auth browser suite | 18 passed: nine journeys each on Chromium and mobile WebKit |
| Journey 1 | Actual signup email, refusal before verification, confirmation, saved/reloaded onboarding, second browser context, logout and used-link rejection |
| Journey 2 | Actual reset email, recovery reload, changed password and subsequent sign-in |
| Journeys 3–4 | Invalid credentials, unsafe return URL, sanitized callback failures, Google PKCE challenge and simulated consent denial |
| Journeys 5–6 | Offline logout warning; multi-tab logout, direct-command proof of revoked token, account switch and reload without previous-user data |
| Journey 7 | Non-JSON API outage/retry, actual refresh-token grant, server-revoked session returning to sign-in |
| Journeys 8–9 | Actual conflicting revision with retained draft/explicit reload; missing disclosure blocks completion while retaining profile |
| Readability | Axe checks on sign-in/disclosure, 200% text reflow, synthetic desktop/mobile screenshots inspected; human AT/zoom/usability review remains open |

Clean dependency install (`npm ci`) succeeded and npm reported zero known vulnerabilities at verification time. `npm run check` passed strict types, lint/import boundaries, 59 unit tests, formatting and build. `npm run db:check` reported no schema/advisor issues; all 10 F4 integration tests passed. The existing demo/shell suite passed 13 tests with one desktop-only keyboard case intentionally skipped on mobile. All 18 Auth browser tests passed. The initial compressed JS/CSS entry remains below the 200 KiB gate; Auth and query packages stay route-lazy. Original PDF/XLSX hash tests, local documentation links and `git diff --check` passed; the independent feature worktree remained clean.

Reproduce using the [web Auth runbook](../../runbooks/web-auth.md). Artifacts are ignored under `test-results/`; they are not client data or hosted-provider evidence. The CI database job now includes the serial Auth-browser suite; hosted successful CI/required checks remain unverified.

## Defects found and corrected

- Shorthand Vite proxy changed Host and triggered the API origin check: explicit proxy preserves Host without weakening authorization.
- Duplicate anonymous restoration remounted an active form: session epochs now track identity/recovery changes, and outgoing forms disable during navigation.
- SDK logout could read storage after it was cleared and miss revocation: capture JWT first; tests prove direct database commands reject it afterward.
- A permanently blocked logged-out tab could delete another tab's newer login: session-specific stale-event suppression plus switch/reload regression.
- WebKit rejected the test runner's simulated 302 response: use an isolated navigation fixture for denied Google consent, explicitly not a real Google acceptance result.

## Acceptance and remaining gates

- M1-A01: local password/confirmation/recovery/refresh/logout and failed callbacks pass. Actual Google success, hosted sender delivery, deployed redirects and session/abuse policy remain pending.
- M1-A06: committed steps persist across reload/another browser; actual conflicts and missing disclosure are tested. Approved real wording and client usability acceptance remain pending.
- M1-A07: connected routes and automated accessibility/reflow evidence added; human assistive-technology/actual zoom and target-audience testing remain required.
- M1-A08/A09: shared schemas, no demo imports, isolated cache and F4 server/database authorization remain in place. Hosted security/telemetry review remains F6.
- M1-A10: local setup and limitations documented; second-developer and hosted operations walkthroughs not claimed.

No production provisioning, remote migration, push or deployment occurred. Source documents and independent feature worktree remain preserved. Native delivery and load capacity are unmeasured. F6 should establish staging, telemetry/redaction, exact provider settings, required checks and rollback evidence; full F5 staging/M1 acceptance is not claimed.

## References and decisions

The Supabase skill informed current [PKCE semantics](https://supabase.com/docs/guides/auth/sessions/pkce-flow), [password lifecycle](https://supabase.com/docs/guides/auth/passwords), [Google setup](https://supabase.com/docs/guides/auth/social-login/auth-google) and [email-template restrictions](https://supabase.com/changelog/46599-changes-to-email-template-customisation-on-free-tier). The pinned SDK was inspected for recovery events, lock bounds and logout protocol. Default local email templates were used; no hosted SMTP was provisioned.

Adopted the planned verified email/password default, not unconfirmed passwordless. Selected pinned TanStack Query for the first real browser server-state cache; no competing profile cache, persistent financial cache or offline-write subsystem was added.
