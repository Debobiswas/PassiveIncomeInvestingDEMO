import { useState } from 'react';
import { TrendingUp, TrendingDown, ArrowRight, Calendar, AlertCircle, MessageSquare, Zap, X, CheckCircle2 } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { portfolioStats, recentActivity, incomeProjection, upcomingDates, driftAlerts, monthlyCheckin } from '../data/dummy';

const C = { hi: 'var(--text-hi)', mid: 'var(--text-mid)', low: 'var(--text-low)', accent: 'var(--accent)', border: 'var(--border)', subtle: 'var(--bg-subtle)' };

export default function Home({ onNav }) {
  const [checkinDismissed, setCheckinDismissed] = useState(false);
  const sparkData = incomeProjection.filter(d => d.actual !== null).map(d => ({ v: d.actual }));
  const nextEvent = [...upcomingDates].sort((a, b) => a.daysUntil - b.daysUntil)[0];
  const hasDrift = driftAlerts.length > 0;
  const pctUp = portfolioStats.totalValueChange >= 0;

  return (
    <div className="px-4 py-5 md:px-8 md:py-8 space-y-6">
      {/* Header */}
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.low }}>Welcome back, Erica</p>
        <h1 className="text-3xl font-bold mt-1" style={{ color: C.hi }}>Here's your week</h1>
      </header>

      {/* Top row — 2-col: income hero + right panel */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-5">

        {/* LEFT — Income hero (3/5) */}
        <div className="col-span-1 md:col-span-3 rounded-3xl overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.10) 0%, rgba(245,166,35,0.03) 100%)', border: '1px solid rgba(245,166,35,0.22)', boxShadow: '0 4px 20px rgba(245,166,35,0.10)' }}>
          <div className="p-6 md:p-7 flex items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: C.accent, letterSpacing: '0.1em' }}>Monthly Income</p>
              <p className="text-5xl md:text-6xl font-bold mt-2 leading-none font-mono" style={{ color: C.hi, letterSpacing: '-0.02em' }}>
                ${portfolioStats.monthlyIncome.toFixed(2)}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(22,163,74,0.12)', color: '#16A34A' }}>
                  <TrendingUp size={12} />+{portfolioStats.monthlyIncomePct}%
                </span>
                <span className="text-xs" style={{ color: C.mid }}>vs. last month</span>
              </div>
            </div>
            <div className="w-32 h-20 md:w-44 md:h-24 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparkData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F5A623" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#F5A623" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="v" stroke="#F5A623" strokeWidth={2.5} fill="url(#spark)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stat strip — abbreviated on mobile */}
          <div className="grid grid-cols-3 border-t" style={{ borderColor: 'rgba(245,166,35,0.15)' }}>
            {[
              {
                label: 'Value',
                valueMobile: `$${(portfolioStats.totalValue / 1000).toFixed(0)}K`,
                valueDesktop: `$${portfolioStats.totalValue.toLocaleString()}`,
                sub: `${pctUp ? '+' : ''}$${portfolioStats.totalValueChange.toFixed(0)} today`,
                subColor: pctUp ? '#16A34A' : '#DC2626',
              },
              { label: 'Yield', valueMobile: `${portfolioStats.yieldOnCost}%`, valueDesktop: `${portfolioStats.yieldOnCost}%`, sub: 'on cost', subColor: C.mid },
              { label: 'Positions', valueMobile: `${portfolioStats.positions}`, valueDesktop: `${portfolioStats.positions}`, sub: '3 accounts', subColor: C.mid },
            ].map(s => (
              <div key={s.label} className="px-3 md:px-6 py-4">
                <p className="text-[9px] uppercase tracking-widest font-bold" style={{ color: C.low }}>{s.label}</p>
                <p className="text-base md:text-xl font-bold mt-1 font-mono" style={{ color: C.hi }}>
                  <span className="md:hidden">{s.valueMobile}</span>
                  <span className="hidden md:inline">{s.valueDesktop}</span>
                </p>
                <p className="text-[10px] mt-0.5 font-semibold" style={{ color: s.subColor }}>{s.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT panel (2/5) — stacked cards */}
        <div className="col-span-1 md:col-span-2 flex flex-col gap-4">

          {/* Context-aware action card */}
          {hasDrift ? (
            <button onClick={() => onNav('portfolio')}
              className="flex-1 rounded-2xl p-5 flex items-center gap-4 cursor-pointer transition-all duration-200 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:opacity-90"
              style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.10), rgba(245,166,35,0.04))', border: '1px solid rgba(245,166,35,0.30)', boxShadow: '0 2px 12px rgba(245,166,35,0.12)' }}>
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,166,35,0.15)' }}>
                <AlertCircle size={19} style={{ color: C.accent }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: C.hi }}>Portfolio drifted</p>
                <p className="text-xs mt-0.5" style={{ color: C.mid }}>{driftAlerts.length} positions off target · review plan</p>
              </div>
              <ArrowRight size={16} style={{ color: C.accent }} />
            </button>
          ) : (
            <button onClick={() => onNav('plan')}
              className="flex-1 card rounded-2xl p-5 flex items-center gap-4 cursor-pointer transition-all duration-200 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:opacity-90">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(124,58,237,0.10)' }}>
                <MessageSquare size={19} style={{ color: '#7C3AED' }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: C.hi }}>Ask your advisor</p>
                <p className="text-xs mt-0.5" style={{ color: C.mid }}>Get help planning your next move</p>
              </div>
              <ArrowRight size={16} style={{ color: C.mid }} />
            </button>
          )}

          {/* Next dividend */}
          {nextEvent && (
            <div className="flex-1 card rounded-2xl p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(22,163,74,0.10)' }}>
                <Calendar size={19} style={{ color: '#16A34A' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] uppercase tracking-widest font-bold" style={{ color: C.low }}>Next event</p>
                <p className="text-sm font-semibold mt-0.5 truncate" style={{ color: C.hi }}>
                  <span className="font-mono">{nextEvent.ticker}</span> · {nextEvent.type.toLowerCase()}
                </p>
                <p className="text-xs mt-0.5" style={{ color: C.mid }}>{nextEvent.date.split(',')[0]} · ${nextEvent.amount}/unit</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-3xl font-bold font-mono leading-none" style={{ color: '#16A34A' }}>{nextEvent.daysUntil}</p>
                <p className="text-[9px] mt-0.5 font-semibold uppercase tracking-wider" style={{ color: C.low }}>days</p>
              </div>
            </div>
          )}

          {/* Quick discover CTA */}
          <button onClick={() => onNav('discover')}
            className="card rounded-2xl px-5 py-4 flex items-center gap-3 cursor-pointer transition-all duration-200 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:opacity-90">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,166,35,0.10)' }}>
              <Zap size={16} style={{ color: C.accent }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: C.hi }}>Discover ETFs</p>
              <p className="text-xs" style={{ color: C.mid }}>Browse 40+ income ETFs</p>
            </div>
            <ArrowRight size={14} style={{ color: C.low }} />
          </button>
        </div>
      </div>

      {/* ── Monthly check-in banner (M6) — responsive layout ── */}
      {!checkinDismissed && monthlyCheckin.status === 'ready' && (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.10), rgba(124,58,237,0.07))', border: '1px solid rgba(245,166,35,0.28)', boxShadow: '0 2px 16px rgba(245,166,35,0.10)' }}>

          {/* Top row — icon + title + dismiss */}
          <div className="px-4 pt-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(245,166,35,0.15)' }}>
              <CheckCircle2 size={16} style={{ color: 'var(--accent)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-hi)' }}>
                {monthlyCheckin.month} check-in ready
              </p>
              {/* Desktop-only inline stats */}
              <div className="hidden md:flex items-center gap-4 mt-1 flex-wrap">
                <span className="text-xs" style={{ color: 'var(--text-mid)' }}>
                  Income: <strong style={{ color: 'var(--text-hi)' }}>${monthlyCheckin.income.toFixed(0)}/mo</strong>
                  <span className="ml-1" style={{ color: '#16A34A' }}>+{monthlyCheckin.incomeChange}%</span>
                </span>
                <span className="text-xs" style={{ color: 'var(--text-mid)' }}>
                  {monthlyCheckin.distributionsReceived} distributions · <strong style={{ color: 'var(--text-hi)' }}>${monthlyCheckin.totalReceived.toFixed(0)}</strong> received
                </span>
                <span className="text-xs" style={{ color: '#D97706' }}>{monthlyCheckin.nextRebalance}</span>
              </div>
            </div>
            <button onClick={() => setCheckinDismissed(true)}
              aria-label="Dismiss check-in"
              className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer shrink-0 focus-visible:outline-none active:opacity-70"
              style={{ color: 'var(--text-low)', touchAction: 'manipulation' }}>
              <X size={14} />
            </button>
          </div>

          {/* Mobile-only: compact stat chips */}
          <div className="md:hidden px-4 pt-2 flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium"
              style={{ background: 'rgba(22,163,74,0.10)', color: '#16A34A' }}>
              ${monthlyCheckin.income.toFixed(0)}/mo · +{monthlyCheckin.incomeChange}%
            </span>
            <span className="text-xs" style={{ color: 'var(--text-mid)' }}>
              {monthlyCheckin.distributionsReceived} distributions
            </span>
            <span className="text-xs font-medium" style={{ color: '#D97706' }}>· Rebalance needed</span>
          </div>

          {/* Bottom row — CTA button */}
          <div className="px-4 pb-4 pt-3 flex items-center gap-3">
            <button onClick={() => onNav('portfolio')}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer px-4 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:opacity-90 transition-opacity"
              style={{ minHeight: '40px', background: 'var(--accent)', color: '#fff', touchAction: 'manipulation' }}>
              Review check-in <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Bottom — Recent activity full-width */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: C.low }}>Recent activity</p>
          <button onClick={() => onNav('portfolio')}
            className="text-xs font-semibold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded px-1"
            style={{ color: C.accent }}>
            View all →
          </button>
        </div>
        <div className="card rounded-2xl overflow-hidden">
          {recentActivity.slice(0, 4).map((item, idx, arr) => {
            const isCredit = item.amount > 0;
            return (
              <div key={item.id}
                className="px-5 py-3.5 flex items-center gap-3 transition-colors cursor-pointer"
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                style={{ borderBottom: idx < arr.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                {/* Type icon */}
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: isCredit ? 'rgba(22,163,74,0.10)' : 'rgba(220,38,38,0.08)' }}>
                  {isCredit
                    ? <TrendingUp size={13} style={{ color: '#16A34A' }} />
                    : <TrendingDown size={13} style={{ color: '#DC2626' }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: C.hi }}>
                    <span className="font-mono">{item.ticker}</span>
                    <span className="font-normal ml-1.5" style={{ color: C.mid }}>· {item.label}</span>
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: C.low }}>{item.date}</p>
                </div>
                <p className="text-sm font-bold font-mono shrink-0" style={{ color: isCredit ? '#16A34A' : '#DC2626' }}>
                  {isCredit ? '+' : '-'}${Math.abs(item.amount).toFixed(2)}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
