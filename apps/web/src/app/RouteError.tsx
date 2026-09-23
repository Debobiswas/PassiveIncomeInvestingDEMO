import { useEffect, useRef } from 'react';
import { diagnosticRoute } from '@pii/contracts';
import { reportBrowser } from './telemetry';
import { useRouteError } from 'react-router-dom';

export function RouteError() {
  const error = useRouteError();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    reportBrowser(
      {
        kind: 'route_failure',
        route: diagnosticRoute(window.location.pathname),
        code: 'unexpected_error',
      },
      error,
    );
    document.title = 'Page unavailable · PII';
    heading.current?.focus();
  }, [error]);
  return (
    <main className="site-main intro-panel" id="main">
      <h1 ref={heading} tabIndex={-1}>
        This page couldn’t load
      </h1>
      <p role="alert">
        Check your connection and try again. No account data has been changed.
      </p>
      <button className="primary-link" onClick={() => window.location.reload()}>
        Try again
      </button>
      <a className="secondary-link" href="/">
        Return to the preview
      </a>
    </main>
  );
}
