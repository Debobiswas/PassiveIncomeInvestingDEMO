# Portfolio Import + SnapTrade Connection — Design

**Date:** 2026-08-21
**Status:** Approved design, pending implementation plan
**Milestone:** M1 (Foundations & Auth) — SnapTrade integration, CSV fallback, multi-portfolio
**Scope:** First feature to cross the frontend-only line. Introduces a backend, a database, and real auth.

---

## 1. Problem

`robo-advisor/` is a frontend-only Vite SPA. Every number in it comes from `src/data/dummy.js`.
Two capabilities are needed:

1. **Import portfolio via document upload** — a user uploads a broker CSV/XLSX export and their real holdings populate the app.
2. **Connect your wallet (SnapTrade)** — a user links a real brokerage account and holdings sync automatically.

Today `Portfolio.jsx:25` contains an `UploadModal` that accepts a file and does nothing with it, and
`dummy.js` exports a static `brokerageAccounts` list with a fake `status: 'imported'` field. Both are
placeholders that this work replaces with functioning implementations.

## 2. Non-goals

- PDF statement or screenshot parsing (no OCR/LLM extraction). CSV/XLSX only.
- Trading. SnapTrade connections are requested with `connectionType: 'read'` — least privilege.
- Portfolio switcher UI. Schema supports many portfolios; UI shows one.
- Replacing the RAG advisor, ETF screener, or calculator logic.
- Unrelated refactoring of `Plan.jsx` / `Discover.jsx`.

## 3. Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Backend location | Vercel serverless functions in `api/`, same repo | One deploy, one repo; SnapTrade requires server-side signing |
| Persistence | Supabase Postgres | Already provisioned |
| Identity | Supabase Auth, **Google OAuth only** | Already configured on the cloud project |
| Document types | CSV + XLSX | Deterministic parsing, no probabilistic extraction |
| Portals | `/demo/*` public + `/app/*` authenticated | Private beta running in parallel with marketing |
| Demo behaviour | Interactive but sandboxed | Prospects feel the real feature; no DB writes, no API quota burned |
| Connection portal | Official `snaptrade-react` modal | Documented as the fastest path for React; handles the full postMessage contract |
| Dev environment | Local Supabase via Docker; cloud for deploy | Migrations validated before touching real data |
| Multi-portfolio | Schema-ready, single-portfolio UI | No later data migration; no UI complexity now |
| Login escape hatch | "Explore the demo instead" link | Uninvited visitors see the product instead of bouncing |

## 4. Architecture

```
                      browser
    ┌────────────────────┴────────────────────┐
    │                                         │
/demo/*  DemoProvider                  /app/*  LiveProvider
   dummy.js + in-browser parse            supabase-js (publishable key)
   no network writes                      fetch /api/* with Supabase JWT
                                                   │
                                    ┌──────────────┴──────────────┐
                                    │   api/ (Vercel functions)   │
                                    │   secret key + SnapTrade    │
                                    │   credentials live ONLY here│
                                    └──────┬───────────────┬──────┘
                                           │               │
                                    Supabase Postgres   SnapTrade API
```

### 4.1 The security boundary

SnapTrade's `registerSnapTradeUser` returns a `userSecret` which, paired with `userId`, grants full
access to that user's brokerage data. It is stored in `snaptrade_users`, a table with **RLS denying all
client access**. Only functions holding `SUPABASE_SECRET_KEY` can read it.

The browser never sees `userSecret`, `SNAPTRADE_CONSUMER_KEY`, or `SUPABASE_SECRET_KEY`. It sends a
Supabase JWT; the function resolves `auth.uid()` → `userSecret` server-side.

### 4.2 Repo layout

