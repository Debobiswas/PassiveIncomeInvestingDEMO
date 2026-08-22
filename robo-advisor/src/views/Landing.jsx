import { Link } from 'react-router-dom';
import { TrendingUp, ArrowRight, Eye } from 'lucide-react';

const C = { hi: 'var(--text-hi)', mid: 'var(--text-mid)', low: 'var(--text-low)',
            accent: 'var(--accent)', border: 'var(--border)' };

export default function Landing() {
  return (
    <div className="min-h-screen flex items-center justify-center p-5" style={{ background: 'var(--bg-page)' }}>
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: C.accent }}>
          <TrendingUp size={28} className="text-white" strokeWidth={2.5} />
        </div>

        <h1 className="text-3xl font-bold tracking-tight" style={{ color: C.hi }}>PassiveIncome</h1>
        <p className="text-sm mt-3 leading-relaxed" style={{ color: C.mid }}>
          Know how much you're making and what to do next — built on
          Erica Villani's DIY Investing Package.
        </p>

        <div className="mt-9 space-y-3">
          <Link to="/login"
            className="w-full flex items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white cursor-pointer active:scale-[0.98] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            style={{ minHeight: '48px', background: C.accent }}>
            Sign in <ArrowRight size={15} />
          </Link>

          <Link to="/demo/home"
            className="w-full flex items-center justify-center gap-2 rounded-2xl text-sm font-semibold cursor-pointer active:scale-[0.98] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            style={{ minHeight: '48px', background: 'var(--bg-card)', color: C.hi, border: `1px solid var(--border-mid)` }}>
            <Eye size={15} /> See the demo
          </Link>
        </div>

        <p className="text-[11px] mt-7" style={{ color: C.low }}>Private beta</p>
      </div>
    </div>
  );
}
