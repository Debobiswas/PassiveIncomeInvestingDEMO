import { Home, Wallet, Search, Compass, TrendingUp, Settings, Bell } from 'lucide-react';

const navItems = [
  { id: 'home',      label: 'Home',      icon: Home,    hint: 'Overview' },
  { id: 'portfolio', label: 'Portfolio', icon: Wallet,  hint: 'What you own' },
  { id: 'discover',  label: 'Discover',  icon: Search,  hint: 'Find ETFs' },
  { id: 'plan',      label: 'Plan',      icon: Compass, hint: 'Goals & Advisor' },
];

export default function Sidebar({ active, onNav, unreadCount = 0, onBell }) {
  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 h-screen sticky top-0 z-20"
      style={{ background: 'var(--bg-card)', borderRight: '1px solid var(--border)' }}>

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent)' }}>
          <TrendingUp size={18} className="text-white" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-hi)' }}>PassiveIncome</p>
          <p className="text-[11px]" style={{ color: 'var(--text-low)' }}>Advisor</p>
        </div>
      </div>

      {/* Nav — only 4 items */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        {navItems.map(({ id, label, icon: Icon, hint }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onNav(id)}
              aria-current={isActive ? 'page' : undefined}
              className="group w-full flex items-center gap-3 px-3 rounded-xl cursor-pointer transition-all duration-200 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-amber-400"
              style={{
                minHeight: '48px',
                background: isActive ? 'rgba(245,166,35,0.10)' : 'transparent',
                border: isActive ? '1px solid rgba(245,166,35,0.22)' : '1px solid transparent',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(26,26,26,0.04)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon size={18} style={{ color: isActive ? 'var(--accent)' : 'var(--text-mid)' }} strokeWidth={isActive ? 2.25 : 1.75} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight" style={{ color: isActive ? 'var(--accent)' : 'var(--text-hi)' }}>{label}</p>
                <p className="text-[10px] leading-tight mt-0.5" style={{ color: 'var(--text-low)' }}>{hint}</p>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Compact bottom utility row */}
      <div className="px-3 pb-3 flex items-center gap-1" style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
        <button aria-label="Notifications" onClick={onBell}
          className="flex items-center justify-center relative rounded-lg cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          style={{ minWidth: '44px', minHeight: '44px', color: 'var(--text-mid)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(26,26,26,0.04)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <Bell size={16} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white px-0.5"
              style={{ background: 'var(--accent)' }}>
              {unreadCount}
            </span>
          )}
        </button>
        <button aria-label="Settings"
          className="flex items-center justify-center rounded-lg cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          style={{ minWidth: '44px', minHeight: '44px', color: 'var(--text-mid)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(26,26,26,0.04)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <Settings size={16} />
        </button>
      </div>

      {/* User */}
      <div className="px-4 py-4 flex items-center gap-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ background: 'linear-gradient(135deg, var(--accent), #E8961A)' }}>EV</div>
        <div className="min-w-0">
          <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-hi)' }}>Erica Villani</p>
          <p className="text-[10px] truncate" style={{ color: 'var(--text-low)' }}>Questrade · TFSA</p>
        </div>
      </div>
    </aside>
  );
}
