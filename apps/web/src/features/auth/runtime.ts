import { createClient } from '@supabase/supabase-js';
import { QueryClient } from '@tanstack/react-query';
import { publicAuthConfig, returnPath, sessionMarker } from './policy';
import type { Session } from '@supabase/supabase-js';
import { SessionStore } from './session-store';

const config = publicAuthConfig(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
);
const storageKey = config
  ? `pii-auth-${new URL(config.url).host}`
  : 'pii-auth-unconfigured';
const recoveryKey = `${storageKey}-recovery`;
const logoutKey = `${storageKey}-logout`;

function createRuntime(settings: NonNullable<typeof config>) {
  const queries = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 30_000, gcTime: 300_000 },
      mutations: { retry: false },
    },
  });
  const store = new SessionStore(queries);
  const client = createClient(settings.url, settings.key, {
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: false,
      persistSession: true,
      autoRefreshToken: true,
      storageKey,
      lockAcquireTimeout: 10_000,
    },
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          signal: AbortSignal.any([
            ...(init?.signal ? [init.signal] : []),
            AbortSignal.timeout(10_000),
          ]),
        }),
    },
  });
  const clearLocal = (notice: string, broadcast: boolean) => {
    const marker = sessionMarker(store.getSnapshot().session?.access_token);
    if (broadcast && marker) localStorage.setItem(logoutKey, marker);
    // These are keys owned by this app's configured Auth client, not all storage.
    for (const suffix of ['', '-code-verifier', '-user'])
      localStorage.removeItem(`${storageKey}${suffix}`);
    sessionStorage.removeItem(recoveryKey);
    store.set(null, false, notice);
  };
  function acceptSession(session: Session | null, recovery = false) {
    const marker = sessionMarker(session?.access_token);
    if (marker && marker === localStorage.getItem(logoutKey)) {
      // Ignore a late refresh from the logged-out session, but do not delete a
      // newer login written by another tab in the meantime.
      const saved = JSON.parse(
        localStorage.getItem(storageKey) ?? 'null',
      ) as Session | null;
      if (sessionMarker(saved?.access_token) === marker)
        localStorage.removeItem(storageKey);
      if (
        !store.getSnapshot().session ||
        sessionMarker(store.getSnapshot().session?.access_token) === marker
      )
        store.set(null, false, store.getSnapshot().notice);
      return;
    }
    store.set(session, recovery);
  }
  client.auth.onAuthStateChange((event, session) => {
    // Never await another Supabase method inside its auth callback lock.
    if (event === 'SIGNED_OUT') {
      clearLocal('', false);
      return;
    }
    if (event === 'PASSWORD_RECOVERY' && session)
      sessionStorage.setItem(recoveryKey, session.user.id);
    acceptSession(
      session,
      !!session && sessionStorage.getItem(recoveryKey) === session.user.id,
    );
  });
  window.addEventListener('storage', (event) => {
    if (event.key === logoutKey)
      clearLocal('You signed out in another tab.', false);
  });
  // Bounded restoration also covers unavailable storage/network/SDK initialization.
  async function restore() {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const result = await Promise.race([
        client.auth.getSession(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error('Session timeout')),
            12_000,
          );
        }),
      ]);
      if (result.error) throw result.error;
      acceptSession(
        result.data.session,
        !!result.data.session &&
          sessionStorage.getItem(recoveryKey) === result.data.session.user.id,
      );
    } catch {
      store.fail();
    } finally {
      clearTimeout(timer);
    }
  }
  void restore();
  async function signOut() {
    // Hide data before any network call; even an offline logout clears this device.
    // Capture the token before removing storage. The SDK's queued signOut reads
    // storage later and can otherwise miss the session it must revoke.
    const token = store.getSnapshot().session?.access_token;
    clearLocal('Signing out…', true);
    const epoch = store.getSnapshot().epoch;
    try {
      if (token) {
        const response = await fetch(
          `${settings.url}/auth/v1/logout?scope=local`,
          {
            method: 'POST',
            headers: { apikey: settings.key, Authorization: `Bearer ${token}` },
            signal: AbortSignal.timeout(10_000),
          },
        );
        if (!response.ok && ![401, 403, 404].includes(response.status))
          throw new Error('Revocation unavailable');
      }
      if (store.getSnapshot().epoch === epoch)
        clearLocal('You are signed out.', false);
    } catch {
      if (store.getSnapshot().epoch === epoch)
        clearLocal(
          'This device is signed out. We couldn’t confirm server revocation. For a lost or shared device, contact the project administrator.',
          false,
        );
    }
  }
  let callback: Promise<string> | undefined;
  function completeCallback(url: URL) {
    // One exchange per page load, including React Strict Mode's repeated effects.
    if (!callback)
      callback = (async () => {
        const next = returnPath(sessionStorage.getItem('pii-auth-return'));
        sessionStorage.removeItem('pii-auth-return');
        const hash = new URLSearchParams(url.hash.slice(1));
        const code = url.searchParams.get('code');
        // Strip credentials and untrusted provider descriptions before rendering.
        window.history.replaceState(null, '', '/auth/callback');
        if (
          url.searchParams.has('error') ||
          hash.has('error') ||
          !code ||
          code.length > 2048
        )
          throw new Error('Invalid callback');
        const { data, error } = await client.auth.exchangeCodeForSession(code);
        if (error || !data.session) throw new Error('Invalid callback');
        return store.getSnapshot().recovery ? '/auth/recovery' : next;
      })();
    return callback;
  }
  return {
    client,
    queries,
    store,
    restore,
    signOut,
    completeCallback,
    callbackUrl: `${window.location.origin}/auth/callback`,
    expire: () => clearLocal('Your session ended. Please sign in again.', true),
    finishRecovery: () => {
      sessionStorage.removeItem(recoveryKey);
      store.set(store.getSnapshot().session);
    },
    rememberReturn: (next: string) =>
      sessionStorage.setItem('pii-auth-return', returnPath(next)),
  };
}

// Missing public configuration does not break landing/demo or create fake users.
export const runtime = config ? createRuntime(config) : null;
export function getRuntime() {
  if (!runtime) throw new Error('Member access is not configured.');
  return runtime;
}
