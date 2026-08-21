# Portfolio Import + SnapTrade Connection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a user populate the app with their real portfolio, either by uploading a broker CSV/XLSX export or by connecting a brokerage account through SnapTrade.

**Architecture:** The existing Vite SPA gains a router and splits into two portals — a public `/demo/*` serving `dummy.js`, and an authenticated `/app/*` serving Supabase. Both mount the same four views behind a `usePortfolio()` provider, so the views never learn which portal they are in. New Vercel serverless functions in `api/` hold the SnapTrade and Supabase-secret credentials; the browser only ever sends a Supabase JWT.

**Tech Stack:** Vite 8 · React 19 · Tailwind 4 · react-router-dom 7 · Vercel Node functions · Supabase (Postgres + Google OAuth) · `snaptrade-typescript-sdk` 12 · `snaptrade-react` 3 · SheetJS · Vitest

**Spec:** `docs/superpowers/specs/2026-08-21-portfolio-import-and-snaptrade-design.md`

## Global Constraints

- **Language:** plain JavaScript with JSX. This repo has no TypeScript; do not introduce `.ts`/`.tsx`.
- **Package versions (verified, pin these):** `snaptrade-typescript-sdk@^12.1.8`, `snaptrade-react@^3.2.5`, `react-router-dom@^7.18.2`, `xlsx@^0.18.5`, `@supabase/supabase-js@^2.112.3`, `vitest@^3`.
- **Never send to the browser:** `SNAPTRADE_CLIENT_ID`, `SNAPTRADE_CONSUMER_KEY`, `SUPABASE_SECRET_KEY`, or any SnapTrade `userSecret`. Only `VITE_`-prefixed vars reach the client bundle.
- **Vite env rule:** the client reads env exclusively through `import.meta.env.VITE_*`. `process.env` is not available in the browser, and non-`VITE_` names are stripped from the bundle.
- **Numeric parsing:** SnapTrade returns `units`, `price`, and `cost_basis` as `string | null`. Always convert with the shared `num()` helper from Task 19. Never do arithmetic on the raw values — `"10" + "5"` is `"105"`.
- **Money type:** all currency columns are `numeric(18,4)`; share quantities are `numeric(18,6)`. Never `float`.
- **Design tokens:** colors come from CSS custom properties via the `C` shorthand object already used in `views/*.jsx` (`C.hi`, `C.mid`, `C.low`, `C.accent`, `C.border`, `C.subtle`). Never hardcode a hex value in a component.
- **Touch targets:** interactive elements keep `minHeight: '44px'` (48px for primary CTAs), matching the existing mobile-first views.
- **Commit style:** conventional commits (`feat:`, `fix:`, `test:`, `chore:`, `docs:`). Commit at the end of every task.
- **Demo portal invariant:** code reachable from `/demo/*` must never write to Supabase and never call `/api/snaptrade/*`. Task 27 enforces this with a test.

---

## File Structure

**New — server (`api/`, Vercel Node functions, repo root):**

| File | Responsibility |
|---|---|
| `api/_lib/env.js` | Read + validate required server env vars once; throw a clear error naming the missing key |
| `api/_lib/supabase.js` | Service-role Supabase client singleton (secret key) |
| `api/_lib/auth.js` | Verify the `Authorization: Bearer` Supabase JWT → `{ userId }`, else 401 |
| `api/_lib/http.js` | `json()`, `fail()`, `methodGuard()`, `readJsonBody()` — uniform responses |
| `api/_lib/snaptrade.js` | `Snaptrade` client singleton built with `SnaptradeAuth.commercialApiKey` |
| `api/_lib/snaptradeUser.js` | Get-or-create the SnapTrade user; returns `{ snaptradeUserId, userSecret }` |
| `api/_lib/normalize.js` | `num()`, `normalizePosition()`, `normalizeActivity()`, `normalizeAccount()` |
| `api/_lib/parse.js` | CSV/XLSX buffer → `{ headers, rows }` |
| `api/_lib/mapping.js` | Column-synonym detection, broker presets, row normalization + warnings |
| `api/snaptrade/login-url.js` | `POST` → `{ redirectURI }` |
| `api/snaptrade/sync.js` | `POST` → pull accounts/positions/dividends, upsert, return counts |
| `api/snaptrade/connections.js` | `GET` list · `DELETE` remove |
| `api/snaptrade/webhook.js` | `POST` SnapTrade events |
| `api/import/preview.js` | `POST` multipart → parsed rows + mapping + warnings |
| `api/import/commit.js` | `POST` confirmed rows → holdings |

**New — client (`robo-advisor/src/`):**

| File | Responsibility |
|---|---|
| `lib/supabase.js` | Browser Supabase client (publishable key) |
| `lib/api.js` | `apiGet`/`apiPost`/`apiDelete`/`apiUpload`, auto-attaching the Supabase JWT |
| `context/SessionContext.jsx` | Supabase session state + `signInWithGoogle`, `signOut` |
| `context/PortfolioContext.jsx` | `PortfolioContext` + `usePortfolio()` hook only |
| `context/DemoProvider.jsx` | Serves `dummy.js`; import parses in-browser; connect is simulated |
| `context/LiveProvider.jsx` | Serves Supabase; import and connect call `/api/*` |
| `lib/demoParse.js` | Browser-side CSV/XLSX parse for the demo portal |
| `lib/derive.js` | Holdings → `stats`, `allocation`, `drift` (shared by both providers) |
| `components/auth/RequireAuth.jsx` | Route guard; redirects to `/login` |
| `components/layout/PortalLayout.jsx` | Sidebar + mobile nav + notifications chrome, extracted from `App.jsx` |
| `components/layout/DemoBadge.jsx` | Fixed "Demo mode" badge |
| `components/import/ImportWizard.jsx` | 3-step wizard orchestrator |
| `components/import/Dropzone.jsx` | File drop + picker |
| `components/import/MappingTable.jsx` | Editable column mapping |
| `components/import/PreviewTable.jsx` | Normalized preview with per-row warnings |
| `components/connect/ConnectBrokerageButton.jsx` | Real (`snaptrade-react`) and simulated variants |
| `components/connect/ConnectionList.jsx` | Connected accounts + reconnect/remove |
| `views/Landing.jsx` · `views/Login.jsx` · `views/AuthCallback.jsx` | Public routes |

**Modified:**

| File | Change |
|---|---|
| `robo-advisor/src/App.jsx` | Becomes the router; chrome moves to `PortalLayout`; `OnboardingModal` moves out |
| `robo-advisor/src/views/Portfolio.jsx:24-100` | Delete the dead `UploadModal`; mount `ImportWizard` + `ConnectionList` |
| `robo-advisor/src/views/{Home,Discover,Plan}.jsx` | Swap `dummy.js` imports for `usePortfolio()` |
| `robo-advisor/package.json` | Add router, supabase-js, snaptrade-react, xlsx, vitest |
| `supabase/config.toml` | Add `[auth.external.google]` |
| `.gitignore` | Ignore `.vercel/` |

**Deleted:** `robo-advisor/.env` (consolidated into root `.env.local` in Task 1).

---

## Stage 1 — Foundation

### Task 1: Environment consolidation and Vercel wiring

**Files:**
- Create: `.env.local`, `.env.example`, `vercel.json`, `api/_lib/env.js`, `api/health.js`
- Modify: `.gitignore`, `package.json`
- Delete: `robo-advisor/.env`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: `requireEnv(name) -> string` and `serverEnv()  -> { snaptradeClientId, snaptradeConsumerKey, supabaseUrl, supabaseSecretKey }` from `api/_lib/env.js`. Every later server task imports `serverEnv`.

- [ ] **Step 1: Read the existing env file and record the four values**

```bash
cat robo-advisor/.env
```

You need the literal values of `SNAPTRADE_CLIENT_ID`, `SNAPTRADE_CONSUMER_KEY`, `SUPABASE_PUSHABLE_KEY`, `SUPABASE_SECRET_KEY`. Do not print them into any file that is not gitignored, and do not paste them into a commit.

- [ ] **Step 2: Create the root `.env.local`**

Substitute the four real values. Note `SUPABASE_PUSHABLE_KEY` becomes **`VITE_SUPABASE_PUBLISHABLE_KEY`** — Vite only exposes `VITE_`-prefixed variables to the browser, and the publishable key is designed to be public. The URLs below are the fixed local-Docker Supabase defaults from `supabase/config.toml` (`api.port = 54321`).

```bash
cat > .env.local <<'EOF'
# ── Server only. Never prefixed, never bundled. ──
SNAPTRADE_CLIENT_ID=<value from robo-advisor/.env>
SNAPTRADE_CONSUMER_KEY=<value from robo-advisor/.env>
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SECRET_KEY=<local service_role key printed by `supabase start` in Task 2>
SNAPTRADE_WEBHOOK_SECRET=dev-webhook-secret-change-me

# ── Browser-safe. Publishable key is intended to be public. ──
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=<local anon key printed by `supabase start` in Task 2>
EOF
```

The two local Supabase keys are placeholders until Task 2 runs `supabase start` and prints them. The cloud `SUPABASE_PUSHABLE_KEY`/`SUPABASE_SECRET_KEY` values you just read belong in the Vercel dashboard for deploys, not in local dev.

- [ ] **Step 3: Create `.env.example` as the committed reference**

```bash
cat > .env.example <<'EOF'
# Copy to .env.local and fill in. Never commit .env.local.
SNAPTRADE_CLIENT_ID=
SNAPTRADE_CONSUMER_KEY=
SNAPTRADE_WEBHOOK_SECRET=
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SECRET_KEY=
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=
EOF
```

- [ ] **Step 4: Delete the old env file and confirm the new one is ignored**

```bash
rm robo-advisor/.env
git check-ignore -v .env.local
```

Expected: prints a `.gitignore:` line matching `.env.*.local`. If it prints nothing, **stop** — the file would be committed.

- [ ] **Step 5: Ignore Vercel's local directory**

```bash
printf '\n# Vercel\n.vercel/\n' >> .gitignore
```

- [ ] **Step 6: Write `vercel.json`**

The SPA lives in `robo-advisor/` but `api/` is at the repo root. `buildCommand` and `outputDirectory` point Vercel at the subdirectory while functions are still auto-detected from root `api/`. The rewrite sends every non-API, non-asset path to `index.html` so react-router's deep links (`/app/portfolio`) resolve on a hard refresh.

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "cd robo-advisor && npm install && npm run build",
  "outputDirectory": "robo-advisor/dist",
  "functions": { "api/**/*.js": { "runtime": "nodejs22.x" } },
  "rewrites": [{ "source": "/((?!api/).*)", "destination": "/index.html" }]
}
```

- [ ] **Step 7: Add server dependencies at the repo root**

Functions in `api/` resolve imports from the root `package.json`.

```bash
npm install @supabase/supabase-js@^2.112.3 snaptrade-typescript-sdk@^12.1.8 xlsx@^0.18.5
npm uninstall @supabase/ssr
```

`@supabase/ssr` is for server-rendered frameworks like Next.js; a Vite SPA plus serverless functions needs only `@supabase/supabase-js`.

- [ ] **Step 8: Write `api/_lib/env.js`**

Fail fast and name the missing variable. A function that returns 500 with "cannot read property of undefined" costs far more debugging time than one that says which key is absent.

```js
// Reads and validates server-only environment variables.
// Never import this from client code — it would leak secret names into the bundle.

export function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
      `Add it to .env.local (local) or the Vercel project settings (deployed).`
    );
  }
  return value;
}

let cached = null;

export function serverEnv() {
  if (cached) return cached;
  cached = {
    snaptradeClientId:   requireEnv('SNAPTRADE_CLIENT_ID'),
    snaptradeConsumerKey: requireEnv('SNAPTRADE_CONSUMER_KEY'),
    supabaseUrl:         requireEnv('SUPABASE_URL'),
    supabaseSecretKey:   requireEnv('SUPABASE_SECRET_KEY'),
  };
  return cached;
}
```

- [ ] **Step 9: Write `api/health.js` to prove the function runtime works**

Reports which env vars are present **without echoing any value**.

```js
import { serverEnv } from './_lib/env.js';

export default function handler(req, res) {
  try {
    const env = serverEnv();
    res.status(200).json({
      ok: true,
      env: {
        snaptradeClientId:   Boolean(env.snaptradeClientId),
        snaptradeConsumerKey: Boolean(env.snaptradeConsumerKey),
        supabaseUrl:         env.supabaseUrl,
        supabaseSecretKey:   Boolean(env.supabaseSecretKey),
      },
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}
```

- [ ] **Step 10: Verify the build still succeeds**

```bash
cd robo-advisor && npm run build && cd ..
```

Expected: Vite build completes and writes `robo-advisor/dist/`.

- [ ] **Step 11: Commit**

```bash
git add .gitignore .env.example vercel.json api/ package.json package-lock.json
git commit -m "feat: add vercel function runtime and consolidated server env

Moves the four credentials from robo-advisor/.env to a root .env.local so
that functions in api/ can read them, and renames the publishable key to
VITE_SUPABASE_PUBLISHABLE_KEY since Vite only exposes VITE_-prefixed vars
to the browser.

Drops @supabase/ssr, which targets server-rendered frameworks and is not
used by a Vite SPA."
```

---

### Task 2: Local Supabase with Google OAuth

**Files:**
- Modify: `supabase/config.toml`, `.env.local`

**Interfaces:**
- Consumes: `.env.local` from Task 1.
- Produces: a running local Supabase at `http://127.0.0.1:54321` and the two local keys written into `.env.local`. Every later task depends on this being up.

- [ ] **Step 1: Confirm Docker is running**

```bash
docker info --format '{{.ServerVersion}}'
```

Expected: a version string. If it errors with `failed to connect to the docker API`, **stop and ask the operator to launch OrbStack** — nothing further in this plan can be verified without it.

- [ ] **Step 2: Add the Google provider to `supabase/config.toml`**

Append this block. `skip_nonce_check = true` is required for local Google sign-in — `config.toml`'s own comment on the equivalent Apple block states this. It must **not** be set in the cloud project.

```toml
[auth.external.google]
enabled = true
client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"
redirect_uri = ""
url = ""
skip_nonce_check = true
email_optional = false
```

- [ ] **Step 3: Allow the SPA's callback URL**

In `supabase/config.toml`, replace the `additional_redirect_urls` line. `site_url` already reads `http://127.0.0.1:3000`, which matches `vercel dev`'s default port — leave it alone.

```toml
additional_redirect_urls = ["http://127.0.0.1:3000", "http://127.0.0.1:3000/auth/callback", "http://localhost:3000/auth/callback"]
```

- [ ] **Step 4: Add the Google credentials to `.env.local`**

Ask the operator for the Google OAuth client ID and secret from the cloud Supabase dashboard's Google provider settings (or the Google Cloud console credential that backs it).

```bash
cat >> .env.local <<'EOF'

# ── Local Supabase Google provider (cloud project has its own copy) ──
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=<google client id>
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=<google client secret>
EOF
```

- [ ] **Step 5: Start Supabase**

```bash
supabase start
```

Expected: a table of local URLs and keys. Record `API URL`, `anon key`, and `service_role key`.

- [ ] **Step 6: Write the real local keys into `.env.local`**

Replace the two placeholders from Task 1 Step 2: `SUPABASE_SECRET_KEY` gets the **service_role key**, `VITE_SUPABASE_PUBLISHABLE_KEY` gets the **anon key**. Local Supabase still issues legacy-style anon/service_role JWTs; `supabase-js` accepts them in the same positions as the newer publishable/secret keys.

- [ ] **Step 7: Verify Supabase is reachable and Google is registered**

```bash
curl -s http://127.0.0.1:54321/auth/v1/settings | python3 -m json.tool
```

Expected: JSON containing `"google": true` under `external`. If Google is `false`, `config.toml` was not picked up — run `supabase stop && supabase start`.

- [ ] **Step 8: Commit**

`.env.local` is gitignored, so only the config changes are committed.

```bash
git add supabase/config.toml
git commit -m "feat: enable google oauth on local supabase

The cloud project already has Google configured, but config.toml was
pristine default. skip_nonce_check is required for local Google sign-in
per the provider block's own documentation, and must stay local-only."
```

---

## Stage 2 — Schema

### Task 3: Migration and row-level security

**Files:**
- Create: `supabase/migrations/20260821000001_portfolio_import.sql`
- Create: `scripts/verify-rls.mjs`

**Interfaces:**
- Consumes: running local Supabase from Task 2.
- Produces: tables `profiles`, `snaptrade_users`, `portfolios`, `accounts`, `holdings`, `distributions`, `import_jobs`. Later tasks reference these exact column names.

- [ ] **Step 1: Write the migration**

```sql
-- Portfolio import + SnapTrade connection schema.
-- Every user-facing table is scoped by user_id and protected by RLS.
-- snaptrade_users holds credentials and is deliberately unreachable by any client token.

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- SERVICE ROLE ONLY. Holds the SnapTrade userSecret, which together with
-- userId grants full access to a user's brokerage data.
create table public.snaptrade_users (
  user_id            uuid primary key references auth.users(id) on delete cascade,
  snaptrade_user_id  text not null unique,
  user_secret        text not null,
  registered_at      timestamptz not null default now()
);

create table public.portfolios (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  source      text not null check (source in ('snaptrade', 'csv', 'manual')),
  is_primary  boolean not null default false,
  created_at  timestamptz not null default now()
);
create index portfolios_user_id_idx on public.portfolios (user_id);

create table public.accounts (
  id                         uuid primary key default gen_random_uuid(),
  user_id                    uuid not null references auth.users(id) on delete cascade,
  portfolio_id               uuid not null references public.portfolios(id) on delete cascade,
  snaptrade_account_id       uuid unique,
  snaptrade_authorization_id uuid,
  institution_name           text,
  account_name               text,
  account_number_masked      text,
  account_type               text,
  currency                   text not null default 'CAD',
  total_value                numeric(18,4),
  sync_status                text,
  last_synced_at             timestamptz,
  created_at                 timestamptz not null default now()
);
create index accounts_user_id_idx on public.accounts (user_id);
create index accounts_portfolio_id_idx on public.accounts (portfolio_id);

create table public.holdings (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  account_id         uuid not null references public.accounts(id) on delete cascade,
  symbol             text not null,
  raw_symbol         text,
  description        text,
  instrument_kind    text not null default 'stock',
  units              numeric(18,6) not null,
  price              numeric(18,6),
  market_value       numeric(18,4),
  avg_purchase_price numeric(18,6),
  open_pnl           numeric(18,4),
  currency           text not null default 'CAD',
  as_of              timestamptz not null default now(),
  constraint holdings_unique_position unique (account_id, symbol, instrument_kind)
);
create index holdings_user_id_idx on public.holdings (user_id);
create index holdings_account_id_idx on public.holdings (account_id);

create table public.distributions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  account_id      uuid not null references public.accounts(id) on delete cascade,
  external_id     text not null unique,
  symbol          text,
  amount          numeric(18,4) not null,
  currency        text,
  trade_date      date,
  settlement_date date,
  activity_type   text,
  description     text
);
create index distributions_user_id_idx on public.distributions (user_id);
create index distributions_symbol_trade_date_idx on public.distributions (symbol, trade_date desc);

create table public.import_jobs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  portfolio_id uuid references public.portfolios(id) on delete set null,
  filename     text,
  status       text not null check (status in ('previewed', 'committed', 'failed')),
  row_count    integer,
  mapping      jsonb,
  warnings     jsonb,
  created_at   timestamptz not null default now()
);
create index import_jobs_user_id_idx on public.import_jobs (user_id);

-- ── Row-level security ──────────────────────────────────────────────────────
alter table public.profiles        enable row level security;
alter table public.snaptrade_users enable row level security;
alter table public.portfolios      enable row level security;
alter table public.accounts        enable row level security;
alter table public.holdings        enable row level security;
alter table public.distributions   enable row level security;
alter table public.import_jobs     enable row level security;

-- snaptrade_users intentionally gets NO policy. RLS is on and nothing is
-- permitted, so any anon or authenticated token sees zero rows. Only the
-- service role, which bypasses RLS, can read it.

create policy "own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "own portfolios" on public.portfolios
  for select using (auth.uid() = user_id);
create policy "own accounts" on public.accounts
  for select using (auth.uid() = user_id);
create policy "own holdings" on public.holdings
  for select using (auth.uid() = user_id);
create policy "own distributions" on public.distributions
  for select using (auth.uid() = user_id);
create policy "own import jobs" on public.import_jobs
  for select using (auth.uid() = user_id);

-- ── Auto-create a profile row on signup ─────────────────────────────────────
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

`security definer` plus `set search_path = ''` on the trigger function is required: it writes to `public.profiles` while running in the `auth` schema's insert context, and an empty search path prevents a schema-shadowing attack.

- [ ] **Step 2: Apply the migration**

```bash
supabase migration up
```

Expected: `Applying migration 20260821000001_portfolio_import.sql...` with no errors.

- [ ] **Step 3: Write the RLS verification script**

This is the security boundary the whole feature rests on, so it gets an executable check rather than a manual glance.

```js
// scripts/verify-rls.mjs
// Confirms an anon-key client cannot read snaptrade_users.
// Run: node --env-file=.env.local scripts/verify-rls.mjs
import { createClient } from '@supabase/supabase-js';

const anon = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

const { data, error } = await anon.from('snaptrade_users').select('*');

// RLS-with-no-policy yields an empty set rather than an error, so both
// outcomes are acceptable — a non-empty result is the failure.
if (data && data.length > 0) {
  console.error('FAIL: anon client read snaptrade_users rows:', data.length);
  process.exit(1);
}
console.log('PASS: snaptrade_users unreadable by anon client', error ? `(${error.code})` : '(empty set)');
```

- [ ] **Step 4: Run the verification**

```bash
node --env-file=.env.local scripts/verify-rls.mjs
```

Expected: `PASS: snaptrade_users unreadable by anon client`.

- [ ] **Step 5: Confirm the tables exist**

```bash
supabase db diff --schema public
```

Expected: no diff — the migration fully describes the current schema.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations scripts/verify-rls.mjs
git commit -m "feat: add portfolio schema with row-level security

snaptrade_users has RLS enabled and no policy, so the user secret it holds
is unreachable by any client token and only readable by the service role.
scripts/verify-rls.mjs asserts this rather than trusting review."
```

---

## Stage 3 — Auth and routing

### Task 4: Supabase browser client and session context

**Files:**
- Create: `robo-advisor/src/lib/supabase.js`, `robo-advisor/src/lib/api.js`, `robo-advisor/src/context/SessionContext.jsx`
- Modify: `robo-advisor/package.json`

**Interfaces:**
- Consumes: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Produces:
  - `supabase` (default client instance) from `lib/supabase.js`
  - `apiGet(path)`, `apiPost(path, body)`, `apiDelete(path)`, `apiUpload(path, file)` from `lib/api.js`
  - `<SessionProvider>` and `useSession() -> { session, user, loading, signInWithGoogle, signOut }` from `context/SessionContext.jsx`

- [ ] **Step 1: Install client dependencies**

```bash
cd robo-advisor
npm install @supabase/supabase-js@^2.112.3 react-router-dom@^7.18.2 snaptrade-react@^3.2.5 xlsx@^0.18.5
npm install -D vitest@^3 @testing-library/react@^16 @testing-library/jest-dom@^6 jsdom@^25
cd ..
```

- [ ] **Step 2: Point Vite at the root env file**

Vite loads `.env*` from its own root, which is `robo-advisor/`. The consolidated env now lives one level up, so `envDir` must be widened. Modify `robo-advisor/vite.config.js`:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // The consolidated .env.local lives at the repo root so that Vercel
  // functions in api/ can read the same file.
  envDir: '..',
  server: {
    port: 5173,
    proxy: { '/api': 'http://127.0.0.1:3000' },
  },
});
```

The proxy lets `npm run dev` on :5173 reach functions served by `vercel dev` on :3000. Keep the existing plugin list intact — read the current file first and preserve anything not shown here.

- [ ] **Step 3: Write the Supabase browser client**

```js
// robo-advisor/src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. ' +
    'Both must be set in the repo-root .env.local, and both must keep the ' +
    'VITE_ prefix — Vite strips unprefixed variables from the client bundle.'
  );
}

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
```

- [ ] **Step 4: Write the API helper**

Every server call needs the Supabase JWT. Centralising it means no handler is ever called unauthenticated by accident.

```js
// robo-advisor/src/lib/api.js
import { supabase } from './supabase';

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) throw new Error('Not signed in');
  return { Authorization: `Bearer ${token}` };
}

async function handle(res) {
  const text = await res.text();
  const body = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body;
}

export async function apiGet(path) {
  return handle(await fetch(path, { headers: await authHeaders() }));
}

export async function apiPost(path, body = {}) {
  return handle(await fetch(path, {
    method: 'POST',
    headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }));
}

export async function apiDelete(path) {
  return handle(await fetch(path, { method: 'DELETE', headers: await authHeaders() }));
}

