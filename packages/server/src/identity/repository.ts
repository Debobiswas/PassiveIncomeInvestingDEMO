import { createClient, isAuthSessionMissingError } from '@supabase/supabase-js';
import {
  profileSchema,
  onboardingSchema,
  staffAccessSchema,
} from '@pii/contracts';
import type { ProfilePatch, OnboardingPatch } from '@pii/contracts';
import type { ZodType } from 'zod';
import type { ServerConfig } from '../config.ts';
import { ApiError, unauthenticated, unavailable, timeout } from '../errors.ts';

const databaseErrors: Record<string, [number, string]> = {
  PT400: [400, 'invalid_input'],
  PT401: [401, 'unauthenticated'],
  PT403: [403, 'forbidden'],
  PT404: [404, 'profile_not_initialized'],
  PT409: [409, 'state_conflict'],
};

// A fresh non-persisting client per request: never share one user's auth state.
export async function identityRepository(
  config: ServerConfig,
  token: string,
  signal: AbortSignal,
  fetcher: typeof fetch,
) {
  const client = createClient(config.supabaseUrl, config.publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: { Authorization: `Bearer ${token}` },
      fetch: async (input, init) => {
        const response = await fetcher(input, { ...init, signal });
        if (
          !response.ok &&
          !response.headers.get('content-type')?.includes('application/json')
        ) {
          // Preserve a gateway's HTTP status when the SDK expects JSON, without
          // parsing or logging a potentially sensitive HTML error page.
          await response.body?.cancel();
          return Response.json(
            { message: 'Upstream request failed.' },
            { status: response.status },
          );
        }
        return response;
      },
    },
  });
  const { data, error } = await client.auth.getUser(token);
  if (signal.aborted) throw timeout();
  if (error) {
    if (
      isAuthSessionMissingError(error) ||
      error.status === 401 ||
      error.status === 403
    )
      throw unauthenticated();
    throw unavailable();
  }
  if (!data.user || data.user.is_anonymous || !data.user.email_confirmed_at)
    throw unauthenticated();
  const actorId = data.user.id;
  if (!profileSchema.shape.user_id.safeParse(actorId).success)
    throw unavailable();
  const ownedProfile = profileSchema.refine(
    (profile) => profile.user_id === actorId,
  );
  const ownedOnboarding = onboardingSchema.refine(
    (result) => result.state.user_id === actorId,
  );

  async function rpc<T>(
    name: string,
    schema: ZodType<T>,
    args: Record<string, unknown> = {},
  ): Promise<T> {
    const response = await client.rpc(name, args).abortSignal(signal);
    if (signal.aborted) throw timeout();
    if (response.error) {
      const known = databaseErrors[response.error.code];
      if (known)
        throw new ApiError(
          known[0],
          known[1],
          known[0] === 409
            ? 'The saved state or disclosure changed. Reload before continuing.'
            : 'The requested operation is not available for this account.',
        );
      // Gateways sometimes return HTML, including on auth errors. Preserve safe
      // status semantics without returning raw upstream content or SQL messages.
      if (response.status === 401) throw unauthenticated();
      if (response.status === 403)
        throw new ApiError(403, 'forbidden', 'Access is not permitted.');
      throw unavailable();
    }
    const parsed = schema.safeParse(response.data);
    if (!parsed.success) throw unavailable();
    return parsed.data;
  }
  return {
    me: () => rpc('identity_me', ownedProfile),
    initialize: () => rpc('identity_initialize', ownedProfile),
    updateProfile: (patch: ProfilePatch) =>
      rpc('identity_update_profile', ownedProfile, { patch }),
    onboarding: () => rpc('identity_onboarding', ownedOnboarding),
    updateOnboarding: (patch: OnboardingPatch) =>
      rpc('identity_update_onboarding', ownedOnboarding, { patch }),
    staffAccess: () => rpc('identity_staff_access', staffAccessSchema),
  };
}
