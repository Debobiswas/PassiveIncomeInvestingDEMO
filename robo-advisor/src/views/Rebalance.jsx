import { useState } from 'react';
import { AlertTriangle, CheckCircle, RefreshCw, ArrowRight, Bell, Clock } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import BentoCard from '../components/BentoCard';
import { portfolioHoldings, driftAlerts, rebalanceHistory } from '../data/dummy';

const C = { hi: 'var(--text-hi)', mid: 'var(--text-mid)', low: 'var(--text-low)', accent: 'var(--accent)', border: 'var(--border)', subtle: 'var(--bg-subtle)' };

const severityStyle = {
  high:   { bg: '#FEF9C3', border: '#FDE047', text: '#A16207', label: 'High Drift'  },
  medium: { bg: '#DBEAFE', border: '#93C5FD', text: '#1D4ED8', label: 'Moderate'    },
};

function DriftBar({ current, target, color, ticker }) {
  const drift = current - target;
  const absDrift = Math.abs(drift);
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="font-mono font-semibold" style={{ color: C.hi }}>{ticker}</span>
        <div className="flex items-center gap-2">
          <span style={{ color: C.low }}>{target}% target</span>
          <span className="font-mono font-bold" style={{ color: drift > 0 ? '#D97706' : drift < 0 ? '#2563EB' : '#16A34A' }}>
            {drift > 0 ? '+' : ''}{drift.toFixed(1)}%
          </span>
        </div>
      </div>
      <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'rgba(26,26,26,0.08)' }}>
        <div className="absolute top-0 bottom-0 w-0.5 z-10" style={{ left: `${(target / 30) * 100}%`, background: 'rgba(26,26,26,0.20)' }} />
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(current / 30) * 100}%`, background: color }} />
      </div>
      <p className="text-[9px] mt-0.5" style={{ color: C.low }}>{current}% current</p>
    </div>
  );
}

export default function Rebalance() {
  const [runningRebalance, setRunningRebalance] = useState(false);
  const [done, setDone] = useState(false);

  const handleRebalance = () => {
    setRunningRebalance(true);
    setTimeout(() => { setRunningRebalance(false); setDone(true); }, 2200);
  };

  const radarData = portfolioHoldings.map(h => ({
    subject: h.ticker.replace('.TO',''),
    current: h.currentPct,
    target: h.targetPct,
  }));

  const totalDrift = portfolioHoldings.reduce((acc, h) => acc + Math.abs(h.drift), 0);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: C.hi }}>Check-in & Rebalance</h1>
          <p className="text-sm mt-0.5" style={{ color: C.mid }}>Drift detection · Monthly check-in · Rebalance suggestions</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl" style={{ background: C.subtle, border: `1px solid ${C.border}`, color: C.mid }}>
            <Clock size={12} />Next check-in: <span className="font-semibold ml-1" style={{ color: C.hi }}>Jun 1, 2026</span>
          </div>
          <button className="flex items-center gap-1.5 text-xs px-3 rounded-xl cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            style={{ minHeight: '44px', background: C.subtle, border: `1px solid ${C.border}`, color: C.mid }}
            aria-label="Notify me about rebalance">
            <Bell size={12} />Notify me
          </button>
        </div>
      </div>

      {/* Alerts */}
      {!done && driftAlerts.map(({ ticker, severity, message }) => {
        const s = severityStyle[severity];
        return (
          <div key={ticker} className="flex items-center gap-3 px-4 py-3 rounded-xl border"
            style={{ background: s.bg, borderColor: s.border }}>
            <AlertTriangle size={14} style={{ color: s.text }} />
            <span className="text-xs font-mono font-semibold" style={{ color: s.text }}>{ticker}</span>
            <span className="text-xs flex-1" style={{ color: s.text }}>{message}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: `${s.border}60`, color: s.text }}>{s.label}</span>
          </div>
        );
      })}

      {done && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ background: '#DCFCE7', borderColor: '#BBF7D0' }}>
          <CheckCircle size={14} style={{ color: '#16A34A' }} />
          <span className="text-xs font-semibold" style={{ color: '#16A34A' }}>Rebalance plan applied — trades queued for next market open.</span>
        </div>
      )}

      <div className="grid grid-cols-12 gap-4">
        {/* Drift bars */}
        <BentoCard className="col-span-12 md:col-span-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold" style={{ color: C.hi }}>Portfolio Drift</p>
              <p className="text-[10px]" style={{ color: C.low }}>Current vs. target allocation</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-mono font-bold" style={{ color: '#D97706' }}>{totalDrift.toFixed(1)}% total drift</p>
              <p className="text-[10px]" style={{ color: C.low }}>threshold: 2.0%</p>
            </div>
          </div>
          <div className="space-y-4">
            {portfolioHoldings.map(h => <DriftBar key={h.ticker} current={h.currentPct} target={h.targetPct} color={h.color} ticker={h.ticker} />)}
          </div>
        </BentoCard>

        {/* Radar */}
        <BentoCard className="col-span-12 md:col-span-4">
          <p className="text-sm font-semibold mb-1" style={{ color: C.hi }}>Allocation Radar</p>
          <p className="text-[10px] mb-3" style={{ color: C.low }}>Current (gold) vs. Target (violet)</p>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                <PolarGrid stroke="rgba(26,26,26,0.08)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-low)', fontSize: 9 }} />
                <Radar name="Current" dataKey="current" stroke="#F5A623" fill="#F5A623" fillOpacity={0.20} strokeWidth={2} />
                <Radar name="Target"  dataKey="target"  stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="4 2" />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, fontSize: 11, color: 'var(--text-hi)' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-[10px] mt-2" style={{ color: C.low }}>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 inline-block rounded" style={{ background: '#F5A623' }}></span>Current</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 inline-block rounded" style={{ background: '#7C3AED' }}></span>Target</span>
          </div>
        </BentoCard>

        {/* Action panel */}
        <BentoCard className="col-span-12 md:col-span-3 flex flex-col justify-between" accent>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,166,35,0.12)' }}>
                <RefreshCw size={14} style={{ color: C.accent }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: C.hi }}>Rebalance Plan</p>
            </div>
            <div className="space-y-2 mb-4">
              {portfolioHoldings.filter(h => Math.abs(h.drift) > 0.5).map(h => (
                <div key={h.ticker} className="rounded-xl px-3 py-2 flex items-center gap-2" style={{ background: C.subtle, border: `1px solid ${C.border}` }}>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
                    style={h.drift > 0 ? { background: '#FEF9C3', color: '#A16207' } : { background: '#DBEAFE', color: '#1D4ED8' }}>
                    {h.drift > 0 ? 'TRIM' : 'BUY'}
                  </span>
                  <span className="text-xs flex-1" style={{ color: C.hi }}>{h.ticker}</span>
                  <span className="text-xs font-mono font-semibold" style={{ color: h.drift > 0 ? '#D97706' : '#2563EB' }}>
                    {h.drift > 0 ? '-' : '+'}${Math.abs(h.drift * 1485).toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <button onClick={handleRebalance} disabled={runningRebalance || done}
            className="w-full flex items-center justify-center gap-2 rounded-xl text-sm font-semibold cursor-pointer active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-400"
            style={{ minHeight: '44px', background: 'var(--accent)' }}>
            {runningRebalance ? <><RefreshCw size={13} className="animate-spin" />Calculating…</>
              : done ? <><CheckCircle size={13} />Applied</>
              : <><RefreshCw size={13} />Apply Rebalance<ArrowRight size={13} /></>}
          </button>
        </BentoCard>

        {/* History */}
        <BentoCard className="col-span-12">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.low }}>Rebalance History</p>
            <span className="text-[10px]" style={{ color: C.low }}>{rebalanceHistory.length} past events</span>
          </div>
          <div className="space-y-2">
            {rebalanceHistory.map((r, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 rounded-xl" style={{ background: C.subtle, border: `1px solid ${C.border}` }}>
                <CheckCircle size={14} style={{ color: '#16A34A' }} className="shrink-0" />
                <span className="text-xs font-mono w-32 shrink-0" style={{ color: C.mid }}>{r.date}</span>
                <span className="text-xs flex-1" style={{ color: C.hi }}>{r.action}</span>
                <span className="text-xs font-mono font-semibold" style={{ color: C.mid }}>{r.amount}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: '#DCFCE7', color: '#16A34A' }}>{r.status}</span>
              </div>
            ))}
          </div>
        </BentoCard>
      </div>
    </div>
  );
}