export async function apiUpload(path, file) {
  const form = new FormData();
  form.append('file', file);
  // Content-Type is deliberately omitted so the browser sets the
  // multipart boundary itself.
  return handle(await fetch(path, { method: 'POST', headers: await authHeaders(), body: form }));
}
```

- [ ] **Step 5: Write the session context**

```jsx
// robo-advisor/src/context/SessionContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });

  const signOut = () => supabase.auth.signOut();

  return (
    <SessionContext.Provider
      value={{ session, user: session?.user ?? null, loading, signInWithGoogle, signOut }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}
```

- [ ] **Step 6: Verify the client builds and the env reaches the browser**

```bash
cd robo-advisor && npm run build && cd ..
```

Expected: build succeeds. If it throws the "Missing VITE_SUPABASE_URL" error, `envDir: '..'` was not applied or the variable lacks the `VITE_` prefix.

- [ ] **Step 7: Commit**

```bash
git add robo-advisor/package.json robo-advisor/package-lock.json robo-advisor/vite.config.js robo-advisor/src/lib robo-advisor/src/context
git commit -m "feat: add supabase browser client, api helper, and session context

vite.config.js gains envDir:'..' so the SPA and the root api/ functions
read one shared .env.local, and a dev proxy so :5173 can reach vercel dev
on :3000."
```

---

### Task 5: Router and portal layout extraction

**Files:**
- Create: `robo-advisor/src/components/layout/PortalLayout.jsx`, `robo-advisor/src/components/layout/DemoBadge.jsx`, `robo-advisor/src/components/OnboardingModal.jsx`
- Modify: `robo-advisor/src/App.jsx` (full rewrite), `robo-advisor/src/main.jsx`

**Interfaces:**
- Consumes: `useSession()` from Task 4.
- Produces: `<PortalLayout mode="demo" | "app" />` rendering an `<Outlet />`; routes `/demo/:view` and `/app/:view` resolving `home | portfolio | discover | plan`.

- [ ] **Step 1: Read the current App.jsx in full**

```bash
cat robo-advisor/src/App.jsx
```

It currently holds three separate concerns: an `OnboardingModal` component (~90 lines), the app chrome (mobile header, `Sidebar`, `main`, bottom tab bar, notifications panel), and view switching via `useState`. Steps 2–4 separate them.

- [ ] **Step 2: Move `OnboardingModal` into its own file**

Cut the entire `OnboardingModal` function out of `App.jsx` into `robo-advisor/src/components/OnboardingModal.jsx` unchanged, adding imports and an export:

```jsx
import { TrendingUp, ArrowRight, Shield, Zap, BarChart2 } from 'lucide-react';

export default function OnboardingModal({ onClose }) {
  // Paste the entire existing body here unchanged: the FEATURES array, the
  // hero block, the feature list, and both buttons. This is a move, not a rewrite.
}
```

Copy the body exactly — the `FEATURES` array, the hero gradient, and the two buttons. Do not restyle it.

- [ ] **Step 3: Write `DemoBadge.jsx`**

Marks the demo portal unmistakably so a prospect never mistakes sample data for their own.

```jsx
import { Eye } from 'lucide-react';

const C = { accent: 'var(--accent)' };

export default function DemoBadge() {
  return (
    <div
      className="fixed z-30 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider shadow-lg"
      style={{
        background: C.accent,
        color: '#fff',
        top: 'calc(env(safe-area-inset-top) + 10px)',
        right: '12px',
      }}>
      <Eye size={11} strokeWidth={2.5} />
      Demo mode
    </div>
  );
}
```

- [ ] **Step 4: Write `PortalLayout.jsx`**

This is the chrome lifted out of `App.jsx`, with two changes: navigation becomes router-driven, and the active view is derived from the URL instead of `useState`.

```jsx
import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { TrendingUp, Bell, Home as HomeIcon, Wallet, Search, Compass } from 'lucide-react';
import Sidebar from '../Sidebar';
import NotificationsPanel from '../NotificationsPanel';
import OnboardingModal from '../OnboardingModal';
import DemoBadge from './DemoBadge';
import { notifications } from '../../data/dummy';

const MOBILE_NAV = [
  { id: 'home',      label: 'Home',      icon: HomeIcon },
  { id: 'portfolio', label: 'Portfolio', icon: Wallet   },
  { id: 'discover',  label: 'Discover',  icon: Search   },
  { id: 'plan',      label: 'Plan',      icon: Compass  },
];

export default function PortalLayout({ mode }) {
  const { view = 'home' } = useParams();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Onboarding shows once per session, and only in the demo portal —
  // a signed-in beta member does not need the marketing intro.
  useEffect(() => {
    if (mode !== 'demo') return;
    if (sessionStorage.getItem('pw-onboarded')) return;
    setShowOnboarding(true);
    sessionStorage.setItem('pw-onboarded', '1');
  }, [mode]);

  const handleNav = (next) => {
    setNotifOpen(false);
    navigate(`/${mode}/${next}`);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden" style={{ background: 'var(--bg-page)' }}>

      <header className="flex md:hidden items-center justify-between px-4 shrink-0 z-10"
        style={{ minHeight: '56px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent)' }}>
            <TrendingUp size={15} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-hi)' }}>PassiveIncome</span>
        </div>
        <button onClick={() => setNotifOpen(o => !o)} aria-label="Notifications"
          className="relative w-11 h-11 rounded-xl flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:opacity-70 transition-opacity"
          style={{ color: 'var(--text-mid)', touchAction: 'manipulation' }}>
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white px-0.5"
              style={{ background: 'var(--accent)' }}>{unreadCount}</span>
          )}
        </button>
      </header>

      <Sidebar active={view} onNav={handleNav} unreadCount={unreadCount}
        onBell={() => setNotifOpen(o => !o)} />

      <main className="flex-1 overflow-y-auto pb-24 md:pb-0"
        style={{ overscrollBehaviorY: 'contain', WebkitOverflowScrolling: 'touch' }}>
        <Outlet context={{ onNav: handleNav }} />
      </main>

      <nav className="flex md:hidden fixed bottom-0 left-0 right-0 z-20 shrink-0"
        style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)', paddingBottom: 'env(safe-area-inset-bottom)', touchAction: 'manipulation', boxShadow: '0 -4px 20px rgba(0,0,0,0.05)' }}>
        {MOBILE_NAV.map(({ id, label, icon: Icon }) => {
          const isActive = view === id;
          return (
            <button key={id} onClick={() => handleNav(id)}
              aria-current={isActive ? 'page' : undefined}
              className="flex-1 flex flex-col items-center justify-center gap-1 focus-visible:outline-none cursor-pointer active:opacity-60 transition-opacity"
              style={{ minHeight: '58px', touchAction: 'manipulation' }}>
              <div className="flex items-center justify-center rounded-2xl transition-all duration-250"
                style={{
                  width: isActive ? 48 : 28,
                  height: 30,
                  background: isActive ? 'rgba(245,166,35,0.14)' : 'transparent',
                  boxShadow: isActive ? '0 0 0 1px rgba(245,166,35,0.20)' : 'none',
                }}>
                <Icon size={19} style={{ color: isActive ? 'var(--accent)' : 'var(--text-low)' }} strokeWidth={isActive ? 2.5 : 1.75} />
              </div>
              <span className="text-[10px] leading-none transition-all duration-200"
                style={{ color: isActive ? 'var(--accent)' : 'var(--text-low)', fontWeight: isActive ? 700 : 500 }}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      {notifOpen && <NotificationsPanel onClose={() => setNotifOpen(false)} onNav={handleNav} />}
      {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}
      {mode === 'demo' && <DemoBadge />}
    </div>
  );
}
```

- [ ] **Step 5: Rewrite `App.jsx` as the router**

`DemoProvider` and `LiveProvider` do not exist until Task 8 and Task 9. To keep this task independently verifiable, import them now and create them as one-line passthrough stubs in the same commit; Task 8 and 9 fill them in.

```jsx
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SessionProvider } from './context/SessionContext';
import DemoProvider from './context/DemoProvider';
import LiveProvider from './context/LiveProvider';
import PortalLayout from './components/layout/PortalLayout';
import RequireAuth from './components/auth/RequireAuth';

const Home         = lazy(() => import('./views/Home'));
const Portfolio    = lazy(() => import('./views/Portfolio'));
const Discover     = lazy(() => import('./views/Discover'));
const Plan         = lazy(() => import('./views/Plan'));
const Landing      = lazy(() => import('./views/Landing'));
const Login        = lazy(() => import('./views/Login'));
const AuthCallback = lazy(() => import('./views/AuthCallback'));

function Loading() {
  return (
    <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-low)' }}>
      <div className="text-sm">Loading…</div>
    </div>
  );
}

// The same four views are mounted under both portals. Only the surrounding
// data provider differs, which is why no view needs to know its portal.
function portalRoutes() {
  return (
    <>
      <Route index element={<Navigate to="home" replace />} />
      <Route path="home"      element={<Home />} />
      <Route path="portfolio" element={<Portfolio />} />
      <Route path="discover"  element={<Discover />} />
      <Route path="plan"      element={<Plan />} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            <Route path="/demo" element={<DemoProvider><PortalLayout mode="demo" /></DemoProvider>}>
              {portalRoutes()}
            </Route>
            <Route path="/demo/:view" element={<DemoProvider><PortalLayout mode="demo" /></DemoProvider>} />

            <Route path="/app" element={
              <RequireAuth><LiveProvider><PortalLayout mode="app" /></LiveProvider></RequireAuth>
            }>
              {portalRoutes()}
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </SessionProvider>
    </BrowserRouter>
  );
}
```

Delete the now-duplicated `/demo/:view` line above — nested `portalRoutes()` already supplies `/demo/home` etc. via `useParams`. The final file must have exactly one `<Route path="/demo" ...>` block with `portalRoutes()` as its children, and one for `/app`.

- [ ] **Step 6: Create the two provider stubs**

```jsx
// robo-advisor/src/context/DemoProvider.jsx
// Filled in by Task 8.
export default function DemoProvider({ children }) {
  return children;
}
```

```jsx
// robo-advisor/src/context/LiveProvider.jsx
// Filled in by Task 9.
export default function LiveProvider({ children }) {
  return children;
}
```

- [ ] **Step 7: Verify `main.jsx` needs no change**

```bash
cat robo-advisor/src/main.jsx
```

It should render `<App />` into `#root`. The router now lives inside `App`, so `main.jsx` stays as it is. If it wraps `App` in anything, leave that wrapper outermost.

- [ ] **Step 8: Run the dev server and check both portals**

```bash
cd robo-advisor && npm run dev
```

Visit `http://localhost:5173/demo/portfolio`. Expected: the portfolio view renders with the sidebar, the bottom tab bar highlights Portfolio, and the amber "Demo mode" badge sits top-right. Navigating tabs changes the URL. A hard refresh on `/demo/portfolio` still resolves.

`/app/*` will bounce to `/login` once Task 6 lands; until then `RequireAuth` does not exist, so expect that import to fail — complete Task 6 before judging `/app`.

- [ ] **Step 9: Commit**

```bash
git add robo-advisor/src/App.jsx robo-advisor/src/components robo-advisor/src/context
git commit -m "feat: add router and split app into demo and app portals

App.jsx held three concerns at once: an onboarding modal, the app chrome,
and useState view switching. The modal and chrome move to their own files
and view selection becomes URL-driven, so /demo/portfolio and
/app/portfolio are real deep links."
```

---

### Task 6: Public routes and the auth gate

**Files:**
- Create: `robo-advisor/src/views/Landing.jsx`, `robo-advisor/src/views/Login.jsx`, `robo-advisor/src/views/AuthCallback.jsx`, `robo-advisor/src/components/auth/RequireAuth.jsx`

**Interfaces:**
- Consumes: `useSession()` from Task 4.
- Produces: `<RequireAuth>` wrapper used by `App.jsx`.

- [ ] **Step 1: Write `RequireAuth.jsx`**

The `loading` check matters: without it, a signed-in user is bounced to `/login` for a frame on every hard refresh while the session is restored from storage.

```jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useSession } from '../../context/SessionContext';

export default function RequireAuth({ children }) {
  const { session, loading } = useSession();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: 'var(--bg-page)', color: 'var(--text-low)' }}>
        <div className="text-sm">Checking your session…</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
```

- [ ] **Step 2: Write `Login.jsx`**

Google is the only provider, with the demo escape hatch beneath it.

```jsx
import { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { useSession } from '../context/SessionContext';

const C = { hi: 'var(--text-hi)', mid: 'var(--text-mid)', low: 'var(--text-low)',
            accent: 'var(--accent)', border: 'var(--border)' };

export default function Login() {
  const { session, loading, signInWithGoogle } = useSession();
  const navigate = useNavigate();
  const location = useLocation();

  // Already signed in — go where they were headed.
  useEffect(() => {
    if (!loading && session) navigate(location.state?.from || '/app/home', { replace: true });
  }, [loading, session, navigate, location.state]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-page)' }}>
      <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--bg-card)', border: `1px solid ${C.border}` }}>

        <div className="px-8 pt-9 pb-7 text-center"
          style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.08), rgba(124,58,237,0.06))' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: C.accent }}>
            <TrendingUp size={24} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: C.hi }}>Welcome back</h1>
          <p className="text-sm mt-2" style={{ color: C.mid }}>
            Sign in to see your portfolio and income
          </p>
        </div>

        <div className="px-7 py-7 space-y-4">
          <button onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-2.5 rounded-2xl text-sm font-semibold cursor-pointer active:scale-[0.98] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            style={{ minHeight: '48px', background: '#fff', color: C.hi, border: `1px solid var(--border-mid)` }}>
            <GoogleMark />
            Continue with Google
          </button>

          <p className="text-[11px] text-center leading-relaxed" style={{ color: C.low }}>
            PassiveIncome is in private beta. If your account isn't recognised,
            ask Erica for an invite.
          </p>

          <div className="pt-2 border-t text-center" style={{ borderColor: C.border }}>
            <Link to="/demo/home"
              className="inline-flex items-center gap-1.5 text-xs font-medium mt-4 cursor-pointer focus-visible:outline-none rounded"
              style={{ color: C.accent, minHeight: '36px' }}>
              Explore the demo instead <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline SVG so the page has no external asset dependency.
function GoogleMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.27-4.74 3.27-8.09Z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/>
      <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"/>
    </svg>
  );
}
```

- [ ] **Step 3: Write `AuthCallback.jsx`**

`detectSessionInUrl: true` from Task 4 means `supabase-js` consumes the OAuth fragment automatically; this view only waits for the resulting session and forwards.

```jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';

export default function AuthCallback() {
  const { session, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    navigate(session ? '/app/home' : '/login', { replace: true });
  }, [loading, session, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)', color: 'var(--text-low)' }}>
      <div className="text-sm">Signing you in…</div>
    </div>
  );
}
```

- [ ] **Step 4: Write `Landing.jsx`**

Two doors, nothing else. This is the marketing-safe surface.

```jsx
import { Link } from 'react-router-dom';
import { TrendingUp, ArrowRight, Eye } from 'lucide-react';

const C = { hi: 'var(--text-hi)', mid: 'var(--text-mid)', low: 'var(--text-low)',
            accent: 'var(--accent)', border: 'var(--border)' };

export default function Landing() {
  return (
    <div className="min-h-screen flex items-center justify-center p-5" style={{ background: 'var(--bg-page)' }}>
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: C.accent }}>
          <TrendingUp size={28} className="text-white" strokeWidth={2.5} />
        </div>

        <h1 className="text-3xl font-bold tracking-tight" style={{ color: C.hi }}>PassiveIncome</h1>
        <p className="text-sm mt-3 leading-relaxed" style={{ color: C.mid }}>
          Know how much you're making and what to do next — built on
          Erica Villani's DIY Investing Package.
        </p>

        <div className="mt-9 space-y-3">
          <Link to="/login"
            className="w-full flex items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white cursor-pointer active:scale-[0.98] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            style={{ minHeight: '48px', background: C.accent }}>
            Sign in <ArrowRight size={15} />
          </Link>

          <Link to="/demo/home"
            className="w-full flex items-center justify-center gap-2 rounded-2xl text-sm font-semibold cursor-pointer active:scale-[0.98] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            style={{ minHeight: '48px', background: 'var(--bg-card)', color: C.hi, border: `1px solid var(--border-mid)` }}>
            <Eye size={15} /> See the demo
          </Link>
        </div>

        <p className="text-[11px] mt-7" style={{ color: C.low }}>Private beta</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Verify the full auth round trip**

Run `vercel dev` (port 3000) so the callback origin matches `site_url`:

```bash
npx vercel dev
```

1. Visit `http://127.0.0.1:3000/` — the landing page shows two buttons.
2. Click **See the demo** — lands on `/demo/home` with the badge.
3. Visit `/app/portfolio` directly — redirects to `/login`.
4. Click **Continue with Google**, complete sign-in — returns to `/auth/callback`, then `/app/home`.
5. Hard-refresh `/app/portfolio` — stays put, no flash of `/login`.

- [ ] **Step 6: Confirm the profile row was created by the trigger**

```bash
supabase db shell --command "select id, email, full_name from public.profiles;"
```

Expected: one row matching the Google account you signed in with. An empty table means the `on_auth_user_created` trigger from Task 3 did not fire — check `supabase logs db`.

- [ ] **Step 7: Commit**

```bash
git add robo-advisor/src/views/Landing.jsx robo-advisor/src/views/Login.jsx robo-advisor/src/views/AuthCallback.jsx robo-advisor/src/components/auth
git commit -m "feat: add landing, google sign-in, and auth gate

RequireAuth waits on the session-loading flag before redirecting, so a
hard refresh of /app/* does not flash the login screen while the session
is restored from storage."
```

---

## Stage 4 — Provider split

### Task 7: Derivation layer and portfolio context

**Files:**
- Create: `robo-advisor/src/lib/derive.js`, `robo-advisor/src/context/PortfolioContext.jsx`
- Test: `robo-advisor/src/lib/derive.test.js`, `robo-advisor/vitest.config.js`

**Interfaces:**
- Consumes: nothing.
- Produces, from `lib/derive.js`:
  - `deriveHoldings(rows) -> Array<{ ticker, name, currentPct, targetPct, value, drift, color, units, currency, instrumentKind }>`
  - `deriveStats(rows, distributions) -> { totalValue, positions, monthlyIncome, yieldOnCost, totalValueChange, totalValueChangePct, monthlyIncomePct }`
  - `deriveAllocation(viewHoldings) -> Array<{ name, value, color }>`
  - `deriveDrift(viewHoldings) -> Array<{ ticker, severity, message }>`
  - `HOLDING_COLORS` (array of 10 hex strings)
- Produces, from `context/PortfolioContext.jsx`: `PortfolioContext`, `usePortfolio()`.

**Why this task exists:** the views already consume a *view-model*, not raw holdings —
`robo-advisor/src/data/dummy.js:173` exports `{ ticker, name, currentPct, targetPct, value, drift, color }`.
Producing that exact shape from real rows is what lets `Home.jsx`, `Discover.jsx`, and `Plan.jsx`
switch data sources without changing their markup.

- [ ] **Step 1: Configure Vitest**

```js
// robo-advisor/vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{js,jsx}', '../api/**/*.test.js'],
  },
});
```

Add these scripts to `robo-advisor/package.json`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 2: Write the failing test**

```js
// robo-advisor/src/lib/derive.test.js
import { describe, it, expect } from 'vitest';
import { deriveHoldings, deriveStats, deriveAllocation, deriveDrift } from './derive';

const rows = [
  { symbol: 'HDIV', description: 'Hamilton Enhanced Multi-Sector Covered Call ETF', units: 100, price: 15, market_value: 1500, currency: 'CAD', instrument_kind: 'etf' },
  { symbol: 'ZWQT', description: 'BMO Global Enhanced Income Fund ETF',             units: 50,  price: 10, market_value: 500,  currency: 'CAD', instrument_kind: 'etf' },
];

describe('deriveHoldings', () => {
  it('maps rows to the view-model shape the views already consume', () => {
    const result = deriveHoldings(rows);
    expect(result[0]).toMatchObject({
      ticker: 'HDIV',
      name: 'Hamilton Enhanced Multi-Sector Covered Call ETF',
      value: 1500,
    });
    expect(result[0]).toHaveProperty('currentPct');
    expect(result[0]).toHaveProperty('targetPct');
    expect(result[0]).toHaveProperty('drift');
    expect(result[0]).toHaveProperty('color');
  });

  it('computes currentPct as a share of total market value', () => {
    const result = deriveHoldings(rows);
    expect(result[0].currentPct).toBeCloseTo(75, 5);
    expect(result[1].currentPct).toBeCloseTo(25, 5);
  });

  it('uses an equal-weight target and derives drift from it', () => {
    const result = deriveHoldings(rows);
    expect(result[0].targetPct).toBeCloseTo(50, 5);
    expect(result[0].drift).toBeCloseTo(25, 5);
    expect(result[1].drift).toBeCloseTo(-25, 5);
  });

  it('falls back to units x price when market_value is absent', () => {
    const [only] = deriveHoldings([{ symbol: 'X', units: 4, price: 25 }]);
    expect(only.value).toBe(100);
  });

  it('returns an empty array for no rows rather than throwing', () => {
    expect(deriveHoldings([])).toEqual([]);
    expect(deriveHoldings(null)).toEqual([]);
  });

  it('assigns a stable colour per symbol regardless of row order', () => {
    const a = deriveHoldings(rows).find(h => h.ticker === 'ZWQT').color;
    const b = deriveHoldings([...rows].reverse()).find(h => h.ticker === 'ZWQT').color;
    expect(a).toBe(b);
  });
});

describe('deriveStats', () => {
  it('sums market value and counts positions', () => {
    const stats = deriveStats(rows);
    expect(stats.totalValue).toBe(2000);
    expect(stats.positions).toBe(2);
  });

  it('reports zeroes for an empty portfolio instead of NaN', () => {
    const stats = deriveStats([]);
    expect(stats.totalValue).toBe(0);
    expect(stats.positions).toBe(0);
    expect(Number.isNaN(stats.monthlyIncome)).toBe(false);
    expect(Number.isNaN(stats.yieldOnCost)).toBe(false);
  });

  it('averages trailing twelve-month distributions into monthly income', () => {
    const recent = new Date();
    const iso = `${recent.getFullYear()}-${String(recent.getMonth() + 1).padStart(2, '0')}-01`;
    const stats = deriveStats(rows, [
      { amount: 120, trade_date: iso },
      { amount: 120, trade_date: iso },
    ]);
    expect(stats.monthlyIncome).toBeCloseTo(20, 5);   // 240 / 12
  });
});

describe('deriveAllocation', () => {
  it('produces one slice per holding with percentages', () => {
    const alloc = deriveAllocation(deriveHoldings(rows));
    expect(alloc).toHaveLength(2);
    expect(alloc[0]).toMatchObject({ name: 'HDIV', value: 75 });
    expect(alloc[0].color).toBeTruthy();
  });
});

describe('deriveDrift', () => {
  it('flags holdings drifting more than half a percentage point', () => {
    const alerts = deriveDrift(deriveHoldings(rows));
    expect(alerts.map(a => a.ticker).sort()).toEqual(['HDIV', 'ZWQT']);
    expect(alerts[0].severity).toBe('high');
  });

  it('returns nothing when a portfolio is balanced', () => {
    const balanced = deriveHoldings([
      { symbol: 'A', units: 1, price: 100 },
      { symbol: 'B', units: 1, price: 100 },
    ]);
    expect(deriveDrift(balanced)).toEqual([]);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
cd robo-advisor && npx vitest run src/lib/derive.test.js
```

Expected: FAIL — `Failed to resolve import "./derive"`.

- [ ] **Step 4: Implement `derive.js`**

