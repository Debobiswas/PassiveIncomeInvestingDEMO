import { useRef, useState } from 'react';
import {
  Link,
  Navigate,
  useSearchParams,
  useNavigation,
} from 'react-router-dom';
import { authMessage, returnPath } from './policy';
import { getRuntime } from './runtime';
import { useAuth } from './use-auth';

export function Login() {
  const auth = useAuth();
  const [params] = useSearchParams();
  const mode =
    params.get('mode') === 'signup'
      ? 'signup'
      : params.get('mode') === 'reset'
        ? 'reset'
        : 'login';
  const next = returnPath(params.get('next'));
  if (auth.session)
    return <Navigate to={auth.recovery ? '/auth/recovery' : next} replace />;
  return <LoginForm key={mode} mode={mode} next={next} notice={auth.notice} />;
}

function LoginForm({
  mode,
  next,
  notice,
}: {
  mode: 'signup' | 'reset' | 'login';
  next: string;
  notice: string;
}) {
  const auth = getRuntime();
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const working = useRef(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const run = async (operation: () => Promise<void>) => {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await operation();
    } catch (reason) {
      setError(authMessage(reason));
    } finally {
      working.current = false;
      setBusy(false);
      setPassword('');
    }
  };
  const submit = () =>
    run(async () => {
      auth.rememberReturn(next);
      if (mode === 'login') {
        const { error: failure } = await auth.client.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (failure) throw failure;
      } else if (mode === 'signup') {
        const { error: failure } = await auth.client.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: auth.callbackUrl },
        });
        if (failure) throw failure;
        setMessage(
          'Check your email. If this address can be registered, a confirmation link is on its way. Open it in this same browser; then return here to sign in if needed.',
        );
      } else {
        const { error: failure } = await auth.client.auth.resetPasswordForEmail(
          email.trim(),
          { redirectTo: auth.callbackUrl },
        );
        if (failure) throw failure;
        setMessage(
          'If an account exists for this email, a reset link is on its way. Open it in this same browser.',
        );
      }
    });
  const title =
    mode === 'signup'
      ? 'Create your account'
      : mode === 'reset'
        ? 'Reset your password'
        : 'Welcome back';
  const link = (value: string) =>
    `/login?mode=${value}&next=${encodeURIComponent(next)}`;
  return (
    <section className="auth-panel">
      <p className="eyebrow">Your private workspace</p>
      <h1>{title}</h1>
      <p>
        {mode === 'signup'
          ? 'Start with a verified email address. This development environment is not ready for real financial information.'
          : mode === 'reset'
            ? 'We’ll email you a link to choose a new password.'
            : 'Sign in to continue where you left off.'}
      </p>
      {notice && <p role="status">{notice}</p>}
      {message && (
        <p className="form-notice" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        aria-busy={busy}
      >
        <fieldset disabled={busy || navigation.state !== 'idle'}>
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            required
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          {mode !== 'reset' && (
            <>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete={
                  mode === 'signup' ? 'new-password' : 'current-password'
                }
                minLength={mode === 'signup' ? 12 : 1}
                maxLength={128}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-describedby="password-help"
              />
              <p id="password-help" className="field-help">
                {mode === 'signup'
                  ? 'Use at least 12 characters. Password managers and pasting are welcome.'
                  : 'Use the password you chose when you registered.'}
              </p>
            </>
          )}
          <button className="primary-link" type="submit">
            {busy
              ? 'Please wait…'
              : mode === 'signup'
                ? 'Create account'
                : mode === 'reset'
                  ? 'Send reset link'
                  : 'Sign in'}
          </button>
        </fieldset>
      </form>
      {mode === 'login' && (
        <>
          <button
            className="secondary-link"
            disabled={
              busy || import.meta.env.VITE_GOOGLE_AUTH_ENABLED !== 'true'
            }
            onClick={() =>
              void run(async () => {
                auth.rememberReturn(next);
                const { data, error: failure } =
                  await auth.client.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                      redirectTo: auth.callbackUrl,
                      skipBrowserRedirect: true,
                    },
                  });
                if (failure || !data.url) throw failure;
                window.location.assign(data.url);
              })
            }
          >
            Continue with Google
          </button>
          {import.meta.env.VITE_GOOGLE_AUTH_ENABLED !== 'true' && (
            <p className="field-help">
              Google sign-in is awaiting provider configuration in this
              environment.
            </p>
          )}
          <button
            className="secondary-link"
            disabled={busy || !email.trim()}
            onClick={() =>
              void run(async () => {
                auth.rememberReturn(next);
                const { error: failure } = await auth.client.auth.resend({
                  type: 'signup',
                  email: email.trim(),
                  options: { emailRedirectTo: auth.callbackUrl },
                });
                if (failure) throw failure;
                setMessage(
                  'If confirmation is needed, a new email is on its way. Open it in the browser where you registered.',
                );
              })
            }
          >
            Resend confirmation email
          </button>
        </>
      )}
      <nav className="auth-links" aria-label="Account options">
        {mode !== 'login' && <Link to={link('login')}>Back to sign in</Link>}
        {mode !== 'signup' && (
          <Link to={link('signup')}>Create an account</Link>
        )}
        {mode !== 'reset' && (
          <Link to={link('reset')}>Forgot your password?</Link>
        )}
      </nav>
    </section>
  );
}
