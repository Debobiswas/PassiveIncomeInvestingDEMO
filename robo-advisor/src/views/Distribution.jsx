import { useState } from 'react';
import { Calendar, Download, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import BentoCard from '../components/BentoCard';
import { distributionHistory, upcomingDates } from '../data/dummy';

const C = { hi: 'var(--text-hi)', mid: 'var(--text-mid)', low: 'var(--text-low)', accent: 'var(--accent)', border: 'var(--border)', subtle: 'var(--bg-subtle)' };

const TICKERS = [
  { key: 'xdiv', label: 'XDIV.TO', color: '#F5A623' },
  { key: 'hdiv', label: 'HDIV.TO', color: '#7C3AED' },
  { key: 'zwb',  label: 'ZWB.TO',  color: '#16A34A' },
  { key: 'jepi', label: 'JEPI',    color: '#2563EB' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card rounded-xl px-3 py-2 text-xs shadow-lg">
      <p className="font-medium mb-1" style={{ color: C.mid }}>{label}</p>
      {payload.map(p => <p key={p.dataKey} style={{ color: p.color }} className="font-mono">{p.name}: ${p.value?.toFixed(3)}/unit</p>)}
    </div>
  );
};

const typeColor = { 'Ex-Div': '#F5A623', 'Pay Date': '#16A34A', 'Record': '#7C3AED' };

export default function Distribution() {
  const [activeRange, setActiveRange] = useState('12m');
  const [activeTickers, setActiveTickers] = useState(['xdiv', 'hdiv', 'zwb', 'jepi']);
  const toggleTicker = (key) => setActiveTickers(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const ranges = { '6m': 6, '12m': 12, '24m': 24 };
  const sliced = distributionHistory.slice(-ranges[activeRange]);
  const totalMonthly = (0.058 * 600) + (0.106 * 200) + (0.073 * 250) + (0.084 * 320);

  const btnStyle = (active) => ({
    background: active ? 'rgba(245,166,35,0.12)' : 'transparent',
    color: active ? C.accent : C.low,
    fontWeight: active ? 600 : 400,
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: C.hi }}>Distribution Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: C.mid }}>Distribution history · Ex/Record/Pay dates · 12–24 month view</p>
        </div>
        <div className="flex items-center gap-2">
          {['Export CSV', 'Export XLSX'].map(label => (
            <button key={label} className="flex items-center gap-1.5 text-xs cursor-pointer px-3 py-2 rounded-xl transition-all duration-200"
              style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: C.mid }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,166,35,0.35)'; e.currentTarget.style.color = C.hi; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = C.mid; }}>
              <Download size={12} />{label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Est. Monthly Income', value: `$${totalMonthly.toFixed(0)}`, sub: 'from tracked ETFs', color: '#16A34A', bg: '#DCFCE7', icon: DollarSign },
          { label: 'Avg Yield (Portfolio)', value: '6.57%', sub: 'weighted avg',  color: '#D97706', bg: '#FEF9C3', icon: TrendingUp },
          { label: 'Next Ex-Date',   value: 'May 28', sub: 'XDIV.TO', color: '#F5A623', bg: 'rgba(245,166,35,0.10)', icon: Calendar },
          { label: 'Next Pay Date',  value: 'Jun 3',  sub: 'JEPI',    color: '#2563EB', bg: '#DBEAFE', icon: Clock },
        ].map(({ label, value, sub, color, bg, icon: Icon }) => (
          <BentoCard key={label} className="flex-row items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
              <Icon size={15} style={{ color }} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: C.low }}>{label}</p>
              <p className="text-lg font-bold" style={{ color }}>{value}</p>
              <p className="text-[10px]" style={{ color: C.low }}>{sub}</p>
            </div>
          </BentoCard>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Chart */}
        <BentoCard className="col-span-12 md:col-span-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold" style={{ color: C.hi }}>Distribution History</p>
              <p className="text-[10px]" style={{ color: C.low }}>Per-unit distribution · $/unit</p>
            </div>
            <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: C.subtle, border: `1px solid ${C.border}` }}>
              {Object.keys(ranges).map(r => (
                <button key={r} onClick={() => setActiveRange(r)}
                  className="text-[10px] px-2.5 py-1 rounded-lg cursor-pointer transition-all duration-200 font-medium"
                  style={btnStyle(activeRange === r)}>{r}</button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {TICKERS.map(({ key, label, color }) => (
              <button key={key} onClick={() => toggleTicker(key)}
                className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full border cursor-pointer transition-all duration-200"
                style={activeTickers.includes(key)
                  ? { background: `${color}18`, borderColor: `${color}40`, color }
                  : { background: 'transparent', borderColor: C.border, color: C.low }}>
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: activeTickers.includes(key) ? color : C.ghost }}></span>
                {label}
              </button>
            ))}
          </div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sliced} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barSize={8} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,26,26,0.05)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-low)', fontSize: 9 }} axisLine={false} tickLine={false} interval={2} />
                <YAxis tick={{ fill: 'var(--text-low)', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v.toFixed(2)}`} />
                <Tooltip content={<CustomTooltip />} />
                {TICKERS.filter(t => activeTickers.includes(t.key)).map(({ key, label, color }) => (
                  <Bar key={key} dataKey={key} name={label} fill={color} fillOpacity={0.85} radius={[2,2,0,0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </BentoCard>

        {/* Upcoming dates */}
        <BentoCard className="col-span-12 md:col-span-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.low }}>Upcoming Dates</p>
            <span className="text-[10px]" style={{ color: C.low }}>{upcomingDates.length} events</span>
          </div>
          <div className="space-y-2.5">
            {upcomingDates.map(({ ticker, type, date, amount, daysUntil }) => (
              <div key={`${ticker}-${type}`} className="flex items-center gap-3">
                <div className="w-1 h-8 rounded-full shrink-0" style={{ background: typeColor[type] }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono font-semibold" style={{ color: C.hi }}>{ticker}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full border font-medium"
                      style={{ color: typeColor[type], borderColor: `${typeColor[type]}40`, background: `${typeColor[type]}12` }}>{type}</span>
                  </div>
                  <p className="text-[10px]" style={{ color: C.low }}>{date} · ${amount}/unit</p>
                </div>
                <span className="text-[10px] font-mono shrink-0 font-semibold" style={{ color: daysUntil <= 7 ? C.accent : C.low }}>{daysUntil}d</span>
              </div>
            ))}
          </div>
        </BentoCard>

        {/* Record table */}
        <BentoCard className="col-span-12 p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.low }}>Distribution Record Table</p>
            <span className="text-[10px]" style={{ color: C.low }}>Last 6 months · exportable</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {['Month', 'XDIV.TO', 'HDIV.TO', 'ZWB.TO', 'JEPI', 'Total / Unit'].map(h => (
                    <th key={h} className="text-left pl-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.low }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {distributionHistory.slice(-6).reverse().map((row, i, arr) => {
                  const total = row.xdiv + row.hdiv + row.zwb + row.jepi;
                  return (
                    <tr key={row.month} style={{ borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td className="pl-5 py-2.5 font-semibold" style={{ color: C.hi }}>{row.month}</td>
                      {['xdiv','hdiv','zwb','jepi'].map(k => (
                        <td key={k} className="pl-5 py-2.5 font-mono" style={{ color: C.mid }}>${row[k].toFixed(3)}</td>
                      ))}
                      <td className="pl-5 py-2.5 font-mono font-semibold" style={{ color: '#16A34A' }}>${total.toFixed(3)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </BentoCard>
      </div>
    </div>
  );
}