```
api/
  _lib/
    snaptrade.js      SDK singleton from env
    supabase.js       service-role client (secret key)
    auth.js           verify Supabase JWT -> { userId }  | 401
    snaptradeUser.js  get-or-create snaptrade user + secret
    normalize.js      SnapTrade position -> Holding row
    parse.js          CSV/XLSX -> { headers, rows }
    mapping.js        column synonym detection + broker presets
  snaptrade/
    login-url.js      POST -> { redirectURI }
    sync.js           POST -> pull accounts/positions/dividends, upsert
    connections.js    GET list | DELETE remove
    webhook.js        POST SnapTrade events
  import/
    preview.js        POST multipart -> parsed rows + mapping + warnings
    commit.js         POST confirmed rows -> holdings
robo-advisor/         existing SPA
supabase/migrations/  new SQL migrations
vercel.json           build config + /api routing
```

## 5. Environment & configuration

### 5.1 Required changes to env layout

`robo-advisor/.env` currently holds all four keys. Two problems:

1. Vercel functions in `api/` resolve env from the **repo root**, not `robo-advisor/`.
2. Vite exposes only `VITE_`-prefixed vars to the browser, so the SPA cannot read
   `SUPABASE_PUSHABLE_KEY` — `createClient` would receive `undefined`.

