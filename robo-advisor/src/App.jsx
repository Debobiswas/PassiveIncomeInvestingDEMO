import { useState, Suspense, lazy } from 'react';
import { TrendingUp, ArrowRight, Shield, Zap, BarChart2, Bell, Home as HomeIcon, Wallet, Search, Compass } from 'lucide-react';
import Sidebar from './components/Sidebar';
import NotificationsPanel from './components/NotificationsPanel';
import { notifications } from './data/dummy';

const MOBILE_NAV = [
  { id: 'home',      label: 'Home',      icon: HomeIcon },
  { id: 'portfolio', label: 'Portfolio', icon: Wallet   },
  { id: 'discover',  label: 'Discover',  icon: Search   },
  { id: 'plan',      label: 'Plan',      icon: Compass  },
];

const Home      = lazy(() => import('./views/Home'));
const Portfolio = lazy(() => import('./views/Portfolio'));
const Discover  = lazy(() => import('./views/Discover'));
const Plan      = lazy(() => import('./views/Plan'));

const views = { home: Home, portfolio: Portfolio, discover: Discover, plan: Plan };

// ── Onboarding welcome modal (M7) ─────────────────────────────────────────────
function OnboardingModal({ onClose }) {
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

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [active, setActive] = useState('home');
  const [notifOpen, setNotifOpen]       = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(
    () => !sessionStorage.getItem('pw-onboarded')
  );
  const View = views[active] || Home;

  const unreadCount = notifications.filter(n => !n.read).length;

  // Onboarding shows once per session; the flag is written on dismiss.
  const dismissOnboarding = () => {
    sessionStorage.setItem('pw-onboarded', '1');
    setShowOnboarding(false);
  };

  const handleNav = (view) => {
    setActive(view);
    setNotifOpen(false);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden" style={{ background: 'var(--bg-page)' }}>

      {/* ── Mobile top header (hidden on md+) ── */}
      <header className="flex md:hidden items-center justify-between px-4 shrink-0 z-10"
        style={{ minHeight: '56px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent)' }}>
            <TrendingUp size={15} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-hi)' }}>PassiveIncome</span>
        </div>
        <button onClick={() => setNotifOpen(o => !o)} aria-label="Notifications"
          className="relative w-11 h-11 rounded-xl flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:opacity-70 transition-opacity"
          style={{ color: 'var(--text-mid)', touchAction: 'manipulation' }}>
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white px-0.5"
              style={{ background: 'var(--accent)' }}>{unreadCount}</span>
          )}
        </button>
      </header>

      {/* ── Sidebar (hidden on mobile) ── */}
      <Sidebar
        active={active}
        onNav={handleNav}
        unreadCount={unreadCount}
        onBell={() => setNotifOpen(o => !o)} />

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-0"
        style={{ overscrollBehaviorY: 'contain', WebkitOverflowScrolling: 'touch' }}>
        <Suspense fallback={
          <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-low)' }}>
            <div className="text-sm">Loading…</div>
          </div>
        }>
          <View onNav={handleNav} />
        </Suspense>
      </main>

      {/* ── Mobile bottom tab bar (hidden on md+) ── */}
      <nav className="flex md:hidden fixed bottom-0 left-0 right-0 z-20 shrink-0"
        style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)', paddingBottom: 'env(safe-area-inset-bottom)', touchAction: 'manipulation', boxShadow: '0 -4px 20px rgba(0,0,0,0.05)' }}>
        {MOBILE_NAV.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button key={id} onClick={() => handleNav(id)}
              aria-current={isActive ? 'page' : undefined}
              className="flex-1 flex flex-col items-center justify-center gap-1 focus-visible:outline-none cursor-pointer active:opacity-60 transition-opacity"
              style={{ minHeight: '58px', touchAction: 'manipulation' }}>
              {/* Active pill indicator */}
              <div className="flex items-center justify-center rounded-2xl transition-all duration-250"
                style={{
                  width: isActive ? 48 : 28,
                  height: 30,
                  background: isActive ? 'rgba(245,166,35,0.14)' : 'transparent',
                  boxShadow: isActive ? '0 0 0 1px rgba(245,166,35,0.20)' : 'none',
                }}>
                <Icon size={19} style={{ color: isActive ? 'var(--accent)' : 'var(--text-low)' }} strokeWidth={isActive ? 2.5 : 1.75} />
              </div>
              <span className="text-[10px] leading-none transition-all duration-200"
                style={{ color: isActive ? 'var(--accent)' : 'var(--text-low)', fontWeight: isActive ? 700 : 500 }}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Notifications panel */}
      {notifOpen && (
        <NotificationsPanel onClose={() => setNotifOpen(false)} onNav={handleNav} />
      )}

      {/* Onboarding modal */}
      {showOnboarding && <OnboardingModal onClose={dismissOnboarding} />}
    </div>
  );
}
