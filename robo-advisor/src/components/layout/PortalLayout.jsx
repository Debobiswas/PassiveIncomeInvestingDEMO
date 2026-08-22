import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { TrendingUp, Bell, Home as HomeIcon, Wallet, Search, Compass } from 'lucide-react';
import Sidebar from '../Sidebar';
import NotificationsPanel from '../NotificationsPanel';
import OnboardingModal from '../OnboardingModal';
import DemoBadge from './DemoBadge';
import { notifications } from '../../data/dummy';

const MOBILE_NAV = [
  { id: 'home',      label: 'Home',      icon: HomeIcon },
  { id: 'portfolio', label: 'Portfolio', icon: Wallet   },
  { id: 'discover',  label: 'Discover',  icon: Search   },
  { id: 'plan',      label: 'Plan',      icon: Compass  },
];

export default function PortalLayout({ mode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  // Onboarding shows once per session, and only in the demo portal —
  // a signed-in beta member does not need the marketing intro. Computed
  // lazily at mount rather than in an effect: react-hooks/set-state-in-effect
  // rejects a synchronous setState inside useEffect.
  const [showOnboarding, setShowOnboarding] = useState(
    () => mode === 'demo' && !sessionStorage.getItem('pw-onboarded')
  );

  // The child routes are static segments (`home`, `portfolio`, …) rather than
  // a `:view` param, so useParams() has nothing to read. The second path
  // segment IS the active view.
  const view = pathname.split('/')[2] || 'home';

  const unreadCount = notifications.filter(n => !n.read).length;

  // The flag is written on dismiss, so an unread intro survives a refresh.
  const dismissOnboarding = () => {
    sessionStorage.setItem('pw-onboarded', '1');
    setShowOnboarding(false);
  };

  const handleNav = (next) => {
    setNotifOpen(false);
    navigate(`/${mode}/${next}`);
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
      <Sidebar active={view} onNav={handleNav} unreadCount={unreadCount}
        onBell={() => setNotifOpen(o => !o)} />

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-0"
        style={{ overscrollBehaviorY: 'contain', WebkitOverflowScrolling: 'touch' }}>
        <Outlet context={{ onNav: handleNav }} />
      </main>

      {/* ── Mobile bottom tab bar (hidden on md+) ── */}
      <nav className="flex md:hidden fixed bottom-0 left-0 right-0 z-20 shrink-0"
        style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)', paddingBottom: 'env(safe-area-inset-bottom)', touchAction: 'manipulation', boxShadow: '0 -4px 20px rgba(0,0,0,0.05)' }}>
        {MOBILE_NAV.map(({ id, label, icon: Icon }) => {
          const isActive = view === id;
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

      {notifOpen && <NotificationsPanel onClose={() => setNotifOpen(false)} onNav={handleNav} />}
      {showOnboarding && <OnboardingModal onClose={dismissOnboarding} />}
      {mode === 'demo' && <DemoBadge />}
    </div>
  );
}
