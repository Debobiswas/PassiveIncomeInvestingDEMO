import { z } from 'zod';
import { unavailable } from './errors.ts';

export const serverConfigSchema = z.strictObject({
  supabaseUrl: z.url().refine((value) => {
    const url = new URL(value);
    return (
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      (url.protocol === 'https:' ||
        (url.protocol === 'http:' &&
          ['localhost', '127.0.0.1'].includes(url.hostname)))
    );
  }),
  publishableKey: z.string().startsWith('sb_publishable_'),
});
export type ServerConfig = z.infer<typeof serverConfigSchema>;
export function loadServerConfig(): ServerConfig {
  const parsed = serverConfigSchema.safeParse({
    supabaseUrl: process.env.SUPABASE_URL,
    publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY,
  });
  if (!parsed.success) throw unavailable();
  return parsed.data;
}
