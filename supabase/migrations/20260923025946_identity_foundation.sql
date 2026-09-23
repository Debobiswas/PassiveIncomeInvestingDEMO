set local check_function_bodies = off;

-- Generated from a verified isolated local database, then reviewed/hardened.
-- Never overlay the separate feature branch's public-table prototype blindly.
do $$ begin
  if to_regclass('public.profiles') is not null then
    raise exception 'Legacy public.profiles detected: reconcile migration history before applying this baseline';
  end if;
end $$;
revoke create on schema public from public, anon, authenticated;
alter default privileges in schema public revoke execute on functions from public;

create schema "private";
revoke all on schema private from public, anon, authenticated, service_role;
alter default privileges in schema private revoke execute on functions from public;

create table "private"."disclosures" (
  "version"    text    not null,
  "body"       text    not null,
  "is_current" boolean not null default false,
  constraint "disclosures_body_check" check (((char_length(body) >= 1) AND (char_length(body) <= 10000))),
  constraint "disclosures_pkey" primary key (version),
  constraint "disclosures_version_check" check (((char_length(version) >= 1) AND (char_length(version) <= 80)))
);

alter table "private"."disclosures"
  enable row level security;

alter table "private"."disclosures"
  force row level security;

create table "private"."onboarding" (
  "user_id"            uuid                     not null,
  "version"            integer                  not null default 1,
  "revision"           integer                  not null default 0,
  "disclosure_version" text,
  "acknowledged_at"    timestamp with time zone,
  "completed_at"       timestamp with time zone,
  constraint "onboarding_check1" check (((completed_at IS NULL) OR (acknowledged_at IS NOT NULL))),
  constraint "onboarding_check" check (((disclosure_version IS NULL) = (acknowledged_at IS NULL))),
  constraint "onboarding_pkey" primary key (user_id),
  constraint "onboarding_revision_check" check ((revision >= 0)),
  constraint "onboarding_version_check" check ((version = 1))
);

alter table "private"."onboarding"
  enable row level security;

alter table "private"."onboarding"
  force row level security;

create table "private"."profiles" (
  "user_id"          uuid                     not null,
  "display_name"     text,
  "country"          text,
  "display_currency" text,
  "revision"         integer                  not null default 0,
  "created_at"       timestamp with time zone not null default now(),
  "updated_at"       timestamp with time zone not null default now(),
  constraint "profiles_country_check" check (((country IS NULL) OR (country ~ '^[A-Z]{2}$'::text))),
  constraint "profiles_display_currency_check" check ((display_currency = ANY (ARRAY['CAD'::text, 'USD'::text]))),
  constraint "profiles_display_name_check"
    check
    (((display_name IS NULL) OR ((display_name = btrim(display_name)) AND ((char_length(display_name) >= 1) AND (char_length(display_name) <= 80)) AND (display_name !~
    '[[:cntrl:]]'::text)))),
  constraint "profiles_pkey" primary key (user_id),
  constraint "profiles_revision_check" check ((revision >= 0))
);

alter table "private"."profiles"
  enable row level security;

alter table "private"."profiles"
  force row level security;

create table "private"."staff_audit" (
  "id"              bigint                   generated always as identity not null,
  "subject_user_id" uuid                     not null,
  "operation"       text                     not null,
  "database_actor"  text                     not null,
  "occurred_at"     timestamp with time zone not null default now(),
  constraint "staff_audit_pkey" primary key (id)
);

alter table "private"."staff_audit"
  enable row level security;

alter table "private"."staff_audit"
  force row level security;

create table "private"."staff_memberships" (
  "user_id"    uuid                     not null,
  "role"       text                     not null,
  "granted_at" timestamp with time zone not null default now(),
  constraint "staff_memberships_pkey" primary key (user_id),
  constraint "staff_memberships_role_check" check ((role = 'admin'::text))
);

alter table "private"."staff_memberships"
  enable row level security;

alter table "private"."staff_memberships"
  force row level security;

create or replace function private.audit_staff_change()
  returns trigger
  language plpgsql
  set search_path to ''
  AS $function$
begin
  insert into private.staff_audit(subject_user_id, operation, database_actor)
  values (coalesce(new.user_id, old.user_id), tg_op, session_user);
  return coalesce(new, old);
end;
$function$;

