import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getRuntime } from './runtime';

export function Callback() {
  const navigate = useNavigate();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    void getRuntime()
      .completeCallback(new URL(window.location.href))
      .then(
        (next) => {
          if (active) void navigate(next, { replace: true });
        },
        () => {
          if (active) setFailed(true);
        },
      );
    return () => {
      active = false;
    };
  }, [navigate]);
  return (
    <section className="auth-panel">
      <h1>
        {failed ? 'We couldn’t finish signing you in' : 'Finishing sign-in'}
      </h1>
      {failed ? (
        <>
          <p role="alert">
            This link may be expired, already used, or opened in a different
            browser. Google consent may also have been cancelled. Start again in
            the browser where you requested the link.
          </p>
          <Link className="primary-link" to="/login">
            Back to sign in
          </Link>
          <Link className="secondary-link" to="/login?mode=reset">
            Request a new reset link
          </Link>
        </>
      ) : (
        <p role="status">Checking your secure sign-in link…</p>
      )}
    </section>
  );
}
