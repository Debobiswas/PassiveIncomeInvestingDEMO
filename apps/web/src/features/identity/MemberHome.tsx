import { useIdentity } from './use-identity';

export function MemberHome() {
  const { identity } = useIdentity();
  return (
    <section className="auth-panel">
      <p className="eyebrow">Account setup complete</p>
      <h1>Welcome, {identity.profile.display_name}</h1>
      <p>Your account preferences and acknowledgement are saved.</p>
      <h2>Your workspace is ready for the next step</h2>
      <p>
        Portfolio tools are still being built. No brokerage is connected and no
        holdings, balances or income estimates are shown here.
      </p>
      <p className="field-help">
        Display preference: {identity.profile.display_currency}. No money has
        been converted or invested.
      </p>
    </section>
  );
}
