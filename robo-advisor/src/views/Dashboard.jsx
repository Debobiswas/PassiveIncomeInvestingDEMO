import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, DollarSign, Send, Wallet, Activity, Link2, AlertCircle, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useState } from 'react';
import BentoCard from '../components/BentoCard';
import { portfolioStats, recentActivity, incomeProjection, allocationData, brokerageAccounts } from '../data/dummy';

const C = {
  hi: 'var(--text-hi)', body: 'var(--text-body)', mid: 'var(--text-mid)',
  low: 'var(--text-low)', ghost: 'var(--text-ghost)',
  accent: 'var(--accent)', border: 'var(--border)', subtle: 'var(--bg-subtle)',
};

function StatBadge({ value, positive }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ background: positive ? '#DCFCE7' : '#FEE2E2', color: positive ? '#16A34A' : '#DC2626' }}>
      {positive ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}{value}
    </span>
  );
}

function ActivityIcon({ type }) {
  const map = {
    dividend: { icon: DollarSign, bg: '#DCFCE7', color: '#16A34A' },
    buy:      { icon: TrendingUp,   bg: '#DBEAFE', color: '#2563EB' },
    sell:     { icon: TrendingDown, bg: '#FEF9C3', color: '#CA8A04' },
  };
  const { icon: Icon, bg, color } = map[type] || map.buy;
  return (
    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: bg }}>
      <Icon size={13} style={{ color }} />
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card rounded-xl px-3 py-2 text-xs shadow-lg">
      <p className="mb-1" style={{ color: C.mid }}>{label}</p>
      {payload.map(p => <p key={p.dataKey} style={{ color: p.color }} className="font-medium">{p.name}: ${p.value?.toLocaleString()}</p>)}
    </div>
  );
};

