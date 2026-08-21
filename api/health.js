import { serverEnv } from './_lib/env.js';

export default function handler(req, res) {
  try {
    const env = serverEnv();
    res.status(200).json({
      ok: true,
      env: {
        snaptradeClientId:   Boolean(env.snaptradeClientId),
        snaptradeConsumerKey: Boolean(env.snaptradeConsumerKey),
        supabaseUrl:         env.supabaseUrl,
        supabaseSecretKey:   Boolean(env.supabaseSecretKey),
      },
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}
