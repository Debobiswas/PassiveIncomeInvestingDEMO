import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { authMessage } from './policy';
import { getRuntime } from './runtime';
import { useAuth } from './use-auth';

export function Recovery() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const working = useRef(false);
  const [error, setError] = useState('');
  if (!auth.session)
    return (
      <section className="auth-panel">
        <h1>Request a password reset</h1>
        <p>Use the email link in the browser where you requested it.</p>
        <Link className="primary-link" to="/login?mode=reset">
          Send a new reset link
        </Link>
      </section>
    );
  if (!auth.recovery) return <Navigate to="/app/home" replace />;
  return (
    <section className="auth-panel">
      <h1>Choose a new password</h1>
      <p>Use at least 12 characters, and don’t reuse an old password.</p>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <form
        aria-busy={busy}
        onSubmit={(event) => {
          event.preventDefault();
          if (working.current) return;
          if (password !== confirmation) {
            setError('The passwords don’t match. Please check both fields.');
            return;
          }
          working.current = true;
          setBusy(true);
          setError('');
          void (async () => {
            try {
              const { error: failure } =
                await getRuntime().client.auth.updateUser({ password });
              if (failure) throw failure;
              getRuntime().finishRecovery();
              await getRuntime().signOut();
              void navigate('/login', { replace: true });
            } catch (reason) {
              setError(authMessage(reason));
            } finally {
              working.current = false;
              setBusy(false);
              setPassword('');
              setConfirmation('');
            }
          })();
        }}
      >
        <fieldset disabled={busy}>
          <label htmlFor="new-password">New password</label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            maxLength={128}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <label htmlFor="confirm-password">Confirm new password</label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            maxLength={128}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
          <button className="primary-link">
            {busy ? 'Updating password…' : 'Update password'}
          </button>
        </fieldset>
      </form>
      <button
        className="secondary-link"
        disabled={busy}
        onClick={() => void getRuntime().signOut()}
      >
        Cancel and sign out
      </button>
    </section>
  );
}
