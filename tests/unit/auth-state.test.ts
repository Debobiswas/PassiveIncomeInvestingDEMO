import { describe, expect, it } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import { SessionStore } from '../../apps/web/src/features/auth/session-store';
import {
  authMessage,
  publicAuthConfig,
  returnPath,
} from '../../apps/web/src/features/auth/policy';

const session = (id: string, token = 'synthetic') =>
  ({ user: { id }, access_token: token }) as Session;
describe('browser identity boundary', () => {
  it('clears cached data for a new provider session even for the same account', () => {
    const token = (marker: string) =>
      `header.${btoa(JSON.stringify({ session_id: marker }))}.signature`;
    const queries = new QueryClient();
    const store = new SessionStore(queries);
    store.set(session('a', token('session-one')));
    queries.setQueryData(['private'], { value: 'old-session' });
    const epoch = store.getSnapshot().epoch;
    store.set(session('a', token('session-two')));
    expect(store.getSnapshot().epoch).toBeGreaterThan(epoch);
    expect(queries.getQueryCache().getAll()).toHaveLength(0);
  });
  it('duplicate anonymous restoration does not remount an in-progress login form', () => {
    const store = new SessionStore(new QueryClient());
    store.set(null);
    const epoch = store.getSnapshot().epoch;
    store.set(null);
    expect(store.getSnapshot().epoch).toBe(epoch);
  });
  it.each([
    '//evil.test',
    'https://evil.test/app/home',
    '/auth/callback',
    '/login',
    '/app/home?token=secret',
    '/app/../login',
    '/app/home#secret',
    '/%2f%2fevil.test',
    null,
  ])('rejects unsafe/unsupported return destination %s', (value) => {
    expect(returnPath(value)).toBe('/app/home');
  });
  it('allows only implemented member destinations', () => {
    expect(returnPath('/app/onboarding')).toBe('/app/onboarding');
  });
  it('rejects privileged keys and insecure/noncanonical provider configuration', () => {
    for (const url of [
      'http://remote.test',
      'https://user:pass@example.test',
      'https://example.test/?key=secret',
    ])
      expect(publicAuthConfig(url, 'sb_publishable_test')).toBeNull();
    expect(
      publicAuthConfig('https://example.test', 'sb_secret_test'),
    ).toBeNull();
    expect(
      publicAuthConfig('http://127.0.0.1:55421', 'sb_publishable_test'),
    ).not.toBeNull();
  });
  it('never presents provider internals as user-facing error text', () => {
    expect(authMessage({ message: 'secret upstream details' })).not.toContain(
      'secret',
    );
    expect(authMessage({ code: 'email_not_confirmed' })).toContain('confirm');
  });
  it('retains same-account cache on refresh but clears it on switch, recovery and logout', () => {
    const queries = new QueryClient();
    const store = new SessionStore(queries);
    store.set(session('a'));
    const epoch = store.getSnapshot().epoch;
    queries.setQueryData(['identity', epoch, 'a'], { private: 'a' });
    store.set(session('a', 'refreshed'));
    expect(store.getSnapshot().epoch).toBe(epoch);
    expect(queries.getQueryCache().getAll()).toHaveLength(1);
    store.set(session('b'));
    expect(queries.getQueryCache().getAll()).toHaveLength(0);
    queries.setQueryData(['identity', 'b'], { private: 'b' });
    store.set(session('b'), true);
    expect(queries.getQueryCache().getAll()).toHaveLength(0);
    store.set(null);
    expect(store.getSnapshot().session).toBeNull();
    expect(store.getSnapshot().recovery).toBe(false);
  });
  it('cancels in-flight private reads before a new account can consume them', async () => {
    const queries = new QueryClient();
    const store = new SessionStore(queries);
    store.set(session('a'));
    let aborted = false;
    const pending = queries
      .fetchQuery({
        queryKey: ['identity', 'a'],
        queryFn: ({ signal }) =>
          new Promise((resolve) => {
            signal.addEventListener('abort', () => {
              aborted = true;
              resolve({ private: 'late-a' });
            });
          }),
      })
      .catch(() => undefined);
    store.set(session('b'));
    await pending;
    expect(aborted).toBe(true);
    expect(queries.getQueryCache().getAll()).toHaveLength(0);
  });
});
