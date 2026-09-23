// Only implemented member destinations can be returned to after authentication.
// An allowlist avoids open redirects, callback loops and unsupported deep links.
export function returnPath(value: string | null | undefined): string {
  return value === '/app/home' || value === '/app/onboarding'
    ? value
    : '/app/home';
}

// Correlation for local logout races ONLY, never identity/authorization. The API
// verifies the JWT independently. Refresh rotates tokens but retains session_id.
export function sessionMarker(token: string | undefined): string | null {
  try {
    const payload = token?.split('.')[1];
    if (!payload) return null;
    const value: unknown = JSON.parse(
      atob(payload.replaceAll('-', '+').replaceAll('_', '/')),
    );
    return value &&
      typeof value === 'object' &&
      'session_id' in value &&
      typeof value.session_id === 'string'
      ? value.session_id
      : null;
  } catch {
    return null;
  }
}

export function authMessage(error: unknown): string {
  const code =
    error && typeof error === 'object' && 'code' in error ? error.code : '';
  if (code === 'invalid_credentials')
    return 'The email or password is incorrect. Please try again.';
  if (code === 'email_not_confirmed')
    return 'Please confirm your email before signing in. You can request a new confirmation below.';
  if (
    code === 'over_request_rate_limit' ||
    code === 'over_email_send_rate_limit'
  )
    return 'Too many attempts. Please wait a few minutes before trying again.';
  if (code === 'weak_password' || code === 'same_password')
    return 'Choose a different, stronger password with at least 12 characters.';
  return 'We couldn’t complete that request. Check your connection and try again. If a link expired, request a new one.';
}

export function publicAuthConfig(url: unknown, key: unknown) {
  if (
    typeof url !== 'string' ||
    typeof key !== 'string' ||
    !key.startsWith('sb_publishable_')
  )
    return null;
  try {
    const parsed = new URL(url);
    if (
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash ||
      parsed.pathname !== '/'
    )
      return null;
    if (
      parsed.protocol !== 'https:' &&
      !(
        parsed.protocol === 'http:' &&
        ['localhost', '127.0.0.1'].includes(parsed.hostname)
      )
    )
      return null;
    return { url: parsed.origin, key };
  } catch {
    return null;
  }
}
