import { z } from 'zod';

const revision = z.number().int().min(0).max(999999999);
const displayName = z
  .string()
  .min(1)
  .refine(
    (name) =>
      [...name].length <= 80 &&
      !name.startsWith(' ') &&
      !name.endsWith(' ') &&
      !/\p{Cc}/u.test(name),
  );
const country = z.string().regex(/^[A-Z]{2}$/);
const currency = z.enum(['CAD', 'USD']);
const timestamp = z.iso.datetime({ offset: true });
export const profilePatchSchema = z
  .strictObject({
    expected_revision: revision,
    display_name: displayName.optional(),
    country: country.optional(),
    display_currency: currency.optional(),
  })
  .refine((patch) => Object.keys(patch).length > 1);
export const onboardingPatchSchema = z.discriminatedUnion('action', [
  z.strictObject({
    expected_revision: revision,
    action: z.literal('acknowledge_disclosure'),
    disclosure_version: z.string().min(1).max(80),
  }),
  z.strictObject({
    expected_revision: revision,
    action: z.literal('complete'),
  }),
]);
export const profileSchema = z.strictObject({
  user_id: z.uuid(),
  display_name: displayName.nullable(),
  country: country.nullable(),
  display_currency: currency.nullable(),
  revision,
  created_at: timestamp,
  updated_at: timestamp,
});
export const onboardingSchema = z.strictObject({
  state: z.strictObject({
    user_id: z.uuid(),
    version: z.literal(1),
    revision,
    disclosure_version: z.string().nullable(),
    acknowledged_at: timestamp.nullable(),
    completed_at: timestamp.nullable(),
  }),
  disclosure: z
    .strictObject({ version: z.string(), body: z.string() })
    .nullable(),
});
export const staffAccessSchema = z.strictObject({ role: z.literal('admin') });
export const emptyInputSchema = z.strictObject({});
export const problemSchema = z.strictObject({
  error: z.strictObject({
    code: z.string(),
    message: z.string(),
    request_id: z.uuid(),
    retryable: z.boolean(),
  }),
});
export type Profile = z.infer<typeof profileSchema>;
export type ProfilePatch = z.infer<typeof profilePatchSchema>;
export type Onboarding = z.infer<typeof onboardingSchema>;
export type OnboardingPatch = z.infer<typeof onboardingPatchSchema>;
export {
  diagnosticSchema,
  diagnosticRoute,
  redactDiagnostic,
  releaseSchema,
  telemetryConfigSchema,
  privateDataCollection,
} from './telemetry.ts';
export type { Diagnostic, TelemetryConfig } from './telemetry.ts';
