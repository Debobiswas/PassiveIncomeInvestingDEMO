import { QueryClientProvider } from '@tanstack/react-query';
import { Link, Outlet } from 'react-router-dom';
import { runtime, getRuntime } from './runtime';
import { useAuth } from './use-auth';
import './auth.css';

function ConfiguredLayout() {
  const auth = useAuth();
  if (auth.status === 'loading')
    return (
      <section className="auth-panel">
        <h1>Restoring your session</h1>
        <p role="status">Please wait…</p>
      </section>
    );
  if (auth.status === 'error')
    return (
      <section className="auth-panel">
        <h1>We couldn’t restore your session</h1>
        <p role="alert">{auth.notice}</p>
        <button
          className="primary-link"
          onClick={() => void getRuntime().restore()}
        >
          Retry session
        </button>
        <Link to="/">Return to the preview</Link>
      </section>
    );
  return (
    <QueryClientProvider client={getRuntime().queries}>
      <Outlet key={auth.epoch} />
    </QueryClientProvider>
  );
}

export function AuthLayout() {
  if (!runtime)
    return (
      <section className="auth-panel">
        <h1>Member access is not configured</h1>
        <p>
          The local sign-in service needs its public configuration. No private
          account data has been loaded.
        </p>
        <Link className="primary-link" to="/">
          Return to the preview
        </Link>
      </section>
    );
  return <ConfiguredLayout />;
}