```js
// robo-advisor/src/lib/derive.js
// Turns raw holding rows into the view-model the four views already consume.
// dummy.js exports { ticker, name, currentPct, targetPct, value, drift, color };
// matching that shape exactly is what keeps the views source-agnostic.

export const HOLDING_COLORS = [
  '#F59E0B', '#8B5CF6', '#10B981', '#3B82F6', '#EC4899',
  '#06B6D4', '#F97316', '#A855F7', '#14B8A6', '#EAB308',
];

const DRIFT_THRESHOLD = 0.5;   // percentage points
const HIGH_DRIFT      = 1.5;

function marketValue(row) {
  const stored = Number(row.market_value);
  if (Number.isFinite(stored) && stored !== 0) return stored;
  const units = Number(row.units);
  const price = Number(row.price);
  if (Number.isFinite(units) && Number.isFinite(price)) return units * price;
  return 0;
}

// Stable per-symbol colour: hashing the symbol means a holding keeps its
// colour across reorderings, syncs, and re-imports.
function colorFor(symbol) {
  let hash = 0;
  const s = String(symbol || '');
  for (let i = 0; i < s.length; i += 1) {
    hash = (hash * 31 + s.charCodeAt(i)) % 100000;
  }
  return HOLDING_COLORS[hash % HOLDING_COLORS.length];
}

export function deriveHoldings(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  const withValue = rows.map(row => ({ row, value: marketValue(row) }));
  const total = withValue.reduce((sum, r) => sum + r.value, 0);
  const targetPct = 100 / withValue.length;   // equal-weight until the user sets targets

  return withValue.map(({ row, value }) => {
    const currentPct = total > 0 ? (value / total) * 100 : 0;
    return {
      ticker: row.symbol,
      name: row.description || row.symbol,
      currentPct,
      targetPct,
      value,
      drift: currentPct - targetPct,
      color: row.color || colorFor(row.symbol),
      units: Number(row.units) || 0,
      currency: row.currency || 'CAD',
      instrumentKind: row.instrument_kind || 'stock',
    };
  });
}

export function deriveStats(rows, distributions = []) {
  const holdings = deriveHoldings(rows);
  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);

  // Monthly income comes from the trailing twelve months of actual
  // distributions, which is the honest number. With no history it is zero,
  // not an estimate dressed up as a fact.
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 12);
  const trailing = (distributions || []).filter(
    d => d && d.trade_date && new Date(d.trade_date) >= cutoff
  );
  const trailingTotal = trailing.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const monthlyIncome = trailing.length > 0 ? trailingTotal / 12 : 0;

  return {
    totalValue,
    positions: holdings.length,
    monthlyIncome,
    // Home.jsx:68 interpolates this directly as `${yieldOnCost}%`, so round here
    // rather than shipping 12.034567901234568 to the UI.
    yieldOnCost: totalValue > 0
      ? Number((((monthlyIncome * 12) / totalValue) * 100).toFixed(2))
      : 0,
    totalValueChange: 0,        // needs a value-history table; out of scope
    totalValueChangePct: 0,
    monthlyIncomePct: 0,
  };
}

export function deriveAllocation(viewHoldings) {
  if (!Array.isArray(viewHoldings)) return [];
  return viewHoldings.map(h => ({
    name: h.ticker,
    value: Number(h.currentPct.toFixed(1)),
    color: h.color,
  }));
}

export function deriveDrift(viewHoldings) {
  if (!Array.isArray(viewHoldings)) return [];
  const total = viewHoldings.reduce((sum, h) => sum + h.value, 0);

  return viewHoldings
    .filter(h => Math.abs(h.drift) > DRIFT_THRESHOLD)
    .sort((a, b) => Math.abs(b.drift) - Math.abs(a.drift))
    .map(h => {
      const over = h.drift > 0;
      const dollars = Math.abs((h.drift / 100) * total);
      return {
        ticker: h.ticker,
        severity: Math.abs(h.drift) >= HIGH_DRIFT ? 'high' : 'medium',
        message: `${over ? '+' : ''}${h.drift.toFixed(1)}% ${over ? 'above' : 'below'} target — ` +
                 `consider ${over ? 'trimming' : 'adding'} ~$${Math.round(dollars).toLocaleString()}`,
      };
    });
}
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
npx vitest run src/lib/derive.test.js
```

Expected: PASS, all cases green.

- [ ] **Step 6: Write the portfolio context**

Hook and context only — the two providers supply the value. Separate files mean neither provider's imports leak into the other's lazy chunk.

```jsx
// robo-advisor/src/context/PortfolioContext.jsx
import { createContext, useContext } from 'react';

export const PortfolioContext = createContext(null);

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) {
    throw new Error('usePortfolio must be used inside <DemoProvider> or <LiveProvider>');
  }
  return ctx;
}
```

- [ ] **Step 7: Commit**

```bash
git add robo-advisor/vitest.config.js robo-advisor/package.json robo-advisor/src/lib/derive.js robo-advisor/src/lib/derive.test.js robo-advisor/src/context/PortfolioContext.jsx
git commit -m "test: add holdings derivation layer with view-model parity

deriveHoldings emits the exact shape dummy.js already exports, so the four
existing views switch between demo and real data without markup changes.
Colours are hashed from the symbol so a holding keeps its colour across
re-imports."
```

---

### Task 8: Shared column mapping and row normalization

**Files:**
- Create: `shared/mapping.js`, `shared/mapping.test.js`
- Modify: `robo-advisor/vite.config.js` (add the `@shared` alias)

**Interfaces:**
- Consumes: nothing.
- Produces, from `shared/mapping.js`:
  - `FIELD_SYNONYMS` — object mapping canonical field → array of synonyms
  - `BROKER_PRESETS` — array of `{ name, signature: string[] }`. A preset only *names* the
    recognised layout; the synonym table already maps its columns, so no per-preset override
    is needed. Adding one later means adding a `mapping` field and merging it over the
    detected result.
  - `normalizeHeader(header) -> string`
  - `detectMapping(headers) -> { mapping, preset }` where `mapping` is `{ symbol, units, price, market_value, avg_purchase_price, currency, description }`, each value a header string or `null`
  - `parseNumber(value) -> number | null`
  - `normalizeRows(rawRows, mapping) -> { rows, warnings }` where each row is `{ symbol, description, units, price, market_value, avg_purchase_price, currency, instrument_kind }` and each warning is `{ rowIndex, field, code, message }`

**Why this lives in `shared/`:** both the server (`api/import/preview.js`, Task 13) and the demo portal
(`DemoProvider`, Task 9) need identical mapping behaviour. Two copies would drift, and the demo would
start accepting files the real importer rejects.

- [ ] **Step 1: Write the failing test**

```js
// shared/mapping.test.js
import { describe, it, expect } from 'vitest';
import { normalizeHeader, detectMapping, parseNumber, normalizeRows } from './mapping.js';

describe('normalizeHeader', () => {
  it('lowercases and strips punctuation, spacing, and BOM', () => {
    expect(normalizeHeader('  Market Value ($) ')).toBe('marketvalue');
    expect(normalizeHeader('﻿Symbol')).toBe('symbol');
    expect(normalizeHeader('# of Shares')).toBe('ofshares');
  });

  it('survives null and non-string input', () => {
    expect(normalizeHeader(null)).toBe('');
    expect(normalizeHeader(42)).toBe('42');
  });
});

describe('parseNumber', () => {
  it('strips currency symbols, thousands separators, and percent signs', () => {
    expect(parseNumber('$1,234.56')).toBeCloseTo(1234.56, 6);
    expect(parseNumber('1 234,56')).toBeCloseTo(1234.56, 6);
    expect(parseNumber('12.5%')).toBeCloseTo(12.5, 6);
  });

  it('reads accounting-style negatives in parentheses', () => {
    expect(parseNumber('(500.25)')).toBeCloseTo(-500.25, 6);
  });

  it('returns null for values that are not numbers', () => {
    expect(parseNumber('N/A')).toBeNull();
    expect(parseNumber('')).toBeNull();
    expect(parseNumber(null)).toBeNull();
    expect(parseNumber('--')).toBeNull();
  });

  it('passes through real numbers unchanged', () => {
    expect(parseNumber(1500)).toBe(1500);
    expect(parseNumber(0)).toBe(0);
  });
});

describe('detectMapping', () => {
  it('detects a Questrade-style header row', () => {
    const { mapping } = detectMapping(['Symbol', 'Quantity', 'Market Price', 'Market Value', 'Average Cost', 'Currency']);
    expect(mapping.symbol).toBe('Symbol');
    expect(mapping.units).toBe('Quantity');
    expect(mapping.price).toBe('Market Price');
    expect(mapping.market_value).toBe('Market Value');
    expect(mapping.avg_purchase_price).toBe('Average Cost');
    expect(mapping.currency).toBe('Currency');
  });

  it('detects ticker and shares as symbol and units', () => {
    const { mapping } = detectMapping(['Ticker', 'Shares', 'Last Price']);
    expect(mapping.symbol).toBe('Ticker');
    expect(mapping.units).toBe('Shares');
    expect(mapping.price).toBe('Last Price');
  });

  it('leaves unmatched fields null rather than guessing', () => {
    const { mapping } = detectMapping(['Symbol', 'Quantity']);
    expect(mapping.market_value).toBeNull();
    expect(mapping.currency).toBeNull();
  });

  it('names the preset when a signature matches', () => {
    const { preset } = detectMapping(['Symbol', 'Quantity', 'Market Price', 'Market Value', 'Average Cost', 'Currency']);
    expect(preset).toBe('Questrade');
  });

  it('reports no preset for an unrecognised layout', () => {
    const { preset } = detectMapping(['Thing', 'Amount']);
    expect(preset).toBeNull();
  });

  it('does not map the same header to two fields', () => {
    const { mapping } = detectMapping(['Value']);
    const used = Object.values(mapping).filter(Boolean);
    expect(used.length).toBe(new Set(used).size);
  });
});

describe('normalizeRows', () => {
  const mapping = {
    symbol: 'Symbol', units: 'Quantity', price: 'Price', market_value: 'Market Value',
    avg_purchase_price: null, currency: null, description: null,
  };

  it('normalizes a clean row', () => {
    const { rows, warnings } = normalizeRows(
      [{ Symbol: 'hdiv.to', Quantity: '100', Price: '$15.00', 'Market Value': '$1,500.00' }],
      mapping
    );
    expect(warnings).toEqual([]);
    expect(rows[0]).toMatchObject({
      symbol: 'HDIV.TO', units: 100, price: 15, market_value: 1500, currency: 'CAD',
    });
  });

  it('derives market_value from units x price when absent', () => {
    const { rows } = normalizeRows(
      [{ Symbol: 'X', Quantity: '4', Price: '25', 'Market Value': '' }],
      mapping
    );
    expect(rows[0].market_value).toBe(100);
  });

  it('derives price from market_value / units when price is absent', () => {
    const { rows } = normalizeRows(
      [{ Symbol: 'X', Quantity: '4', Price: '', 'Market Value': '100' }],
      mapping
    );
    expect(rows[0].price).toBe(25);
  });

  it('warns and excludes a row with non-numeric units', () => {
    const { rows, warnings } = normalizeRows(
      [{ Symbol: 'X', Quantity: 'abc', Price: '10', 'Market Value': '' }],
      mapping
    );
    expect(rows[0].excluded).toBe(true);
    expect(warnings[0]).toMatchObject({ rowIndex: 0, field: 'units', code: 'not_a_number' });
  });

  it('warns and excludes a row with zero or negative units', () => {
    const { warnings } = normalizeRows(
      [{ Symbol: 'X', Quantity: '0', Price: '10', 'Market Value': '' }],
      mapping
    );
    expect(warnings[0].code).toBe('non_positive_units');
  });

  it('warns and excludes a row with a missing symbol', () => {
    const { warnings } = normalizeRows(
      [{ Symbol: '', Quantity: '10', Price: '10', 'Market Value': '' }],
      mapping
    );
    expect(warnings[0]).toMatchObject({ field: 'symbol', code: 'missing_symbol' });
  });

  it('flags duplicate symbols within one file', () => {
    const { warnings } = normalizeRows(
      [
        { Symbol: 'X', Quantity: '1', Price: '10', 'Market Value': '' },
        { Symbol: 'x', Quantity: '2', Price: '10', 'Market Value': '' },
      ],
      mapping
    );
    expect(warnings.some(w => w.code === 'duplicate_symbol')).toBe(true);
  });

  it('throws a clear error when the symbol column is unmapped', () => {
    expect(() => normalizeRows([{ a: 1 }], { ...mapping, symbol: null }))
      .toThrow(/symbol column/i);
  });

  it('returns empty results for no rows', () => {
    expect(normalizeRows([], mapping)).toEqual({ rows: [], warnings: [] });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd robo-advisor && npx vitest run ../shared/mapping.test.js
```

Expected: FAIL — cannot resolve `./mapping.js`.

- [ ] **Step 3: Implement `shared/mapping.js`**

```js
// shared/mapping.js
// Column detection and row normalization for broker CSV/XLSX imports.
// Pure JavaScript: no Node APIs and no browser APIs, so both the Vercel
// functions and the demo portal can import it unchanged.

export const FIELD_SYNONYMS = {
  symbol:             ['symbol', 'ticker', 'security', 'securitysymbol', 'stock', 'instrument', 'symbolticker'],
  units:              ['units', 'quantity', 'qty', 'shares', 'sharequantity', 'ofshares', 'position', 'noofshares'],
  price:              ['price', 'lastprice', 'marketprice', 'currentprice', 'close', 'last', 'closingprice'],
  market_value:       ['marketvalue', 'value', 'totalvalue', 'positionvalue', 'marketval', 'currentvalue'],
  avg_purchase_price: ['averagecost', 'avgcost', 'bookvalue', 'avgprice', 'costbasis', 'averageprice', 'acb'],
  currency:           ['currency', 'ccy', 'curr'],
  description:        ['description', 'name', 'securityname', 'company', 'companyname', 'securitydescription'],
};

// Ordered most specific first: 'marketvalue' must win over 'value' so a
// sheet with both columns maps each correctly.
const FIELD_ORDER = ['symbol', 'units', 'market_value', 'avg_purchase_price', 'price', 'currency', 'description'];

export const BROKER_PRESETS = [
  { name: 'Questrade',            signature: ['symbol', 'quantity', 'marketprice', 'marketvalue', 'averagecost'] },
  { name: 'Wealthsimple',         signature: ['symbol', 'quantity', 'bookvalue', 'marketvalue'] },
  { name: 'Interactive Brokers',  signature: ['symbol', 'position', 'marketprice', 'marketvalue', 'costbasis'] },
  { name: 'TD Direct Investing',  signature: ['symbol', 'quantity', 'lastprice', 'marketvalue'] },
  { name: 'Portfolio Template',   signature: ['ticker', 'shares', 'price'] },
];

export function normalizeHeader(header) {
  if (header === null || header === undefined) return '';
  return String(header)
    .replace(/^﻿/, '')          // strip byte-order mark
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');      // drop spaces, punctuation, currency marks
}

export function parseNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (value === null || value === undefined) return null;

  let text = String(value).trim();
  if (text === '' || text === '--' || /^n\/?a$/i.test(text)) return null;

  // Accounting negatives: (500.25) means -500.25
  let negative = false;
  if (/^\(.*\)$/.test(text)) { negative = true; text = text.slice(1, -1); }

  text = text.replace(/[$€£¥%\s]/g, '');

  // Disambiguate decimal separator: if both are present the rightmost wins.
  const lastComma = text.lastIndexOf(',');
  const lastDot   = text.lastIndexOf('.');
  if (lastComma > -1 && lastDot > -1) {
    text = lastComma > lastDot
      ? text.replace(/\./g, '').replace(',', '.')
      : text.replace(/,/g, '');
  } else if (lastComma > -1) {
    // A single comma is a decimal separator only when it is not a thousands group.
    text = /,\d{3}$/.test(text) ? text.replace(/,/g, '') : text.replace(',', '.');
  }

  if (text.startsWith('-')) { negative = true; text = text.slice(1); }
  if (!/^\d*\.?\d+$/.test(text)) return null;

  const parsed = Number(text);
  if (!Number.isFinite(parsed)) return null;
  return negative ? -parsed : parsed;
}

export function detectMapping(headers) {
  const list = Array.isArray(headers) ? headers : [];
  const normalized = list.map(h => ({ original: h, key: normalizeHeader(h) }));
  const present = new Set(normalized.map(n => n.key));

  const preset = BROKER_PRESETS.find(p => p.signature.every(sig => present.has(sig)))?.name ?? null;

  const mapping = {
    symbol: null, units: null, price: null, market_value: null,
    avg_purchase_price: null, currency: null, description: null,
  };

  const claimed = new Set();
  for (const field of FIELD_ORDER) {
    for (const synonym of FIELD_SYNONYMS[field]) {
      const hit = normalized.find(n => n.key === synonym && !claimed.has(n.original));
      if (hit) {
        mapping[field] = hit.original;
        claimed.add(hit.original);
        break;
      }
    }
  }

  return { mapping, preset };
}

export function normalizeRows(rawRows, mapping) {
  if (!mapping || !mapping.symbol) {
    throw new Error(
      'Cannot import without a symbol column. Map one of your columns to Symbol and try again.'
    );
  }
  const source = Array.isArray(rawRows) ? rawRows : [];
  if (source.length === 0) return { rows: [], warnings: [] };

  const warnings = [];
  const seen = new Map();

  const rows = source.map((raw, rowIndex) => {
    const read = field => (mapping[field] ? raw[mapping[field]] : null);

    const rawSymbol = read('symbol');
    const symbol = rawSymbol === null || rawSymbol === undefined
      ? ''
      : String(rawSymbol).trim().toUpperCase();

    let units       = parseNumber(read('units'));
    let price       = parseNumber(read('price'));
    let marketValue = parseNumber(read('market_value'));
    const avgCost   = parseNumber(read('avg_purchase_price'));

    const rawCurrency = read('currency');
    const currency = rawCurrency ? String(rawCurrency).trim().toUpperCase() : 'CAD';

    const rawDescription = read('description');
    const description = rawDescription ? String(rawDescription).trim() : null;

    let excluded = false;

    if (!symbol) {
      warnings.push({ rowIndex, field: 'symbol', code: 'missing_symbol',
        message: 'No symbol on this row.' });
      excluded = true;
    }

    if (units === null) {
      const rawUnits = read('units');
      if (rawUnits !== null && rawUnits !== undefined && String(rawUnits).trim() !== '') {
        warnings.push({ rowIndex, field: 'units', code: 'not_a_number',
          message: `"${rawUnits}" is not a number of units.` });
      } else {
        warnings.push({ rowIndex, field: 'units', code: 'missing_units',
          message: 'No unit quantity on this row.' });
      }
      excluded = true;
    } else if (units <= 0) {
      warnings.push({ rowIndex, field: 'units', code: 'non_positive_units',
        message: `Unit quantity is ${units}.` });
      excluded = true;
    }

    // Fill in whichever of price / market_value is missing.
    if (marketValue === null && units !== null && price !== null) marketValue = units * price;
    if (price === null && marketValue !== null && units) price = marketValue / units;

    if (symbol) {
      if (seen.has(symbol)) {
        warnings.push({ rowIndex, field: 'symbol', code: 'duplicate_symbol',
          message: `${symbol} also appears on row ${seen.get(symbol) + 1}.` });
      } else {
        seen.set(symbol, rowIndex);
      }
    }

    return {
      rowIndex,
      symbol,
      description,
      units,
      price,
      market_value: marketValue,
      avg_purchase_price: avgCost,
      currency,
      instrument_kind: 'etf',   // this app's universe is income ETFs
      excluded,
    };
  });

  return { rows, warnings };
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run ../shared/mapping.test.js
```

Expected: PASS, all cases green. If `does not map the same header to two fields` fails, the `claimed` set is not being consulted.

- [ ] **Step 5: Add the `@shared` alias so the SPA can import it**

`shared/` sits outside Vite's root (`robo-advisor/`), so it needs both an alias and an `fs.allow` entry. Modify `robo-advisor/vite.config.js`, preserving what Task 4 Step 2 added:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  envDir: '..',
  resolve: {
    alias: {
      '@shared': fileURLToPath(new URL('../shared', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: { '/api': 'http://127.0.0.1:3000' },
    fs: { allow: ['..'] },   // permit serving ../shared during dev
  },
});
```

- [ ] **Step 6: Confirm the alias resolves in a build**

```bash
cd robo-advisor && node -e "console.log(require('fs').existsSync('../shared/mapping.js'))" && npm run build
```

Expected: `true`, then a successful build.

- [ ] **Step 7: Commit**

```bash
git add shared/ robo-advisor/vite.config.js
git commit -m "test: add shared broker column mapping and row normalization

Lives in shared/ because the import endpoint and the demo portal must
apply identical rules — two copies would drift and the demo would accept
files the real importer rejects.

parseNumber handles the formats broker exports actually emit: currency
symbols, thousands separators, accounting negatives in parentheses, and
both decimal-separator conventions."
```

---

### Task 9: Demo provider

**Files:**
- Create: `robo-advisor/src/lib/demoParse.js`
- Modify: `robo-advisor/src/context/DemoProvider.jsx` (replace the Task 5 stub)

**Interfaces:**
- Consumes: `detectMapping`, `normalizeRows` from `@shared/mapping` (Task 8); `deriveHoldings`, `deriveStats`, `deriveAllocation`, `deriveDrift` from Task 7; `PortfolioContext` from Task 7.
- Produces `parseWorkbook(file) -> Promise<{ headers, rows }>` from `lib/demoParse.js`.
- Produces the `PortfolioContext` value:
  `{ isDemo: true, loading, error, holdings, accounts, stats, allocation, drift, distributions, upcomingDates, hasImported, actions }`
  where `actions = { previewImport, commitImport, connect, sync, disconnect, reset }`.
  **Task 10 must produce this same context shape** — the views depend on it. The one permitted
  difference is inside `actions`: `DemoProvider` exposes `reset` (restore the sample portfolio),
  `LiveProvider` exposes `refresh` (re-read from Supabase). No view calls either one; only the
  five shared actions are used by shared components.

- [ ] **Step 1: Write the browser-side workbook parser**

```js
// robo-advisor/src/lib/demoParse.js
// Browser-side workbook parsing for the demo portal. Nothing here touches
// the network — the parsed result lives only in React state.
import * as XLSX from 'xlsx';

export async function parseWorkbook(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) throw new Error('That file has no readable sheets.');

  // header:1 yields an array-of-arrays so we can find the real header row
  // ourselves — broker exports often carry title rows above it.
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false, defval: null });
  if (matrix.length === 0) throw new Error('That file appears to be empty.');

  const headerIndex = matrix.findIndex(
    row => Array.isArray(row) && row.filter(c => c !== null && String(c).trim() !== '').length >= 2
  );
  if (headerIndex === -1) throw new Error('Could not find a header row in that file.');

  const headers = matrix[headerIndex].map(h => (h === null ? '' : String(h).trim()));
  const rows = matrix.slice(headerIndex + 1)
    .filter(row => row.some(c => c !== null && String(c).trim() !== ''))
    .map(row => {
      const record = {};
      headers.forEach((h, i) => { record[h] = row[i] ?? null; });
      return record;
    });

  return { headers, rows };
}
```

- [ ] **Step 2: Implement the demo provider**

```jsx
// robo-advisor/src/context/DemoProvider.jsx
// Serves the sample portfolio from dummy.js. Uploads are parsed for real,
// in the browser, and held in memory only. This provider must never write
// to Supabase and never call /api/snaptrade/* — Task 25 asserts that.
import { useCallback, useMemo, useState } from 'react';
import { PortfolioContext } from './PortfolioContext';
import { parseWorkbook } from '../lib/demoParse';
import { detectMapping, normalizeRows } from '@shared/mapping.js';
import { deriveHoldings, deriveStats, deriveAllocation, deriveDrift } from '../lib/derive';
import {
  portfolioHoldings, brokerageAccounts, driftAlerts,
  upcomingDates, distributionHistory, portfolioStats,
} from '../data/dummy';

// dummy.js holdings are already in view-model shape; map them back to raw
// rows so both providers feed the derivation layer identically.
const SAMPLE_ROWS = portfolioHoldings.map(h => ({
  symbol: h.ticker,
  description: h.name,
  units: null,
  price: null,
  market_value: h.value,
  currency: 'CAD',
  instrument_kind: 'etf',
  color: h.color,
}));