create or replace function private.has_active_session()
  returns boolean
  language sql
  stable
  security definer
  set search_path to ''
  AS $function$
  select auth.uid() is not null
    and coalesce(auth.jwt()->>'is_anonymous', 'false') = 'false'
    and exists (
      select 1 from auth.sessions s join auth.users u on u.id = s.user_id
      where s.id = (auth.jwt()->>'session_id')::uuid and s.user_id = auth.uid()
        and (s.not_after is null or s.not_after > now())
        and u.email_confirmed_at is not null and u.deleted_at is null
        and not coalesce(u.is_anonymous, false)
        and (u.banned_until is null or u.banned_until <= now())
    );
$function$;

create or replace function private.require_actor()
  returns uuid
  language plpgsql
  stable
  set search_path to ''
  AS $function$
begin
  if not private.has_active_session() then
    raise sqlstate 'PT401' using message = 'unauthenticated';
  end if;
  return auth.uid();
end;
$function$;

create or replace function public.identity_initialize()
  returns jsonb
  language plpgsql
  set search_path to ''
  AS $function$
declare actor uuid := private.require_actor();
begin
  insert into private.profiles(user_id) values (actor) on conflict (user_id) do nothing;
  insert into private.onboarding(user_id) values (actor) on conflict (user_id) do nothing;
  return public.identity_me();
end;
$function$;

create or replace function public.identity_me()
  returns jsonb
  language plpgsql
  stable
  set search_path to ''
  AS $function$
declare actor uuid := private.require_actor(); result jsonb;
begin
  select to_jsonb(p) into result from private.profiles p where p.user_id = actor;
  if result is null then raise sqlstate 'PT404' using message = 'profile_not_initialized'; end if;
  return result;
end;
$function$;

create or replace function public.identity_onboarding()
  returns jsonb
  language plpgsql
  stable
  set search_path to ''
  AS $function$
declare actor uuid := private.require_actor(); result jsonb;
begin
  select to_jsonb(o) into result from private.onboarding o where o.user_id = actor;
  if result is null then raise sqlstate 'PT404' using message = 'profile_not_initialized'; end if;
  return jsonb_build_object('state', result, 'disclosure', (select jsonb_build_object('version', d.version, 'body', d.body) from private.disclosures d where d.is_current));
end;
$function$;

create or replace function public.identity_staff_access()
  returns jsonb
  language plpgsql
  stable
  set search_path to ''
  AS $function$
declare actor uuid := private.require_actor();
begin
  if not exists (select 1 from private.staff_memberships where user_id = actor and role = 'admin') then
    raise sqlstate 'PT403' using message = 'forbidden';
  end if;
  return jsonb_build_object('role', 'admin');
end;
$function$;

create or replace function public.identity_update_onboarding (
  patch jsonb
)
  returns jsonb
  language plpgsql
  set search_path to ''
  AS $function$
declare actor uuid := private.require_actor(); profile private.profiles; state private.onboarding; disclosure text;
begin
  if patch is null or jsonb_typeof(patch) <> 'object' or octet_length(patch::text) > 4096
    or not (patch ?& array['expected_revision','action'])
    or jsonb_typeof(patch->'expected_revision') <> 'number'
    or (patch->>'expected_revision') !~ '^[0-9]{1,9}$'
    or jsonb_typeof(patch->'action') <> 'string'
    or patch->>'action' not in ('acknowledge_disclosure','complete')
    or exists (select 1 from jsonb_object_keys(patch) k where k not in ('expected_revision','action','disclosure_version'))
    or (patch->>'action' = 'complete' and patch ? 'disclosure_version')
    or (patch->>'action' = 'acknowledge_disclosure' and (not (patch ? 'disclosure_version') or jsonb_typeof(patch->'disclosure_version') <> 'string'))
  then raise sqlstate 'PT400' using message = 'invalid_input'; end if;
  -- Consistent lock order across commands prevents completion racing profile edits.
  select * into profile from private.profiles where user_id = actor for update;
  if not found then raise sqlstate 'PT404' using message = 'profile_not_initialized'; end if;
  select * into state from private.onboarding where user_id = actor for update;
  if state.completed_at is not null and patch->>'action' = 'complete' then return public.identity_onboarding(); end if;
  if state.revision <> (patch->>'expected_revision')::integer then raise sqlstate 'PT409' using message = 'revision_conflict'; end if;
  if state.completed_at is not null then raise sqlstate 'PT409' using message = 'onboarding_complete'; end if;
  select version into disclosure from private.disclosures where is_current;
  if disclosure is null then raise sqlstate 'PT409' using message = 'disclosure_unavailable'; end if;
  if patch->>'action' = 'acknowledge_disclosure' then
    if patch->>'disclosure_version' <> disclosure then raise sqlstate 'PT409' using message = 'disclosure_changed'; end if;
    update private.onboarding set disclosure_version = disclosure, acknowledged_at = now(), revision = revision + 1 where user_id = actor;
  else
    if profile.display_name is null or profile.country is null or profile.display_currency is null or state.disclosure_version is distinct from disclosure then
      raise sqlstate 'PT409' using message = 'onboarding_incomplete';
    end if;
    update private.onboarding set completed_at = now(), revision = revision + 1 where user_id = actor;
  end if;
  return public.identity_onboarding();
