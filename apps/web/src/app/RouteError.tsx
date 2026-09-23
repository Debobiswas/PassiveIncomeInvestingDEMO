import { useEffect, useRef } from 'react';

export function RouteError() {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    document.title = 'Page unavailable · PII';
    heading.current?.focus();
  }, []);
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
