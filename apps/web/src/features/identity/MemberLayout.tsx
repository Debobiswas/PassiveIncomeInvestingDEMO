import { useQuery } from '@tanstack/react-query';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getRuntime } from '../auth/runtime';
import { useAuth } from '../auth/use-auth';
import { returnPath } from '../auth/policy';
import { loadIdentity } from './client';

export function MemberLayout() {
  const auth = useAuth();
  const location = useLocation();
  const result = useQuery({
    queryKey: ['identity', auth.epoch, auth.session?.user.id],
    queryFn: ({ signal }) => loadIdentity(signal, auth.epoch),
    enabled: !!auth.session && !auth.recovery,
  });
  const next = returnPath(location.pathname);
  if (!auth.session)
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  if (auth.recovery) return <Navigate to="/auth/recovery" replace />;
  const signOut = (
    <button type="button" onClick={() => void getRuntime().signOut()}>
      Sign out
    </button>
  );
  if (result.isError)
    return (
      <section className="auth-panel">
        <h1>We couldn’t load your workspace</h1>
        <p role="alert">{result.error.message}</p>
        <button className="primary-link" onClick={() => void result.refetch()}>
          Retry loading
        </button>
        {signOut}
      </section>
    );
  if (!result.data)
    return (
      <section className="auth-panel">
        <h1>Opening your workspace</h1>
        <p role="status">Loading your saved information…</p>
        {signOut}
      </section>
    );
  if (
    !result.data.onboarding.state.completed_at &&
    location.pathname !== '/app/onboarding'
  )
    return (
      <Navigate
        to={`/app/onboarding?next=${encodeURIComponent(next)}`}
        replace
      />
    );
  return (
    <>
      <div className="member-bar">
        <p>Private member workspace</p>
        {signOut}
      </div>
      <Outlet
        context={{
          identity: result.data,
          reload: () => result.refetch({ throwOnError: true }),
        }}
      />
    </>
  );
}