export default function DemoProvider({ children }) {
  const [rows, setRows] = useState(SAMPLE_ROWS);
  const [imported, setImported] = useState(false);
  const [accounts, setAccounts] = useState(brokerageAccounts);
  const [error, setError] = useState(null);

  const previewImport = useCallback(async (file) => {
    setError(null);
    try {
      const { headers, rows: raw } = await parseWorkbook(file);
      const { mapping, preset } = detectMapping(headers);
      const { rows: normalized, warnings } = normalizeRows(raw, mapping);
      return {
        jobId: 'demo',
        headers,
        mapping,
        detectedPreset: preset,
        rows: normalized,
        warnings,
        totals: {
          rowCount: normalized.length,
          included: normalized.filter(r => !r.excluded).length,
          warningCount: warnings.length,
        },
      };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const commitImport = useCallback(async ({ rows: confirmed, filename }) => {
    setRows(confirmed);
    setImported(true);
    setAccounts([{
      id: 'demo-import',
      broker: filename || 'Imported file',
      accountType: 'Imported',
      value: confirmed.reduce((sum, r) => sum + (Number(r.market_value) || 0), 0),
      lastImport: 'just now',
      status: 'imported',
      logo: 'CSV',
    }]);
    return { imported: confirmed.length, skipped: 0 };
  }, []);

  // Connecting is simulated here. No login URL is requested, so demo and
  // marketing traffic never consumes SnapTrade account quota.
  const connect    = useCallback(async () => ({ simulated: true }), []);
  const sync       = useCallback(async () => ({ simulated: true }), []);
  const disconnect = useCallback(async () => ({ simulated: true }), []);
  const reset      = useCallback(() => {
    setRows(SAMPLE_ROWS);
    setImported(false);
    setAccounts(brokerageAccounts);
  }, []);

  const value = useMemo(() => {
    const holdings = deriveHoldings(rows);
    return {
      isDemo: true,
      loading: false,
      error,
      holdings,
      accounts,
      // Before an import the curated figures show as-is so the marketing
      // demo looks complete; after one, everything is derived from the file.
      stats:         imported ? deriveStats(rows) : portfolioStats,
      allocation:    deriveAllocation(holdings),
      drift:         imported ? deriveDrift(holdings) : driftAlerts,
      distributions: distributionHistory,
      upcomingDates,
      hasImported:   imported,
      actions: { previewImport, commitImport, connect, sync, disconnect, reset },
    };
  }, [rows, accounts, imported, error, previewImport, commitImport, connect, sync, disconnect, reset]);

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}
```

- [ ] **Step 3: Verify the demo portal still renders identically**

```bash
cd robo-advisor && npm run dev
```

Visit `http://localhost:5173/demo/portfolio`. Expected: the same 10 holdings, the same donut, the same accounts list as before this task. The provider is in place but no view reads it yet — that is Task 11.

- [ ] **Step 4: Commit**

```bash
git add robo-advisor/src/lib/demoParse.js robo-advisor/src/context/DemoProvider.jsx
git commit -m "feat: add demo portfolio provider with real in-browser parsing

Uploads in the demo portal are genuinely parsed so a prospect feels the
real feature, but the result stays in React state. No Supabase write and
no SnapTrade call is reachable from this provider."
```

---

### Task 10: Live provider

**Files:**
- Modify: `robo-advisor/src/context/LiveProvider.jsx` (replace the Task 5 stub)

**Interfaces:**
- Consumes: `supabase` (Task 4), `apiPost`/`apiUpload`/`apiDelete` (Task 4), `useSession()` (Task 4), derivation helpers (Task 7).
- Produces the **same context shape as Task 9** with `isDemo: false`, plus `refresh()` inside `actions`.

- [ ] **Step 1: Implement the live provider**

Reads go directly to Supabase through RLS-protected views — no function round trip needed for
selects. Writes go through `/api/*`, which holds the credentials.

```jsx
// robo-advisor/src/context/LiveProvider.jsx
// Serves the signed-in user's real portfolio. Reads come straight from
// Supabase under RLS; writes go through /api/* where the secrets live.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PortfolioContext } from './PortfolioContext';
import { useSession } from './SessionContext';
import { supabase } from '../lib/supabase';
import { apiPost, apiUpload, apiDelete } from '../lib/api';
import { deriveHoldings, deriveStats, deriveAllocation, deriveDrift } from '../lib/derive';

export default function LiveProvider({ children }) {
  const { user } = useSession();
  const [rows, setRows] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [holdingsRes, accountsRes, distRes] = await Promise.all([
        supabase.from('holdings').select('*').order('market_value', { ascending: false }),
        supabase.from('accounts').select('*').order('created_at', { ascending: true }),
        supabase.from('distributions').select('*').order('trade_date', { ascending: false }).limit(500),
      ]);

      const firstError = holdingsRes.error || accountsRes.error || distRes.error;
      if (firstError) throw new Error(firstError.message);

      setRows(holdingsRes.data ?? []);
      setAccounts(accountsRes.data ?? []);
      setDistributions(distRes.data ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const previewImport = useCallback(file => apiUpload('/api/import/preview', file), []);

  const commitImport = useCallback(async (payload) => {
    const result = await apiPost('/api/import/commit', payload);
    await refresh();
    return result;
  }, [refresh]);

  const connect = useCallback(() => apiPost('/api/snaptrade/login-url'), []);

  const sync = useCallback(async (accountId) => {
    const result = await apiPost('/api/snaptrade/sync', accountId ? { accountId } : {});
    await refresh();
    return result;
  }, [refresh]);

  const disconnect = useCallback(async (authorizationId) => {
    const result = await apiDelete(`/api/snaptrade/connections?id=${encodeURIComponent(authorizationId)}`);
    await refresh();
    return result;
  }, [refresh]);

  const value = useMemo(() => {
    const holdings = deriveHoldings(rows);
    return {
      isDemo: false,
      loading,
      error,
      holdings,
      // Map DB accounts onto the shape the existing accounts list renders.
      accounts: accounts.map(a => ({
        id: a.id,
        broker: a.institution_name || a.account_name || 'Account',
        accountType: a.account_type || '—',
        value: Number(a.total_value) || 0,
        lastImport: a.last_synced_at
          ? new Date(a.last_synced_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
          : null,
        status: a.sync_status === 'BROKEN' ? 'broken' : (a.last_synced_at ? 'imported' : 'pending'),
        logo: (a.institution_name || 'AC').slice(0, 3).toUpperCase(),
        authorizationId: a.snaptrade_authorization_id,
      })),
      stats:         deriveStats(rows, distributions),
      allocation:    deriveAllocation(holdings),
      drift:         deriveDrift(holdings),
      distributions,
      upcomingDates: [],          // requires a forward calendar feed; out of scope
      hasImported:   rows.length > 0,
      actions: { previewImport, commitImport, connect, sync, disconnect, refresh },
    };
  }, [rows, accounts, distributions, loading, error, previewImport, commitImport, connect, sync, disconnect, refresh]);

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}
```

- [ ] **Step 2: Verify the live portal loads an empty portfolio without errors**

With `vercel dev` running and signed in, visit `/app/portfolio`. Expected: the page renders with zero
holdings and no console errors. `stats.totalValue` is `0`, not `NaN` — Task 7's empty-portfolio test
guarantees this.

- [ ] **Step 3: Confirm RLS scoping in the browser console**

```js
await (await import('/src/lib/supabase.js')).supabase.from('snaptrade_users').select('*')
```

Expected: `data: []`. A populated result means the Task 3 policy is wrong — stop and fix it.

- [ ] **Step 4: Commit**

```bash
git add robo-advisor/src/context/LiveProvider.jsx
git commit -m "feat: add live portfolio provider backed by supabase

Selects go straight to Supabase under RLS; only writes need a function
round trip. Emits the same context shape as DemoProvider so the views
cannot tell the two apart."
```

---

### Task 11: Point the views at the provider

**Files:**
- Modify: `robo-advisor/src/views/Home.jsx:1-4`, `robo-advisor/src/views/Portfolio.jsx:1-5`, `robo-advisor/src/views/Discover.jsx`, `robo-advisor/src/views/Plan.jsx`

**Interfaces:**
- Consumes: `usePortfolio()` from Task 7.
- Produces: no new exports. After this task no view imports portfolio data from `dummy.js`.

**Rule for this task:** change imports and data sources only. Do not restyle, re-lay-out, or
"improve" any view. A diff that touches JSX structure is out of scope here.

- [ ] **Step 1: Update `Home.jsx`**

Replace the `dummy.js` import at `Home.jsx:4`:

```jsx
// before
import { portfolioStats, recentActivity, incomeProjection, upcomingDates, driftAlerts, monthlyCheckin } from '../data/dummy';

// after
import { recentActivity, incomeProjection, monthlyCheckin } from '../data/dummy';
import { usePortfolio } from '../context/PortfolioContext';
```

Then inside the component, before any use of those values:

```jsx
const { stats: portfolioStats, upcomingDates, drift: driftAlerts } = usePortfolio();
```

Destructuring under the old names means the rest of the component body needs no edits.
`Home.jsx:11` derives `nextEvent` from `upcomingDates` and `Home.jsx:115` already guards it with
`{nextEvent && (`, so `LiveProvider`'s empty `upcomingDates` array renders nothing rather than
crashing. No guard needs adding.

`recentActivity`, `incomeProjection`, and `monthlyCheckin` stay on `dummy.js` — they need a
transactions table and a projection engine that this feature does not build.

- [ ] **Step 2: Update `Portfolio.jsx`**

Replace the import at `Portfolio.jsx:5-6`:

```jsx
// before
import { brokerageAccounts, portfolioHoldings, driftAlerts, rebalanceHistory,
         upcomingDates, recentActivity } from '../data/dummy';

// after
import { rebalanceHistory, recentActivity } from '../data/dummy';
import { usePortfolio } from '../context/PortfolioContext';
```

And inside the component:

```jsx
const {
  holdings: portfolioHoldings,
  accounts: brokerageAccounts,
  drift: driftAlerts,
  upcomingDates,
  isDemo,
  actions,
} = usePortfolio();
```

- [ ] **Step 3: Check `Discover.jsx` and `Plan.jsx` for portfolio imports**

```bash
grep -n "from '../data/dummy'" robo-advisor/src/views/Discover.jsx robo-advisor/src/views/Plan.jsx
```

`Discover.jsx` should import only `etfsExtended` — ETF reference data, not portfolio data, so it stays
unchanged. If `Plan.jsx` imports `portfolioStats`, `portfolioHoldings`, or `allocationData`, apply the
same destructure-under-the-old-name treatment. Leave `advisorMessages` and `goals` on `dummy.js`.

- [ ] **Step 4: Verify both portals render identically to before**

```bash
cd robo-advisor && npm run dev
```

- `/demo/home` — income hero, next dividend, drift card all populated exactly as before.
- `/demo/portfolio` — 10 holdings, donut, accounts list unchanged.
- `/app/home` while signed in — renders with zeroed stats and empty tables, no crash, no `NaN`.

- [ ] **Step 5: Confirm no view reads portfolio data from dummy.js any more**

```bash
grep -rn "portfolioStats\|portfolioHoldings\|brokerageAccounts\|allocationData\|driftAlerts" robo-advisor/src/views/ | grep "data/dummy"
```

Expected: no output.

- [ ] **Step 6: Run the full test suite and lint**

```bash
npx vitest run && npm run lint
```

Expected: all tests pass, no new lint errors.

- [ ] **Step 7: Commit**

```bash
git add robo-advisor/src/views
git commit -m "refactor: read portfolio data from the provider, not dummy.js

Values are destructured under their previous names so no JSX changed.
Reference data that this feature does not source (ETF dataset, advisor
messages, projections) deliberately stays on dummy.js."
```

---

## Stage 5 — Import pipeline

**Transport decision — this supersedes the spec's multipart design.** The spec described
`POST /api/import/preview` as `multipart/form-data`. During planning that proved to be the
worse option: the workbook is parsed in the **browser** (SheetJS is already in the client
bundle for the demo portal) and the raw `{ headers, rows }` is posted as JSON. This avoids multipart
handling, a `busboy` dependency, and a second copy of SheetJS on the server, and it sidesteps
Vercel's 4.5 MB request-body limit for anything but absurd files.

The server does **not** trust the client's normalization. `preview` and `commit` both re-run
`detectMapping`/`normalizeRows` from `@shared/mapping.js` against the raw rows. The client's
normalized output is used only to render the preview table.

### Task 12: Server HTTP and auth helpers

**Files:**
- Create: `api/_lib/http.js`, `api/_lib/supabase.js`, `api/_lib/auth.js`
- Test: `api/_lib/auth.test.js`

**Interfaces:**
- Consumes: `serverEnv()` from Task 1.
- Produces:
  - from `http.js`: `json(res, status, body)`, `fail(res, status, message)`, `methodGuard(req, res, allowed) -> boolean`
  - from `supabase.js`: `serviceClient()` — memoized service-role client
  - from `auth.js`: `requireUser(req) -> Promise<{ userId, email }>`, throwing `AuthError` with a `status`

- [ ] **Step 1: Write the HTTP helpers**

```js
// api/_lib/http.js
export function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(body));
}

export function fail(res, status, message) {
  json(res, status, { error: message });
}

// Returns false and responds 405 when the method is not allowed, so callers
// can `if (!methodGuard(req, res, ['POST'])) return;`
export function methodGuard(req, res, allowed) {
  if (allowed.includes(req.method)) return true;
  res.setHeader('Allow', allowed.join(', '));
  fail(res, 405, `${req.method} not allowed. Use ${allowed.join(' or ')}.`);
  return false;
}
```

- [ ] **Step 2: Write the service-role Supabase client**

```js
// api/_lib/supabase.js
// Service-role client. Bypasses RLS, so every query in a handler must be
// explicitly scoped by user_id — RLS is not there to catch mistakes here.
import { createClient } from '@supabase/supabase-js';
import { serverEnv } from './env.js';

let client = null;

export function serviceClient() {
  if (client) return client;
  const { supabaseUrl, supabaseSecretKey } = serverEnv();
  client = createClient(supabaseUrl, supabaseSecretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
```

The comment matters: the service key bypasses RLS, so a handler that forgets `.eq('user_id', userId)`
would read another user's rows. Every query written in Tasks 13, 14, 19, 20, and 21 includes that
filter.

- [ ] **Step 3: Write the failing auth test**

```js
// api/_lib/auth.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';

const getUser = vi.fn();
vi.mock('./supabase.js', () => ({
  serviceClient: () => ({ auth: { getUser } }),
}));

const { requireUser, AuthError } = await import('./auth.js');

describe('requireUser', () => {
  beforeEach(() => getUser.mockReset());

  it('rejects a request with no Authorization header', async () => {
    await expect(requireUser({ headers: {} })).rejects.toThrow(AuthError);
    await expect(requireUser({ headers: {} })).rejects.toMatchObject({ status: 401 });
  });

  it('rejects a header that is not a Bearer token', async () => {
    await expect(requireUser({ headers: { authorization: 'Basic abc' } }))
      .rejects.toMatchObject({ status: 401 });
  });

  it('rejects an empty Bearer token', async () => {
    await expect(requireUser({ headers: { authorization: 'Bearer ' } }))
      .rejects.toMatchObject({ status: 401 });
  });

  it('rejects a token the auth server does not recognise', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: { message: 'bad jwt' } });
    await expect(requireUser({ headers: { authorization: 'Bearer nope' } }))
      .rejects.toMatchObject({ status: 401 });
  });

  it('returns the user id and email for a valid token', async () => {
    getUser.mockResolvedValue({
      data: { user: { id: 'uuid-1', email: 'a@b.com' } },
      error: null,
    });
    await expect(requireUser({ headers: { authorization: 'Bearer good' } }))
      .resolves.toEqual({ userId: 'uuid-1', email: 'a@b.com' });
  });

  it('passes the token through to the auth server verbatim', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u', email: 'e' } }, error: null });
    await requireUser({ headers: { authorization: 'Bearer tok-123' } });
    expect(getUser).toHaveBeenCalledWith('tok-123');
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

```bash
cd robo-advisor && npx vitest run ../api/_lib/auth.test.js
```

Expected: FAIL — cannot resolve `./auth.js`.

- [ ] **Step 5: Implement `auth.js`**

```js
// api/_lib/auth.js
// Verifies the caller's Supabase JWT by asking the auth server, rather than
// decoding it locally — no JWT secret to hold, and revoked sessions fail.
import { serviceClient } from './supabase.js';

export class AuthError extends Error {
  constructor(message, status = 401) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

export async function requireUser(req) {
  const header = req.headers?.authorization || req.headers?.Authorization || '';
  const [scheme, token] = String(header).split(' ');

  if (scheme !== 'Bearer' || !token || !token.trim()) {
    throw new AuthError('Missing or malformed Authorization header. Expected "Bearer <token>".');
  }

  const { data, error } = await serviceClient().auth.getUser(token.trim());
  if (error || !data?.user) {
    throw new AuthError('Invalid or expired session. Sign in again.');
  }

  return { userId: data.user.id, email: data.user.email };
}
```

- [ ] **Step 6: Run the test to verify it passes**

```bash
npx vitest run ../api/_lib/auth.test.js
```

Expected: PASS, six cases green.

- [ ] **Step 7: Commit**

```bash
git add api/_lib/http.js api/_lib/supabase.js api/_lib/auth.js api/_lib/auth.test.js
git commit -m "test: add server auth guard and http helpers

requireUser validates the JWT against the Supabase auth server instead of
decoding it locally, so there is no JWT secret to hold and revoked
sessions are rejected."
```

---

### Task 13: Import preview endpoint

**Files:**
- Create: `api/import/preview.js`
- Test: `api/import/preview.test.js`

**Interfaces:**
- Consumes: `requireUser` (Task 12), `json`/`fail`/`methodGuard` (Task 12), `serviceClient` (Task 12), `detectMapping`/`normalizeRows` (Task 8).
- Produces: `POST /api/import/preview` accepting `{ filename, headers: string[], rows: object[] }` and returning `{ jobId, headers, mapping, detectedPreset, rows, warnings, totals }`.

- [ ] **Step 1: Write the failing test**

```js
// api/import/preview.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';

const insert = vi.fn();
const requireUser = vi.fn();

vi.mock('../_lib/auth.js', () => ({
  requireUser: (...a) => requireUser(...a),
  AuthError: class AuthError extends Error { constructor(m, s = 401) { super(m); this.status = s; } },
}));
vi.mock('../_lib/supabase.js', () => ({
  serviceClient: () => ({ from: () => ({ insert: (...a) => insert(...a) }) }),
}));

const handler = (await import('./preview.js')).default;

function mockRes() {
  return {
    statusCode: 0, headers: {}, body: null,
    status(c) { this.statusCode = c; return this; },
    setHeader(k, v) { this.headers[k] = v; return this; },
    send(b) { this.body = JSON.parse(b); return this; },
  };
}

const VALID_BODY = {
  filename: 'holdings.csv',
  headers: ['Symbol', 'Quantity', 'Market Price', 'Market Value', 'Average Cost', 'Currency'],
  rows: [{ Symbol: 'HDIV', Quantity: '100', 'Market Price': '15.00', 'Market Value': '1500.00', 'Average Cost': '14.00', Currency: 'CAD' }],
};

describe('POST /api/import/preview', () => {
  beforeEach(() => {
    insert.mockReset().mockResolvedValue({ data: [{ id: 'job-1' }], error: null });
    requireUser.mockReset().mockResolvedValue({ userId: 'user-1', email: 'a@b.com' });
  });

  it('rejects a non-POST method with 405', async () => {
    const res = mockRes();
    await handler({ method: 'GET', headers: {} }, res);
    expect(res.statusCode).toBe(405);
  });

  it('rejects an unauthenticated request with 401', async () => {
    requireUser.mockRejectedValue(Object.assign(new Error('nope'), { status: 401 }));
    const res = mockRes();
    await handler({ method: 'POST', headers: {}, body: VALID_BODY }, res);
    expect(res.statusCode).toBe(401);
  });

  it('rejects a body with no rows', async () => {
    const res = mockRes();
    await handler({ method: 'POST', headers: {}, body: { headers: ['A'], rows: [] } }, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/no rows/i);
  });

  it('rejects a row count above the cap', async () => {
    const res = mockRes();
    const rows = Array.from({ length: 5001 }, () => ({ Symbol: 'X', Quantity: '1' }));
    await handler({ method: 'POST', headers: {}, body: { headers: ['Symbol', 'Quantity'], rows } }, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/too many rows/i);
  });

  it('detects the mapping server-side and returns normalized rows', async () => {
    const res = mockRes();
    await handler({ method: 'POST', headers: {}, body: VALID_BODY }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.detectedPreset).toBe('Questrade');
    expect(res.body.mapping.symbol).toBe('Symbol');
    expect(res.body.rows[0]).toMatchObject({ symbol: 'HDIV', units: 100, market_value: 1500 });
  });

  it('records an import job scoped to the caller', async () => {
    const res = mockRes();
    await handler({ method: 'POST', headers: {}, body: VALID_BODY }, res);
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'user-1', status: 'previewed', filename: 'holdings.csv',
    }));
  });

  it('does not write any holdings', async () => {
    const res = mockRes();
    await handler({ method: 'POST', headers: {}, body: VALID_BODY }, res);
    // import_jobs is the only insert a preview may perform.
    expect(insert).toHaveBeenCalledTimes(1);
  });

  it('returns 400 with a helpful message when no symbol column exists', async () => {
    const res = mockRes();
    await handler({ method: 'POST', headers: {}, body: { headers: ['Thing'], rows: [{ Thing: 1 }] } }, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/symbol column/i);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd robo-advisor && npx vitest run ../api/import/preview.test.js
```

Expected: FAIL — cannot resolve `./preview.js`.

- [ ] **Step 3: Implement `api/import/preview.js`**

```js
// api/import/preview.js
// Parses nothing itself — the browser sends raw { headers, rows } from the
// workbook. This endpoint re-derives the mapping and normalization
// server-side so the client's version is never trusted, records the job,
// and writes no holdings.
import { requireUser } from '../_lib/auth.js';
import { serviceClient } from '../_lib/supabase.js';
import { json, fail, methodGuard } from '../_lib/http.js';
import { detectMapping, normalizeRows } from '../../shared/mapping.js';

const MAX_ROWS = 5000;
const PREVIEW_ROWS = 25;

export default async function handler(req, res) {
  if (!methodGuard(req, res, ['POST'])) return;

  let user;
  try {
    user = await requireUser(req);
  } catch (err) {
    return fail(res, err.status || 401, err.message);
  }

  const body = req.body || {};
  const headers = Array.isArray(body.headers) ? body.headers : [];
  const rows = Array.isArray(body.rows) ? body.rows : [];
  const filename = typeof body.filename === 'string' ? body.filename.slice(0, 255) : null;

  if (rows.length === 0) return fail(res, 400, 'That file contained no rows to import.');
  if (rows.length > MAX_ROWS) {
    return fail(res, 400, `Too many rows (${rows.length}). The limit is ${MAX_ROWS} per import.`);
  }

  const { mapping, preset } = detectMapping(headers);

  let normalized;
  try {
    normalized = normalizeRows(rows, mapping);
  } catch (err) {
    // normalizeRows throws only when the symbol column is unmapped, which
    // is a user-fixable problem, not a server fault.
    return fail(res, 400, err.message);
  }

  const included = normalized.rows.filter(r => !r.excluded);

  const { data, error } = await serviceClient()
    .from('import_jobs')
    .insert({
      user_id: user.userId,
      filename,
      status: 'previewed',
      row_count: normalized.rows.length,
      mapping,
      warnings: normalized.warnings,
    })
    .select('id')
    .single();

  if (error) return fail(res, 500, `Could not record the import job: ${error.message}`);

  return json(res, 200, {
    jobId: data?.id ?? null,
    headers,
    mapping,
    detectedPreset: preset,
    rows: normalized.rows.slice(0, PREVIEW_ROWS),
    warnings: normalized.warnings,
    totals: {
      rowCount: normalized.rows.length,
      included: included.length,
      excluded: normalized.rows.length - included.length,
      warningCount: normalized.warnings.length,
      marketValue: included.reduce((sum, r) => sum + (r.market_value || 0), 0),
    },
  });
}
```

Note the `.select('id').single()` chain — the test's mock returns from `insert`, so if this fails at
runtime with "insert(...).select is not a function", update the test mock to chain rather than
weakening the handler.

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run ../api/import/preview.test.js
```

Expected: PASS. Adjust the `serviceClient` mock to return `{ insert: () => ({ select: () => ({ single: insert }) }) }`
if the chain shape differs — the assertion on `user_id` must still hold.

- [ ] **Step 5: Commit**

```bash
git add api/import/preview.js api/import/preview.test.js
git commit -m "test: add import preview endpoint

Re-derives mapping and normalization server-side from the raw rows rather
than trusting the client's version, caps imports at 5000 rows, and writes
only an import_jobs audit row - never holdings."
```

---

### Task 14: Import commit endpoint

**Files:**
- Create: `api/import/commit.js`
- Test: `api/import/commit.test.js`

**Interfaces:**
- Consumes: Task 12 helpers, `normalizeRows` (Task 8).
- Produces: `POST /api/import/commit` accepting `{ jobId, mapping, headers, rows, filename, excludedRowIndexes }` and returning `{ portfolioId, accountId, imported, skipped }`.

**Idempotency:** upserts on the `holdings_unique_position` constraint from Task 3, so re-importing the
same file updates rows rather than duplicating them.

- [ ] **Step 1: Write the failing test**

```js
// api/import/commit.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';

const calls = { portfolioSelect: vi.fn(), portfolioInsert: vi.fn(), accountInsert: vi.fn(),
                holdingsUpsert: vi.fn(), holdingsDelete: vi.fn(), jobUpdate: vi.fn() };
const requireUser = vi.fn();

vi.mock('../_lib/auth.js', () => ({
  requireUser: (...a) => requireUser(...a),
  AuthError: class extends Error {},
}));

vi.mock('../_lib/supabase.js', () => ({
  serviceClient: () => ({
    from(table) {
      if (table === 'portfolios') {
        return {
          select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: calls.portfolioSelect }) }) }),
          insert: () => ({ select: () => ({ single: calls.portfolioInsert }) }),
        };
      }
      if (table === 'accounts') {
        return {
          select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }),
          insert: () => ({ select: () => ({ single: calls.accountInsert }) }),
        };
      }
      if (table === 'holdings') {
        return {
          upsert: (...a) => { calls.holdingsUpsert(...a); return { select: async () => ({ data: a[0], error: null }) }; },
          delete: () => ({ eq: () => ({ not: calls.holdingsDelete }) }),
        };
      }
      if (table === 'import_jobs') {
        return { update: (...a) => { calls.jobUpdate(...a); return { eq: () => ({ eq: async () => ({ error: null }) }) }; } };
      }
      throw new Error(`unexpected table ${table}`);
    },
  }),
}));

const handler = (await import('./commit.js')).default;

function mockRes() {
  return {
    statusCode: 0, headers: {}, body: null,
    status(c) { this.statusCode = c; return this; },
    setHeader(k, v) { this.headers[k] = v; return this; },
    send(b) { this.body = JSON.parse(b); return this; },
  };
}

const BODY = {
  jobId: 'job-1',
  filename: 'holdings.csv',
  mapping: { symbol: 'Symbol', units: 'Quantity', price: 'Price', market_value: 'Market Value',
             avg_purchase_price: null, currency: null, description: null },
  rows: [
    { Symbol: 'HDIV', Quantity: '100', Price: '15', 'Market Value': '1500' },
    { Symbol: 'ZWQT', Quantity: '50',  Price: '10', 'Market Value': '500'  },
  ],
};

describe('POST /api/import/commit', () => {
  beforeEach(() => {
    Object.values(calls).forEach(fn => fn.mockReset());
    requireUser.mockReset().mockResolvedValue({ userId: 'user-1', email: 'a@b.com' });
    calls.portfolioSelect.mockResolvedValue({ data: null, error: null });
    calls.portfolioInsert.mockResolvedValue({ data: { id: 'pf-1' }, error: null });
    calls.accountInsert.mockResolvedValue({ data: { id: 'acc-1' }, error: null });
    calls.holdingsDelete.mockResolvedValue({ error: null });
  });

  it('rejects a non-POST method', async () => {
    const res = mockRes();
    await handler({ method: 'GET', headers: {} }, res);
    expect(res.statusCode).toBe(405);
  });

  it('rejects an unauthenticated request', async () => {
    requireUser.mockRejectedValue(Object.assign(new Error('no'), { status: 401 }));
    const res = mockRes();
    await handler({ method: 'POST', headers: {}, body: BODY }, res);
    expect(res.statusCode).toBe(401);
  });

  it('re-normalizes from raw rows rather than trusting client values', async () => {
    const res = mockRes();
    // A tampered payload claiming a market_value that the raw row disproves.
    await handler({ method: 'POST', headers: {}, body: {
      ...BODY,
      rows: [{ Symbol: 'HDIV', Quantity: '100', Price: '15', 'Market Value': '1500' }],
      normalizedRows: [{ symbol: 'HDIV', units: 999999, market_value: 999999999 }],
    } }, res);
    const upserted = calls.holdingsUpsert.mock.calls[0][0];
    expect(upserted[0].units).toBe(100);
    expect(upserted[0].market_value).toBe(1500);
  });

  it('scopes every written row to the caller', async () => {
    const res = mockRes();
    await handler({ method: 'POST', headers: {}, body: BODY }, res);
    const upserted = calls.holdingsUpsert.mock.calls[0][0];
    expect(upserted.every(r => r.user_id === 'user-1')).toBe(true);
    expect(upserted.every(r => r.account_id === 'acc-1')).toBe(true);
  });

  it('upserts on the unique position constraint so re-imports do not duplicate', async () => {
    const res = mockRes();
    await handler({ method: 'POST', headers: {}, body: BODY }, res);
    expect(calls.holdingsUpsert).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ onConflict: 'account_id,symbol,instrument_kind' })
    );
  });

  it('skips rows the normalizer excluded and reports the count', async () => {
    const res = mockRes();
    await handler({ method: 'POST', headers: {}, body: {
      ...BODY,
      rows: [...BODY.rows, { Symbol: '', Quantity: 'abc', Price: '', 'Market Value': '' }],
    } }, res);
    expect(res.body.imported).toBe(2);
    expect(res.body.skipped).toBe(1);
  });

  it('honours explicit row exclusions from the review step', async () => {
    const res = mockRes();
    await handler({ method: 'POST', headers: {}, body: { ...BODY, excludedRowIndexes: [1] } }, res);
    expect(res.body.imported).toBe(1);
    const upserted = calls.holdingsUpsert.mock.calls[0][0];
    expect(upserted.map(r => r.symbol)).toEqual(['HDIV']);
  });

  it('marks the import job committed', async () => {
    const res = mockRes();
    await handler({ method: 'POST', headers: {}, body: BODY }, res);
    expect(calls.jobUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'committed' }));
  });

  it('rejects a body with no importable rows', async () => {
    const res = mockRes();
    await handler({ method: 'POST', headers: {}, body: { ...BODY, rows: [] } }, res);
    expect(res.statusCode).toBe(400);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd robo-advisor && npx vitest run ../api/import/commit.test.js
```

Expected: FAIL — cannot resolve `./commit.js`.

- [ ] **Step 3: Implement `api/import/commit.js`**

```js
// api/import/commit.js
// Writes the confirmed import. Re-normalizes from the raw rows using the
// confirmed mapping — the client's normalized values are never persisted,
// so a tampered payload cannot write arbitrary numbers.
import { requireUser } from '../_lib/auth.js';
import { serviceClient } from '../_lib/supabase.js';
import { json, fail, methodGuard } from '../_lib/http.js';
import { normalizeRows } from '../../shared/mapping.js';

const CSV_PORTFOLIO_NAME = 'Imported holdings';

async function ensurePortfolio(db, userId) {
  const existing = await db.from('portfolios')
    .select('id').eq('user_id', userId).eq('source', 'csv').maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  if (existing.data) return existing.data.id;

  const created = await db.from('portfolios')
    .insert({ user_id: userId, name: CSV_PORTFOLIO_NAME, source: 'csv', is_primary: true })
    .select('id').single();
  if (created.error) throw new Error(created.error.message);
  return created.data.id;
}

async function ensureAccount(db, userId, portfolioId, filename) {
  const existing = await db.from('accounts')
    .select('id').eq('user_id', userId).eq('portfolio_id', portfolioId).maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  if (existing.data) return existing.data.id;

  const created = await db.from('accounts')
    .insert({
      user_id: userId,
      portfolio_id: portfolioId,
      institution_name: 'Uploaded file',
      account_name: filename || CSV_PORTFOLIO_NAME,
      account_type: 'Imported',
      sync_status: 'MANUAL',
      last_synced_at: new Date().toISOString(),
    })
    .select('id').single();
  if (created.error) throw new Error(created.error.message);
  return created.data.id;
}

export default async function handler(req, res) {
  if (!methodGuard(req, res, ['POST'])) return;

  let user;
  try {
    user = await requireUser(req);
  } catch (err) {
    return fail(res, err.status || 401, err.message);
  }

  const body = req.body || {};
  const rawRows = Array.isArray(body.rows) ? body.rows : [];
  const excluded = new Set(Array.isArray(body.excludedRowIndexes) ? body.excludedRowIndexes : []);

  if (rawRows.length === 0) return fail(res, 400, 'Nothing to import — no rows were supplied.');

  let normalized;
  try {
    normalized = normalizeRows(rawRows, body.mapping);
  } catch (err) {
    return fail(res, 400, err.message);
  }

  const keep = normalized.rows.filter(r => !r.excluded && !excluded.has(r.rowIndex));
  if (keep.length === 0) {
    return fail(res, 400, 'Every row was excluded, so there is nothing to import.');
  }

  const db = serviceClient();
  const asOf = new Date().toISOString();

  try {
    const portfolioId = await ensurePortfolio(db, user.userId);
    const accountId = await ensureAccount(db, user.userId, portfolioId, body.filename);

    const holdingRows = keep.map(r => ({
      user_id: user.userId,
      account_id: accountId,
      symbol: r.symbol,
      raw_symbol: r.symbol,
      description: r.description,
      instrument_kind: r.instrument_kind,
      units: r.units,
      price: r.price,
      market_value: r.market_value,
      avg_purchase_price: r.avg_purchase_price,
      open_pnl: r.avg_purchase_price !== null && r.units !== null && r.market_value !== null
        ? r.market_value - (r.avg_purchase_price * r.units)
        : null,
      currency: r.currency,
      as_of: asOf,
    }));

    const upserted = await db.from('holdings')
      .upsert(holdingRows, { onConflict: 'account_id,symbol,instrument_kind' })
      .select();
    if (upserted.error) throw new Error(upserted.error.message);

    // Positions absent from this file are no longer held in this account.
    const kept = keep.map(r => r.symbol);
    const pruned = await db.from('holdings')
      .delete().eq('account_id', accountId)
      .not('symbol', 'in', `(${kept.map(s => `"${s}"`).join(',')})`);
    if (pruned.error) throw new Error(pruned.error.message);

    if (body.jobId) {
      await db.from('import_jobs')
        .update({ status: 'committed', portfolio_id: portfolioId })
        .eq('id', body.jobId).eq('user_id', user.userId);
    }

    return json(res, 200, {
      portfolioId,
      accountId,
      imported: keep.length,
      skipped: normalized.rows.length - keep.length,
      warnings: normalized.warnings,
    });
  } catch (err) {
    if (body.jobId) {
      await db.from('import_jobs').update({ status: 'failed' })
        .eq('id', body.jobId).eq('user_id', user.userId);
    }
    return fail(res, 500, `Import failed: ${err.message}`);
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run ../api/import/commit.test.js
```

Expected: PASS, nine cases green.

- [ ] **Step 5: Commit**

```bash
git add api/import/commit.js api/import/commit.test.js
git commit -m "test: add import commit endpoint

Re-normalizes from raw rows with the confirmed mapping, so a tampered
payload cannot persist arbitrary values. Upserts on the unique position
constraint, making a repeat import of the same file update rather than
duplicate, and prunes positions the file no longer lists."
```

---

### Task 15: Import wizard UI

**Files:**
- Create: `robo-advisor/src/components/import/ImportWizard.jsx`, `Dropzone.jsx`, `MappingTable.jsx`, `PreviewTable.jsx`
- Modify: `robo-advisor/src/views/Portfolio.jsx` (delete `UploadModal` at lines 24–100; mount the wizard)
- Modify: `robo-advisor/src/lib/api.js` (drop `apiUpload`), `robo-advisor/src/context/LiveProvider.jsx` (`previewImport` posts JSON)

**Interfaces:**
- Consumes: `usePortfolio()` actions `previewImport`/`commitImport`; `parseWorkbook` (Task 9).
- Produces: `<ImportWizard open onClose onDone />`.

- [ ] **Step 1: Correct the transport in `api.js` and `LiveProvider.jsx`**

Stage 5 parses in the browser, so `apiUpload` is dead code. Delete it from `lib/api.js`, then change
`LiveProvider`'s `previewImport` to parse first and post JSON:

```jsx
// robo-advisor/src/context/LiveProvider.jsx — replace the previewImport definition
import { parseWorkbook } from '../lib/demoParse';

const previewImport = useCallback(async (file) => {
  const { headers, rows } = await parseWorkbook(file);
  return apiPost('/api/import/preview', { filename: file.name, headers, rows });
}, []);
```

Both providers now expose `previewImport(file)` with identical signatures — the wizard is unaware of
which one it is talking to.

- [ ] **Step 2: Write `Dropzone.jsx`**

```jsx
import { useRef, useState } from 'react';
import { Upload, FileText } from 'lucide-react';

const C = { hi: 'var(--text-hi)', low: 'var(--text-low)', accent: 'var(--accent)', border: 'var(--border)' };
const ACCEPTED = ['.csv', '.xlsx', '.xls'];
const MAX_BYTES = 5 * 1024 * 1024;

export default function Dropzone({ file, onFile, error }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState(null);

  const accept = (candidate) => {
    setLocalError(null);
    if (!candidate) return;
    const ok = ACCEPTED.some(ext => candidate.name.toLowerCase().endsWith(ext));
    if (!ok) return setLocalError(`${candidate.name} is not a CSV or Excel file.`);
    if (candidate.size > MAX_BYTES) return setLocalError('That file is larger than 5 MB.');
    onFile(candidate);
  };

  const shown = localError || error;

  return (
    <div>
      <button type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); accept(e.dataTransfer.files?.[0]); }}
        className="w-full rounded-2xl flex flex-col items-center justify-center gap-2 px-5 py-9 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        style={{
          border: `1.5px dashed ${dragging ? C.accent : 'var(--border-mid)'}`,
          background: dragging ? 'rgba(245,166,35,0.06)' : 'var(--bg-subtle)',
          minHeight: '150px',
        }}>
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(245,166,35,0.14)' }}>
          {file ? <FileText size={19} style={{ color: C.accent }} /> : <Upload size={19} style={{ color: C.accent }} />}
        </div>
        {file ? (
          <>
            <p className="text-sm font-semibold" style={{ color: C.hi }}>{file.name}</p>
            <p className="text-xs" style={{ color: C.low }}>{(file.size / 1024).toFixed(0)} KB · tap to choose another</p>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold" style={{ color: C.hi }}>Drop your holdings export here</p>
            <p className="text-xs" style={{ color: C.low }}>or tap to browse · CSV, XLSX</p>
          </>
        )}
      </button>

      <input ref={inputRef} type="file" accept={ACCEPTED.join(',')} className="hidden"
        aria-label="Choose a holdings file"
        onChange={e => accept(e.target.files?.[0])} />

      {shown && (
        <p role="alert" className="text-xs mt-2.5 px-1" style={{ color: '#DC2626' }}>{shown}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Write `MappingTable.jsx`**

```jsx
const C = { hi: 'var(--text-hi)', mid: 'var(--text-mid)', low: 'var(--text-low)',
            accent: 'var(--accent)', border: 'var(--border)' };

const FIELDS = [
  { key: 'symbol',             label: 'Symbol',       required: true  },
  { key: 'units',              label: 'Units',        required: true  },
  { key: 'price',              label: 'Price',        required: false },
  { key: 'market_value',       label: 'Market value', required: false },
  { key: 'avg_purchase_price', label: 'Average cost', required: false },
  { key: 'currency',           label: 'Currency',     required: false },
  { key: 'description',        label: 'Description',  required: false },
];

export default function MappingTable({ headers, mapping, detectedPreset, onChange }) {
  return (
    <div>
      {detectedPreset && (
        <p className="text-xs mb-3 px-3 py-2 rounded-xl"
          style={{ background: 'rgba(22,163,74,0.08)', color: '#15803D' }}>
          Recognised a <strong>{detectedPreset}</strong> export — columns matched automatically.
        </p>
      )}

      <div className="space-y-2">
        {FIELDS.map(field => (
          <div key={field.key} className="flex items-center gap-3">
            <label htmlFor={`map-${field.key}`} className="text-xs font-medium w-28 shrink-0"
              style={{ color: field.required ? C.hi : C.mid }}>
              {field.label}{field.required && <span style={{ color: C.accent }}> *</span>}
            </label>
            <select id={`map-${field.key}`}
              value={mapping[field.key] ?? ''}
              onChange={e => onChange({ ...mapping, [field.key]: e.target.value || null })}
              className="flex-1 rounded-xl px-3 text-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              style={{ minHeight: '40px', background: 'var(--bg-input)', color: C.hi, border: `1px solid ${C.border}` }}>
              <option value="">— not mapped —</option>
              {headers.filter(Boolean).map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
        ))}
      </div>

      <p className="text-[11px] mt-3" style={{ color: C.low }}>
        Market value is calculated from units × price when you leave it unmapped.
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Write `PreviewTable.jsx`**

```jsx
import { AlertCircle } from 'lucide-react';

const C = { hi: 'var(--text-hi)', mid: 'var(--text-mid)', low: 'var(--text-low)',
            accent: 'var(--accent)', border: 'var(--border)', subtle: 'var(--bg-subtle)' };

const money = n => (n === null || n === undefined ? '—' : `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`);

export default function PreviewTable({ rows, warnings, excluded, onToggle }) {
  const byRow = warnings.reduce((acc, w) => {
    (acc[w.rowIndex] = acc[w.rowIndex] || []).push(w);
    return acc;
  }, {});

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs" style={{ minWidth: '460px' }}>
          <thead>
            <tr style={{ background: C.subtle }}>
              <th className="text-left px-3 py-2 font-semibold" style={{ color: C.mid }}>Include</th>
              <th className="text-left px-3 py-2 font-semibold" style={{ color: C.mid }}>Symbol</th>
              <th className="text-right px-3 py-2 font-semibold" style={{ color: C.mid }}>Units</th>
              <th className="text-right px-3 py-2 font-semibold" style={{ color: C.mid }}>Price</th>
              <th className="text-right px-3 py-2 font-semibold" style={{ color: C.mid }}>Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const issues = byRow[row.rowIndex] || [];
              const off = excluded.has(row.rowIndex);
              return (
                <tr key={row.rowIndex} style={{ borderTop: `1px solid ${C.border}`, opacity: off ? 0.45 : 1 }}>
                  <td className="px-3 py-2">
                    <input type="checkbox" checked={!off}
                      onChange={() => onToggle(row.rowIndex)}
                      aria-label={`Include ${row.symbol || `row ${row.rowIndex + 1}`}`}
                      className="cursor-pointer" style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} />
                  </td>
                  <td className="px-3 py-2 font-mono font-semibold" style={{ color: C.hi }}>
                    {row.symbol || <span style={{ color: C.low }}>—</span>}
                    {issues.length > 0 && (
                      <span className="inline-flex items-center gap-1 ml-1.5" title={issues.map(i => i.message).join(' ')}>
                        <AlertCircle size={11} style={{ color: '#D97706' }} />
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-mono" style={{ color: C.mid }}>{row.units ?? '—'}</td>
                  <td className="px-3 py-2 text-right font-mono" style={{ color: C.mid }}>{money(row.price)}</td>
                  <td className="px-3 py-2 text-right font-mono font-semibold" style={{ color: C.hi }}>{money(row.market_value)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {warnings.length > 0 && (
        <div className="px-3 py-2.5" style={{ background: 'rgba(217,119,6,0.07)', borderTop: `1px solid ${C.border}` }}>
          <p className="text-[11px] font-semibold mb-1" style={{ color: '#B45309' }}>
            {warnings.length} row{warnings.length === 1 ? '' : 's'} need a look
          </p>
          <ul className="space-y-0.5">
            {warnings.slice(0, 5).map((w, i) => (
              <li key={i} className="text-[11px]" style={{ color: '#92400E' }}>
                Row {w.rowIndex + 1}: {w.message}
              </li>
            ))}
            {warnings.length > 5 && (
              <li className="text-[11px]" style={{ color: '#92400E' }}>…and {warnings.length - 5} more.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Write `ImportWizard.jsx`**

```jsx
import { useState } from 'react';
import { X, ArrowRight, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import Dropzone from './Dropzone';
import MappingTable from './MappingTable';
import PreviewTable from './PreviewTable';

const C = { hi: 'var(--text-hi)', mid: 'var(--text-mid)', low: 'var(--text-low)',
            accent: 'var(--accent)', border: 'var(--border)' };

const STEPS = ['Choose file', 'Review columns', 'Confirm'];

export default function ImportWizard({ open, onClose, onDone }) {
  const { actions, isDemo } = usePortfolio();
  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mapping, setMapping] = useState(null);
  const [excluded, setExcluded] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null);

  if (!open) return null;

  const reset = () => {
    setStep(0); setFile(null); setPreview(null); setMapping(null);
    setExcluded(new Set()); setError(null); setDone(null);
  };

  const close = () => { reset(); onClose(); };

  const runPreview = async (chosen) => {
    setBusy(true); setError(null);
    try {
      const result = await actions.previewImport(chosen);
      setPreview(result);
      setMapping(result.mapping);
      // Rows the normalizer flagged start excluded — the user opts them back in.
      setExcluded(new Set(result.rows.filter(r => r.excluded).map(r => r.rowIndex)));
      setStep(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const runCommit = async () => {
    setBusy(true); setError(null);
    try {
      const result = await actions.commitImport({
        jobId: preview.jobId,
        filename: file?.name,
        mapping,
        headers: preview.headers,
        rows: preview.rawRows ?? preview.rows,
        excludedRowIndexes: [...excluded],
      });
      setDone(result);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggle = (rowIndex) => setExcluded(prev => {
    const next = new Set(prev);
    next.has(rowIndex) ? next.delete(rowIndex) : next.add(rowIndex);
    return next;
  });

  const includedCount = preview
    ? preview.rows.filter(r => !excluded.has(r.rowIndex)).length
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full md:max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        style={{ background: 'var(--bg-card)', border: `1px solid ${C.border}`, maxHeight: '92vh' }}>

        <div className="flex items-start justify-between px-5 pt-5 pb-3 shrink-0">
          <div>
            <p className="font-semibold" style={{ color: C.hi }}>Import your holdings</p>
            <p className="text-xs mt-0.5" style={{ color: C.low }}>
              {STEPS[step]}{isDemo && ' · demo mode, nothing is saved'}
            </p>
          </div>
          <button onClick={close} aria-label="Close import"
            className="w-11 h-11 -mr-2 -mt-2 flex items-center justify-center rounded-xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            style={{ color: C.low }}>
            <X size={17} />
          </button>
        </div>

        <div className="flex gap-1.5 px-5 pb-4 shrink-0">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1 rounded-full transition-colors"
              style={{ height: 3, background: i <= step ? C.accent : 'var(--border-mid)' }} />
          ))}
        </div>

        <div className="px-5 pb-5 overflow-y-auto flex-1">
          {step === 0 && (
            <Dropzone file={file} error={error}
              onFile={chosen => { setFile(chosen); runPreview(chosen); }} />
          )}

          {step === 1 && preview && (
            <div className="space-y-5">
              <MappingTable headers={preview.headers} mapping={mapping}
                detectedPreset={preview.detectedPreset}
                onChange={setMapping} />
              <PreviewTable rows={preview.rows} warnings={preview.warnings}
                excluded={excluded} onToggle={toggle} />
              {error && <p role="alert" className="text-xs" style={{ color: '#DC2626' }}>{error}</p>}
            </div>
          )}

          {step === 2 && done && (
            <div className="text-center py-7">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(22,163,74,0.12)' }}>
                <CheckCircle size={26} style={{ color: '#16A34A' }} />
              </div>
              <p className="font-semibold" style={{ color: C.hi }}>
                Imported {done.imported} position{done.imported === 1 ? '' : 's'}
              </p>
              {done.skipped > 0 && (
                <p className="text-xs mt-1.5" style={{ color: C.low }}>
                  {done.skipped} row{done.skipped === 1 ? '' : 's'} skipped
                </p>
              )}
            </div>
          )}
        </div>

        <div className="px-5 pb-6 pt-1 shrink-0 space-y-2" style={{ borderTop: `1px solid ${C.border}` }}>
          {step === 1 && (
            <>
              <button onClick={runCommit} disabled={busy || includedCount === 0 || !mapping?.symbol}
                className="w-full flex items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white cursor-pointer active:scale-[0.98] transition-transform disabled:opacity-45 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                style={{ minHeight: '48px', background: C.accent }}>
                {busy ? <Loader2 size={15} className="animate-spin" /> : null}
                {busy ? 'Importing…' : `Import ${includedCount} position${includedCount === 1 ? '' : 's'}`}
              </button>
              <button onClick={() => { setStep(0); setPreview(null); setError(null); }}
                className="w-full flex items-center justify-center gap-1.5 text-xs cursor-pointer focus-visible:outline-none rounded"
                style={{ color: C.low, minHeight: '40px' }}>
                <ArrowLeft size={13} /> Choose a different file
              </button>
            </>
          )}

          {step === 2 && (
            <button onClick={() => { const d = done; close(); onDone?.(d); }}
              className="w-full flex items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white cursor-pointer active:scale-[0.98] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              style={{ minHeight: '48px', background: C.accent }}>
              See my portfolio <ArrowRight size={15} />
            </button>
          )}

          {step === 0 && busy && (
            <p className="text-xs text-center" style={{ color: C.low }}>Reading your file…</p>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Return the raw rows from preview so commit can re-normalize**

`ImportWizard` sends `preview.rawRows` to commit. Add it in both providers:

- In `LiveProvider.previewImport`, after the `apiPost`: `return { ...result, rawRows: rows };`
- In `DemoProvider.previewImport`, add `rawRows: raw` to the returned object.

Without this, commit receives the normalized preview rows and `normalizeRows` cannot re-derive from
them — the mapping keys would not match.

- [ ] **Step 7: Mount the wizard in `Portfolio.jsx`**

Delete `UploadModal` (lines 24–100) and its `useRef`/`Upload`/`FileText` imports if now unused. Then:

```jsx
import ImportWizard from '../components/import/ImportWizard';

// inside the component, replacing the old showUpload state usage:
const [showImport, setShowImport] = useState(false);

// replacing {showUpload && <UploadModal ... />}:
{showImport && (
  <ImportWizard open onClose={() => setShowImport(false)} onDone={() => setShowImport(false)} />
)}
```

Point both existing triggers (`Portfolio.jsx:354` "Upload Holdings CSV" and `Portfolio.jsx:485`
"Import CSV") at `setShowImport(true)`.

- [ ] **Step 8: Test the demo path end to end**

Create a fixture and import it in the demo portal:

```bash
cat > /tmp/holdings-test.csv <<'CSV'
Symbol,Quantity,Market Price,Market Value,Average Cost,Currency
HDIV,100,15.00,1500.00,14.00,CAD
ZWQT,250,10.40,2600.00,10.00,CAD
BADROW,abc,,,,CAD
CSV
```

At `/demo/portfolio`, click **Upload Holdings CSV**, drop the file. Expected:
- Step 2 shows "Recognised a **Questrade** export"
- Two rows included, `BADROW` excluded with a `"abc" is not a number of units` warning
- Importing leaves the donut and holdings table showing exactly HDIV and ZWQT
- Nothing appears in Supabase (`supabase db shell --command "select count(*) from public.holdings;"` returns 0)

- [ ] **Step 9: Test the live path end to end**

With `vercel dev` running and signed in, repeat at `/app/portfolio`. Expected: the same wizard
behaviour, and afterwards:

```bash
supabase db shell --command "select symbol, units, market_value from public.holdings order by symbol;"
```

Expected: two rows, HDIV 100/1500 and ZWQT 250/2600.

- [ ] **Step 10: Re-import the same file to prove idempotency**

Import `/tmp/holdings-test.csv` again. Expected: still exactly two rows, not four — the
`onConflict` upsert from Task 14 held.

- [ ] **Step 11: Run the suite and commit**

```bash
cd robo-advisor && npx vitest run && npm run lint && cd ..
git add robo-advisor/src/components/import robo-advisor/src/views/Portfolio.jsx robo-advisor/src/lib/api.js robo-advisor/src/context
git commit -m "feat: add three-step import wizard and remove the dead upload modal

Portfolio.jsx carried a file picker that accepted a file and did nothing.
It is replaced by Drop -> Review -> Confirm, where flagged rows start
excluded and the user opts them back in, because a mis-mapped column
silently corrupts every downstream number."
```

---

## Stage 6 — SnapTrade connection

### Task 16: SnapTrade client and user registration

**Files:**
- Create: `api/_lib/snaptrade.js`, `api/_lib/snaptradeUser.js`
- Test: `api/_lib/snaptradeUser.test.js`

**Interfaces:**
- Consumes: `serverEnv()` (Task 1), `serviceClient()` (Task 12).
- Produces:
  - from `snaptrade.js`: `snaptradeClient()` — memoized `Snaptrade` instance
  - from `snaptradeUser.js`: `getOrCreateSnaptradeUser(userId) -> Promise<{ snaptradeUserId, userSecret }>`

**Verified constructor shape.** `snaptrade-typescript-sdk@12.1.8` requires the `auth` wrapper. The
bare `new Snaptrade({ clientId, consumerKey })` form that appears in older documentation does not work.

- [ ] **Step 1: Write the client singleton**

```js
// api/_lib/snaptrade.js
// SnapTrade client. Verified against snaptrade-typescript-sdk@12.1.8:
// the auth wrapper is required — `new Snaptrade({ clientId, consumerKey })`
// is the older, no-longer-valid form.
import { Snaptrade, SnaptradeAuth } from 'snaptrade-typescript-sdk';
import { serverEnv } from './env.js';

let client = null;

export function snaptradeClient() {
  if (client) return client;
  const { snaptradeClientId, snaptradeConsumerKey } = serverEnv();
  client = new Snaptrade({
    auth: SnaptradeAuth.commercialApiKey({
      clientId: snaptradeClientId,
      consumerKey: snaptradeConsumerKey,
    }),
  });
  return client;
}
```

- [ ] **Step 2: Write the failing test**

```js
// api/_lib/snaptradeUser.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';

const maybeSingle = vi.fn();
const insert = vi.fn();
const registerSnapTradeUser = vi.fn();

vi.mock('./supabase.js', () => ({
  serviceClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle }) }),
      insert: (...a) => { insert(...a); return { select: () => ({ single: async () => ({ data: a[0], error: null }) }) }; },
    }),
  }),
}));

vi.mock('./snaptrade.js', () => ({
  snaptradeClient: () => ({ authentication: { registerSnapTradeUser } }),
}));

const { getOrCreateSnaptradeUser } = await import('./snaptradeUser.js');

describe('getOrCreateSnaptradeUser', () => {
  beforeEach(() => {
    maybeSingle.mockReset();
    insert.mockReset();
    registerSnapTradeUser.mockReset();
  });

  it('returns the stored secret without calling SnapTrade when one exists', async () => {
    maybeSingle.mockResolvedValue({
      data: { snaptrade_user_id: 'uuid-1', user_secret: 'sec-1' }, error: null,
    });

    const result = await getOrCreateSnaptradeUser('uuid-1');

    expect(result).toEqual({ snaptradeUserId: 'uuid-1', userSecret: 'sec-1' });
    expect(registerSnapTradeUser).not.toHaveBeenCalled();
  });

  it('registers with SnapTrade using the supabase uuid as userId', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    registerSnapTradeUser.mockResolvedValue({ data: { userId: 'uuid-2', userSecret: 'sec-2' } });

    await getOrCreateSnaptradeUser('uuid-2');

    // The docs require a unique, immutable id and warn against emails.
    expect(registerSnapTradeUser).toHaveBeenCalledWith({ userId: 'uuid-2' });
  });

  it('persists the returned secret', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    registerSnapTradeUser.mockResolvedValue({ data: { userId: 'uuid-3', userSecret: 'sec-3' } });

    await getOrCreateSnaptradeUser('uuid-3');

    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'uuid-3', snaptrade_user_id: 'uuid-3', user_secret: 'sec-3',
    }));
  });

  it('throws when SnapTrade returns no secret rather than storing undefined', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    registerSnapTradeUser.mockResolvedValue({ data: { userId: 'uuid-4' } });

    await expect(getOrCreateSnaptradeUser('uuid-4')).rejects.toThrow(/no user secret/i);
    expect(insert).not.toHaveBeenCalled();
  });

  it('surfaces a database read failure', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: { message: 'db down' } });
    await expect(getOrCreateSnaptradeUser('uuid-5')).rejects.toThrow(/db down/);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
cd robo-advisor && npx vitest run ../api/_lib/snaptradeUser.test.js
```

Expected: FAIL — cannot resolve `./snaptradeUser.js`.

- [ ] **Step 4: Implement `snaptradeUser.js`**

```js
// api/_lib/snaptradeUser.js
// Maps a Supabase auth.uid() to a SnapTrade user + secret, registering on
// first use. The secret is written to snaptrade_users, which has RLS enabled
// and no policy, so it is readable only by the service role.
import { serviceClient } from './supabase.js';
import { snaptradeClient } from './snaptrade.js';

export async function getOrCreateSnaptradeUser(userId) {
  const db = serviceClient();

  const existing = await db.from('snaptrade_users')
    .select('snaptrade_user_id, user_secret')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing.error) throw new Error(`Could not read SnapTrade user: ${existing.error.message}`);
  if (existing.data) {
    return {
      snaptradeUserId: existing.data.snaptrade_user_id,
      userSecret: existing.data.user_secret,
    };
  }

  // The Supabase uuid is used verbatim: unique and immutable, as SnapTrade
  // requires. Their docs explicitly warn against email addresses here.
  const registered = await snaptradeClient().authentication.registerSnapTradeUser({ userId });
  const userSecret = registered?.data?.userSecret;

  if (!userSecret) {
    throw new Error('SnapTrade returned no user secret at registration. Nothing was stored.');
  }

  const stored = await db.from('snaptrade_users')
    .insert({ user_id: userId, snaptrade_user_id: userId, user_secret: userSecret })
    .select('snaptrade_user_id, user_secret')
    .single();

  if (stored.error) throw new Error(`Could not store SnapTrade secret: ${stored.error.message}`);

  return { snaptradeUserId: userId, userSecret };
}
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
npx vitest run ../api/_lib/snaptradeUser.test.js
```

Expected: PASS, five cases green.

- [ ] **Step 6: Commit**

```bash
git add api/_lib/snaptrade.js api/_lib/snaptradeUser.js api/_lib/snaptradeUser.test.js
git commit -m "test: add snaptrade client and user registration

Uses the SnaptradeAuth.commercialApiKey wrapper required by sdk 12.x, and
the Supabase uuid as the SnapTrade userId since it is unique and immutable
- their docs warn against using emails. Registration that returns no
secret throws rather than storing undefined."
```

---

### Task 17: Position and activity normalization

**Files:**
- Create: `api/_lib/normalize.js`
- Test: `api/_lib/normalize.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `num(value) -> number | null`
  - `normalizePosition(position) -> { symbol, raw_symbol, description, instrument_kind, units, price, market_value, avg_purchase_price, open_pnl, currency } | null`
  - `normalizeActivity(activity) -> { external_id, symbol, amount, currency, trade_date, settlement_date, activity_type, description } | null`
  - `normalizeAccount(account) -> { snaptrade_account_id, snaptrade_authorization_id, institution_name, account_name, account_number_masked, account_type, currency, total_value, sync_status }`

**This is the highest-risk code in the feature.** Verified against
`snaptrade-typescript-sdk@12.1.8`:

- `AccountPosition` is `{ instrument, units?, price?, cost_basis?, currency?, cash_equivalent?, tax_lots? }`.
- `units`, `price`, and `cost_basis` are **`string | null`** — arithmetic without parsing produces string concatenation.
- There is **no `market_value` and no `open_pnl`** on the response. Both are derived.
- `instrument` is discriminated on `kind` across ten values: `adr`, `cef`, `cfd`, `crypto`, `etf`, `future`, `mutualfund`, `option`, `other`, `stock`.
- Most kinds carry `{ id, symbol, raw_symbol, description?, currency?, exchange? }`, but **`option` has no `raw_symbol`** and instead carries `option_type`, `strike_price`, `expiration_date`, `multiplier`, `underlying`.

- [ ] **Step 1: Write the failing test**

```js
// api/_lib/normalize.test.js
import { describe, it, expect } from 'vitest';
import { num, normalizePosition, normalizeActivity, normalizeAccount } from './normalize.js';

const stock = (over = {}) => ({
  instrument: { kind: 'stock', id: 'i1', symbol: 'HDIV.TO', raw_symbol: 'HDIV',
                description: 'Hamilton Enhanced', currency: 'CAD', exchange: 'TSX' },
  units: '100', price: '15.00', cost_basis: '1400.00', currency: 'CAD',
  ...over,
});

describe('num', () => {
  it('parses the string numerics SnapTrade returns', () => {
    expect(num('100')).toBe(100);
    expect(num('15.005')).toBeCloseTo(15.005, 6);
    expect(num('-3.5')).toBeCloseTo(-3.5, 6);
  });

  it('returns null for null, undefined, and empty string', () => {
    expect(num(null)).toBeNull();
    expect(num(undefined)).toBeNull();
    expect(num('')).toBeNull();
  });

  it('returns null rather than NaN for junk', () => {
    expect(num('abc')).toBeNull();
    expect(num({})).toBeNull();
  });

  it('accepts real numbers unchanged', () => {
    expect(num(42)).toBe(42);
    expect(num(0)).toBe(0);
  });
});

describe('normalizePosition', () => {
  it('derives market_value as units x price, not string concatenation', () => {
    const result = normalizePosition(stock());
    expect(result.market_value).toBe(1500);          // not "10015.00"
    expect(typeof result.market_value).toBe('number');
  });

  it('derives open_pnl as market_value minus cost_basis', () => {
    expect(normalizePosition(stock()).open_pnl).toBeCloseTo(100, 6);   // 1500 - 1400
  });

  it('derives avg_purchase_price as cost_basis divided by units', () => {
    expect(normalizePosition(stock()).avg_purchase_price).toBeCloseTo(14, 6);
  });

  it('carries the instrument kind through', () => {
    expect(normalizePosition(stock()).instrument_kind).toBe('stock');
    expect(normalizePosition({ ...stock(), instrument: { ...stock().instrument, kind: 'etf' } }).instrument_kind).toBe('etf');
  });

  it.each(['adr', 'cef', 'cfd', 'crypto', 'etf', 'future', 'mutualfund', 'other', 'stock'])(
    'normalizes a %s position without throwing',
    (kind) => {
      const result = normalizePosition({
        instrument: { kind, id: 'i', symbol: 'SYM', raw_symbol: 'SYM' },
        units: '10', price: '5', cost_basis: '40', currency: 'USD',
      });
      expect(result).toMatchObject({ symbol: 'SYM', instrument_kind: kind, units: 10, market_value: 50 });
    }
  );

  it('handles an option position, which has no raw_symbol', () => {
    const result = normalizePosition({
      instrument: {
        kind: 'option', id: 'o1', symbol: 'HDIV 20261218C15',
        option_type: 'CALL', strike_price: '15', expiration_date: '2026-12-18',
        multiplier: '100', underlying: { symbol: 'HDIV' },
      },
      units: '2', price: '1.25', cost_basis: '200', currency: 'CAD',
    });
    expect(result.symbol).toBe('HDIV 20261218C15');
    expect(result.raw_symbol).toBe('HDIV 20261218C15');   // falls back to symbol
    expect(result.instrument_kind).toBe('option');
  });

  it('applies the option multiplier to market value', () => {
    const result = normalizePosition({
      instrument: { kind: 'option', id: 'o', symbol: 'X', multiplier: '100' },
      units: '2', price: '1.25', cost_basis: null, currency: 'CAD',
    });
    expect(result.market_value).toBe(250);   // 2 x 1.25 x 100
  });

  it('does not apply a multiplier to non-option kinds', () => {
    const result = normalizePosition({
      instrument: { kind: 'stock', id: 's', symbol: 'X', raw_symbol: 'X', multiplier: '100' },
      units: '2', price: '1.25', cost_basis: null,
    });
    expect(result.market_value).toBeCloseTo(2.5, 6);
  });

  it('returns null market_value when price is missing, not zero', () => {
    const result = normalizePosition(stock({ price: null }));
    expect(result.market_value).toBeNull();
  });

  it('returns null open_pnl when cost_basis is missing', () => {
    expect(normalizePosition(stock({ cost_basis: null })).open_pnl).toBeNull();
  });

  it('does not divide by zero when units are zero', () => {
    const result = normalizePosition(stock({ units: '0' }));
    expect(result.avg_purchase_price).toBeNull();
    expect(Number.isFinite(result.market_value ?? 0)).toBe(true);
  });

  it('returns null for a position with no instrument', () => {
    expect(normalizePosition({ units: '1', price: '1' })).toBeNull();
    expect(normalizePosition(null)).toBeNull();
  });

  it('returns null for a position with no symbol', () => {
    expect(normalizePosition({ instrument: { kind: 'stock', id: 'x' }, units: '1' })).toBeNull();
  });

  it('defaults currency to CAD when absent', () => {
    expect(normalizePosition(stock({ currency: null })).currency).toBe('CAD');
  });

  it('prefers the instrument currency when the position has none', () => {
    const result = normalizePosition({
      instrument: { kind: 'stock', id: 's', symbol: 'X', raw_symbol: 'X', currency: 'USD' },
      units: '1', price: '1', currency: null,
    });
    expect(result.currency).toBe('USD');
  });

  it('treats an unknown future kind as other rather than throwing', () => {
    const result = normalizePosition({
      instrument: { kind: 'somethingnew', id: 'x', symbol: 'X' }, units: '1', price: '2',
    });
    expect(result.instrument_kind).toBe('other');
  });
});

describe('normalizeActivity', () => {
  const dividend = {
    id: 'act-1', type: 'DIVIDEND', amount: '198.40', currency: { code: 'CAD' },
    trade_date: '2026-05-21T00:00:00Z', settlement_date: '2026-05-23T00:00:00Z',
    symbol: { symbol: 'HDIV.TO' }, description: 'Cash dividend',
  };

  it('normalizes a dividend activity', () => {
    expect(normalizeActivity(dividend)).toMatchObject({
      external_id: 'act-1', symbol: 'HDIV.TO', amount: 198.4,
      currency: 'CAD', trade_date: '2026-05-21', activity_type: 'DIVIDEND',
    });
  });

  it('trims timestamps to a date for the date columns', () => {
    expect(normalizeActivity(dividend).settlement_date).toBe('2026-05-23');
  });

  it('accepts a plain string symbol as well as an object', () => {
    expect(normalizeActivity({ ...dividend, symbol: 'ZWQT.TO' }).symbol).toBe('ZWQT.TO');
  });

  it('accepts a plain string currency', () => {
    expect(normalizeActivity({ ...dividend, currency: 'USD' }).currency).toBe('USD');
  });

  it('allows a null symbol, which the docs say happens for non-security activity', () => {
    expect(normalizeActivity({ ...dividend, symbol: null }).symbol).toBeNull();
  });

  it('returns null without an id, since external_id is the idempotency key', () => {
    expect(normalizeActivity({ ...dividend, id: null })).toBeNull();
  });

  it('returns null when the amount is not a number', () => {
    expect(normalizeActivity({ ...dividend, amount: 'n/a' })).toBeNull();
  });

  it('returns null for null input', () => {
    expect(normalizeActivity(null)).toBeNull();
  });
});

describe('normalizeAccount', () => {
  it('maps account fields and masks the account number', () => {
    const result = normalizeAccount({
      id: 'acc-1', brokerage_authorization: 'auth-1', name: 'Questrade TFSA',
      number: 'Q6542138443', institution_name: 'Questrade',
      sync_status: { transactions_first_sync_completed: true },
      balance: { total: { amount: '72450.20', currency: 'CAD' } },
      raw_type: 'TFSA',
    });
    expect(result).toMatchObject({
      snaptrade_account_id: 'acc-1',
      snaptrade_authorization_id: 'auth-1',
      institution_name: 'Questrade',
      account_name: 'Questrade TFSA',
      total_value: 72450.2,
      currency: 'CAD',
    });
    expect(result.account_number_masked).toBe('••••8443');
  });

  it('does not store the full account number anywhere', () => {
    const result = normalizeAccount({ id: 'a', number: 'Q6542138443' });
    expect(JSON.stringify(result)).not.toContain('6542138');
  });

  it('survives a missing balance and number', () => {
    const result = normalizeAccount({ id: 'a' });
    expect(result.total_value).toBeNull();
    expect(result.account_number_masked).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd robo-advisor && npx vitest run ../api/_lib/normalize.test.js
```

Expected: FAIL — cannot resolve `./normalize.js`.

- [ ] **Step 3: Implement `normalize.js`**

```js
// api/_lib/normalize.js
// Converts SnapTrade API shapes into our row shapes.
//
// Verified against snaptrade-typescript-sdk@12.1.8:
//  - AccountPosition.units / .price / .cost_basis are `string | null`.
//    Every one goes through num() — "100" * "15" would otherwise concatenate.
//  - There is no market_value and no open_pnl on the response. Both derived.
//  - instrument is discriminated on `kind` across ten values, and `option`
//    carries no raw_symbol.

const KNOWN_KINDS = new Set([
  'adr', 'cef', 'cfd', 'crypto', 'etf', 'future', 'mutualfund', 'option', 'other', 'stock',
]);

export function num(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

// Currency arrives either as { code } or as a bare string depending on endpoint.
function currencyCode(value) {
  if (!value) return null;
  if (typeof value === 'string') return value.toUpperCase();
  if (typeof value.code === 'string') return value.code.toUpperCase();
  return null;
}

// Symbols likewise arrive either nested or bare.
function symbolText(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value.symbol === 'string') return value.symbol;
  if (value.symbol && typeof value.symbol.symbol === 'string') return value.symbol.symbol;
  return null;
}

function dateOnly(value) {
  if (!value) return null;
  const text = String(value);
  return text.length >= 10 ? text.slice(0, 10) : null;
}

export function normalizePosition(position) {
  if (!position || !position.instrument) return null;

  const instrument = position.instrument;
  const symbol = symbolText(instrument);
  if (!symbol) return null;

  const kind = KNOWN_KINDS.has(instrument.kind) ? instrument.kind : 'other';

  const units = num(position.units);
  const price = num(position.price);
  const costBasis = num(position.cost_basis);

  // Options are quoted per share but held in contracts.
  const multiplier = kind === 'option' ? (num(instrument.multiplier) ?? 1) : 1;

  const marketValue = units !== null && price !== null
    ? units * price * multiplier
    : null;

  const avgPurchasePrice = costBasis !== null && units !== null && units !== 0
    ? costBasis / units
    : null;

  const openPnl = marketValue !== null && costBasis !== null
    ? marketValue - costBasis
    : null;

  return {
    symbol,
    // option instruments carry no raw_symbol, so fall back to symbol.
    raw_symbol: instrument.raw_symbol || symbol,
    description: instrument.description ?? null,
    instrument_kind: kind,
    units,
    price,
    market_value: marketValue,
    avg_purchase_price: avgPurchasePrice,
    open_pnl: openPnl,
    currency: currencyCode(position.currency) || currencyCode(instrument.currency) || 'CAD',
  };
}

export function normalizeActivity(activity) {
  if (!activity) return null;

  const externalId = activity.id;
  if (!externalId) return null;                 // external_id is the idempotency key

  const amount = num(activity.amount);
  if (amount === null) return null;

  return {
    external_id: String(externalId),
    symbol: symbolText(activity.symbol),        // null for non-security activity, per the docs
    amount,
    currency: currencyCode(activity.currency),
    trade_date: dateOnly(activity.trade_date),
    settlement_date: dateOnly(activity.settlement_date),
    activity_type: activity.type ?? null,
    description: activity.description ?? null,
  };
}

export function normalizeAccount(account) {
  const number = account?.number ? String(account.number) : null;

  return {
    snaptrade_account_id: account?.id ?? null,
    snaptrade_authorization_id: account?.brokerage_authorization ?? null,
    institution_name: account?.institution_name ?? null,
    account_name: account?.name ?? null,
    // Only the last four digits are stored — nothing needs the rest.
    account_number_masked: number ? `••••${number.slice(-4)}` : null,
    account_type: account?.raw_type ?? account?.account_type ?? null,
    currency: currencyCode(account?.balance?.total?.currency) || 'CAD',
    total_value: num(account?.balance?.total?.amount),
    sync_status: account?.sync_status?.transactions_first_sync_completed === false
      ? 'SYNCING'
      : 'OK',
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run ../api/_lib/normalize.test.js
```

Expected: PASS. The `market_value` assertion of `1500` (not `"10015.00"`) is the one that matters
most — if it fails, a `num()` call is missing.

- [ ] **Step 5: Commit**

```bash
git add api/_lib/normalize.js api/_lib/normalize.test.js
git commit -m "test: add snaptrade position and activity normalization

SnapTrade returns units, price, and cost_basis as strings and omits
market_value and open_pnl entirely, so both are derived through num().
Covers all ten instrument kinds, the option multiplier, and option's
missing raw_symbol. Account numbers are stored masked to the last four."
```

---

### Task 18: Connection portal login URL endpoint

**Files:**
- Create: `api/snaptrade/login-url.js`
- Test: `api/snaptrade/login-url.test.js`

**Interfaces:**
- Consumes: `requireUser` (Task 12), `getOrCreateSnaptradeUser` (Task 16), `snaptradeClient` (Task 16), HTTP helpers (Task 12).
- Produces: `POST /api/snaptrade/login-url` → `{ redirectURI }`.

- [ ] **Step 1: Write the failing test**

```js
// api/snaptrade/login-url.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';

const requireUser = vi.fn();
const getOrCreateSnaptradeUser = vi.fn();
const loginSnapTradeUser = vi.fn();

vi.mock('../_lib/auth.js', () => ({ requireUser: (...a) => requireUser(...a), AuthError: class extends Error {} }));
vi.mock('../_lib/snaptradeUser.js', () => ({ getOrCreateSnaptradeUser: (...a) => getOrCreateSnaptradeUser(...a) }));
vi.mock('../_lib/snaptrade.js', () => ({ snaptradeClient: () => ({ authentication: { loginSnapTradeUser } }) }));

const handler = (await import('./login-url.js')).default;

function mockRes() {
  return { statusCode: 0, headers: {}, body: null,
    status(c) { this.statusCode = c; return this; },
    setHeader(k, v) { this.headers[k] = v; return this; },
    send(b) { this.body = JSON.parse(b); return this; } };
}

describe('POST /api/snaptrade/login-url', () => {
  beforeEach(() => {
    requireUser.mockReset().mockResolvedValue({ userId: 'u1', email: 'a@b.com' });
    getOrCreateSnaptradeUser.mockReset().mockResolvedValue({ snaptradeUserId: 'u1', userSecret: 's1' });
    loginSnapTradeUser.mockReset().mockResolvedValue({ data: { redirectURI: 'https://app.snaptrade.com/x', sessionId: 'sess' } });
  });

  it('rejects a non-POST method', async () => {
    const res = mockRes();
    await handler({ method: 'GET', headers: {} }, res);
    expect(res.statusCode).toBe(405);
  });

  it('rejects an unauthenticated request', async () => {
    requireUser.mockRejectedValue(Object.assign(new Error('no'), { status: 401 }));
    const res = mockRes();
    await handler({ method: 'POST', headers: {} }, res);
    expect(res.statusCode).toBe(401);
  });

  it('returns the redirect URI', async () => {
    const res = mockRes();
    await handler({ method: 'POST', headers: {} }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.redirectURI).toBe('https://app.snaptrade.com/x');
  });

  it('requests read-only access, never trade', async () => {
    const res = mockRes();
    await handler({ method: 'POST', headers: {} }, res);
    expect(loginSnapTradeUser).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'u1', userSecret: 's1', connectionType: 'read',
    }));
  });

  it('does not pass customRedirect, since the modal uses postMessage', async () => {
    const res = mockRes();
    await handler({ method: 'POST', headers: {} }, res);
    expect(loginSnapTradeUser.mock.calls[0][0].customRedirect).toBeUndefined();
  });

  it('fails loudly when SnapTrade returns no redirectURI', async () => {
    // Both fields are optional in the SDK type, so undefined must not reach the client.
    loginSnapTradeUser.mockResolvedValue({ data: { sessionId: 'only-session' } });
    const res = mockRes();
    await handler({ method: 'POST', headers: {} }, res);
    expect(res.statusCode).toBe(502);
    expect(res.body.error).toMatch(/no connection portal/i);
  });

  it('never leaks the user secret to the client', async () => {
    const res = mockRes();
    await handler({ method: 'POST', headers: {} }, res);
    expect(JSON.stringify(res.body)).not.toContain('s1');
  });

  it('passes a reconnect authorization id through when supplied', async () => {
    const res = mockRes();
    await handler({ method: 'POST', headers: {}, body: { reconnect: 'auth-9' } }, res);
    expect(loginSnapTradeUser.mock.calls[0][0].reconnect).toBe('auth-9');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd robo-advisor && npx vitest run ../api/snaptrade/login-url.test.js
```

Expected: FAIL — cannot resolve `./login-url.js`.

- [ ] **Step 3: Implement `api/snaptrade/login-url.js`**

```js
// api/snaptrade/login-url.js
// Opens a Connection Portal session. connectionType is 'read' because this
// app never places trades — least privilege on the brokerage connection.
import { requireUser } from '../_lib/auth.js';
import { getOrCreateSnaptradeUser } from '../_lib/snaptradeUser.js';
import { snaptradeClient } from '../_lib/snaptrade.js';
import { json, fail, methodGuard } from '../_lib/http.js';

export default async function handler(req, res) {
  if (!methodGuard(req, res, ['POST'])) return;

  let user;
  try {
    user = await requireUser(req);
  } catch (err) {
    return fail(res, err.status || 401, err.message);
  }

  try {
    const { snaptradeUserId, userSecret } = await getOrCreateSnaptradeUser(user.userId);

    const request = {
      userId: snaptradeUserId,
      userSecret,
      connectionType: 'read',
      connectionPortalVersion: 'v4',
    };

    // Reconnecting a broken connection reuses its authorization id.
    if (req.body?.reconnect) request.reconnect = String(req.body.reconnect);

    // customRedirect is deliberately omitted: snaptrade-react listens for
    // postMessage instead, which needs no registered redirect URI.
    const response = await snaptradeClient().authentication.loginSnapTradeUser(request);
    const redirectURI = response?.data?.redirectURI;

    if (!redirectURI) {
      // redirectURI is optional in the SDK type, so an undefined value here
      // would silently render an empty modal.
      return fail(res, 502, 'SnapTrade returned no connection portal link. Try again shortly.');
    }

    return json(res, 200, { redirectURI });
  } catch (err) {
    const detail = err?.responseBody?.detail || err?.message || 'Unknown error';
    return fail(res, 502, `Could not open the connection portal: ${detail}`);
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run ../api/snaptrade/login-url.test.js
```

Expected: PASS, eight cases green.

- [ ] **Step 5: Commit**

```bash
git add api/snaptrade/login-url.js api/snaptrade/login-url.test.js
git commit -m "test: add connection portal login url endpoint

Requests connectionType 'read' since the app never trades. redirectURI is
optional in the SDK type, so a missing one returns 502 rather than handing
the modal an undefined link."
```

---

### Task 19: Holdings sync endpoint

**Files:**
- Create: `api/snaptrade/sync.js`
- Test: `api/snaptrade/sync.test.js`

**Interfaces:**
- Consumes: Task 12 helpers, Task 16 user resolution, Task 17 normalizers.
- Produces: `POST /api/snaptrade/sync` accepting `{ accountId? }` → `{ accounts, holdings, distributions, syncedAt }`.

**Endpoint choice.** Uses `listUserAccounts` (daily-cached, no per-call refresh charge), then per
account `getAllAccountPositions` and `getAccountActivities`. It never calls
`refreshBrokerageAuthorization`, which SnapTrade bills per call. `getUserHoldings` is not used at all —
per the SDK's own docs it returns **HTTP 410 Gone** for accounts created after 2026-05-11.

- [ ] **Step 1: Write the failing test**

```js
// api/snaptrade/sync.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';

const requireUser = vi.fn();
const listUserAccounts = vi.fn();
const getAllAccountPositions = vi.fn();
const getAccountActivities = vi.fn();
const upserts = [];

vi.mock('../_lib/auth.js', () => ({ requireUser: (...a) => requireUser(...a), AuthError: class extends Error {} }));
vi.mock('../_lib/snaptradeUser.js', () => ({
  getOrCreateSnaptradeUser: async () => ({ snaptradeUserId: 'u1', userSecret: 's1' }),
}));
vi.mock('../_lib/snaptrade.js', () => ({
  snaptradeClient: () => ({
    accountInformation: { listUserAccounts, getAllAccountPositions, getAccountActivities },
  }),
}));
vi.mock('../_lib/supabase.js', () => ({
  serviceClient: () => ({
    from(table) {
      return {
        select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: 'pf-1' }, error: null }) }) }) }),
        insert: (rows) => ({ select: () => ({ single: async () => ({ data: { id: 'pf-1' }, error: null }) }) }),
        upsert: (rows, opts) => {
          upserts.push({ table, rows, opts });
          return { select: async () => ({ data: rows, error: null }) };
        },
        delete: () => ({ eq: () => ({ not: async () => ({ error: null }) }) }),
        update: () => ({ eq: () => ({ eq: async () => ({ error: null }) }) }),
      };
    },
  }),
}));

const handler = (await import('./sync.js')).default;

function mockRes() {
  return { statusCode: 0, headers: {}, body: null,
    status(c) { this.statusCode = c; return this; },
    setHeader(k, v) { this.headers[k] = v; return this; },
    send(b) { this.body = JSON.parse(b); return this; } };
}

const ACCOUNT = {
  id: 'acc-1', brokerage_authorization: 'auth-1', name: 'Questrade TFSA',
  number: 'Q6542138443', institution_name: 'Questrade', raw_type: 'TFSA',
  balance: { total: { amount: '1500.00', currency: 'CAD' } },
};

describe('POST /api/snaptrade/sync', () => {
  beforeEach(() => {
    upserts.length = 0;
    requireUser.mockReset().mockResolvedValue({ userId: 'user-1', email: 'a@b.com' });
    listUserAccounts.mockReset().mockResolvedValue({ data: [ACCOUNT] });
    getAllAccountPositions.mockReset().mockResolvedValue({
      data: { as_of: '2026-08-21', results: [{
        instrument: { kind: 'etf', id: 'i1', symbol: 'HDIV.TO', raw_symbol: 'HDIV', currency: 'CAD' },
        units: '100', price: '15.00', cost_basis: '1400.00', currency: 'CAD',
      }] },
    });
    getAccountActivities.mockReset().mockResolvedValue({
      data: { data: [{ id: 'act-1', type: 'DIVIDEND', amount: '198.40', currency: 'CAD',
                       trade_date: '2026-05-21', symbol: 'HDIV.TO' }] },
    });
  });

  it('rejects a non-POST method', async () => {
    const res = mockRes();
    await handler({ method: 'GET', headers: {} }, res);
    expect(res.statusCode).toBe(405);
  });

  it('rejects an unauthenticated request', async () => {
    requireUser.mockRejectedValue(Object.assign(new Error('no'), { status: 401 }));
    const res = mockRes();
    await handler({ method: 'POST', headers: {}, body: {} }, res);
    expect(res.statusCode).toBe(401);
  });

  it('passes userId and userSecret on every account-information call', async () => {
    const res = mockRes();
    await handler({ method: 'POST', headers: {}, body: {} }, res);
    expect(listUserAccounts).toHaveBeenCalledWith({ userId: 'u1', userSecret: 's1' });
    expect(getAllAccountPositions).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u1', userSecret: 's1', accountId: 'acc-1' })
    );
  });

  it('requests only dividend activity', async () => {
    const res = mockRes();
    await handler({ method: 'POST', headers: {}, body: {} }, res);
    expect(getAccountActivities).toHaveBeenCalledWith(
      expect.objectContaining({ accountId: 'acc-1', type: 'DIVIDEND' })
    );
  });

  it('writes holdings with derived market value, scoped to the caller', async () => {
    const res = mockRes();
    await handler({ method: 'POST', headers: {}, body: {} }, res);
    const holdings = upserts.find(u => u.table === 'holdings');
    expect(holdings.rows[0]).toMatchObject({
      user_id: 'user-1', symbol: 'HDIV.TO', units: 100, market_value: 1500,
    });
  });

  it('upserts holdings on the unique position constraint', async () => {
    const res = mockRes();
    await handler({ method: 'POST', headers: {}, body: {} }, res);
    const holdings = upserts.find(u => u.table === 'holdings');
    expect(holdings.opts.onConflict).toBe('account_id,symbol,instrument_kind');
  });

  it('upserts distributions on external_id so re-syncs do not duplicate', async () => {
    const res = mockRes();
    await handler({ method: 'POST', headers: {}, body: {} }, res);
    const dist = upserts.find(u => u.table === 'distributions');
    expect(dist.opts.onConflict).toBe('external_id');
    expect(dist.rows[0]).toMatchObject({ external_id: 'act-1', amount: 198.4 });
  });

  it('reports counts', async () => {
    const res = mockRes();
    await handler({ method: 'POST', headers: {}, body: {} }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ accounts: 1, holdings: 1, distributions: 1 });
  });

  it('syncs only the requested account when one is named', async () => {
    listUserAccounts.mockResolvedValue({ data: [ACCOUNT, { ...ACCOUNT, id: 'acc-2' }] });
    const res = mockRes();
    await handler({ method: 'POST', headers: {}, body: { accountId: 'acc-2' } }, res);
    expect(getAllAccountPositions).toHaveBeenCalledTimes(1);
    expect(getAllAccountPositions.mock.calls[0][0].accountId).toBe('acc-2');
  });

  it('succeeds with zero accounts rather than erroring', async () => {
    listUserAccounts.mockResolvedValue({ data: [] });
    const res = mockRes();
    await handler({ method: 'POST', headers: {}, body: {} }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.accounts).toBe(0);
  });

  it('continues past one account whose positions call fails', async () => {
    listUserAccounts.mockResolvedValue({ data: [ACCOUNT, { ...ACCOUNT, id: 'acc-2' }] });
    getAllAccountPositions
      .mockRejectedValueOnce(new Error('brokerage timeout'))
      .mockResolvedValue({ data: { results: [] } });
    const res = mockRes();
    await handler({ method: 'POST', headers: {}, body: {} }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.errors).toHaveLength(1);
  });

  it('drops unnormalizable positions instead of writing nulls', async () => {
    getAllAccountPositions.mockResolvedValue({
      data: { results: [{ units: '10', price: '1' }] },   // no instrument
    });
    const res = mockRes();
    await handler({ method: 'POST', headers: {}, body: {} }, res);
    expect(res.body.holdings).toBe(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd robo-advisor && npx vitest run ../api/snaptrade/sync.test.js
```

Expected: FAIL — cannot resolve `./sync.js`.

- [ ] **Step 3: Implement `api/snaptrade/sync.js`**

```js
// api/snaptrade/sync.js
// Pulls accounts, positions, and dividend history, then upserts.
//
// Endpoint choice is deliberate:
//  - listUserAccounts returns daily-cached data with no per-call refresh
//    charge, which is what we want for a routine sync.
//  - refreshBrokerageAuthorization is never called; SnapTrade bills per call.
//  - getUserHoldings is never called; per the SDK docs it returns HTTP 410
//    Gone for customers who signed up after 2026-05-11.
import { requireUser } from '../_lib/auth.js';
import { getOrCreateSnaptradeUser } from '../_lib/snaptradeUser.js';
import { snaptradeClient } from '../_lib/snaptrade.js';
import { serviceClient } from '../_lib/supabase.js';
import { json, fail, methodGuard } from '../_lib/http.js';
import { normalizePosition, normalizeActivity, normalizeAccount } from '../_lib/normalize.js';

const DIVIDEND_MONTHS = 24;
const ACTIVITY_PAGE = 1000;

function startDate() {
  const d = new Date();
  d.setMonth(d.getMonth() - DIVIDEND_MONTHS);
  return d.toISOString().slice(0, 10);
}

async function ensurePortfolio(db, userId) {
  const existing = await db.from('portfolios')
    .select('id').eq('user_id', userId).eq('source', 'snaptrade').maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  if (existing.data) return existing.data.id;

  const created = await db.from('portfolios')
    .insert({ user_id: userId, name: 'Connected accounts', source: 'snaptrade', is_primary: true })
    .select('id').single();
  if (created.error) throw new Error(created.error.message);
  return created.data.id;
}

// Activities are paginated at 1000 by default and returned newest first.
async function allDividends(api, params) {
  const out = [];
  for (let offset = 0; ; offset += ACTIVITY_PAGE) {
    const page = await api.getAccountActivities({ ...params, offset, limit: ACTIVITY_PAGE });
    const rows = page?.data?.data ?? page?.data ?? [];
    if (!Array.isArray(rows) || rows.length === 0) break;
    out.push(...rows);
    if (rows.length < ACTIVITY_PAGE) break;
  }
  return out;
}

export default async function handler(req, res) {
  if (!methodGuard(req, res, ['POST'])) return;

  let user;
  try {
    user = await requireUser(req);
  } catch (err) {
    return fail(res, err.status || 401, err.message);
  }

  const db = serviceClient();
  const api = snaptradeClient().accountInformation;
  const onlyAccountId = req.body?.accountId ? String(req.body.accountId) : null;
  const syncedAt = new Date().toISOString();
  const errors = [];

  let holdingsWritten = 0;
  let distributionsWritten = 0;
  let accountsWritten = 0;

  try {
    const { snaptradeUserId, userSecret } = await getOrCreateSnaptradeUser(user.userId);
    const creds = { userId: snaptradeUserId, userSecret };
    const portfolioId = await ensurePortfolio(db, user.userId);

    const accountsResponse = await api.listUserAccounts(creds);
    const remoteAccounts = (accountsResponse?.data ?? [])
      .filter(a => !onlyAccountId || a.id === onlyAccountId);

    for (const remote of remoteAccounts) {
      try {
        const mapped = normalizeAccount(remote);

        const accountRow = await db.from('accounts')
          .upsert({
            ...mapped,
            user_id: user.userId,
            portfolio_id: portfolioId,
            last_synced_at: syncedAt,
          }, { onConflict: 'snaptrade_account_id' })
          .select();
        if (accountRow.error) throw new Error(accountRow.error.message);

        const accountId = accountRow.data?.[0]?.id;
        if (!accountId) throw new Error('Account upsert returned no id.');
        accountsWritten += 1;

        // ── Positions ──
        const positionsResponse = await api.getAllAccountPositions({ ...creds, accountId: remote.id });
        const positions = (positionsResponse?.data?.results ?? [])
          .map(normalizePosition)
          .filter(Boolean);

        if (positions.length > 0) {
          const written = await db.from('holdings')
            .upsert(
              positions.map(p => ({ ...p, user_id: user.userId, account_id: accountId, as_of: syncedAt })),
              { onConflict: 'account_id,symbol,instrument_kind' }
            )
            .select();
          if (written.error) throw new Error(written.error.message);
          holdingsWritten += positions.length;
        }

        // Positions the brokerage no longer reports have been closed.
        const held = positions.map(p => p.symbol);
        const pruned = await db.from('holdings')
          .delete().eq('account_id', accountId)
          .not('symbol', 'in', `(${held.map(s => `"${s}"`).join(',') || '""'})`);
        if (pruned.error) throw new Error(pruned.error.message);

        // ── Dividend history ──
        const activities = await allDividends(api, {
          ...creds, accountId: remote.id, type: 'DIVIDEND', startDate: startDate(),
        });
        const dividends = activities.map(normalizeActivity).filter(Boolean);

        if (dividends.length > 0) {
          const written = await db.from('distributions')
            .upsert(
              dividends.map(d => ({ ...d, user_id: user.userId, account_id: accountId })),
              { onConflict: 'external_id' }
            )
            .select();
          if (written.error) throw new Error(written.error.message);
          distributionsWritten += dividends.length;
        }
      } catch (err) {
        // One brokerage timing out must not abort the others.
        errors.push({ accountId: remote.id, message: err.message });
      }
    }

    return json(res, 200, {
      accounts: accountsWritten,
      holdings: holdingsWritten,
      distributions: distributionsWritten,
      syncedAt,
      errors,
    });
  } catch (err) {
    const detail = err?.responseBody?.detail || err?.message || 'Unknown error';
    return fail(res, 502, `Sync failed: ${detail}`);
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run ../api/snaptrade/sync.test.js
```

Expected: PASS, twelve cases green.

- [ ] **Step 5: Commit**

```bash
git add api/snaptrade/sync.js api/snaptrade/sync.test.js
git commit -m "test: add snaptrade holdings and dividend sync

Uses listUserAccounts plus per-account positions and activities, avoiding
both the per-call refresh charge and getUserHoldings, which returns 410
Gone for accounts created after 2026-05-11.

One brokerage failing is collected into an errors array rather than
aborting the whole sync."
```

---

### Task 20: Connections list and removal

**Files:**
- Create: `api/snaptrade/connections.js`

**Interfaces:**
- Consumes: Task 12 helpers, Task 16 user resolution.
- Produces: `GET /api/snaptrade/connections` → `{ connections }`; `DELETE /api/snaptrade/connections?id=<authorizationId>` → `{ removed: true }`.

**Verified SDK surface (12.1.8).** The `connections` namespace exposes exactly: `deleteConnection`,
`detailBrokerageAuthorization`, `disableBrokerageAuthorization`, `listBrokerageAuthorizations`,
`listBrokerageAuthorizationAccounts`, `refreshBrokerageAuthorization`, `returnRates`,
`syncBrokerageAuthorizationTransactions`. Deletion is `deleteConnection({ connectionId, userId, userSecret })`
— a `connectionId` *is* the `brokerage_authorization` id from `listUserAccounts`. Do not reach for
`removeBrokerageAuthorization`; it does not exist in this version.

- [ ] **Step 1: Implement the handler**

```js
// api/snaptrade/connections.js
import { requireUser } from '../_lib/auth.js';
import { getOrCreateSnaptradeUser } from '../_lib/snaptradeUser.js';
import { snaptradeClient } from '../_lib/snaptrade.js';
import { serviceClient } from '../_lib/supabase.js';
import { json, fail, methodGuard } from '../_lib/http.js';

export default async function handler(req, res) {
  if (!methodGuard(req, res, ['GET', 'DELETE'])) return;

  let user;
  try {
    user = await requireUser(req);
  } catch (err) {
    return fail(res, err.status || 401, err.message);
  }

  try {
    const { snaptradeUserId, userSecret } = await getOrCreateSnaptradeUser(user.userId);
    const creds = { userId: snaptradeUserId, userSecret };
    const api = snaptradeClient().connections;

    if (req.method === 'GET') {
      const response = await api.listBrokerageAuthorizations(creds);
      const connections = (response?.data ?? []).map(c => ({
        id: c.id,
        brokerage: c.brokerage?.name ?? null,
        disabled: Boolean(c.disabled),
        createdAt: c.created_date ?? null,
        updatedAt: c.updated_date ?? null,
      }));
      return json(res, 200, { connections });
    }

    // DELETE
    const authorizationId = req.query?.id;
    if (!authorizationId) return fail(res, 400, 'Missing connection id.');

    // Verified against sdk 12.1.8: the method is deleteConnection({ connectionId, ... }).
    // There is no removeBrokerageAuthorization — the Connections API exposes
    // deleteConnection, disableBrokerageAuthorization, detailBrokerageAuthorization,
    // listBrokerageAuthorizations, listBrokerageAuthorizationAccounts,
    // refreshBrokerageAuthorization, returnRates, and
    // syncBrokerageAuthorizationTransactions.
    await api.deleteConnection({ ...creds, connectionId: String(authorizationId) });

    // Local rows cascade from accounts; scope the delete to this user so a
    // service-role query can never touch someone else's data.
    const db = serviceClient();
    const removed = await db.from('accounts')
      .delete()
      .eq('user_id', user.userId)
      .eq('snaptrade_authorization_id', authorizationId);
    if (removed.error) throw new Error(removed.error.message);

    return json(res, 200, { removed: true });
  } catch (err) {
    const detail = err?.responseBody?.detail || err?.message || 'Unknown error';
    return fail(res, 502, `Connection request failed: ${detail}`);
  }
}
```

- [ ] **Step 2: Verify both methods respond**

With `vercel dev` running and signed in, from the browser console on `/app/portfolio`:

```js
const { apiGet } = await import('/src/lib/api.js');
await apiGet('/api/snaptrade/connections');
```

Expected: `{ connections: [] }` before any brokerage is linked — not an error.

- [ ] **Step 3: Commit**

```bash
git add api/snaptrade/connections.js
git commit -m "feat: add connection list and removal endpoint

The local delete is scoped by user_id as well as authorization id, since
the service-role client bypasses RLS and cannot rely on it as a backstop."
```

---

### Task 21: Connect brokerage UI

**Files:**
- Create: `robo-advisor/src/components/connect/ConnectBrokerageButton.jsx`, `ConnectionList.jsx`
- Modify: `robo-advisor/src/views/Portfolio.jsx` (replace the static linked-accounts block at ~479–512)

**Interfaces:**
- Consumes: `usePortfolio()` actions `connect`/`sync`/`disconnect`; `SnapTradeReact` from `snaptrade-react`.
- Produces: `<ConnectBrokerageButton onConnected />`, `<ConnectionList />`.

**Message contract handled by the component:** `SUCCESS { status, authorizationId }`,
`ERROR { status, errorCode, statusCode, detail }`, `ABANDONED`, `CLOSED`, `CLOSE_MODAL`. Per the docs,
*"the Connection Portal never closes a window or modal that your app created"* — so `close` must be
wired on every terminal event, not only on success.

- [ ] **Step 1: Write `ConnectBrokerageButton.jsx`**

```jsx
import { useState } from 'react';
import { SnapTradeReact } from 'snaptrade-react';
import { Link2, Loader2 } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';

const C = { hi: 'var(--text-hi)', low: 'var(--text-low)', accent: 'var(--accent)' };

export default function ConnectBrokerageButton({ onConnected, reconnectId = null, label = 'Connect a brokerage' }) {
  const { actions, isDemo } = usePortfolio();
  const [loginLink, setLoginLink] = useState(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [simulated, setSimulated] = useState(false);

  const start = async () => {
    setError(null);
    // The demo portal never requests a login URL, so demo traffic never
    // consumes SnapTrade account quota.
    if (isDemo) return setSimulated(true);

    setBusy(true);
    try {
      const { redirectURI } = await actions.connect(reconnectId);
      setLoginLink(redirectURI);
      setOpen(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const close = () => { setOpen(false); setLoginLink(null); };

  return (
    <>
      <button onClick={start} disabled={busy}
        className="flex items-center justify-center gap-2 rounded-xl text-xs font-semibold cursor-pointer active:scale-[0.98] transition-transform disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        style={{ minHeight: '44px', padding: '0 14px', background: 'rgba(245,166,35,0.12)', color: C.accent }}>
        {busy ? <Loader2 size={13} className="animate-spin" /> : <Link2 size={13} />}
        {busy ? 'Opening…' : label}
      </button>

      {error && <p role="alert" className="text-xs mt-2" style={{ color: '#DC2626' }}>{error}</p>}

      {!isDemo && (
        <SnapTradeReact
          loginLink={loginLink}
          isOpen={open}
          close={close}
          onSuccess={async (authorizationId) => {
            close();
            await actions.sync();
            onConnected?.(authorizationId);
          }}
          onError={(err) => { close(); setError(err?.detail || 'The connection could not be completed.'); }}
          onExit={close}
          contentLabel="Connect your brokerage account"
          style={{ overlay: { backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000 } }}
        />
      )}

      {simulated && <SimulatedPortal onClose={() => setSimulated(false)} />}
    </>
  );
}

// Demo-only stand-in. Shows the shape of the real flow without a network call.
function SimulatedPortal({ onClose }) {
  const BROKERS = ['Questrade', 'Wealthsimple', 'RBC Direct', 'TD Direct', 'Interactive Brokers', 'BMO InvestorLine'];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full max-w-sm rounded-3xl p-6 shadow-2xl"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <p className="text-[10px] font-bold uppercase tracking-wider mb-3"
          style={{ color: C.accent }}>Demo mode</p>
        <p className="font-semibold" style={{ color: C.hi }}>Connect a brokerage</p>
        <p className="text-xs mt-1.5 leading-relaxed" style={{ color: C.low }}>
          In the live app this opens SnapTrade's secure portal, where you pick your
          brokerage and sign in directly with them. Your credentials never touch
          PassiveIncome.
        </p>

        <div className="grid grid-cols-2 gap-2 mt-4">
          {BROKERS.map(b => (
            <div key={b} className="rounded-xl px-3 py-2.5 text-xs font-medium"
              style={{ background: 'var(--bg-subtle)', color: C.hi }}>{b}</div>
          ))}
        </div>

        <button onClick={onClose}
          className="w-full mt-5 rounded-2xl text-sm font-semibold text-white cursor-pointer active:scale-[0.98] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          style={{ minHeight: '46px', background: C.accent }}>
          Got it
        </button>
        <p className="text-[11px] text-center mt-3" style={{ color: C.low }}>
          Sign in to connect a real account.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write `ConnectionList.jsx`**

Replaces the static block currently rendering `brokerageAccounts` in `Portfolio.jsx`, adding sync,
reconnect, and remove.

```jsx
import { useState } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, Trash2, Loader2 } from 'lucide-react';
import { usePortfolio } from '../../context/PortfolioContext';
import ConnectBrokerageButton from './ConnectBrokerageButton';

const C = { hi: 'var(--text-hi)', mid: 'var(--text-mid)', low: 'var(--text-low)',
            accent: 'var(--accent)', border: 'var(--border)', subtle: 'var(--bg-subtle)' };

export default function ConnectionList() {
  const { accounts, actions, isDemo } = usePortfolio();
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);

  const run = async (id, fn) => {
    setBusyId(id); setError(null);
    try { await fn(); } catch (err) { setError(err.message); } finally { setBusyId(null); }
  };

  return (
    <div className="rounded-3xl p-5" style={{ background: 'var(--bg-card)', border: `1px solid ${C.border}` }}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.low }}>
          Connected accounts
        </p>
        <ConnectBrokerageButton label="Add account" />
      </div>

      {accounts.length === 0 ? (
        <p className="text-xs py-3" style={{ color: C.low }}>
          No accounts connected yet. Connect a brokerage to sync holdings automatically,
          or upload a holdings export.
        </p>
      ) : (
        <div className="space-y-2">
          {accounts.map(acc => {
            const broken = acc.status === 'broken';
            const busy = busyId === acc.id;
            return (
              <div key={acc.id} className="flex items-center gap-3 rounded-2xl px-3.5 py-3"
                style={{ background: C.subtle, opacity: acc.status === 'pending' ? 0.6 : 1 }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-[10px] font-bold"
                  style={{ background: 'var(--bg-card)', color: C.mid, border: `1px solid ${C.border}` }}>
                  {acc.logo}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate" style={{ color: C.hi }}>{acc.broker}</p>
                  <p className="text-[11px]" style={{ color: broken ? '#DC2626' : C.low }}>
                    {broken
                      ? 'Connection needs attention — reconnect to resume syncing'
                      : `${acc.accountType}${acc.lastImport ? ` · synced ${acc.lastImport}` : ' · not synced yet'}`}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {acc.value > 0 && (
                    <span className="text-xs font-mono font-semibold mr-1" style={{ color: C.hi }}>
                      ${acc.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  )}

                  {broken ? (
                    <ConnectBrokerageButton reconnectId={acc.authorizationId} label="Reconnect" />
                  ) : (
                    <>
                      <button onClick={() => run(acc.id, () => actions.sync(acc.id))}
                        disabled={busy || isDemo} aria-label={`Sync ${acc.broker}`}
                        className="w-11 h-11 flex items-center justify-center rounded-xl cursor-pointer disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                        style={{ color: C.mid }}>
                        {busy ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                      </button>
                      {acc.authorizationId && !isDemo && (
                        <button onClick={() => run(acc.id, () => actions.disconnect(acc.authorizationId))}
                          disabled={busy} aria-label={`Remove ${acc.broker}`}
                          className="w-11 h-11 flex items-center justify-center rounded-xl cursor-pointer disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                          style={{ color: C.low }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                      {!busy && acc.lastImport && <CheckCircle size={14} style={{ color: '#16A34A' }} />}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-xs mt-3" style={{ color: '#DC2626' }}>
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Mount it in `Portfolio.jsx`**

Replace the whole "Linked accounts" section (the block beginning with the
`{/* ── Linked accounts ── */}` comment near line 479 and ending after the "Holdings imported via
CSV" paragraph near line 511) with:

```jsx
<ConnectionList />
```

Add the import at the top: `import ConnectionList from '../components/connect/ConnectionList';`

- [ ] **Step 4: Verify the demo simulation**

At `/demo/portfolio`, click **Add account**. Expected: the demo modal appears with a "Demo mode"
label and a broker grid, and the browser network tab shows **no** request to
`/api/snaptrade/login-url`.

- [ ] **Step 5: Verify the real connection flow**

With `vercel dev` running and signed in, at `/app/portfolio` click **Add account**. Expected:
1. `POST /api/snaptrade/login-url` returns a `redirectURI`
2. The SnapTrade modal opens with the brokerage picker
3. Completing a connection fires `onSuccess`, the modal closes, `POST /api/snaptrade/sync` runs
4. The holdings table and donut populate with real positions

Then confirm the data landed:

```bash
supabase db shell --command "select institution_name, sync_status, total_value from public.accounts;"
supabase db shell --command "select symbol, units, price, market_value, instrument_kind from public.holdings order by market_value desc limit 10;"
supabase db shell --command "select count(*), min(trade_date), max(trade_date) from public.distributions;"
```

Expected: the connected account, its positions with **numeric** `market_value` (not concatenated
strings), and dividend rows spanning up to 24 months.

- [ ] **Step 6: Verify the secret never reached the browser**

In the browser devtools, inspect the `login-url` response body and search the whole JS bundle:

```bash
cd robo-advisor && npm run build && grep -rc "SNAPTRADE_CONSUMER_KEY\|user_secret\|userSecret" dist/assets/*.js | grep -v ':0' || echo "PASS: no secret references in the bundle"
```

Expected: `PASS: no secret references in the bundle`.

- [ ] **Step 7: Commit**

```bash
git add robo-advisor/src/components/connect robo-advisor/src/views/Portfolio.jsx
git commit -m "feat: add brokerage connection via the official snaptrade modal

Uses snaptrade-react so the SUCCESS/ERROR/ABANDONED/CLOSED/CLOSE_MODAL
contract is handled for us; close is wired on every terminal event because
the portal never closes a modal the app created.

The demo portal renders a simulated portal instead and never requests a
login URL, so marketing traffic consumes no SnapTrade account quota."
```

---

## Stage 7 — Hardening

### Task 22: Webhook handler

**Files:**
- Create: `api/snaptrade/webhook.js`
- Test: `api/snaptrade/webhook.test.js`

**Interfaces:**
- Consumes: `serviceClient` (Task 12).
- Produces: `POST /api/snaptrade/webhook`. Unauthenticated by design — SnapTrade calls it — but gated on `SNAPTRADE_WEBHOOK_SECRET` from Task 1.

- [ ] **Step 1: Write the failing test**

```js
// api/snaptrade/webhook.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';

const updates = [];
vi.mock('../_lib/supabase.js', () => ({
  serviceClient: () => ({
    from: (table) => ({
      update: (patch) => { updates.push({ table, patch }); return { eq: () => ({ eq: async () => ({ error: null }) }) }; },
      delete: () => ({ eq: () => ({ eq: async () => ({ error: null }) }) }),
    }),
  }),
}));
vi.mock('../_lib/env.js', () => ({
  serverEnv: () => ({}),
  requireEnv: (n) => (n === 'SNAPTRADE_WEBHOOK_SECRET' ? 'top-secret' : 'x'),
}));

const handler = (await import('./webhook.js')).default;

function mockRes() {
  return { statusCode: 0, headers: {}, body: null,
    status(c) { this.statusCode = c; return this; },
    setHeader(k, v) { this.headers[k] = v; return this; },
    send(b) { this.body = b ? JSON.parse(b) : null; return this; } };
}

describe('POST /api/snaptrade/webhook', () => {
  beforeEach(() => { updates.length = 0; });

  it('rejects a request with the wrong shared secret', async () => {
    const res = mockRes();
    await handler({ method: 'POST', headers: {}, body: { webhookSecret: 'wrong', eventType: 'CONNECTION_BROKEN' } }, res);
    expect(res.statusCode).toBe(401);
  });

  it('rejects a non-POST method', async () => {
    const res = mockRes();
    await handler({ method: 'GET', headers: {} }, res);
    expect(res.statusCode).toBe(405);
  });

  it('marks the connection broken on CONNECTION_BROKEN', async () => {
    const res = mockRes();
    await handler({ method: 'POST', headers: {}, body: {
      webhookSecret: 'top-secret', eventType: 'CONNECTION_BROKEN',
      userId: 'user-1', brokerageAuthorizationId: 'auth-1',
    } }, res);
    expect(res.statusCode).toBe(200);
    expect(updates[0]).toMatchObject({ table: 'accounts', patch: { sync_status: 'BROKEN' } });
  });

  it('clears the broken flag on CONNECTION_FIXED', async () => {
    const res = mockRes();
    await handler({ method: 'POST', headers: {}, body: {
      webhookSecret: 'top-secret', eventType: 'CONNECTION_FIXED',
      userId: 'user-1', brokerageAuthorizationId: 'auth-1',
    } }, res);
    expect(updates[0].patch.sync_status).toBe('OK');
  });

  it('acknowledges an unrecognised event without failing', async () => {
    const res = mockRes();
    await handler({ method: 'POST', headers: {}, body: {
      webhookSecret: 'top-secret', eventType: 'SOMETHING_NEW', userId: 'user-1',
    } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.handled).toBe(false);
  });

  it('acknowledges an event with no userId without writing', async () => {
    const res = mockRes();
    await handler({ method: 'POST', headers: {}, body: {
      webhookSecret: 'top-secret', eventType: 'CONNECTION_BROKEN',
    } }, res);
    expect(res.statusCode).toBe(200);
    expect(updates).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails, then implement**

```bash
cd robo-advisor && npx vitest run ../api/snaptrade/webhook.test.js
```

Expected: FAIL. Then write:

```js
// api/snaptrade/webhook.js
// SnapTrade posts connection lifecycle events here. Unauthenticated by
// nature, so it is gated on a shared secret configured in the SnapTrade
// dashboard. Always acknowledge with 200 for recognised-but-unhandled
// events — a non-2xx makes SnapTrade retry indefinitely.
import { serviceClient } from '../_lib/supabase.js';
import { requireEnv } from '../_lib/env.js';
import { json, fail, methodGuard } from '../_lib/http.js';

export default async function handler(req, res) {
  if (!methodGuard(req, res, ['POST'])) return;

  const body = req.body || {};
  let expected;
  try {
    expected = requireEnv('SNAPTRADE_WEBHOOK_SECRET');
  } catch (err) {
    return fail(res, 500, err.message);
  }

  if (body.webhookSecret !== expected) {
    return fail(res, 401, 'Invalid webhook secret.');
  }

  const { eventType, userId, brokerageAuthorizationId } = body;
  if (!userId) return json(res, 200, { handled: false, reason: 'no userId on event' });

  const db = serviceClient();

  try {
    switch (eventType) {
      case 'CONNECTION_BROKEN':
        await db.from('accounts').update({ sync_status: 'BROKEN' })
          .eq('user_id', userId).eq('snaptrade_authorization_id', brokerageAuthorizationId);
        return json(res, 200, { handled: true });

      case 'CONNECTION_FIXED':
        await db.from('accounts').update({ sync_status: 'OK' })
          .eq('user_id', userId).eq('snaptrade_authorization_id', brokerageAuthorizationId);
        return json(res, 200, { handled: true });

      case 'CONNECTION_DELETED':
        await db.from('accounts').delete()
          .eq('user_id', userId).eq('snaptrade_authorization_id', brokerageAuthorizationId);
        return json(res, 200, { handled: true });

      case 'ACCOUNT_HOLDINGS_UPDATED':
        // Flagged rather than synced inline: a webhook must return fast, and
        // the next client-side sync picks it up.
        await db.from('accounts').update({ sync_status: 'STALE' })
          .eq('user_id', userId).eq('snaptrade_authorization_id', brokerageAuthorizationId);
        return json(res, 200, { handled: true });

      default:
        return json(res, 200, { handled: false, reason: `unhandled event ${eventType}` });
    }
  } catch (err) {
    return fail(res, 500, `Webhook processing failed: ${err.message}`);
  }
}
```

- [ ] **Step 3: Run the test to verify it passes**

```bash
npx vitest run ../api/snaptrade/webhook.test.js
```

Expected: PASS, six cases green.

- [ ] **Step 4: Register the webhook**

In the SnapTrade dashboard, set the webhook URL to
`https://<your-deployment>/api/snaptrade/webhook` and the shared secret to the value of
`SNAPTRADE_WEBHOOK_SECRET`. Local development cannot receive webhooks without a tunnel; that is
acceptable — nothing in this plan's verification depends on one.

- [ ] **Step 5: Commit**

```bash
git add api/snaptrade/webhook.js api/snaptrade/webhook.test.js
git commit -m "test: add snaptrade webhook handler

Gated on a shared secret and always acknowledges recognised-but-unhandled
events with 200, since a non-2xx makes SnapTrade retry indefinitely.
ACCOUNT_HOLDINGS_UPDATED flags the account stale rather than syncing
inline, because a webhook must return promptly."
```

---

### Task 23: Empty, error, and broken-connection states

**Files:**
- Create: `robo-advisor/src/components/EmptyPortfolio.jsx`
- Modify: `robo-advisor/src/views/Portfolio.jsx`, `robo-advisor/src/views/Home.jsx`

**Interfaces:**
- Consumes: `usePortfolio()`.
- Produces: `<EmptyPortfolio onImport />`.

- [ ] **Step 1: Write `EmptyPortfolio.jsx`**

A first-run `/app` user has no holdings. An empty table reads as a broken app, so both entry points
get equal billing.

```jsx
import { Upload, Link2, TrendingUp } from 'lucide-react';
import ConnectBrokerageButton from './connect/ConnectBrokerageButton';

const C = { hi: 'var(--text-hi)', mid: 'var(--text-mid)', low: 'var(--text-low)',
            accent: 'var(--accent)', border: 'var(--border)' };

export default function EmptyPortfolio({ onImport }) {
  return (
    <div className="rounded-3xl px-6 py-10 text-center"
      style={{ background: 'var(--bg-card)', border: `1px solid ${C.border}` }}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
        style={{ background: 'rgba(245,166,35,0.12)' }}>
        <TrendingUp size={24} style={{ color: C.accent }} strokeWidth={2.5} />
      </div>

      <p className="text-lg font-bold" style={{ color: C.hi }}>Let's find your income</p>
      <p className="text-sm mt-2 max-w-xs mx-auto leading-relaxed" style={{ color: C.mid }}>
        Add your holdings and we'll show what you're earning each month and what to do next.
      </p>

      <div className="flex flex-col sm:flex-row gap-2.5 justify-center mt-7">
        <button onClick={onImport}
          className="flex items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white cursor-pointer active:scale-[0.98] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          style={{ minHeight: '48px', padding: '0 20px', background: C.accent }}>
          <Upload size={15} /> Upload holdings
        </button>

        <div className="flex justify-center">
          <ConnectBrokerageButton label="Connect a brokerage" />
        </div>
      </div>

      <p className="text-[11px] mt-6 flex items-center justify-center gap-1.5" style={{ color: C.low }}>
        <Link2 size={11} /> Connecting keeps holdings up to date automatically
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Gate the Portfolio view on emptiness**

In `Portfolio.jsx`, after the `usePortfolio()` destructure:

```jsx
const isEmpty = !loading && portfolioHoldings.length === 0;
```

Add `loading` and `error` to the destructure. Then, immediately inside the returned wrapper, before
the holdings and allocation sections:

```jsx
{error && (
  <div role="alert" className="rounded-2xl px-4 py-3 mb-4 text-xs"
    style={{ background: 'rgba(220,38,38,0.08)', color: '#B91C1C' }}>
    {error} — showing the last data we have.
  </div>
)}

{isEmpty && <EmptyPortfolio onImport={() => setShowImport(true)} />}
```

Wrap the existing holdings table, allocation donut, and distributions sections in
`{!isEmpty && ( … )}` so they are hidden until there is data. Do not alter their internals.

- [ ] **Step 3: Add the broken-connection banner to Home**

In `Home.jsx`, after the `usePortfolio()` destructure, add `accounts` and:

```jsx
const brokenAccount = accounts.find(a => a.status === 'broken');
```

Render above the income hero:

```jsx
{brokenAccount && (
  <div role="alert" className="rounded-2xl px-4 py-3 mb-4 flex items-center gap-2.5"
    style={{ background: 'rgba(220,38,38,0.08)' }}>
    <AlertCircle size={15} style={{ color: '#B91C1C' }} />
    <p className="text-xs flex-1" style={{ color: '#B91C1C' }}>
      {brokenAccount.broker} needs reconnecting — your income figures may be out of date.
    </p>
  </div>
)}
```

`AlertCircle` is already imported in `Home.jsx:2`.

- [ ] **Step 4: Verify all three states**

- Signed in with no data → `/app/portfolio` shows `EmptyPortfolio`, `/app/home` shows zeroes and no crash
- After an import → the empty state disappears, the table and donut appear
- Force a broken state and confirm both the banner and the reconnect button appear:

```bash
supabase db shell --command "update public.accounts set sync_status='BROKEN';"
```

Then reset it:

```bash
supabase db shell --command "update public.accounts set sync_status='OK';"
```

- [ ] **Step 5: Commit**

```bash
git add robo-advisor/src/components/EmptyPortfolio.jsx robo-advisor/src/views/Portfolio.jsx robo-advisor/src/views/Home.jsx
git commit -m "feat: add empty, error, and broken-connection states

A first-run /app user saw an empty table, which reads as a broken app. Both
entry points now get equal billing, sync errors keep the last known data
visible rather than blanking the portfolio, and a broken connection is
surfaced on Home where the income figure it affects lives."
```

---

### Task 24: Demo sandbox audit

**Files:**
- Create: `robo-advisor/src/context/DemoProvider.test.jsx`

**Interfaces:**
- Consumes: `DemoProvider` (Task 9).
- Produces: no exports. This is the executable guarantee behind the demo-portal invariant in Global Constraints.

- [ ] **Step 1: Write the test**

Reviewing for this by eye is exactly the kind of check that rots. Assert it instead.

```jsx
// robo-advisor/src/context/DemoProvider.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import DemoProvider from './DemoProvider';
import { usePortfolio } from './PortfolioContext';

// Any network activity at all is a failure for this provider.
const fetchSpy = vi.fn(() => Promise.reject(new Error('demo portal must not make network calls')));
vi.stubGlobal('fetch', fetchSpy);

const supabaseFrom = vi.fn();
vi.mock('../lib/supabase', () => ({
  supabase: { from: (...a) => { supabaseFrom(...a); throw new Error('demo portal must not query supabase'); } },
}));

function Probe() {
  const { isDemo, holdings, stats, actions } = usePortfolio();
  return (
    <div>
      <span data-testid="isDemo">{String(isDemo)}</span>
      <span data-testid="count">{holdings.length}</span>
      <span data-testid="total">{Math.round(stats.totalValue)}</span>
      <span data-testid="actions">{Object.keys(actions).sort().join(',')}</span>
    </div>
  );
}

describe('DemoProvider sandbox', () => {
  beforeEach(() => { fetchSpy.mockClear(); supabaseFrom.mockClear(); });

  it('serves the sample portfolio', async () => {
    render(<DemoProvider><Probe /></DemoProvider>);
    expect(screen.getByTestId('isDemo').textContent).toBe('true');
    expect(Number(screen.getByTestId('count').textContent)).toBeGreaterThan(0);
    expect(Number(screen.getByTestId('total').textContent)).toBeGreaterThan(0);
  });

  it('makes no network request while rendering', async () => {
    render(<DemoProvider><Probe /></DemoProvider>);
    await waitFor(() => expect(screen.getByTestId('isDemo')).toBeTruthy());
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('never queries supabase', () => {
    render(<DemoProvider><Probe /></DemoProvider>);
    expect(supabaseFrom).not.toHaveBeenCalled();
  });

  it('exposes the same action surface as the live provider', () => {
    render(<DemoProvider><Probe /></DemoProvider>);
    expect(screen.getByTestId('actions').textContent)
      .toBe('commitImport,connect,disconnect,previewImport,reset,sync');
  });

  it('resolves connect without a network call, so no snaptrade quota is used', async () => {
    let captured;
    function Grab() { captured = usePortfolio().actions; return null; }
    render(<DemoProvider><Grab /></DemoProvider>);
    await expect(captured.connect()).resolves.toEqual({ simulated: true });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('parses an uploaded file entirely in memory', async () => {
    let captured;
    function Grab() { captured = usePortfolio().actions; return null; }
    render(<DemoProvider><Grab /></DemoProvider>);

    const csv = 'Symbol,Quantity,Market Price\nHDIV,100,15.00\nZWQT,50,10.00\n';
    const file = new File([csv], 'holdings.csv', { type: 'text/csv' });

    const preview = await captured.previewImport(file);
    expect(preview.rows).toHaveLength(2);
    expect(preview.rows[0]).toMatchObject({ symbol: 'HDIV', units: 100, market_value: 1500 });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(supabaseFrom).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run it**

```bash
cd robo-advisor && npx vitest run src/context/DemoProvider.test.jsx
```

Expected: PASS, six cases green. If `File.arrayBuffer` is unavailable, add
`globalThis.File.prototype.arrayBuffer` via a jsdom polyfill in `vitest.config.js` `setupFiles`
rather than weakening the test.

- [ ] **Step 3: Run the whole suite and lint**

```bash
npx vitest run && npm run lint && npm run build
```

Expected: every test passes, no lint errors, build succeeds.

- [ ] **Step 4: Commit**

```bash
git add robo-advisor/src/context/DemoProvider.test.jsx
git commit -m "test: assert the demo portal writes nothing

The demo-must-not-touch-production rule is the kind of invariant that rots
under review, so it is asserted: fetch and supabase.from both throw inside
the test, and a full parse-and-preview cycle must still succeed."
```

---

## Verification checklist

Run before declaring the feature done. Every line must be *observed*, not assumed.

```bash
# 1. Unit and integration tests
cd robo-advisor && npx vitest run

# 2. Lint and production build
npm run lint && npm run build

# 3. Secrets absent from the client bundle
grep -rc "SNAPTRADE_CONSUMER_KEY\|user_secret\|userSecret\|SUPABASE_SECRET" dist/assets/*.js | grep -v ':0' \
  || echo "PASS: no secrets in bundle"

# 4. RLS still denies the secret table
cd .. && node --env-file=.env.local scripts/verify-rls.mjs

# 5. Demo portal wrote nothing
supabase db shell --command "select count(*) as holdings from public.holdings;"
```

Manual passes:

| Flow | Expected |
|---|---|
| `/` → **See the demo** | `/demo/home`, badge visible, no auth |
| `/demo/portfolio` → upload a broker CSV | preset detected, bad rows flagged and excluded, table updates, **zero** DB rows |
| `/demo/portfolio` → **Add account** | simulated portal, **no** `/api/snaptrade/login-url` request |
| `/app/portfolio` while signed out | redirects to `/login` |
| `/login` → **Continue with Google** | returns to `/app/home` |
| Hard refresh `/app/portfolio` | stays, no flash of `/login` |
| `/app/portfolio` first run | `EmptyPortfolio`, not an empty table |
| `/app/portfolio` → upload the same CSV twice | two rows, not four |
| `/app/portfolio` → connect a real brokerage | modal opens, sync runs, numeric `market_value` in the DB |
| Set `sync_status='BROKEN'` | banner on Home, **Reconnect** in the accounts list |

## Deployment notes

Not part of the task list — do these when shipping.

1. `vercel link`, then add to the Vercel project's environment variables: `SNAPTRADE_CLIENT_ID`, `SNAPTRADE_CONSUMER_KEY`, `SNAPTRADE_WEBHOOK_SECRET`, `SUPABASE_URL` (cloud), `SUPABASE_SECRET_KEY` (cloud secret key), `VITE_SUPABASE_URL` (cloud), `VITE_SUPABASE_PUBLISHABLE_KEY` (cloud publishable key).
2. `supabase link --project-ref <ref>` then `supabase db push` to apply migrations to the cloud project.
3. In the cloud Supabase dashboard, add the deployment origin to the auth redirect allow-list. Do **not** set `skip_nonce_check` there — it is a local-only workaround.
4. In the SnapTrade dashboard, set the webhook URL and shared secret.
