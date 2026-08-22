import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';

// detectSessionInUrl: true (see lib/supabase.js) means supabase-js consumes
// the OAuth fragment on its own; this view only waits for the resulting
// session and forwards.
export default function AuthCallback() {
  const { session, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    navigate(session ? '/app/home' : '/login', { replace: true });
  }, [loading, session, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--bg-page)', color: 'var(--text-low)' }}>
      <div className="text-sm">Signing you in…</div>
    </div>
  );
}
