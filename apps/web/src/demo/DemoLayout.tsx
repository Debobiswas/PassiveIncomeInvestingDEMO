import { NavLink, Outlet } from 'react-router-dom';

export function DemoLayout() {
  return (
    <>
      <aside className="demo-notice" aria-label="Demo notice">
        <strong>Demo only · Sample data</strong>
        <p>
          Balances, forecasts and AI replies are illustrative and unverified.
          Nothing is saved, connected or traded. Do not upload real financial
          data.
        </p>
      </aside>
      <nav className="demo-nav" aria-label="Demo navigation">
        <NavLink to="/demo/home">Home</NavLink>
        <NavLink to="/demo/portfolio">Portfolio</NavLink>
        <NavLink to="/demo/funds">Explore funds</NavLink>
        <NavLink to="/demo/plan">Plan</NavLink>
      </nav>
      <Outlet />
    </>
  );
}
