import { onboardingSchema, profileSchema, problemSchema } from '@pii/contracts';
import type { OnboardingPatch, ProfilePatch } from '@pii/contracts';
import type { ZodType } from 'zod';
import { getRuntime } from '../auth/runtime';
import { diagnosticRoute } from '@pii/contracts';
import { reportBrowser } from '../../app/telemetry';

export class MemberError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  schema: ZodType<T>,
  method: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const auth = getRuntime();
  const snapshot = auth.store.getSnapshot();
  if (!snapshot.session) throw new MemberError(401, 'Please sign in again.');
  try {
    const response = await fetch(`/api/v1${path}`, {
      method,
      cache: 'no-store',
      credentials: 'omit',
      headers: {
        Authorization: `Bearer ${snapshot.session.access_token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.any([
        ...(signal ? [signal] : []),
        AbortSignal.timeout(12_000),
      ]),
    });
    if (auth.store.getSnapshot().epoch !== snapshot.epoch)
      throw new MemberError(401, 'The account changed. Please try again.');
    const data: unknown = await response.json().catch(() => null);
    if (auth.store.getSnapshot().epoch !== snapshot.epoch)
      throw new MemberError(401, 'The account changed. Please try again.');
    if (!response.ok) {
      if (response.status === 401) auth.expire();
      const problem = problemSchema.safeParse(data);
      if (response.status >= 500)
        reportBrowser({
          kind: 'member_failure',
          route: diagnosticRoute(`/api/v1${path}`),
          code: 'service_unavailable',
          ...(problem.success
            ? { request_id: problem.data.error.request_id }
            : {}),
        });
      const message =
        response.status === 409
          ? 'Your saved information changed. Reload it before saving again.'
          : problem.success
            ? problem.data.error.message
            : 'The service is unavailable. Please try again.';
      throw new MemberError(response.status, message);
    }
    const result = schema.safeParse(data);
    if (!result.success)
      throw new MemberError(
        503,
        'The service returned an unexpected response. Please try again.',
      );
    return result.data;
  } catch (error) {
    if (error instanceof MemberError) throw error;
    throw new MemberError(
      503,
      'We couldn’t reach the service. Check your connection, then reload saved information before retrying.',
    );
  }
}

export async function loadIdentity(signal: AbortSignal, expectedEpoch: number) {
  if (getRuntime().store.getSnapshot().epoch !== expectedEpoch)
    throw new MemberError(401, 'The account changed. Please try again.');
  const owner = getRuntime().store.getSnapshot().session?.user.id;
  // Bootstrap only after a verified server response says this profile is absent.
  let profile;
  try {
    profile = await request('/me', profileSchema, 'GET', undefined, signal);
  } catch (error) {
    if (!(error instanceof MemberError) || error.status !== 404) throw error;
    profile = await request('/me', profileSchema, 'POST', {}, signal);
  }
  const onboarding = await request(
    '/me/onboarding',
    onboardingSchema,
    'GET',
    undefined,
    signal,
  );
  if (
    getRuntime().store.getSnapshot().epoch !== expectedEpoch ||
    profile.user_id !== owner ||
    onboarding.state.user_id !== owner
  )
    throw new MemberError(503, 'The account response could not be verified.');
  return { profile, onboarding };
}
export const saveProfile = (patch: ProfilePatch) =>
  request('/me', profileSchema, 'PATCH', patch);
export const saveOnboarding = (patch: OnboardingPatch) =>
  request('/me/onboarding', onboardingSchema, 'PATCH', patch);
