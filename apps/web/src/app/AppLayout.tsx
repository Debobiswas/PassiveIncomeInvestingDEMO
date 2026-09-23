import { useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigation } from 'react-router-dom';

export function AppLayout() {
  const location = useLocation();
  const navigation = useNavigation();
  const main = useRef<HTMLElement>(null);
  useEffect(() => {
    main.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
    document.title = `${main.current?.querySelector('h1')?.textContent ?? 'Passive Income Investing'} · PII`;
  }, [location.pathname]);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <Link className="brand" to="/">
          Passive Income Investing
        </Link>
        <span className="build-label">Development preview</span>
      </header>
      <p className="route-status" role="status" aria-live="polite">
        {navigation.state !== 'idle' ? 'Loading page…' : ''}
      </p>
      <main
        id="main"
        tabIndex={-1}
        ref={main}
        className="site-main"
        aria-busy={navigation.state !== 'idle'}
      >
        <Outlet />
      </main>
    </>
  );
}
