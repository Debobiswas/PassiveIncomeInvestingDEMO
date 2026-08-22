import { TrendingUp, ArrowRight, Shield, Zap, BarChart2 } from 'lucide-react';

// ── Onboarding welcome modal (M7) ─────────────────────────────────────────────
// Moved verbatim out of App.jsx when the router landed. Not restyled.
export default function OnboardingModal({ onClose }) {
  const FEATURES = [
    {
      icon: BarChart2,
      color: '#F5A623',
      title: 'ETF Screener & Dashboard',
      desc: '63+ income ETFs from Erica\'s DIY Package — filter, compare, and deep-dive.',
    },
    {
      icon: Zap,
      color: '#7C3AED',
      title: 'AI Advisor + Goal Engine',
      desc: 'Answer 4 questions, get a personalized portfolio match and income roadmap.',
    },
    {
      icon: Shield,
      color: '#16A34A',
      title: 'Rebalance & Check-ins',
      desc: 'Monthly drift detection, plain-English trade plans, and what-if simulations.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="rounded-3xl max-w-md w-full shadow-2xl overflow-hidden"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>

        {/* Hero */}
        <div className="px-8 pt-8 pb-6 text-center"
          style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.08), rgba(124,58,237,0.06))' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--accent)' }}>
            <TrendingUp size={24} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-hi)' }}>Welcome to PassiveIncome</h1>
          <p className="text-sm mt-2" style={{ color: 'var(--text-mid)' }}>
            Your personal robo-advisor built on Erica Villani's<br />DIY Investing Package
          </p>
        </div>

        {/* Feature list */}
        <div className="px-6 py-5 space-y-4">
          {FEATURES.map(f => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${f.color}18` }}>
                  <Icon size={16} style={{ color: f.color }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-hi)' }}>{f.title}</p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-mid)' }}>{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="px-6 pb-7 space-y-3">
          <button onClick={onClose}
            className="w-full flex items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white cursor-pointer active:scale-[0.98] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            style={{ minHeight: '48px', background: 'var(--accent)' }}>
            Let's get started <ArrowRight size={15} />
          </button>
          <button onClick={onClose}
            className="w-full text-xs cursor-pointer focus-visible:outline-none rounded"
            style={{ color: 'var(--text-low)', minHeight: '36px' }}>
            Skip intro
          </button>
        </div>
      </div>
    </div>
  );
}