end;
$function$;

create or replace function public.identity_update_profile (
  patch jsonb
)
  returns jsonb
  language plpgsql
  set search_path to ''
  AS $function$
declare actor uuid := private.require_actor(); current_profile private.profiles;
begin
  if patch is null or jsonb_typeof(patch) <> 'object' or octet_length(patch::text) > 4096
    or not (patch ? 'expected_revision')
    or jsonb_typeof(patch->'expected_revision') <> 'number'
    or (patch->>'expected_revision') !~ '^[0-9]{1,9}$'
    or not (patch ?| array['display_name','country','display_currency'])
    or exists (select 1 from jsonb_object_keys(patch) k where k not in ('expected_revision','display_name','country','display_currency'))
  then raise sqlstate 'PT400' using message = 'invalid_input'; end if;
  if (patch ? 'display_name' and (jsonb_typeof(patch->'display_name') <> 'string' or char_length(patch->>'display_name') not between 1 and 80 or patch->>'display_name' <> btrim(patch->>'display_name') or patch->>'display_name' ~ '[[:cntrl:]]'))
    or (patch ? 'country' and (jsonb_typeof(patch->'country') <> 'string' or (patch->>'country') !~ '^[A-Z]{2}$'))
    or (patch ? 'display_currency' and (jsonb_typeof(patch->'display_currency') <> 'string' or patch->>'display_currency' not in ('CAD','USD')))
  then raise sqlstate 'PT400' using message = 'invalid_input'; end if;
  select * into current_profile from private.profiles where user_id = actor for update;
  if not found then raise sqlstate 'PT404' using message = 'profile_not_initialized'; end if;
  if current_profile.revision <> (patch->>'expected_revision')::integer then raise sqlstate 'PT409' using message = 'revision_conflict'; end if;
  update private.profiles set
    display_name = coalesce(patch->>'display_name', display_name),
    country = coalesce(patch->>'country', country),
    display_currency = coalesce(patch->>'display_currency', display_currency),
    revision = revision + 1, updated_at = now() where user_id = actor;
  return public.identity_me();
end;
$function$;

alter table "private"."onboarding"
  add constraint "onboarding_disclosure_version_fkey" foreign key (disclosure_version) references private.disclosures(version);

alter table "private"."onboarding"
  add constraint "onboarding_user_id_fkey" foreign key (user_id) references private.profiles(user_id) on delete cascade;

alter table "private"."profiles"
  add constraint "profiles_user_id_fkey" foreign key (user_id) references auth.users(id) on delete cascade;

alter table "private"."staff_memberships"
  add constraint "staff_memberships_user_id_fkey" foreign key (user_id) references auth.users(id) on delete cascade;

create unique index disclosures_one_current on private.disclosures using btree (is_current)
  where is_current;

create index onboarding_disclosure_version_idx on private.onboarding using btree (disclosure_version);

create trigger staff_change_audit
  after insert or delete or update on private.staff_memberships
  for each row
  execute function private.audit_staff_change();

create policy "disclosures_select" on "private"."disclosures"
  for select
  to "authenticated"
  using ((is_current AND ( select private.has_active_session() as has_active_session)));

create policy "onboarding_insert" on "private"."onboarding"
  for insert
  to "authenticated"
  with check (((user_id = ( SELECT auth.uid() AS uid)) AND ( SELECT private.has_active_session() AS has_active_session)));

create policy "onboarding_select" on "private"."onboarding"
  for select
  to "authenticated"
  using (((user_id = ( select auth.uid() as uid)) AND ( select private.has_active_session() as has_active_session)));

create policy "onboarding_update" on "private"."onboarding"
  for update
  to "authenticated"
  using (((user_id = ( select auth.uid() as uid)) AND ( select private.has_active_session() as has_active_session)))
  with check (((user_id = ( SELECT auth.uid() AS uid)) AND ( SELECT private.has_active_session() AS has_active_session)));

