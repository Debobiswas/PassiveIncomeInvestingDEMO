# Local identity backend

F4 implements the API and database foundation only. The member UI/email/Google lifecycle is F5; hosted configuration and operational acceptance are F6. This runbook does not authorize remote migrations or production provisioning.

## Start and verify

Use the root Node/npm versions and Docker:

```sh
npm ci
npm run db:start
npm run db:check
npm run test:integration
npm run check
```

The isolated Supabase project is `pii-foundation`: Auth/Data API on `127.0.0.1:55421`, Postgres on `127.0.0.1:55422`, local mail on port 55424. Other projects on default Supabase ports are not used. The wrapper checks the exact local target and does not print credentials. Realtime, storage, Studio and other unused services are excluded.

Integration tests create confirmed synthetic identities, exercise the actual HTTP adapter/Auth/PostgREST/Postgres, and delete only their own records. They require no existing current disclosure, to avoid replacing real content. Do not run concurrent copies against this database. Test-only privileged clients and SQL role simulation are never application authentication mechanisms.

### Destructive local replay

Only when this isolated database contains disposable test data:

```sh
npm run db:reset:local
npm run db:check
npm run test:integration
```

Reset deletes this local project's data and recreates it from migrations. It cannot recover that data; export anything valuable first. The wrapper verifies the project and exact local API/database URLs before invoking `--local`. Never substitute a remote connection, `--linked`, or a different project's configuration.

Stop only this stack with `npx supabase stop --project-id pii-foundation`. Default stop preserves its volumes. Do not use `--all` or `--no-backup`.

## Run the HTTP API

Use `.env.example` as the template for an ignored `.env.local`. Supply the local publishable key privately from your local Supabase configuration; never paste status output into shared logs. Runtime needs only `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`. Secret/service-role keys are refused.

```sh
node --env-file=.env.local scripts/dev-api.ts
```

Alternatively supply environment variables externally and run `npm run dev:api`. The development adapter listens on loopback port 3001; it is not a production server. Vercel entry points use the same Web Request/Response handler. Hosted routing still requires F6 verification.

Requests use `Authorization: Bearer <access-token>`; never put tokens in URLs or logs. A browser Origin, when supplied, must match the API origin. Native clients need not send Origin. F5 should use a same-origin development proxy, not wildcard CORS. The web app is not yet connected to these endpoints.

## Contract

`packages/contracts` owns runtime Zod schemas and inferred TypeScript types, shared without server imports. An OpenAPI document/generated SDK is not yet provided.

| Endpoint                      | Behavior                                                            |
| ----------------------------- | ------------------------------------------------------------------- |
| `POST /api/v1/me` with `{}`   | Idempotent profile/onboarding initialization after verified sign-in |
| `GET /api/v1/me`              | Own profile, or 404 before initialization                           |
| `PATCH /api/v1/me`            | Update allowed fields with `expected_revision`                      |
| `GET /api/v1/me/onboarding`   | Own persisted state and current approved disclosure, if any         |
| `PATCH /api/v1/me/onboarding` | Acknowledge a specific current disclosure or complete setup         |
| `GET /api/v1/admin/access`    | Current server-controlled admin membership, otherwise 403           |

Profile fields are display name (1–80 Unicode code points, no leading/trailing ASCII spaces or control characters), country (uppercase two-letter syntax), and CAD/USD display currency. Country syntax is not a validated country catalogue or tax-residency evidence. Product taxonomy and UI choices remain F5 work. Initial fields are null, never invented defaults.

Inputs are strict, limited to 4 KiB, and reject supplied owners, roles, timestamps and completion flags. Requests have an eight-second abort deadline. Both HTTP and database commands validate writes. Revisions prevent lost updates; duplicate initialization and completion are harmless. After an ambiguous write timeout, fetch persisted state before retrying. Financial idempotency keys/outboxes are not implemented in this identity slice.

Errors contain a safe code/message, generated request ID and retryability. Responses are private/no-store. Validation/auth/authorization/not-found/conflict errors retain 400/401/403/404/409 semantics; body/content-type limits use 413/415; dependency failures/timeouts use 503/504. Raw provider/SQL errors are never returned. Request IDs are not yet connected to hosted telemetry.

## Security boundary

- Only `public` is an exposed Data API schema. **Never expose `private`.** Private base tables have forced RLS and explicit grants; public commands are narrowly granted security-invoker functions. Column grants allow those invoker functions to work, not arbitrary client SQL. Do not give end users SQL logins or add arbitrary SQL execution endpoints.
- Ordinary runtime operations use the publishable key plus the member JWT, not service-role bypass. Auth verifies identity; PostgREST verifies signature/expiry and establishes the database actor. Returned private records are checked against that verified actor too.
- The sole security-definer helper is a private, read-only boolean check of the caller's own live Auth session and confirmed, non-anonymous, non-banned/non-deleted identity. It has an empty search path and no caller-supplied user/session parameters. This makes session revocation effective for direct commands as well as the application API.
- Staff access reads current `private.staff_memberships`, ignoring editable metadata and stale token role claims. Members cannot provision staff. Trusted operator changes produce `private.staff_audit` entries with the database actor. A human approver/ticket workflow and operator identity correlation remain F6 work; a shared database role is not a complete human audit trail.
- Direct Data API bypass attempts are tested separately from HTTP validation. Grant/RLS checks include positive own-user writes, not just denied requests.

No approved educational disclosure is seeded. Without one, onboarding completion fails safely. An approved operator publication must supply a new version for changed wording; never rewrite the body of an acknowledged version. This publication rule is presently operational, not enforced by an immutable-content trigger. Changing the current disclosure does not reset previously completed onboarding: mandatory re-consent requires a separately designed versioned workflow.

## Migration and release boundary

The initial migration was generated from the local schema, reviewed/hardened for explicit negative/default grants, and replayed on an empty local database. It refuses the legacy `public.profiles` schema. It is not an upgrade migration for the independent portfolio-import branch or an unknown hosted database.

Before any remote change, discover existing users/schema/history read-only and test an explicit upgrade/repair path on a disposable copy. After this baseline is committed, append migrations rather than rewriting applied history. Prefer additive schema changes; roll back application code without dropping user tables.

Still unverified: hosted CI/required checks, Google credentials/redirects, real email delivery/verification/recovery, invitation policy, production session policy, platform rate controls, approved disclosure wording, North American deployment, Sentry/redaction, staging rollback/restore, and load capacity. F4 tests do not prove the 1,000-online-user workload or M1 acceptance.
