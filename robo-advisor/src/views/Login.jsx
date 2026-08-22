import { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { useSession } from '../context/SessionContext';

const C = { hi: 'var(--text-hi)', mid: 'var(--text-mid)', low: 'var(--text-low)',
            accent: 'var(--accent)', border: 'var(--border)' };

export default function Login() {
  const { session, loading, signInWithGoogle } = useSession();
  const navigate = useNavigate();
  const location = useLocation();

  // Already signed in — go where they were headed.
  useEffect(() => {
    if (!loading && session) navigate(location.state?.from || '/app/home', { replace: true });
  }, [loading, session, navigate, location.state]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-page)' }}>
      <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--bg-card)', border: `1px solid ${C.border}` }}>

        <div className="px-8 pt-9 pb-7 text-center"
          style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.08), rgba(124,58,237,0.06))' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: C.accent }}>
            <TrendingUp size={24} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: C.hi }}>Welcome back</h1>
          <p className="text-sm mt-2" style={{ color: C.mid }}>
            Sign in to see your portfolio and income
          </p>
        </div>

        <div className="px-7 py-7 space-y-4">
          <button onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-2.5 rounded-2xl text-sm font-semibold cursor-pointer active:scale-[0.98] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            style={{ minHeight: '48px', background: '#fff', color: C.hi, border: `1px solid var(--border-mid)` }}>
            <GoogleMark />
            Continue with Google
          </button>

          <p className="text-[11px] text-center leading-relaxed" style={{ color: C.low }}>
            PassiveIncome is in private beta. If your account isn't recognised,
            ask Erica for an invite.
          </p>

          <div className="pt-2 border-t text-center" style={{ borderColor: C.border }}>
            <Link to="/demo/home"
              className="inline-flex items-center gap-1.5 text-xs font-medium mt-4 cursor-pointer focus-visible:outline-none rounded"
              style={{ color: C.accent, minHeight: '36px' }}>
              Explore the demo instead <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline SVG so the page has no external asset dependency.
function GoogleMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.27-4.74 3.27-8.09Z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/>
      <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"/>
    </svg>
  );
}
