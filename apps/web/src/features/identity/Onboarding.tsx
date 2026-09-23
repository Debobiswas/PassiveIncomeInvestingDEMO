import { useRef, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { profilePatchSchema } from '@pii/contracts';
import type { Profile } from '@pii/contracts';
import { returnPath } from '../auth/policy';
import { saveOnboarding, saveProfile, MemberError } from './client';
import { useIdentity } from './use-identity';

export function Onboarding() {
  const { identity, reload } = useIdentity();
  const [params] = useSearchParams();
  const [editing, setEditing] = useState(false);
  const next =
    returnPath(params.get('next')) === '/app/onboarding'
      ? '/app/home'
      : returnPath(params.get('next'));
  if (identity.onboarding.state.completed_at)
    return <Navigate to={next} replace />;
  const ready =
    !!identity.profile.display_name &&
    !!identity.profile.country &&
    !!identity.profile.display_currency &&
    !editing;
  return (
    <section className="auth-panel">
      <p className="eyebrow">{ready ? 'Step 2 of 2' : 'Step 1 of 2'}</p>
      <h1>{ready ? 'Before you begin' : 'Make yourself at home'}</h1>
      <p>
        Your progress is saved after each step. You can sign out and continue
        later.
      </p>
      {ready ? (
        <>
          <p>
            Your saved preferences: {identity.profile.display_name},{' '}
            {identity.profile.country}, {identity.profile.display_currency}.
          </p>
          <button className="secondary-link" onClick={() => setEditing(true)}>
            Edit my details
          </button>
          <Disclosure key={identity.onboarding.state.revision} />
        </>
      ) : (
        <ProfileForm
          key={identity.profile.revision}
          profile={identity.profile}
          reload={reload}
          onSaved={() => setEditing(false)}
        />
      )}
    </section>
  );
}

function ProfileForm({
  profile,
  reload,
  onSaved,
}: {
  profile: Profile;
  reload: () => Promise<unknown>;
  onSaved: () => void;
}) {
  const [name, setName] = useState(profile.display_name ?? '');
  const [country, setCountry] = useState(profile.country ?? '');
  const [currency, setCurrency] = useState(profile.display_currency ?? '');
  const [busy, setBusy] = useState(false);
  const working = useRef(false);
  const [error, setError] = useState('');
  const [mustReload, setMustReload] = useState(false);
  return (
    <>
      <form
        aria-busy={busy}
        onSubmit={(event) => {
          event.preventDefault();
          if (working.current || mustReload) return;
          const parsed = profilePatchSchema.safeParse({
            expected_revision: profile.revision,
            display_name: name.trim(),
            country: country.trim().toUpperCase(),
            display_currency: currency,
          });
          if (!parsed.success) {
            setError(
              'Enter a name of 1–80 characters, a two-letter country code, and a display currency.',
            );
            return;
          }
          working.current = true;
          setBusy(true);
          setError('');
          void (async () => {
            try {
              await saveProfile(parsed.data);
              await reload();
              onSaved();
            } catch (reason) {
              setError(
                reason instanceof Error
                  ? reason.message
                  : 'We couldn’t save your details.',
              );
              setMustReload(
                reason instanceof MemberError &&
                  (reason.status === 409 || reason.status >= 500),
              );
            } finally {
              working.current = false;
              setBusy(false);
            }
          })();
        }}
      >
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <fieldset disabled={busy || mustReload}>
          <label htmlFor="display-name">What should we call you?</label>
          <input
            id="display-name"
            autoComplete="nickname"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-describedby="name-help"
          />
          <p className="field-help" id="name-help">
            Your preferred name, up to 80 characters. It doesn’t need to be your
            legal name.
          </p>
          <label htmlFor="country">Country or region code</label>
          <input
            id="country"
            autoComplete="country"
            list="country-options"
            required
            pattern="[A-Za-z]{2}"
            maxLength={2}
            value={country}
            onChange={(event) => setCountry(event.target.value.toUpperCase())}
            aria-describedby="country-help"
          />
          <datalist id="country-options">
            <option value="CA">Canada</option>
            <option value="US">United States</option>
          </datalist>
          <p className="field-help" id="country-help">
            Two letters, such as CA for Canada or US for United States. This is
            not tax-residency information.
          </p>
          <label htmlFor="currency">Preferred display currency</label>
          <select
            id="currency"
            required
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
          >
            <option value="">Choose a currency</option>
            <option value="CAD">Canadian dollars (CAD)</option>
            <option value="USD">US dollars (USD)</option>
          </select>
          <button className="primary-link">
            {busy ? 'Saving…' : 'Save and continue'}
          </button>
        </fieldset>
      </form>
      {mustReload && (
        <button
          className="secondary-link"
          onClick={() =>
            void reload()
              .then(() => {
                setMustReload(false);
                setError('');
              })
              .catch(() =>
                setError(
                  'We couldn’t reload. Check your connection and try again.',
                ),
              )
          }
        >
          Reload saved information
        </button>
      )}
    </>
  );
}

function Disclosure() {
  const { identity, reload } = useIdentity();
  const { state, disclosure } = identity.onboarding;
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const working = useRef(false);
  const [error, setError] = useState('');
  const acknowledged =
    !!disclosure &&
    state.disclosure_version === disclosure.version &&
    !!state.acknowledged_at;
  return (
    <>
      {!disclosure ? (
        <p className="form-notice" role="status">
          Your details are saved. The educational disclosure is awaiting
          approval, so account setup cannot be completed yet. Please check back
          later.
        </p>
      ) : (
        <>
          <h2>Educational disclosure</h2>
          <p className="field-help">Version {disclosure.version}</p>
          <div className="disclosure-body">{disclosure.body}</div>
          {acknowledged ? (
            <p role="status">Your acknowledgement is saved.</p>
          ) : (
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={checked}
                disabled={busy}
                onChange={(event) => setChecked(event.target.checked)}
              />
              I have read and acknowledge this educational disclosure.
            </label>
          )}
          <button
            className="primary-link"
            disabled={busy || !!error || (!acknowledged && !checked)}
            onClick={() => {
              if (working.current) return;
              working.current = true;
              setBusy(true);
              setError('');
              void (async () => {
                try {
                  await saveOnboarding(
                    acknowledged
                      ? {
                          expected_revision: state.revision,
                          action: 'complete',
                        }
                      : {
                          expected_revision: state.revision,
                          action: 'acknowledge_disclosure',
                          disclosure_version: disclosure.version,
                        },
                  );
                  await reload();
                } catch (reason) {
                  setError(
                    reason instanceof Error
                      ? reason.message
                      : 'We couldn’t save your progress.',
                  );
                } finally {
                  working.current = false;
                  setBusy(false);
                }
              })();
            }}
          >
            {busy
              ? 'Saving…'
              : acknowledged
                ? 'Finish setup'
                : 'Save acknowledgement'}
          </button>
        </>
      )}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <button
        className="secondary-link"
        disabled={busy}
        onClick={() =>
          void reload()
            .then(() => setError(''))
            .catch(() => setError('We couldn’t reload. Please try again.'))
        }
      >
        Reload saved information
      </button>
    </>
  );
}
