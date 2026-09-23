# Web authentication and onboarding (F5)

F5 connects the F4 API to readable sign-in, recovery, onboarding and member screens. Local email/password flows use real Auth and Postgres. Google initiation/failure handling is implemented, but actual Google success remains an external acceptance gate. Responsive web is not native-app acceptance.

## Local setup

1. Use the root Node/npm versions, `npm ci`, Docker and `npm run db:start`.
2. If the F4 stack was already running, restart **only** `pii-foundation` using `npx supabase stop --project-id pii-foundation`, then `npm run db:start` to apply updated Auth settings. Default stop preserves data. Do not use `--all` or `--no-backup`.
3. Create ignored root `.env.local` from `.env.example` with local `SUPABASE_URL` and its publishable key. Create ignored `apps/web/.env.local` from its `.env.example` with the same URL/key under `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Never put secret/service-role keys in Vite variables.
4. Run `node --env-file=.env.local scripts/dev-api.ts` and `npm run dev` in separate terminals. Open the printed URL, normally port 5173. Vite proxies `/api` to loopback 3001 while preserving Host. Do not weaken the API's same-origin check or add wildcard CORS.
5. Use `/login` with synthetic identities. Local emails appear at `http://127.0.0.1:55424`; no external mail is sent. Follow links in the **same browser and origin** where requested. Do not alternate localhost and 127.0.0.1 during a flow.

Local email confirmation is enabled. Exact callback URLs include localhost/127.0.0.1:5173 and the test origin 127.0.0.1:5180, all at `/auth/callback`. The local mail rate limit is for the isolated mail catcher, not a hosted recommendation. Public/demo routes need no Auth variables; member routes show a configuration-unavailable state if missing. This does not authorize public registration: invitation-only beta enforcement remains a provider/server policy gate before exposure.

See [database operations](local-identity.md) for API/schema security and destructive local-only replay. F5 requires no new schema migration and does not modify remote environments.

## Routes and behavior

| Route             | Behavior                                                                                                                      |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `/login`          | Verified email/password sign-in, registration, confirmation resend, reset request; generic registration/reset acknowledgement |
| `/auth/callback`  | One manual PKCE exchange per page load; strip query/fragment before rendering sanitized failures                              |
| `/auth/recovery`  | New password after recovery event; reload preserves recovery mode; success signs this device out for fresh sign-in            |
| `/app/onboarding` | Save/review/edit profile, acknowledge current disclosure, finish; committed steps resume after interruption                   |
| `/app/home`       | Server-verified identity and persisted completion; honest empty workspace with no fictional holdings or balances              |

Return destinations are allowlisted to `/app/home` and `/app/onboarding`; add future routes deliberately. PKCE links require the initiating browser's verifier. Overlapping flows in different tabs can invalidate an earlier verifier; request a fresh link in the current browser after failure. Passwordless was not confirmed, so the planned verified email/password default is adopted.

Country accepts uppercase two-letter syntax with Canada/US suggestions, not a complete validated country catalogue or tax-residency assessment. Display currency is CAD/USD. Unsaved drafts remain in component memory; logout/navigation discards them. Concurrent writes retain the draft but require explicit reload before another save.

No approved disclosure is seeded. The UI preserves saved details and blocks completion pending approval. Test-only wording is clearly synthetic and removed afterward. Changing current disclosure does not reset previously completed F4 onboarding; mandatory re-consent requires a separately approved workflow version.

## Session, cache and security

Supabase owns browser session persistence/refresh. Browser state supplies tokens, not authority: F4 independently verifies every API request, active database session and ownership. Editable metadata never grants member/admin access.

TanStack Query is the sole server-state cache: `['identity', epoch, userId]`, 30-second stale interval, no automatic retries, and cancellable reads. Identity/recovery changes synchronously cancel/clear queries and remount forms. Old-epoch responses and query closures are rejected. There is no persisted profile/financial query cache or offline write queue.

Logout captures the access token before clearing owned Auth storage/private views, then explicitly calls the provider's `/auth/v1/logout?scope=local`. This avoids queued SDK storage reads missing the session to revoke. A scoped storage event clears other tabs. A session-ID tombstone suppresses late refreshes from the just-signed-out session without deleting a newer login. Decoding this marker is **local race correlation only, never authentication**.

Offline logout clears the device but explicitly reports that server revocation was not confirmed. It does not invalidate copied tokens or claim account-wide logout. Production session limits, account-wide revoke/support procedures and invitation enforcement remain release gates. The SDK currently stores its session in localStorage: hosted XSS/CSP/redaction review and native secure storage are important remaining requirements, not completed hardening.

Auth HTTP/locks are bounded at 10 seconds, restoration at 12 seconds, and product requests at 12 seconds around F4's eight-second server deadline. Reload persisted state after an ambiguous write or conflict rather than blindly retrying. Referrer policy is `no-referrer`; never log passwords, callback URLs, sessions or tokens.

## Google and hosted acceptance

The Google button is disabled with an explanation unless `VITE_GOOGLE_AUTH_ENABLED=true`. Enable it only after configuring the intended provider using [Supabase's Google setup](https://supabase.com/docs/guides/auth/social-login/auth-google). Client secrets belong in provider/server configuration, never public variables. Google's redirect is the Supabase callback; the app's return URL is its exact allowed `/auth/callback` origin. These are different URLs.

Live credentials were not supplied; no Google project or remote settings were changed. Before acceptance, exercise actual consent/success/denial, hosted verified-sender delivery, expired/used links, origin mismatch, exact deployed redirects, session/abuse policy and accessibility on staging. Custom email templates on new Free projects may require custom SMTP; default local templates work here.

## Verification

```sh
npm run check
npm run db:check
npm run test:integration
npm run test:e2e
npm run test:auth:e2e
```

Auth browser tests use temporary loopback ports 5180/3002 and only the verified local database 55422/Auth 55421. They create/clean synthetic accounts, disclosure and mail, refuse an existing current disclosure, and run serially. Do not run concurrently with integration tests or use valuable data. The Postgres skill's least-privilege/testing guidance applies to this privileged fixture harness, not application access. Only publishable configuration enters Vite; fixture admin credentials stay in Node.

Both Chromium and mobile-emulated WebKit exercise real local email flows. Only Google's denied redirect is simulated; no real Google success is claimed. Auth traces/video/automatic screenshots are disabled. The runner disables automatic Playwright AI error-context snapshots, which can expose password values. Explicit screenshots use synthetic text or cleared password fields. Never upload Auth traces/mail dumps. The separate demo job retains its ordinary diagnostics.

F5 does not deploy, provision providers, implement native apps or prove capacity. Roll back application code without schema rollback. Keep email confirmation enabled; do not weaken hosted Auth to accommodate an old preview. Human screen-reader/actual-zoom testing and representative older-user usability sessions remain required.