**Resolution:** single root `.env.local` (already covered by `.gitignore`'s `.env.*.local`):

```
# server-only — never prefixed, never bundled
SNAPTRADE_CLIENT_ID=...
SNAPTRADE_CONSUMER_KEY=...
SUPABASE_SECRET_KEY=...
SUPABASE_URL=http://127.0.0.1:54321        # local; cloud URL in Vercel dashboard

# browser-safe — publishable key is designed to be public
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

Supabase's publishable/secret key pair is the current replacement for the legacy anon/service_role
keys and is accepted by `supabase-js` in the same positions.

**Mapping from the keys already present in `robo-advisor/.env`** (values are reused verbatim; only
the names and file location change, and `robo-advisor/.env` is then deleted):

| Existing name | Becomes | Exposure |
|---|---|---|
| `SNAPTRADE_CLIENT_ID` | `SNAPTRADE_CLIENT_ID` | server only |
| `SNAPTRADE_CONSUMER_KEY` | `SNAPTRADE_CONSUMER_KEY` | server only |
| `SUPABASE_SECRET_KEY` | `SUPABASE_SECRET_KEY` | server only |
| `SUPABASE_PUSHABLE_KEY` | `VITE_SUPABASE_PUBLISHABLE_KEY` | **browser** (intended) |


Local Docker issues its **own** keys, printed by `supabase start`. Cloud keys (the ones already
provided) belong in the Vercel project's environment variables, not in local dev.

### 5.2 `supabase/config.toml` changes

`config.toml` is currently pristine default. Google is configured on the cloud project only, so local
Docker needs it added:

```toml
[auth.external.google]
enabled = true
client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"
skip_nonce_check = true   # config.toml's own comment: required for local Google sign-in
```

`site_url = "http://127.0.0.1:3000"` already matches `vercel dev`'s default port — no change needed.
`additional_redirect_urls` gains `http://127.0.0.1:3000/auth/callback`.

**Prerequisite:** Docker must be running. OrbStack's socket was absent during design
(`~/.orbstack/run/docker.sock` missing) — `supabase start` fails until OrbStack is launched.

## 6. Database schema

New migration `supabase/migrations/<ts>_portfolio_import.sql`.

```sql
-- Mirror of auth.users, created on first sign-in
profiles(
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
)

-- SERVICE ROLE ONLY. RLS denies all client access.
snaptrade_users(
  user_id uuid primary key references auth.users(id) on delete cascade,
  snaptrade_user_id text unique not null,   -- == user_id (uuid, immutable, not an email)
  user_secret text not null,
  registered_at timestamptz default now()
)

portfolios(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  source text not null check (source in ('snaptrade','csv','manual')),
  is_primary boolean default false,
  created_at timestamptz default now()
)

accounts(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  portfolio_id uuid not null references portfolios(id) on delete cascade,
  snaptrade_account_id uuid unique,          -- null for CSV-sourced accounts
  snaptrade_authorization_id uuid,
  institution_name text,
  account_name text,
  account_number_masked text,
  account_type text,
  currency text default 'CAD',
  total_value numeric(18,4),
  sync_status text,                          -- mirrors SnapTrade sync_status
  last_synced_at timestamptz,
  created_at timestamptz default now()
)

holdings(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references accounts(id) on delete cascade,
  symbol text not null,
  raw_symbol text,
  description text,
  instrument_kind text,                      -- adr|cef|cfd|crypto|etf|future|mutualfund|option|other|stock
  units numeric(18,6) not null,
  price numeric(18,6),
  market_value numeric(18,4),
  avg_purchase_price numeric(18,6),
  open_pnl numeric(18,4),
  currency text default 'CAD',
  as_of timestamptz default now(),
  unique (account_id, symbol, instrument_kind)
)

distributions(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references accounts(id) on delete cascade,
  external_id text unique not null,          -- SnapTrade activity id -> idempotent sync
  symbol text,                               -- null for non-security activity
  amount numeric(18,4) not null,
  currency text,
  trade_date date,
  settlement_date date,
  activity_type text,
  description text
)

import_jobs(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  portfolio_id uuid references portfolios(id) on delete set null,
  filename text,
  status text check (status in ('previewed','committed','failed')),
  row_count int,
  mapping jsonb,
  warnings jsonb,
  created_at timestamptz default now()
)
```

**RLS:** enabled on every table.
- `profiles`, `portfolios`, `accounts`, `holdings`, `distributions`, `import_jobs`:
  `using (user_id = auth.uid())` for select; writes performed by functions via the secret key.
- `snaptrade_users`: RLS enabled with **no permissive policy** — unreachable from any client token.

`distributions.external_id` unique makes re-sync idempotent. `holdings` unique on
`(account_id, symbol, instrument_kind)` makes position upserts idempotent.

## 7. API contracts

All routes require `Authorization: Bearer <supabase_jwt>`; `_lib/auth.js` returns 401 otherwise.

### `POST /api/snaptrade/login-url`
Get-or-create the SnapTrade user, then open a portal session.
- Ensures a row in `snaptrade_users` (calls `registerSnapTradeUser({ userId })` on first use and
  stores the returned `userSecret`). `userId` is the Supabase `auth.uid()` UUID — unique and
  immutable, as the docs require. Emails are explicitly unsuitable.
- Calls `loginSnapTradeUser({ userId, userSecret, connectionType: 'read', connectionPortalVersion: 'v4' })`.
- **Does not** pass `customRedirect` — the modal uses postMessage instead.
- → `200 { redirectURI }`

### `POST /api/snaptrade/sync`
Body: `{ accountId? }` (omit to sync all).
1. `listUserAccounts({ userId, userSecret })` — daily-cached, no per-call refresh charge.
2. Upsert `accounts`.
3. Per account: `getAllAccountPositions` → normalize → upsert `holdings`; delete holdings absent
   from the response (closed positions).
4. Per account: `getUserAccountBalance` → `accounts.total_value`.
5. Per account: `getAccountActivities({ type: 'DIVIDEND', startDate: today-24mo })`, paginated
   (default page size 1000, reverse chronological by `trade_date`) → upsert `distributions` on
   `external_id`.
- → `200 { accounts, holdingsCount, distributionsCount, syncedAt }`

**Cost note:** deliberately avoids `refreshBrokerageAuthorization`, which is billed per call.

**`getUserHoldings` is not merely deprecated — it is unusable for us.** The SDK's own type
documentation (v12.1.8) states it *"will return HTTP 410 Gone for all customers that sign up after
May 11, 2026."* A SnapTrade account created for this project would be inside that window, so the
finer-grained endpoints are the only viable path.

**Verified against `snaptrade-typescript-sdk@12.1.8` type definitions:**

- Client construction is `new Snaptrade({ auth: SnaptradeAuth.commercialApiKey({ clientId, consumerKey }) })`.
  The bare `new Snaptrade({ clientId, consumerKey })` form found in older docs no longer type-checks.
- Every account-information request carries `userId` + `userSecret` per call in commercial-key mode.
- `loginSnapTradeUser` returns `{ redirectURI?: string, sessionId?: string }` — **both optional**, so
  the handler must fail loudly when `redirectURI` is absent rather than passing `undefined` to the modal.
- `AccountPosition` is `{ instrument, units?, price?, cost_basis?, currency?, cash_equivalent?, tax_lots? }`
  where **`units`, `price`, and `cost_basis` are `string | null`, not numbers**, and there is **no
  `market_value` and no `open_pnl` field**. Both must be derived:
  `market_value = units × price` (× `multiplier` for options) and `open_pnl = market_value − cost_basis`.
  Treating these strings as numbers without parsing yields string concatenation, not arithmetic —
  the single most likely silent-corruption bug in this feature.
- `instrument` is a union discriminated on `kind` with ten values: `adr`, `cef`, `cfd`, `crypto`,
  `etf`, `future`, `mutualfund`, `option`, `other`, `stock`. Most carry
  `{ id, symbol, raw_symbol, description?, currency?, exchange? }`, but **`option` has no
  `raw_symbol`** and instead carries `option_type`, `strike_price`, `expiration_date`, `multiplier`,
  and `underlying`. A normalizer that reads `instrument.raw_symbol` unconditionally returns
  `undefined` for every option position.

### `GET /api/snaptrade/connections` · `DELETE /api/snaptrade/connections?id=`
List via `listBrokerageAuthorizations`; delete removes the connection and cascades local rows.

### `POST /api/snaptrade/webhook`
Unauthenticated but verified against a shared secret. Handles:
- `ACCOUNT_HOLDINGS_UPDATED` → enqueue/perform sync for that account
- `CONNECTION_BROKEN` → mark `accounts.sync_status`, surface a reconnect prompt
- `CONNECTION_DELETED` / `USER_DELETED` → clean up local rows

### `POST /api/import/preview`
`multipart/form-data` with one file, max 5 MB, extension in `.csv|.xlsx`.
- Parses with SheetJS (handles both formats), locates the header row, auto-detects column mapping.
- → `200 { jobId, detectedPreset, mapping, headers, rows: first 25 normalized, warnings, totals }`
- Writes an `import_jobs` row with `status: 'previewed'`. **No holdings written.**

### `POST /api/import/commit`
Body: `{ jobId, mapping, rows }` — the user-confirmed mapping and rows.
- Creates or reuses a `csv`-sourced portfolio + synthetic account.
- Upserts `holdings`; marks the job `committed`.
- → `200 { portfolioId, accountId, imported, skipped }`

## 8. Import pipeline detail

**Column synonym detection** (`_lib/mapping.js`), case/space/punctuation-insensitive:

| Field | Synonyms |
|---|---|
| `symbol` | symbol, ticker, security, security symbol, stock, instrument |
| `units` | units, quantity, qty, shares, share quantity, # of shares, position |
| `price` | price, last price, market price, current price, close, last |
| `market_value` | market value, value, total value, position value, market val |
| `avg_purchase_price` | average cost, avg cost, book value, cost basis, avg price |
| `currency` | currency, ccy, curr |
| `description` | description, name, security name, company |

**Broker presets** short-circuit detection when a header signature matches: Questrade,
Wealthsimple, Interactive Brokers, TD Direct Investing, and Erica's Portfolio Template.

**Derivations & defaults**
- `market_value` absent → `units × price`
- `price` absent but `market_value` present → `market_value / units`
- `currency` absent → `CAD` (the ETF universe in `dummy.js` is `.TO`-dominant)
- Symbols uppercased and trimmed; exchange suffixes preserved

**Row warnings** (never silent failures): non-numeric units, `units <= 0`, missing symbol,
symbol not found in the ETF dataset, duplicate symbol within the file, unparseable currency.
Rows with warnings are shown flagged and are **excluded by default**, individually re-includable.

**Why a mandatory review step:** a mis-mapped column silently corrupts someone's portfolio and every
downstream number (income hero, allocation, drift, projections). The wizard is Drop → Review → Confirm;
nothing is written before Confirm.

## 9. Frontend

### 9.1 Routing (`react-router-dom`)

```
/                     Landing + portal picker (marketing-safe)
/login                Google button + "Explore the demo instead" -> /demo
/auth/callback         session exchange -> upsert profile -> /app/home
/demo                 -> /demo/home
/demo/:view           DemoProvider,  "Demo mode" badge, no auth
/app                  -> /app/home
/app/:view            RequireAuth -> LiveProvider
*                     404 -> /
```

`App.jsx` currently switches views with `useState` (`App.jsx:104`) and has no router. Refactor:
extract the sidebar/mobile-nav/notifications chrome into `PortalLayout`, mount views as route
children. The lazy `import()` calls and the existing `MOBILE_NAV` config are preserved.

### 9.2 The provider abstraction

The single most important design choice: **the four views never learn which portal they are in.**

```js
usePortfolio() -> {
  stats, holdings, accounts, distributions, drift, isDemo, loading, error,
  actions: { previewImport, commitImport, connect, sync, disconnect }
}
```

- `DemoProvider` — serves `dummy.js`; `previewImport`/`commitImport` parse the real file **in the
  browser** into React state; `connect` runs a scripted simulation. No network writes.
- `LiveProvider` — serves Supabase; actions call `/api/*`.

Consequence: `Home.jsx`, `Discover.jsx`, and `Plan.jsx` need **no changes** beyond swapping their
`dummy.js` imports for `usePortfolio()`. `Portfolio.jsx` additionally loses its dead `UploadModal`.

### 9.3 New components

```
components/
  auth/       GoogleSignInButton.jsx  RequireAuth.jsx  SessionProvider.jsx
  layout/     PortalLayout.jsx  DemoBadge.jsx
  import/     ImportWizard.jsx  Dropzone.jsx  MappingTable.jsx
              PreviewTable.jsx  ImportSummary.jsx
  connect/    ConnectBrokerageButton.jsx  ConnectionList.jsx  BrokenConnectionBanner.jsx
context/      PortfolioContext.jsx  DemoProvider.jsx  LiveProvider.jsx
lib/          supabase.js  api.js
views/        Landing.jsx  Login.jsx  AuthCallback.jsx
```

`Portfolio.jsx` is already 668 lines; the wizard lives in `components/import/` rather than growing it.

### 9.4 SnapTrade connect flow

```jsx
const { data } = await api.post('/api/snaptrade/login-url');
setLoginLink(data.redirectURI); setOpen(true);

<SnapTradeReact
  loginLink={loginLink} isOpen={open} close={() => setOpen(false)}
  onSuccess={async (authorizationId) => { setOpen(false); await sync(); }}
  onError={(e) => showError(e.detail)}
  onExit={() => setOpen(false)}
/>
```

Message contract handled by the component: `SUCCESS {status, authorizationId}`,
`ERROR {status, errorCode, statusCode, detail}`, `ABANDONED`, `CLOSED`, `CLOSE_MODAL`.
Per the docs, *"the Connection Portal never closes a window or modal that your app created"* — so
`close` must be wired on every terminal event, which the component surfaces as `onExit`/`close`.

In the demo portal `ConnectBrokerageButton` renders a simulated portal with a "Demo mode" badge and
never requests a login URL — no SnapTrade account quota is consumed by marketing traffic.

### 9.5 Empty and error states

- `/app` with no data → "Import your portfolio" + "Connect a brokerage" side by side, not an empty table.
- Broken connection → persistent banner with a reconnect action (re-opens the portal).
- Sync failure → last-known cached data plus a stale-data timestamp; never a blank portfolio.
- Import failure → the wizard stays open on the Review step with per-row errors intact.

## 10. Testing

Vitest + `@testing-library/react`, added as dev dependencies.

**Unit — highest value first**
- `_lib/parse.js` against real fixture files per broker preset, plus adversarial cases: BOM, CRLF,
  quoted commas, thousands separators, `$`/`%` symbols, blank trailing rows, preamble rows above
  the header.
- `_lib/mapping.js` — synonym detection, preset signatures, ambiguous headers.
- `_lib/normalize.js` — SnapTrade v2 positions across every `instrument.kind`
  (stock / etf / option / crypto / mutualfund + `cash_equivalent`). **This is the likeliest source of
  a shipped bug**, since each kind carries a different instrument schema behind the discriminator.
- `_lib/auth.js` — missing, malformed, and expired JWTs all 401.

**Integration** — SnapTrade SDK mocked at the module boundary; sync idempotency asserted by running
the same fixture payload twice and expecting identical row counts.

**Manual verification** against local Docker Supabase: Google sign-in, import a real broker CSV
end-to-end, confirm `/demo` writes nothing to the database.

## 11. Prerequisites on the operator

1. Start OrbStack, then `supabase start`.
2. Provide Google OAuth client ID + secret as `SUPABASE_AUTH_EXTERNAL_GOOGLE_*` for local parity
   with the cloud project.
3. In the SnapTrade dashboard: confirm the API key's plan tier (daily-cached vs real-time affects
   which endpoints return live data) and register the webhook URL.
