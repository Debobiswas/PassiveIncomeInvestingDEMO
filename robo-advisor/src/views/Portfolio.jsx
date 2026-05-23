import { useState, useRef } from 'react';
import { Plus, Link2, RefreshCw, AlertCircle, ChevronRight, Calendar, Download,
         CheckCircle, ArrowRight, Upload, FileText, X } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { brokerageAccounts, portfolioHoldings, driftAlerts, rebalanceHistory,
         upcomingDates, recentActivity } from '../data/dummy';

const C = { hi: 'var(--text-hi)', mid: 'var(--text-mid)', low: 'var(--text-low)',
            accent: 'var(--accent)', border: 'var(--border)', subtle: 'var(--bg-subtle)' };
const typeColor = { 'Ex-Div': '#F5A623', 'Pay Date': '#16A34A', 'Record': '#7C3AED' };

// ── Custom donut tooltip ──
function DonutTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-xl px-3 py-2 text-xs shadow-lg" style={{ background: 'var(--bg-card)', border: `1px solid ${C.border}` }}>
      <p className="font-mono font-bold" style={{ color: C.hi }}>{d.name}</p>
      <p style={{ color: C.accent }}>{d.value.toFixed(1)}%</p>
    </div>
  );
}

// ── CSV Upload modal ──
function UploadModal({ onClose }) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith('.csv') || f.name.endsWith('.xlsx'))) setFile(f);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="rounded-3xl w-full max-w-md" onClick={e => e.stopPropagation()}
           style={{ background: 'var(--bg-card)', border: `1px solid ${C.border}` }}>

        <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div>
            <p className="font-semibold" style={{ color: C.hi }}>Upload Holdings</p>
            <p className="text-xs mt-0.5" style={{ color: C.low }}>CSV or XLSX · Portfolio Template format</p>
          </div>
          <button onClick={onClose} aria-label="Close"
            className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer"
            style={{ background: 'var(--bg-subtle)', color: C.mid }}>
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Drag-drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className="rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors"
            style={{ borderColor: dragOver ? C.accent : C.border, background: dragOver ? 'rgba(245,166,35,0.05)' : 'transparent' }}>
            <input ref={inputRef} type="file" accept=".csv,.xlsx" className="hidden"
              onChange={e => setFile(e.target.files[0])} aria-label="Upload holdings file" />
            <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center mb-3"
                 style={{ background: 'rgba(245,166,35,0.10)' }}>
              <Upload size={20} style={{ color: C.accent }} />
            </div>
            {file ? (
              <div>
                <p className="text-sm font-semibold" style={{ color: C.hi }}>{file.name}</p>
                <p className="text-xs mt-1" style={{ color: C.low }}>{(file.size / 1024).toFixed(0)} KB · ready to import</p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium" style={{ color: C.hi }}>Drop your file here</p>
                <p className="text-xs mt-1" style={{ color: C.low }}>or click to browse · CSV / XLSX</p>
              </div>
            )}
          </div>

          {/* Template hint */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'var(--bg-subtle)' }}>
            <FileText size={16} style={{ color: C.mid }} />
            <div className="flex-1 text-xs" style={{ color: C.mid }}>
              Use Erica's <strong>Portfolio Template #1</strong> format:<br />
              <span className="font-mono text-[10px]">Symbol | Investment | Shares | Book Price | Yield%</span>
            </div>
          </div>

          <button
            disabled={!file}
            className="w-full rounded-xl text-sm font-semibold text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            style={{ minHeight: '44px', background: C.accent }}>
            {file ? 'Import Holdings' : 'Select a file first'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Rebalance Wizard (M6) ─────────────────────────────────────────────────────
const TRADE_PLAN = [
  { action: 'TRIM', ticker: 'HHIS', amount: 2670, shares: 16, reason: '+1.8% over target' },
  { action: 'TRIM', ticker: 'ZWQT', amount: 1780, shares: 12, reason: '+1.2% over target' },
  { action: 'BUY',  ticker: 'HYLD', amount: 2373, shares: 18, reason: '-1.6% under target' },
  { action: 'BUY',  ticker: 'QQCC', amount: 2076, shares: 20, reason: '-1.4% under target' },
];

function RebalanceWizardModal({ onClose, onComplete }) {
  const [step, setStep] = useState(1); // 1=Review, 2=Trade Plan, 3=Done
  const [copied, setCopied] = useState(false);

  const copyTrades = () => {
    const text = TRADE_PLAN.map(t => `${t.action} ${t.ticker}: ${t.shares} shares (~$${t.amount})`).join('\n');
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="rounded-3xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}
        style={{ background: 'var(--bg-card)', border: `1px solid ${C.border}` }}>

        {/* Header */}
        <div className="px-6 py-5 flex items-center gap-4" style={{ borderBottom: `1px solid ${C.border}` }}>
          {/* Step pills */}
          <div className="flex items-center gap-1.5">
            {[1,2,3].map(s => (
              <div key={s} className="flex items-center gap-1.5">
                <div className="rounded-full flex items-center justify-center text-[10px] font-bold transition-all"
                  style={{
                    width: 24, height: 24,
                    background: step >= s ? 'var(--accent)' : 'var(--bg-subtle)',
                    color: step >= s ? '#fff' : 'var(--text-low)',
                  }}>
                  {step > s ? '✓' : s}
                </div>
                {s < 3 && <div className="w-6 h-0.5 rounded" style={{ background: step > s ? 'var(--accent)' : 'var(--border)' }} />}
              </div>
            ))}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: C.hi }}>
              {step === 1 ? 'Review Drift' : step === 2 ? 'Trade Plan' : 'Rebalance Complete'}
            </p>
            <p className="text-[10px]" style={{ color: C.low }}>
              {step === 1 ? '4 positions off target' : step === 2 ? 'Net zero — no new money needed' : 'Trades queued for next market open'}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close"
            className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer focus-visible:outline-none"
            style={{ background: 'var(--bg-subtle)', color: C.mid }}>
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Step 1: Review */}
          {step === 1 && (
            <>
              <div className="rounded-xl px-4 py-3 text-sm leading-relaxed"
                style={{ background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.20)' }}>
                <p style={{ color: C.hi }}>
                  <strong>HHIS</strong> outperformed (+1.8%) and <strong>HYLD</strong> + <strong>QQCC</strong> underperformed.
                  The plan below brings everything back to 10% target. <strong>No new capital required</strong> — sell a little
                  HHIS and ZWQT, add to HYLD and QQCC.
                </p>
              </div>
              {portfolioHoldings.filter(h => Math.abs(h.drift) > 0.5).map(h => (
                <div key={h.ticker} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ background: 'var(--bg-subtle)', border: `1px solid ${C.border}` }}>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded w-10 text-center"
                    style={h.drift > 0 ? { background: '#FEF9C3', color: '#A16207' } : { background: '#DBEAFE', color: '#1D4ED8' }}>
                    {h.drift > 0 ? 'TRIM' : 'BUY'}
                  </span>
                  <span className="text-sm font-mono font-semibold w-14 shrink-0" style={{ color: C.hi }}>{h.ticker}</span>
                  <div className="flex-1 relative h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-card)' }}>
                    <div className="absolute inset-y-0 rounded-full"
                      style={{
                        left: h.drift > 0 ? '50%' : `${50 + (h.drift / 5) * 50}%`,
                        right: h.drift > 0 ? `${50 - (h.drift / 5) * 50}%` : '50%',
                        background: h.drift > 0 ? '#D97706' : '#2563EB',
                      }} />
                    <div className="absolute top-0 bottom-0 w-0.5" style={{ left: '50%', background: C.border }} />
                  </div>
                  <span className="text-sm font-mono font-semibold w-16 text-right"
                    style={{ color: h.drift > 0 ? '#D97706' : '#2563EB' }}>
                    {h.drift > 0 ? '-' : '+'}${Math.abs(h.drift * 1485).toFixed(0)}
                  </span>
                </div>
              ))}
              <button onClick={() => setStep(2)}
                className="w-full flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white cursor-pointer active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                style={{ minHeight: '44px', background: 'var(--accent)' }}>
                Generate Trade Plan <ChevronRight size={16} />
              </button>
            </>
          )}

          {/* Step 2: Trade Plan */}
          {step === 2 && (
            <>
              <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'var(--bg-subtle)', borderBottom: `1px solid ${C.border}` }}>
                      {['Action', 'Ticker', 'Est. shares', 'Amount', 'Reason'].map(h => (
                        <th key={h} className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-left"
                          style={{ color: C.low }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TRADE_PLAN.map(t => (
                      <tr key={`${t.action}-${t.ticker}`} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded font-mono"
                            style={t.action === 'TRIM'
                              ? { background: '#FEF9C3', color: '#A16207' }
                              : { background: '#DBEAFE', color: '#1D4ED8' }}>
                            {t.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold" style={{ color: C.hi }}>{t.ticker}</td>
                        <td className="px-4 py-3 font-mono" style={{ color: C.mid }}>~{t.shares}</td>
                        <td className="px-4 py-3 font-mono font-semibold"
                          style={{ color: t.action === 'TRIM' ? '#D97706' : '#2563EB' }}>
                          {t.action === 'TRIM' ? '-' : '+'}${t.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: C.low }}>{t.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between px-3 py-2 rounded-lg"
                style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.20)' }}>
                <span className="text-xs font-medium" style={{ color: '#16A34A' }}>Net cash flow</span>
                <span className="text-sm font-bold font-mono" style={{ color: '#16A34A' }}>$0 — fully self-funded</span>
              </div>
              <div className="flex gap-3">
                <button onClick={copyTrades}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl text-sm font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  style={{ minHeight: '44px', background: 'var(--bg-subtle)', color: C.mid, border: `1px solid ${C.border}` }}>
                  {copied ? <><CheckCircle size={14} style={{ color: '#16A34A' }} /> Copied!</> : '📋 Copy trade list'}
                </button>
                <button onClick={() => { setStep(3); onComplete(); }}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white cursor-pointer active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  style={{ minHeight: '44px', background: 'var(--accent)' }}>
                  Confirm &amp; Queue <ChevronRight size={16} />
                </button>
              </div>
            </>
          )}

          {/* Step 3: Done */}
          {step === 3 && (
            <div className="text-center py-4 space-y-5">
              <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
                style={{ background: 'rgba(22,163,74,0.12)' }}>
                <CheckCircle size={28} style={{ color: '#16A34A' }} />
              </div>
              <div>
                <p className="text-lg font-semibold" style={{ color: C.hi }}>Rebalance queued!</p>
                <p className="text-sm mt-1" style={{ color: C.mid }}>
                  4 trades will execute at next market open via Questrade.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Trades queued', value: '4' },
                  { label: 'Capital moved', value: '$4,449' },
                  { label: 'New cash needed', value: '$0' },
                  { label: 'Est. completion', value: 'Tomorrow 9:30am' },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: 'var(--bg-subtle)' }}>
                    <p className="text-xs font-medium" style={{ color: C.low }}>{s.label}</p>
                    <p className="text-sm font-bold font-mono mt-0.5" style={{ color: C.hi }}>{s.value}</p>
                  </div>
                ))}
              </div>
              <button onClick={onClose}
                className="w-full rounded-xl text-sm font-semibold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                style={{ minHeight: '44px', background: 'var(--accent)', color: '#fff' }}>
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Portfolio() {
  const [tab, setTab] = useState('holdings');
  const [rebalanceOpen, setRebalanceOpen] = useState(false);
  const [applied, setApplied] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showWizard, setShowWizard] = useState(false);

  const totalValue = portfolioHoldings.reduce((s, h) => s + h.value, 0);
  const hasDrift = driftAlerts.length > 0 && !applied;

  const tabs = [
    { id: 'holdings',      label: 'Holdings',      count: portfolioHoldings.length },
    { id: 'distributions', label: 'Distributions', count: upcomingDates.length },
    { id: 'activity',      label: 'Activity',      count: recentActivity.length },
  ];

  // Donut chart data from holdings
  const donutData = portfolioHoldings.map(h => ({ name: h.ticker, value: h.currentPct, fill: h.color }));

  return (
    <div className="px-4 py-5 md:px-8 md:py-8 space-y-6">
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
      {showWizard && <RebalanceWizardModal onClose={() => setShowWizard(false)} onComplete={() => setApplied(true)} />}

      {/* ── Top row: value + donut ── */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-5">

        {/* Left: header stats */}
        <div className="col-span-1 md:col-span-2 flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.low }}>Portfolio Value</p>
            <h1 className="text-5xl font-bold mt-2 font-mono leading-none" style={{ color: C.hi }}>
              ${totalValue.toLocaleString()}
            </h1>
            <p className="text-sm mt-2" style={{ color: C.mid }}>
              {portfolioHoldings.length} positions · {brokerageAccounts.filter(a => a.status === 'imported').length} accounts · as of May 1, 2026
            </p>
          </div>

          {/* Quick stat strip */}
          <div className="grid grid-cols-3 gap-2 mt-5">
            {[
              { label: 'Yield',   value: '12.03%', sub: 'on cost',    color: C.accent,  bg: 'rgba(245,166,35,0.08)'  },
              { label: 'Income',  value: '$1,487',  sub: 'per month',  color: '#16A34A', bg: 'rgba(22,163,74,0.08)'   },
              { label: 'Avg MER', value: '0.51%',   sub: 'weighted',  color: C.mid,     bg: 'var(--bg-subtle)'       },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: s.bg }}>
                <p className="text-[9px] uppercase tracking-wider font-semibold mb-1" style={{ color: C.low }}>{s.label}</p>
                <p className="text-sm font-bold font-mono" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[9px] mt-0.5" style={{ color: C.low }}>{s.sub}</p>
              </div>
            ))}
          </div>

          <button onClick={() => setShowUpload(true)}
            className="flex items-center justify-center gap-2 rounded-xl text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 mt-3"
            style={{ minHeight: '44px', background: 'var(--bg-card)', border: `1px solid ${C.border}`, color: C.mid }}>
            <Upload size={14} />Upload Holdings CSV
          </button>
        </div>

        {/* Right: donut chart */}
        <div className="col-span-1 md:col-span-3 card rounded-2xl p-5 flex flex-col">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: C.low }}>
            Portfolio Allocation
          </p>
          {/* Mobile: stacked | Desktop: side-by-side */}
          <div className="flex-1 flex flex-col md:flex-row items-center gap-4">
            <ResponsiveContainer width="100%" height={180} className="md:hidden">
              <PieChart>
                <Pie data={donutData} dataKey="value" innerRadius="50%" outerRadius="75%"
                     paddingAngle={2} startAngle={90} endAngle={-270}>
                  {donutData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip content={<DonutTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <ResponsiveContainer width="55%" height={200} className="hidden md:block">
              <PieChart>
                <Pie data={donutData} dataKey="value" innerRadius="55%" outerRadius="80%"
                     paddingAngle={2} startAngle={90} endAngle={-270}>
                  {donutData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip content={<DonutTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Legend — 2-col grid on mobile, single col on desktop */}
            <div className="w-full md:flex-1 md:space-y-1.5 md:overflow-y-auto grid grid-cols-2 md:grid-cols-1 gap-x-4 gap-y-1.5" style={{ maxHeight: 200 }}>
              {portfolioHoldings.map(h => (
                <div key={h.ticker} className="flex items-center gap-2 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: h.color }} />
                  <span className="text-xs font-mono font-semibold shrink-0" style={{ color: C.hi }}>{h.ticker}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden hidden md:block" style={{ background: 'var(--bg-subtle)' }}>
                    <div className="h-full rounded-full" style={{ width: `${h.currentPct * 4}%`, background: h.color }} />
                  </div>
                  <span className="text-xs font-mono ml-auto" style={{ color: C.mid }}>{h.currentPct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Drift alert ── */}
      {hasDrift && (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(245,166,35,0.35)', background: 'linear-gradient(135deg, rgba(245,166,35,0.08) 0%, rgba(245,166,35,0.03) 100%)' }}>
          <button onClick={() => setRebalanceOpen(o => !o)}
            className="w-full px-5 py-4 flex items-center gap-4 cursor-pointer focus-visible:outline-none">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                 style={{ background: 'rgba(245,166,35,0.15)' }}>
              <AlertCircle size={18} style={{ color: C.accent }} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold" style={{ color: C.hi }}>Rebalance Suggested</p>
              <p className="text-xs mt-0.5" style={{ color: C.mid }}>{driftAlerts.length} positions drifted · tap to see trade plan</p>
            </div>
            <div className="shrink-0 flex items-center gap-1.5">
              <span className="text-[10px] font-semibold px-2 py-1 rounded-full" style={{ background: 'rgba(245,166,35,0.15)', color: C.accent }}>Action needed</span>
              <ChevronRight size={16} style={{ color: C.mid, transform: rebalanceOpen ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 200ms' }} />
            </div>
          </button>

          {rebalanceOpen && (
            <div className="px-5 pb-5 space-y-3">
              {/* Plain-English explanation */}
              <div className="rounded-xl px-4 py-3 text-sm leading-relaxed" style={{ background: 'var(--bg-card)', border: `1px solid ${C.border}` }}>
                <p style={{ color: C.hi }}>
                  Your portfolio drifted because <strong>HHIS</strong> outperformed (+1.8%) and
                  <strong> HYLD</strong> and <strong>QQCC</strong> underperformed. The suggested trades below
                  bring everything back to your 10% target allocation. No new money required — just
                  sell a little HHIS and ZWQT, then add to HYLD and QQCC.
                </p>
              </div>

              {/* Visual drift bars */}
              {portfolioHoldings.filter(h => Math.abs(h.drift) > 0.5).map(h => (
                <div key={h.ticker} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                     style={{ background: 'var(--bg-card)', border: `1px solid ${C.border}` }}>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded w-10 text-center"
                    style={h.drift > 0
                      ? { background: '#FEF9C3', color: '#A16207' }
                      : { background: '#DBEAFE', color: '#1D4ED8' }}>
                    {h.drift > 0 ? 'TRIM' : 'BUY'}
                  </span>
                  <span className="text-sm font-mono font-semibold w-16 shrink-0" style={{ color: C.hi }}>{h.ticker}</span>
                  {/* Drift bar */}
                  <div className="flex-1 relative h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-subtle)' }}>
                    <div className="absolute inset-y-0 rounded-full transition-all"
                      style={{
                        left: h.drift > 0 ? '50%' : `${50 + (h.drift / 5) * 50}%`,
                        right: h.drift > 0 ? `${50 - (h.drift / 5) * 50}%` : '50%',
                        background: h.drift > 0 ? '#D97706' : '#2563EB',
                      }} />
                    <div className="absolute top-0 bottom-0 w-0.5" style={{ left: '50%', background: C.border }} />
                  </div>
                  <span className="text-sm font-mono font-semibold w-20 text-right"
                    style={{ color: h.drift > 0 ? '#D97706' : '#2563EB' }}>
                    {h.drift > 0 ? '-' : '+'}${Math.abs(h.drift * 1485).toFixed(0)}
                  </span>
                </div>
              ))}

              <button onClick={() => setShowWizard(true)}
                className="w-full mt-1 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold cursor-pointer text-white transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                style={{ minHeight: '44px', background: 'var(--accent)' }}>
                <RefreshCw size={14} />Open Rebalance Wizard<ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {applied && (
        <div className="rounded-2xl px-5 py-4 flex items-center gap-3 border" style={{ background: '#DCFCE7', borderColor: '#BBF7D0' }}>
          <CheckCircle size={16} style={{ color: '#16A34A' }} />
          <p className="text-sm font-semibold" style={{ color: '#16A34A' }}>Rebalance applied — trades queued for next market open.</p>
        </div>
      )}

      {/* ── Linked accounts ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.low }}>Linked accounts</p>
          <button className="flex items-center gap-1 text-xs font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded px-2 py-1"
            style={{ color: C.accent }}>
            <Plus size={12} />Import CSV
          </button>
        </div>
        <div className="card rounded-2xl overflow-hidden divide-y" style={{ borderColor: C.border }}>
          {brokerageAccounts.map(acc => {
            const imported = acc.status === 'imported';
            return (
              <div key={acc.id} className="flex items-center gap-3 px-4 py-3.5 transition-colors"
                   style={{ opacity: imported ? 1 : 0.5 }}
                   onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                   onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-bold shrink-0"
                     style={{ background: 'var(--bg-subtle)', color: C.hi }}>{acc.logo}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: C.hi }}>{acc.broker}</p>
                  <p className="text-xs" style={{ color: C.low }}>
                    {acc.accountType} · {imported ? `Updated ${acc.lastImport}` : 'Pending import'}
                  </p>
                </div>
                {imported
                  ? <p className="text-sm font-bold font-mono shrink-0" style={{ color: '#16A34A' }}>${acc.value.toLocaleString()}</p>
                  : <AlertCircle size={14} style={{ color: C.low }} className="shrink-0" />}
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-center mt-3" style={{ color: C.low }}>Holdings imported via CSV · updated monthly · next import due Jun 1</p>
      </section>

      {/* ── Sub-tabs ── */}
      <section>
        <div className="flex items-center gap-1 border-b mb-5" style={{ borderColor: C.border }}>
          {tabs.map(t => {
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="px-4 py-2.5 text-sm font-medium cursor-pointer transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-t-lg"
                style={{ color: active ? C.hi : C.mid }}>
                {t.label}<span className="ml-1.5 text-[10px] font-normal" style={{ color: C.low }}>({t.count})</span>
                {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t" style={{ background: C.accent }} />}
              </button>
            );
          })}
        </div>

        {/* Holdings */}
        {tab === 'holdings' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs" style={{ color: C.low }}>Portfolio #1 · Income ~12% yield · from Erica's DIY Package</p>
              <button onClick={() => setShowUpload(true)}
                className="flex items-center gap-1.5 text-xs font-medium cursor-pointer px-3 py-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                style={{ background: 'var(--bg-subtle)', color: C.mid, minHeight: '36px' }}>
                <Upload size={12} />Import CSV
              </button>
            </div>
            <div className="card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: 420 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    {['Holding', '% of portfolio', 'Value', 'Drift'].map((h, i) => (
                      <th key={h} className={`py-3 px-5 text-[10px] font-semibold uppercase tracking-wider ${i === 0 ? 'text-left' : 'text-right'}`}
                          style={{ color: C.low }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {portfolioHoldings.map(h => (
                    <tr key={h.ticker} className="transition-colors" style={{ borderBottom: `1px solid ${C.border}` }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-8 rounded-full shrink-0" style={{ background: h.color }} />
                          <div>
                            <p className="font-mono font-semibold" style={{ color: C.hi }}>{h.ticker}</p>
                            <p className="text-[11px]" style={{ color: C.low }}>{h.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-5 text-right">
                        <div className="inline-flex items-center gap-2 justify-end">
                          <span className="font-mono text-sm" style={{ color: C.hi }}>{h.currentPct}%</span>
                          <span className="text-[10px]" style={{ color: C.low }}>/ {h.targetPct}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-5 text-right font-mono font-medium" style={{ color: C.hi }}>${h.value.toLocaleString()}</td>
                      <td className="py-3 px-5 text-right">
                        <span className="text-sm font-mono font-semibold"
                          style={{ color: h.drift > 0 ? '#D97706' : h.drift < 0 ? '#2563EB' : '#16A34A' }}>
                          {h.drift > 0 ? '+' : ''}{h.drift.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>{/* /overflow-x-auto */}
            </div>
          </div>
        )}

        {/* Distributions */}
        {tab === 'distributions' && (
          <div className="card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold" style={{ color: C.hi }}>Next 30 days</p>
                <p className="text-[11px] mt-0.5" style={{ color: C.low }}>{upcomingDates.length} upcoming distribution events</p>
              </div>
              <button className="flex items-center gap-1.5 text-xs font-medium cursor-pointer px-3 py-2 rounded-lg"
                      style={{ background: 'var(--bg-subtle)', color: C.mid, minHeight: '36px' }}>
                <Download size={12} />Export CSV
              </button>
            </div>
            <div className="space-y-2">
              {upcomingDates.map(ev => (
                <div key={`${ev.ticker}-${ev.type}`} className="flex items-center gap-3 py-2.5 px-3 rounded-xl transition-colors cursor-pointer"
                     onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                     onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div className="w-1 h-9 rounded-full shrink-0" style={{ background: typeColor[ev.type] }} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-semibold" style={{ color: C.hi }}>{ev.ticker}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                        style={{ color: typeColor[ev.type], background: `${typeColor[ev.type]}15` }}>{ev.type}</span>
                    </div>
                    <p className="text-[11px] mt-0.5" style={{ color: C.low }}>{ev.date} · ${ev.amount}/unit</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-mono font-bold" style={{ color: ev.daysUntil <= 7 ? C.accent : C.hi }}>{ev.daysUntil}</p>
                    <p className="text-[10px]" style={{ color: C.low }}>days</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity */}
        {tab === 'activity' && (
          <div className="card rounded-2xl divide-y" style={{ borderColor: C.border }}>
            {recentActivity.map(item => {
              const isCredit = item.amount > 0;
              return (
                <div key={item.id} className="px-5 py-4 flex items-center gap-3" style={{ borderColor: C.border }}>
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: isCredit ? '#16A34A' : '#DC2626' }} />
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: C.hi }}>
                      <span className="font-mono">{item.ticker}</span>
                      <span className="font-normal ml-2" style={{ color: C.mid }}>· {item.label}</span>
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: C.low }}>{item.date}</p>
                  </div>
                  <p className="text-sm font-semibold font-mono" style={{ color: isCredit ? '#16A34A' : '#DC2626' }}>
                    {isCredit ? '+' : ''}${Math.abs(item.amount).toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Rebalance history ── */}
      {rebalanceHistory.length > 0 && (
        <section>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: C.low }}>Rebalance history</p>
          <div className="card rounded-2xl divide-y" style={{ borderColor: C.border }}>
            {rebalanceHistory.map((r, i) => (
              <div key={i} className="px-5 py-3 flex items-center gap-3" style={{ borderColor: C.border }}>
                <CheckCircle size={14} style={{ color: '#16A34A' }} className="shrink-0" />
                <span className="text-xs font-mono w-28 shrink-0" style={{ color: C.mid }}>{r.date}</span>
                <span className="text-sm flex-1" style={{ color: C.hi }}>{r.action}</span>
                <span className="text-sm font-mono font-semibold" style={{ color: C.mid }}>{r.amount}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
