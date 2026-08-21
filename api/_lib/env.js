// Reads and validates server-only environment variables.
// Never import this from client code — it would leak secret names into the bundle.

export function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
      `Add it to .env.local (local) or the Vercel project settings (deployed).`
    );
  }
  return value;
}

let cached = null;

export function serverEnv() {
  if (cached) return cached;
  cached = {
    snaptradeClientId:   requireEnv('SNAPTRADE_CLIENT_ID'),
    snaptradeConsumerKey: requireEnv('SNAPTRADE_CONSUMER_KEY'),
    supabaseUrl:         requireEnv('SUPABASE_URL'),
    supabaseSecretKey:   requireEnv('SUPABASE_SECRET_KEY'),
  };
  return cached;
}
