import { Navigate, useLocation } from 'react-router-dom';
import { useSession } from '../../context/SessionContext';

// Gate for everything under /app/*. The `loading` check matters: without it a
// signed-in user is bounced to /login for a frame on every hard refresh, while
// supabase-js is still restoring the session from storage.
export default function RequireAuth({ children }) {
  const { session, loading } = useSession();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen"
        style={{ background: 'var(--bg-page)', color: 'var(--text-low)' }}>
        <div className="text-sm">Checking your session…</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