export default function Dashboard({ onNav }) {
  const [chatInput, setChatInput] = useState('');
  const s = portfolioStats;

  const handleChatSubmit = (e) => { e.preventDefault(); if (chatInput.trim()) onNav('advisor'); };

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: C.hi }}>Portfolio Overview</h1>
          <p className="text-sm mt-0.5" style={{ color: C.mid }}>Welcome back, Erica · May 2026 import</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
          style={{ background: 'var(--bg-subtle)', color: 'var(--text-mid)', border: '1px solid var(--border)' }}>
          As of May 1, 2026
        </span>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-4">

        {/* ── Total Portfolio Value ── */}
        <BentoCard className="col-span-12 md:col-span-4 row-span-2" accent>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,166,35,0.12)' }}>
                <Wallet size={15} style={{ color: C.accent }} />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.low }}>Total Portfolio</span>
            </div>
            <StatBadge value={`+${s.totalValueChangePct}%`} positive />
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <p className="text-4xl font-bold tracking-tight" style={{ color: C.hi }}>
              ${s.totalValue.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm font-medium mt-1" style={{ color: '#16A34A' }}>
              +${s.totalValueChange.toLocaleString('en-CA', { minimumFractionDigits: 2 })} today
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
            {[
              { label: 'Monthly Income', value: `$${s.monthlyIncome}`, sub: `+${s.monthlyIncomePct}%` },
              { label: 'Yield on Cost',  value: `${s.yieldOnCost}%`,   sub: 'avg' },
              { label: 'Positions',      value: s.positions,            sub: 'holdings' },
            ].map(({ label, value, sub }) => (
              <div key={label} className="rounded-xl p-2.5" style={{ background: C.subtle }}>
                <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: C.low }}>{label}</p>
                <p className="text-sm font-semibold" style={{ color: C.hi }}>{value}</p>
                <p className="text-[10px]" style={{ color: C.ghost }}>{sub}</p>
              </div>
            ))}
          </div>
        </BentoCard>

        {/* ── Passive Income Projection ── */}
        <BentoCard className="col-span-12 md:col-span-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.08)' }}>
                <Activity size={15} style={{ color: '#7C3AED' }} />
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: C.hi }}>Passive Income Projection</p>
                <p className="text-[10px]" style={{ color: C.low }}>12-month forecast · CAD</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[10px]" style={{ color: C.low }}>
              <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 inline-block rounded" style={{ background: C.accent }}></span>Actual</span>
              <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 inline-block rounded" style={{ background: '#7C3AED' }}></span>Projected</span>
            </div>
          </div>
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={incomeProjection} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,26,26,0.05)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-low)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-low)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="actual" name="Actual" stroke="#F5A623" strokeWidth={2} dot={{ r: 3, fill: '#F5A623' }} connectNulls={false} />
                <Line type="monotone" dataKey="projected" name="Projected" stroke="#7C3AED" strokeWidth={2} strokeDasharray="5 3" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </BentoCard>

        {/* ── Linked Accounts ── */}
        <BentoCard className="col-span-12 md:col-span-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#DCFCE7' }}>
                <Link2 size={13} style={{ color: '#16A34A' }} />
              </div>
              <p className="text-xs font-semibold" style={{ color: C.hi }}>Linked Accounts</p>
            </div>
            <button className="text-[10px] flex items-center gap-0.5 cursor-pointer transition-colors font-medium" style={{ color: C.accent }}>
              Import CSV <ChevronRight size={10} />
            </button>
          </div>
          <div className="space-y-2">
            {brokerageAccounts.map(({ id, broker, accountType, value, lastImport, status, logo }) => (
              <div key={id} className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{
                background: status === 'imported' ? C.subtle : 'transparent',
                border: `1px solid ${C.border}`, opacity: status === 'imported' ? 1 : 0.5,
              }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.border }}>
                  <span className="text-[9px] font-bold font-mono" style={{ color: C.mid }}>{logo}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: C.hi }}>{broker} · {accountType}</p>
                  <p className="text-[10px]" style={{ color: C.low }}>{lastImport ?? 'Pending import'}</p>
                </div>
                {status === 'imported'
                  ? <span className="text-xs font-mono font-semibold shrink-0" style={{ color: '#16A34A' }}>${value?.toLocaleString()}</span>
                  : <AlertCircle size={12} style={{ color: C.ghost }} />
                }
              </div>
            ))}
          </div>
          <p className="text-[9px] text-center mt-3" style={{ color: C.ghost }}>CSV import · updated monthly · next due Jun 1</p>
        </BentoCard>

        {/* ── Allocation ── */}
        <BentoCard className="col-span-12 md:col-span-4">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: C.low }}>Allocation</p>
          <div className="space-y-3">
            {allocationData.map(({ name, value, color }) => (
              <div key={name}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span style={{ color: C.body }}>{name}</span>
                  <span className="font-mono" style={{ color: C.mid }}>{value}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(26,26,26,0.08)' }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: color }} />
                </div>
              </div>
            ))}
          </div>
        </BentoCard>

        {/* ── Recent Activity ── */}
        <BentoCard className="col-span-12 md:col-span-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.low }}>Recent Activity</p>
            <button className="text-[10px] cursor-pointer font-medium" style={{ color: C.accent }}>View all</button>
          </div>
          <div className="space-y-2.5">
            {recentActivity.map(({ id, type, ticker, amount, date, label }) => (
              <div key={id} className="flex items-center gap-3">
                <ActivityIcon type={type} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: C.hi }}>{ticker}</p>
                  <p className="text-[10px]" style={{ color: C.low }}>{label} · {date}</p>
                </div>
                <span className="text-xs font-mono font-semibold" style={{ color: amount > 0 ? '#16A34A' : '#DC2626' }}>
                  {amount > 0 ? '+' : ''}${Math.abs(amount).toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </BentoCard>

        {/* ── Advisor Quick-Chat ── */}
        <BentoCard className="col-span-12 md:col-span-3">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.10)' }}>
                <span className="text-[10px] font-bold font-mono" style={{ color: '#7C3AED' }}>AI</span>
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: C.hi }}>Quick Advisor</p>
                <p className="text-[10px] flex items-center gap-1" style={{ color: '#16A34A' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>Online
                </p>
              </div>
            </div>
            <div className="rounded-xl p-3 mb-3" style={{ background: C.subtle }}>
              <p className="text-xs leading-relaxed" style={{ color: C.mid }}>
                Ask me about ETFs, your portfolio yield, or how to hit your income target faster.
              </p>
            </div>
          </div>
          <form onSubmit={handleChatSubmit} className="flex gap-2 mt-auto">
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Ask the advisor…"
              className="flex-1 rounded-xl px-3 py-2 text-xs focus:outline-none transition-all duration-200"
              style={{ background: C.subtle, border: `1px solid ${C.border}`, color: C.hi }}
              onFocus={e => { e.target.style.borderColor = 'rgba(245,166,35,0.50)'; e.target.style.background = '#fff'; }}
              onBlur={e => { e.target.style.borderColor = C.border; e.target.style.background = C.subtle; }}
            />
            <button type="submit"
              className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer active:scale-95 transition-all duration-150 shrink-0"
              style={{ background: 'var(--accent)' }}>
              <Send size={13} className="text-white" />
            </button>
          </form>
        </BentoCard>

      </div>
    </div>
  );
}
