import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { SessionContext } from './SessionContext';

export function SessionProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });

  const signOut = () => supabase.auth.signOut();

  return (
    <SessionContext.Provider
      value={{ session, user: session?.user ?? null, loading, signInWithGoogle, signOut }}>
      {children}
    </SessionContext.Provider>
  );
}
