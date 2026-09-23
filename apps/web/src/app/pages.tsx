import { Link } from 'react-router-dom';

export function Landing() {
  return (
    <section className="intro-panel">
      <p className="eyebrow">A clearer view of your income</p>
      <h1>Passive Income Investing</h1>
      <p>
        Explore the early design for tracking investments and planning income,
        on a phone or a larger screen.
      </p>
      <p>
        This preview uses fictional sample data. Member accounts, brokerage
        connections and live advice are not available yet.
      </p>
      <Link className="primary-link" to="/demo/home">
        Explore the demo
      </Link>
      <p className="supporting-text">
        No sign-up needed. Do not enter personal or financial information.
      </p>
    </section>
  );
}

export function MemberUnavailable() {
  return (
    <section className="intro-panel">
      <h1>Member access is not available yet</h1>
      <p>
        Secure sign-in and private portfolios are still being built. No account
        or portfolio data has been loaded.
      </p>
      <Link className="primary-link" to="/">
        Return to the preview
      </Link>
    </section>
  );
}

export function NotFound() {
  return (
    <section className="intro-panel">
      <p className="eyebrow">404 · Page not found</p>
      <h1>We couldn’t find that page</h1>
      <p>
        The link may be out of date. Choose a page from the navigation or return
        to the preview.
      </p>
      <Link className="primary-link" to="/">
        Return to the preview
      </Link>
    </section>
  );
}