4. Add the **cloud** Supabase URL + keys to the Vercel project environment for deploy.

## 12. Build sequence

The spec is large enough that it must be built in dependency order, each stage independently
verifiable before the next begins.

| Stage | Delivers | Verifiable by |
|---|---|---|
| 1. Foundation | Root `.env.local`, `vercel.json`, `config.toml` Google block, local Supabase running | `supabase start` succeeds; `vercel dev` serves the SPA |
| 2. Schema | Migration + RLS policies | Migration applies clean; `snaptrade_users` unreachable with a client token |
| 3. Auth + routing | `react-router-dom`, `PortalLayout`, Google sign-in, `/login`, `/auth/callback`, `RequireAuth`, `/demo/*` + `/app/*` | Sign in with Google, land on `/app/home`; `/demo/*` loads with no session |
| 4. Provider split | `PortfolioContext`, `DemoProvider`, `LiveProvider`; views read `usePortfolio()` | All four views render identically in both portals |
| 5. Import pipeline | `_lib/parse.js`, `mapping.js`, `/api/import/*`, `ImportWizard` | Unit tests green; a real broker CSV imports end-to-end |
| 6. SnapTrade | `_lib/snaptrade.js`, `normalize.js`, `/api/snaptrade/*`, `snaptrade-react` modal | Real brokerage connects; holdings and distributions populate |
| 7. Hardening | Webhooks, broken-connection banner, empty/error states, demo sandbox audit | `/demo` provably writes nothing to the database |

Stages 5 and 6 are independent of each other once stage 4 lands, and either one delivers user-visible
value on its own.

## 13. Risks

| Risk | Mitigation |
|---|---|
| Mis-mapped CSV column corrupts a portfolio | Mandatory review step; warned rows excluded by default |
| `userSecret` leaking to the browser | RLS with no permissive policy; only the secret key can read it |
| SnapTrade per-call refresh charges | Use daily-cached `listUserAccounts`; never call refresh in a loop |
| Demo traffic consuming account quota | Demo portal never requests a login URL |
| Position schema variance by `instrument.kind` | Explicit per-kind normalizer with unit tests |
| Migration mistakes hitting real data | All development against local Docker Supabase |
