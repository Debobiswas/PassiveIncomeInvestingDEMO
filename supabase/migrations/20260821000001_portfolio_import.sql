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

-- ── Data API exposure ───────────────────────────────────────────────────────
-- config.toml leaves `auto_expose_new_tables` unset, which matches the current
-- cloud default: tables created here are NOT reachable through PostgREST until
-- granted explicitly. Without these grants every client request — even a user
-- reading their own row — fails with 42501 before RLS is ever consulted, and
-- the RLS proofs below would pass for the wrong reason.
--
-- anon gets nothing: no policy on any table permits it, and no grant either.
-- authenticated gets SELECT only, filtered by the policies above; all writes
-- go through the service role in the API layer, which bypasses RLS.
-- snaptrade_users is granted to nobody.
grant select on public.profiles      to authenticated;
grant update on public.profiles      to authenticated;
grant select on public.portfolios    to authenticated;
grant select on public.accounts      to authenticated;
grant select on public.holdings      to authenticated;
grant select on public.distributions to authenticated;
grant select on public.import_jobs   to authenticated;

grant all on public.profiles        to service_role;
grant all on public.snaptrade_users to service_role;
grant all on public.portfolios      to service_role;
grant all on public.accounts        to service_role;
grant all on public.holdings        to service_role;
grant all on public.distributions   to service_role;
grant all on public.import_jobs     to service_role;

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
