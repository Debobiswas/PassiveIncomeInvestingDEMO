// Executable proof that the row-level security in
// supabase/migrations/20260821000001_portfolio_import.sql actually holds.
//
// Run: node --env-file=.env.local scripts/verify-rls.mjs
//
// It creates two throwaway users, seeds one row per table for each through the
// service role, then asserts with real client-token requests that:
//   1. an authenticated user reads exactly their own rows,
//   2. neither user can read, update, or delete the other's rows,
//   3. the anon token reads nothing at all,
//   4. snaptrade_users — which holds the SnapTrade userSecret — is unreachable
//      by every client token and readable only by the service role,
//   5. the denials are the policies talking, not just a missing GRANT —
//      `profiles` is the one table where `authenticated` holds UPDATE, so the
//      cross-user denials there come from RLS and nothing else.
//
// Querying as `postgres` or with the service key bypasses RLS and proves
// nothing, so every assertion below except the seeding and the ground-truth
// reads uses the publishable (anon) key.
//
// The throwaway users are deleted on the way out, so this is safe to re-run.
import { createClient } from '@supabase/supabase-js';

const URL = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const PUBLISHABLE = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SECRET = process.env.SUPABASE_SECRET_KEY;

if (!URL || !PUBLISHABLE || !SECRET) {
  console.error(
    'Missing env. Need VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY and ' +
    'SUPABASE_SECRET_KEY. Run with: node --env-file=.env.local scripts/verify-rls.mjs'
  );
  process.exit(1);
}

const admin = createClient(URL, SECRET, { auth: { persistSession: false } });
const PASSWORD = 'rls-verify-Password-123!';
const EMAIL_A = 'rls-verify-a@example.test';
const EMAIL_B = 'rls-verify-b@example.test';
const USER_TABLES = ['portfolios', 'accounts', 'holdings', 'distributions', 'import_jobs'];

let failures = 0;
let checks = 0;

function rowCount(data) {
  return Array.isArray(data) ? data.length : data ? 1 : 0;
}

/** Assert a client request returned exactly `expected` rows. */
function expect(label, res, expected) {
  checks += 1;
  const got = rowCount(res.data);
  const ok = got === expected;
  if (!ok) failures += 1;
  const err = res.error ? ` [${res.error.code}: ${res.error.message}]` : '';
  console.log(
    `  ${ok ? 'ok  ' : 'FAIL'}  ${label} — expected ${expected} row(s), got ${got}` +
    ` (HTTP ${res.status})${err}`
  );
  return res;
}