create policy "profiles_insert" on "private"."profiles"
  for insert
  to "authenticated"
  with check (((user_id = ( SELECT auth.uid() AS uid)) AND ( SELECT private.has_active_session() AS has_active_session)));

create policy "profiles_select" on "private"."profiles"
  for select
  to "authenticated"
  using (((user_id = ( select auth.uid() as uid)) AND ( select private.has_active_session() as has_active_session)));

create policy "profiles_update" on "private"."profiles"
  for update
  to "authenticated"
  using (((user_id = ( select auth.uid() as uid)) AND ( select private.has_active_session() as has_active_session)))
  with check (((user_id = ( SELECT auth.uid() AS uid)) AND ( SELECT private.has_active_session() AS has_active_session)));

create policy "staff_select" on "private"."staff_memberships"
  for select
  to "authenticated"
  using (((user_id = ( select auth.uid() as uid)) AND ( select private.has_active_session() as has_active_session)));

revoke all on function "private"."audit_staff_change"() from public;

grant execute on function "private"."audit_staff_change"() to "postgres";

revoke all on function "private"."has_active_session"() from public;

grant execute on function "private"."has_active_session"() to "authenticated", "postgres";

revoke all on function "private"."require_actor"() from public;

grant execute on function "private"."require_actor"() to "authenticated", "postgres";

revoke all on function "public"."identity_initialize"() from public;

grant execute on function "public"."identity_initialize"() to "authenticated", "postgres";

revoke all on function "public"."identity_me"() from public;

grant execute on function "public"."identity_me"() to "authenticated", "postgres";

revoke all on function "public"."identity_onboarding"() from public;

grant execute on function "public"."identity_onboarding"() to "authenticated", "postgres";

revoke all on function "public"."identity_staff_access"() from public;

grant execute on function "public"."identity_staff_access"() to "authenticated", "postgres";

revoke all on function "public"."identity_update_onboarding"(jsonb) from public;

grant execute on function "public"."identity_update_onboarding"(jsonb) to "authenticated", "postgres";

revoke all on function "public"."identity_update_profile"(jsonb) from public;

grant execute on function "public"."identity_update_profile"(jsonb) to "authenticated", "postgres";

grant usage on schema "private" to "authenticated";

grant create, usage on schema "private" to "postgres";

grant select on table "private"."disclosures" to "authenticated";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "private"."disclosures" to "postgres";

grant update ("acknowledged_at") on table "private"."onboarding" to "authenticated";

grant update ("completed_at") on table "private"."onboarding" to "authenticated";

grant update ("disclosure_version") on table "private"."onboarding" to "authenticated";

grant update ("revision") on table "private"."onboarding" to "authenticated";

grant insert ("user_id") on table "private"."onboarding" to "authenticated";

grant select on table "private"."onboarding" to "authenticated";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "private"."onboarding" to "postgres";

grant update ("country") on table "private"."profiles" to "authenticated";

grant update ("display_currency") on table "private"."profiles" to "authenticated";

grant update ("display_name") on table "private"."profiles" to "authenticated";

grant update ("revision") on table "private"."profiles" to "authenticated";

grant update ("updated_at") on table "private"."profiles" to "authenticated";

grant insert ("user_id") on table "private"."profiles" to "authenticated";

grant select on table "private"."profiles" to "authenticated";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "private"."profiles" to "postgres";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "private"."staff_audit" to "postgres";

grant select on table "private"."staff_memberships" to "authenticated";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "private"."staff_memberships" to "postgres";

-- Diff generators do not reliably reproduce negative/default grants. Reassert
-- least privilege explicitly even on projects with older automatic exposure.
revoke all on all tables in schema private from public, anon, authenticated, service_role;
grant select on private.profiles, private.onboarding, private.disclosures, private.staff_memberships to authenticated;
grant insert (user_id) on private.profiles, private.onboarding to authenticated;
grant update (display_name, country, display_currency, revision, updated_at) on private.profiles to authenticated;
grant update (disclosure_version, acknowledged_at, completed_at, revision) on private.onboarding to authenticated;
revoke all on function private.audit_staff_change() from public, anon, authenticated, service_role;
revoke all on function private.has_active_session(), private.require_actor() from public, anon, service_role;
revoke all on function public.identity_me(), public.identity_initialize(), public.identity_update_profile(jsonb), public.identity_onboarding(), public.identity_update_onboarding(jsonb), public.identity_staff_access() from public, anon, service_role;
notify pgrst, 'reload schema';
