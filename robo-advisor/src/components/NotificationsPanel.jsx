import { useState } from 'react';
import { X, TrendingDown, DollarSign, RefreshCw, CheckCircle2, FileUp, Bell } from 'lucide-react';
import { notifications as initialNotifs } from '../data/dummy';

const C = { hi: 'var(--text-hi)', mid: 'var(--text-mid)', low: 'var(--text-low)', accent: 'var(--accent)', border: 'var(--border)', subtle: 'var(--bg-subtle)' };

const TYPE_META = {
  distribution: { icon: DollarSign, bg: 'rgba(22,163,74,0.10)',  color: '#16A34A' },
  drift:        { icon: TrendingDown,bg: 'rgba(245,166,35,0.12)', color: '#D97706' },
  checkin:      { icon: RefreshCw,  bg: 'rgba(124,58,237,0.10)', color: '#7C3AED' },
  import:       { icon: FileUp,     bg: 'rgba(59,130,246,0.10)', color: '#3B82F6' },
};

export default function NotificationsPanel({ onClose, onNav }) {
  const [notifs, setNotifs] = useState(initialNotifs);
  const unreadCount = notifs.filter(n => !n.read).length;

  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  const markRead    = id  => setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  const handleClick = (n) => {
    markRead(n.id);
    if (n.type === 'drift' || n.type === 'checkin') onNav('portfolio');
    if (n.type === 'distribution') onNav('portfolio');
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.25)' }} onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-50 flex flex-col w-full md:w-80 shadow-2xl"
        style={{ background: 'var(--bg-card)', borderLeft: `1px solid ${C.border}` }}>

        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between shrink-0"
          style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2">
            <Bell size={16} style={{ color: C.hi }} />
            <p className="text-sm font-semibold" style={{ color: C.hi }}>Notifications</p>
            {unreadCount > 0 && (
              <span className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white"
                style={{ background: C.accent }}>
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button onClick={markAllRead}
                className="text-[11px] font-medium cursor-pointer focus-visible:outline-none px-2 py-1 rounded"
                style={{ color: C.accent }}>
                Mark all read
              </button>
            )}
            <button onClick={onClose} aria-label="Close notifications"
              className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              style={{ background: 'var(--bg-subtle)', color: C.mid }}>
              <X size={15} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {notifs.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3">
              <CheckCircle2 size={28} style={{ color: C.low }} />
              <p className="text-sm" style={{ color: C.mid }}>All caught up!</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: C.border }}>
              {notifs.map(n => {
                const meta = TYPE_META[n.type] || TYPE_META.import;
                const Icon = meta.icon;
                return (
                  <button key={n.id}
                    onClick={() => handleClick(n)}
                    className="w-full flex items-start gap-3 px-5 py-4 text-left cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-400"
                    style={{ background: n.read ? 'transparent' : 'rgba(245,166,35,0.03)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                    onMouseLeave={e => e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(245,166,35,0.03)'}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: meta.bg }}>
                      <Icon size={14} style={{ color: meta.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold leading-snug" style={{ color: C.hi }}>{n.title}</p>
                        {!n.read && (
                          <div className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ background: C.accent }} />
                        )}
                      </div>
                      <p className="text-[11px] mt-0.5 leading-snug" style={{ color: C.mid }}>{n.body}</p>
                      <p className="text-[10px] mt-1" style={{ color: C.low }}>{n.time}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 shrink-0" style={{ borderTop: `1px solid ${C.border}` }}>
          <p className="text-[10px] text-center" style={{ color: C.low }}>
            Email digests sent weekly · Manage in Settings
          </p>
        </div>
      </div>
    </>
  );
}