function assert(label, condition, detail = '') {
  checks += 1;
  if (!condition) failures += 1;
  console.log(`  ${condition ? 'ok  ' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
}

async function deleteUserByEmail(email) {
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const found = data?.users?.find((u) => u.email === email);
  if (found) await admin.auth.admin.deleteUser(found.id);
}

async function freshUser(email) {
  await deleteUserByEmail(email);
  const { data, error } = await admin.auth.admin.createUser({
    email, password: PASSWORD, email_confirm: true,
  });
  if (error) throw new Error(`could not create ${email}: ${error.message}`);
  return data.user;
}

async function signIn(email) {
  const client = createClient(URL, PUBLISHABLE, { auth: { persistSession: false } });
  const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw new Error(`could not sign in ${email}: ${error.message}`);
  return client;
}

/** Seed one row in every user-scoped table, through the service role. */
async function seed(user, tag) {
  const one = async (table, row) => {
    const { data, error } = await admin.from(table).insert({ user_id: user.id, ...row }).select().single();
    if (error) throw new Error(`seeding ${table} for ${tag} failed: ${error.code} ${error.message}`);
    return data;
  };
  const portfolio = await one('portfolios', { name: `${tag}-portfolio`, source: 'manual' });
  const account = await one('accounts', {
    portfolio_id: portfolio.id, account_name: `${tag}-account`, institution_name: `${tag}-bank`,
  });
  const holding = await one('holdings', { account_id: account.id, symbol: `${tag}SYM`, units: 10 });
  const distribution = await one('distributions', {
    // external_id is globally unique, not unique-per-user, so scope it to the
    // throwaway user id or a re-run collides with any leftover row.
    account_id: account.id, external_id: `rls-verify-${user.id}`, symbol: `${tag}SYM`, amount: 1.23,
  });
  const importJob = await one('import_jobs', {
    portfolio_id: portfolio.id, filename: `${tag}.csv`, status: 'committed',
  });
  // snaptrade_user_id is likewise globally unique.
  await one('snaptrade_users', { snaptrade_user_id: `rls-verify-${user.id}`, user_secret: `SECRET-${tag}` });
  return {
    portfolios: portfolio, accounts: account, holdings: holding,
    distributions: distribution, import_jobs: importJob,
  };
}

let userA;
let userB;
try {
  userA = await freshUser(EMAIL_A);
  userB = await freshUser(EMAIL_B);
  const rowsA = await seed(userA, 'A');
  const rowsB = await seed(userB, 'B');

  const clientA = await signIn(EMAIL_A);
  const clientB = await signIn(EMAIL_B);
  const anon = createClient(URL, PUBLISHABLE, { auth: { persistSession: false } });

  console.log('\n1. the signup trigger created a profile for each user');
  {
    const { data } = await admin.from('profiles').select('id').in('id', [userA.id, userB.id]);
    assert('profiles auto-created for both users', rowCount(data) === 2, `got ${rowCount(data)}`);
  }

  console.log('\n2. an authenticated user reads exactly their own rows');
  for (const table of USER_TABLES) {
    const res = expect(`A selects ${table}`, await clientA.from(table).select('*'), 1);
    assert(`the ${table} row A sees belongs to A`, res.data?.[0]?.user_id === userA.id);
    expect(`B selects ${table}`, await clientB.from(table).select('*'), 1);
  }

  console.log("\n3. neither user can read the other's rows, even by primary key");
  for (const table of USER_TABLES) {
    expect(`A selects B's ${table} row`, await clientA.from(table).select('*').eq('id', rowsB[table].id), 0);
    expect(`B selects A's ${table} row`, await clientB.from(table).select('*').eq('id', rowsA[table].id), 0);
  }

  console.log("\n4. neither user can update or delete the other's rows");
  for (const table of USER_TABLES) {
    expect(`A updates B's ${table} row`,
      await clientA.from(table).update({ user_id: userA.id }).eq('id', rowsB[table].id).select(), 0);
    expect(`A deletes B's ${table} row`,
      await clientA.from(table).delete().eq('id', rowsB[table].id).select(), 0);
  }
  for (const table of USER_TABLES) {
    const { data } = await admin.from(table).select('id,user_id').eq('id', rowsB[table].id);
    assert(`B's ${table} row survived intact`, data?.length === 1 && data[0].user_id === userB.id);
  }

  console.log('\n5. the anon token reads nothing, anywhere');
  for (const table of [...USER_TABLES, 'profiles', 'snaptrade_users']) {
    expect(`anon selects ${table}`, await anon.from(table).select('*'), 0);
  }

  // Sections 4 and 5 are held up by two layers at once: no policy permits the
  // write, and `authenticated` was never granted INSERT/UPDATE/DELETE either.
  // Section 6 isolates the RLS layer on its own — profiles is the one table
  // where `authenticated` does hold UPDATE, so the denials there come from the
  // policy and nothing else.
  console.log('\n6. profiles: read and update are confined to your own row (RLS alone, UPDATE is granted here)');
  expect('A selects profiles', await clientA.from('profiles').select('id'), 1);
  expect("A selects B's profile", await clientA.from('profiles').select('*').eq('id', userB.id), 0);
  expect("A updates B's profile", await clientA.from('profiles').update({ full_name: 'PWNED' }).eq('id', userB.id).select(), 0);
  expect('A updates own profile', await clientA.from('profiles').update({ full_name: 'A Real Name' }).eq('id', userA.id).select(), 1);
  expect("A reparents own profile onto B's id", await clientA.from('profiles').update({ id: userB.id }).eq('id', userA.id).select(), 0);
  {
    const { data } = await admin.from('profiles').select('full_name').eq('id', userB.id);
    assert("B's profile was not modified", data?.[0]?.full_name !== 'PWNED', JSON.stringify(data));
  }

  console.log('\n7. snaptrade_users is unreachable by any client token');
  expect('A selects snaptrade_users', await clientA.from('snaptrade_users').select('*'), 0);
  expect('A selects its own snaptrade_users row', await clientA.from('snaptrade_users').select('*').eq('user_id', userA.id), 0);
  expect('B selects snaptrade_users', await clientB.from('snaptrade_users').select('*'), 0);
  expect('anon selects snaptrade_users', await anon.from('snaptrade_users').select('*'), 0);
  expect('A updates snaptrade_users', await clientA.from('snaptrade_users').update({ user_secret: 'x' }).eq('user_id', userB.id).select(), 0);
  expect('A deletes snaptrade_users', await clientA.from('snaptrade_users').delete().eq('user_id', userB.id).select(), 0);
  expect('service_role reads snaptrade_users', await admin.from('snaptrade_users').select('*').in('user_id', [userA.id, userB.id]), 2);

} catch (err) {
  failures += 1;
  console.error(`\nverification aborted: ${err.message}`);
} finally {
  await deleteUserByEmail(EMAIL_A);
  await deleteUserByEmail(EMAIL_B);
}

console.log(
  `\n${failures === 0 ? 'PASS' : 'FAIL'}: ${checks - failures}/${checks} row-level security assertions held`
);
process.exit(failures === 0 ? 0 : 1);
