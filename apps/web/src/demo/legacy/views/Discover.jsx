import { useState, useMemo } from 'react';
import { Search, Star, X, Play, GitCompare, Check, Calendar, ExternalLink } from 'lucide-react';
import { etfsExtended } from '../data/dummy';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

const C = { hi: 'var(--text-hi)', mid: 'var(--text-mid)', low: 'var(--text-low)', accent: 'var(--accent)', border: 'var(--border)', subtle: 'var(--bg-subtle)' };
const TYPES = ['All', 'CDN Covered Call', 'US Covered Call', 'CDN Equity', 'US Equity', 'Fixed Income', 'REIT'];
const FEATURED_TICKERS = ['HDIV', 'HYLD', 'ZWQT', 'HHIS', 'BMAX', 'QQCC'];
const MONTHS_LABELS = ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'];

const DIST_HISTORY = {
  HDIV: [0.182, 0.183, 0.183, 0.184, 0.182, 0.182],
  HYLD: [0.197, 0.198, 0.199, 0.200, 0.200, 0.201],
  ZWQT: [0.093, 0.094, 0.095, 0.095, 0.096, 0.096],
  HHIS: [0.141, 0.142, 0.143, 0.144, 0.144, 0.145],
  BMAX: [0.116, 0.117, 0.117, 0.118, 0.118, 0.118],
  QQCC: [0.132, 0.134, 0.135, 0.137, 0.138, 0.138],
};

const VIDEOS = {
  HDIV:  { title: 'HDIV Review: Is this the BEST All-in-One Covered Call ETF?', duration: '8:42' },
  HYLD:  { title: 'HYLD vs USCL: Which US Covered Call ETF Wins in 2026?', duration: '6:15' },
  ZWQT:  { title: 'BMO ZWQT Full Analysis — Global Income Fund Deep Dive', duration: '5:58' },
  HHIS:  { title: 'HHIS Review: Harvest High Income Shares Breakdown', duration: '7:21' },
  BMAX:  { title: 'BMAX: Brompton\'s Premium Multi-Asset Income ETF', duration: '4:45' },
  QQCC:  { title: 'QQCC vs QYLD: Canadian vs US NASDAQ Covered Call', duration: '9:03' },
};

function Stars({ n }) {
  return (
    <div className="flex gap-0.5">
      {[0, 1, 2, 3, 4].map(i => (
        <Star key={i} size={11}
          fill={i < n ? '#F5A623' : 'transparent'}
          stroke={i < n ? '#F5A623' : '#D4D4D4'}
          strokeWidth={1.5} />
      ))}
    </div>
  );
}

// ── Screener Tab ──────────────────────────────────────────────────────────────
function ScreenerTab({ selected, toggleSelect, setDetail }) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('All');
  const [minYield, setMinYield] = useState(0);

  const filtered = useMemo(() => etfsExtended.filter(e =>
    (type === 'All' || e.type === type) &&
    e.yield >= minYield &&
    (query === '' || e.ticker.toLowerCase().includes(query.toLowerCase()) || e.name.toLowerCase().includes(query.toLowerCase()))
  ), [query, type, minYield]);

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: C.low }} />
        <input value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search by ticker or name…"
          aria-label="Search ETFs"
          className="w-full pl-12 pr-4 rounded-2xl text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          style={{ minHeight: '52px', background: 'var(--bg-card)', border: `1px solid ${C.border}`, color: C.hi }} />
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Type pills — scrollable row on mobile */}
        <div className="hide-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {TYPES.map(t => (
            <button key={t} onClick={() => setType(t)}
              className="px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 shrink-0"
              style={{
                background: type === t ? 'rgba(245,166,35,0.12)' : 'transparent',
                color: type === t ? C.accent : C.mid,
                border: `1px solid ${type === t ? 'rgba(245,166,35,0.30)' : C.border}`,
                touchAction: 'manipulation',
                minHeight: '36px',
              }}>
              {t}
            </button>
          ))}
        </div>
        {/* Min yield — full row */}
        <div className="flex items-center gap-3">
          <span className="text-xs shrink-0" style={{ color: C.mid }}>Min yield</span>
          <input type="range" min="0" max="14" step="0.5" value={minYield}
            onChange={e => setMinYield(parseFloat(e.target.value))}
            className="flex-1 accent-amber-500 cursor-pointer" aria-label="Minimum yield" />
          <span className="text-xs font-mono font-semibold w-10 text-right" style={{ color: C.accent }}>{minYield}%</span>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.low }}>{filtered.length} results</p>
        {selected.length > 0 && (
          <p className="text-xs" style={{ color: C.mid }}>{selected.length} selected · switch to Compare tab</p>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm" style={{ color: C.mid }}>No matches. Try a different filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(etf => {
            const isSelected = selected.includes(etf.ticker);
            return (
              <div key={`${etf.ticker}-${etf.manager}`}
                onClick={() => setDetail(etf)}
                className="card rounded-2xl p-5 cursor-pointer flex flex-col gap-3 relative"
                style={{ transition: 'transform 180ms ease, box-shadow 180ms ease' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>

                <button
                  onClick={e => { e.stopPropagation(); toggleSelect(etf.ticker); }}
                  aria-label={isSelected ? `Remove ${etf.ticker}` : `Add ${etf.ticker} to compare`}
                  className="absolute top-4 right-4 w-6 h-6 rounded-md flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  style={{ background: isSelected ? C.accent : 'transparent', border: `1.5px solid ${isSelected ? C.accent : C.border}` }}>
                  {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                </button>

                <div className="flex items-center gap-1.5 flex-wrap pr-8">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--bg-subtle)', color: C.mid }}>{etf.type}</span>
                  {etf.coveredCall && <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(245,166,35,0.10)', color: C.accent }}>Cov. Call</span>}
                </div>

                <div>
                  <p className="text-lg font-mono font-bold leading-tight" style={{ color: C.hi }}>{etf.ticker}</p>
                  <p className="text-xs mt-0.5 leading-snug" style={{ color: C.mid, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{etf.name}</p>
                  <p className="text-[10px] mt-1 font-medium" style={{ color: C.low }}>{etf.manager}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-auto">
                  <div className="rounded-xl p-2.5 text-center" style={{ background: 'var(--bg-subtle)' }}>
                    <p className="text-lg font-bold font-mono" style={{ color: C.accent }}>{etf.yield}%</p>
                    <p className="text-[10px] mt-0.5 font-medium uppercase tracking-wide" style={{ color: C.low }}>Yield</p>
                  </div>
                  <div className="rounded-xl p-2.5 text-center" style={{ background: 'var(--bg-subtle)' }}>
                    <p className="text-lg font-bold font-mono" style={{ color: C.hi }}>{etf.mer}%</p>
                    <p className="text-[10px] mt-0.5 font-medium uppercase tracking-wide" style={{ color: C.low }}>MER</p>
                  </div>
                </div>
                <p className="text-[10px] text-center" style={{ color: C.low }}>{etf.payout} distributions</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Dashboard Tab ─────────────────────────────────────────────────────────────
function DashboardTab({ setDetail }) {
  const featuredEtfs = FEATURED_TICKERS
    .map(t => etfsExtended.find(e => e.ticker === t && !e.usListed))
    .filter(Boolean);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold" style={{ color: C.hi }}>Erica's Featured ETFs</p>
        <p className="text-xs mt-0.5" style={{ color: C.low }}>Curated picks from the DIY Investing Package · Stats updated monthly</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {featuredEtfs.map(etf => {
          const histRaw = DIST_HISTORY[etf.ticker] || [];
          const chartData = MONTHS_LABELS.map((m, i) => ({ m, v: histRaw[i] ?? 0 }));
          const video = VIDEOS[etf.ticker];
          // Rough days-until-ex-div from exDate (demo only)
          const exDay = parseInt((etf.exDate || '').split(' ')[1]) || 28;
          const daysLeft = Math.max(1, exDay - 23);

          return (
            <div key={etf.ticker} className="card rounded-2xl p-5 flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xl font-mono font-bold" style={{ color: C.hi }}>{etf.ticker}</p>
                    <Stars n={etf.stars} />
                  </div>
                  <p className="text-xs leading-snug" style={{ color: C.mid, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{etf.name}</p>
                  <p className="text-[10px] mt-1 font-medium" style={{ color: C.low }}>{etf.manager} · {etf.payout}</p>
                </div>
                <button onClick={() => setDetail(etf)}
                  className="shrink-0 text-xs font-medium cursor-pointer px-3 py-1.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  style={{ background: 'var(--bg-subtle)', color: C.mid, minHeight: '32px' }}>
                  Details
                </button>
              </div>

              {/* Key stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl p-2.5 text-center" style={{ background: 'var(--bg-subtle)' }}>
                  <p className="text-base font-bold font-mono" style={{ color: C.accent }}>{etf.yield}%</p>
                  <p className="text-[9px] uppercase tracking-wide font-medium" style={{ color: C.low }}>Yield</p>
                </div>
                <div className="rounded-xl p-2.5 text-center" style={{ background: 'var(--bg-subtle)' }}>
                  <p className="text-base font-bold font-mono" style={{ color: C.hi }}>{etf.mer}%</p>
                  <p className="text-[9px] uppercase tracking-wide font-medium" style={{ color: C.low }}>MER</p>
                </div>
                <div className="rounded-xl p-2.5 text-center"
                  style={{ background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.18)' }}>
                  <p className="text-base font-bold font-mono" style={{ color: '#16A34A' }}>{daysLeft}d</p>
                  <p className="text-[9px] uppercase tracking-wide font-medium" style={{ color: C.low }}>Ex-Div</p>
                </div>
              </div>

              {/* Distribution bar chart */}
              {histRaw.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.low }}>
                    Distribution $/unit · last 6 months
                  </p>
                  <div style={{ height: 56 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }} barSize={10}>
                        <XAxis dataKey="m" tick={{ fontSize: 9, fill: 'var(--text-low)' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          formatter={v => [`$${Number(v).toFixed(3)}`, 'Per unit']}
                          contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }}
                          cursor={{ fill: 'rgba(245,166,35,0.06)' }} />
                        <Bar dataKey="v" fill="#F5A623" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* YouTube analysis stub */}
              {video && (
                <div className="rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-colors"
                  style={{ background: 'var(--bg-subtle)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-subtle)'}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#FEE2E2' }}>
                    <Play size={13} style={{ color: '#EF4444' }} fill="#EF4444" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium leading-snug" style={{ color: C.hi, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{video.title}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: C.low }}>{video.duration} · YouTube</p>
                  </div>
                  <ExternalLink size={12} style={{ color: C.low }} className="shrink-0" />
                </div>
              )}

              {/* Date row */}
              <div className="flex items-center gap-1.5 text-[10px]" style={{ color: C.low }}>
                <Calendar size={10} />
                <span>Ex-div <span className="font-medium" style={{ color: C.mid }}>{etf.exDate}</span></span>
                <span className="mx-1 opacity-40">·</span>
                <span>Pay <span className="font-medium" style={{ color: C.mid }}>{etf.payDate}</span></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Compare Tab ───────────────────────────────────────────────────────────────
function CompareTab({ selected, selectedEtfs, toggleSelect }) {
  if (selected.length < 2) {
    return (
      <div className="py-24 flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'var(--bg-subtle)' }}>
          <GitCompare size={28} style={{ color: C.low }} />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold" style={{ color: C.hi }}>Select ETFs to compare</p>
          <p className="text-xs mt-1" style={{ color: C.mid }}>Go to Screener, tick 2–4 ETFs using the checkbox, then return here.</p>
        </div>
      </div>
    );
  }

  const METRICS = [
    { key: 'yield',   label: 'Distribution Yield',  fmt: v => `${v}%`,  winner: 'high' },
    { key: 'mer',     label: 'MER',                  fmt: v => `${v}%`,  winner: 'low'  },
    { key: 'payout',  label: 'Payout Frequency',     fmt: v => v,        winner: null   },
    { key: 'type',    label: 'Category',             fmt: v => v,        winner: null   },
    { key: 'sector',  label: 'Sector',               fmt: v => v,        winner: null   },
    { key: 'region',  label: 'Region',               fmt: v => v,        winner: null   },
    { key: 'exDate',  label: 'Next Ex-Div Date',     fmt: v => v,        winner: null   },
    { key: 'payDate', label: 'Next Pay Date',        fmt: v => v,        winner: null   },
  ];

  const maxYield = Math.max(...selectedEtfs.map(e => e.yield));
  const minMer   = Math.min(...selectedEtfs.map(e => e.mer));

  const clearAll = () => selected.slice().forEach(t => toggleSelect(t));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold" style={{ color: C.hi }}>Comparing {selected.length} ETFs</p>
        <button onClick={clearAll}
          className="text-xs font-medium cursor-pointer px-3 py-1.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          style={{ background: 'var(--bg-subtle)', color: C.mid }}>
          Clear all
        </button>
      </div>

      {/* Visual yield bars */}
      <div className="card rounded-2xl p-5">
        <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: C.low }}>Yield comparison</p>
        <div className="space-y-2.5">
          {selectedEtfs.map(etf => (
            <div key={etf.ticker} className="flex items-center gap-3">
              <p className="text-xs font-mono font-bold w-12 shrink-0" style={{ color: C.hi }}>{etf.ticker}</p>
              <div className="flex-1 h-7 rounded-lg overflow-hidden" style={{ background: 'var(--bg-subtle)' }}>
                <div className="h-full rounded-lg flex items-center px-2.5 transition-all duration-700"
                  style={{
                    width: `${(etf.yield / maxYield) * 100}%`,
                    background: etf.yield === maxYield ? 'rgba(245,166,35,0.75)' : 'rgba(245,166,35,0.25)',
                    minWidth: '3rem',
                  }}>
                  <span className="text-xs font-bold font-mono" style={{ color: etf.yield === maxYield ? '#78350F' : C.hi }}>{etf.yield}%</span>
                </div>
              </div>
              <p className="text-[10px] w-16 shrink-0 text-right" style={{ color: C.low }}>MER {etf.mer}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Full comparison table */}
      <div className="card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: 480 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid var(--border)` }}>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: C.low, width: 160 }}>Metric</th>
                {selectedEtfs.map(etf => (
                  <th key={`${etf.ticker}-${etf.manager}`} className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <p className="text-sm font-mono font-bold" style={{ color: C.hi }}>{etf.ticker}</p>
                      <button onClick={() => toggleSelect(etf.ticker)}
                        className="text-[10px] cursor-pointer px-2 py-0.5 rounded focus-visible:outline-none"
                        style={{ color: C.low, background: 'var(--bg-subtle)' }}>
                        Remove
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRICS.map(m => (
                <tr key={m.key} style={{ borderBottom: `1px solid var(--border)` }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td className="px-5 py-3 text-xs font-medium" style={{ color: C.mid }}>{m.label}</td>
                  {selectedEtfs.map(etf => {
                    const val = etf[m.key];
                    const formatted = m.fmt(val);
                    const isBest = (m.winner === 'high' && val === maxYield) || (m.winner === 'low' && val === minMer);
                    return (
                      <td key={`${etf.ticker}-${etf.manager}`} className="px-4 py-3 text-center">
                        <span className="text-sm font-medium font-mono"
                          style={{
                            color: isBest ? '#16A34A' : C.hi,
                            background: isBest ? 'rgba(22,163,74,0.10)' : 'transparent',
                            padding: isBest ? '2px 8px' : 0,
                            borderRadius: isBest ? 99 : 0,
                          }}>
                          {formatted}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Star ratings grid */}
      <div className="card rounded-2xl p-5">
        <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: C.low }}>Erica's rating</p>
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(selectedEtfs.length, 4)}, 1fr)` }}>
          {selectedEtfs.map(etf => (
            <div key={`${etf.ticker}-${etf.manager}`} className="rounded-xl p-3 text-center" style={{ background: 'var(--bg-subtle)' }}>
              <p className="text-base font-mono font-bold mb-1.5" style={{ color: C.hi }}>{etf.ticker}</p>
              <div className="flex justify-center"><Stars n={etf.stars} /></div>
              <p className="text-[10px] mt-1.5" style={{ color: C.mid }}>{etf.manager}</p>
              {etf.coveredCall && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full mt-1.5 inline-block font-medium"
                  style={{ background: 'rgba(245,166,35,0.10)', color: C.accent }}>Cov. Call</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Discover ─────────────────────────────────────────────────────────────
export default function Discover() {
  const [tab, setTab] = useState('screener');
  const [selected, setSelected] = useState([]);
  const [detail, setDetail] = useState(null);

  const toggleSelect = ticker => {
    setSelected(prev => prev.includes(ticker)
      ? prev.filter(t => t !== ticker)
      : prev.length >= 4 ? prev : [...prev, ticker]);
  };

  const selectedEtfs = etfsExtended.filter(e => selected.includes(e.ticker) && !e.usListed)
    .concat(etfsExtended.filter(e => selected.includes(e.ticker) && e.usListed))
    .filter((e, i, arr) => arr.findIndex(x => x.ticker === e.ticker && x.manager === e.manager) === i);

  const TABS = [
    { id: 'screener',  label: 'Screener',  badge: `${etfsExtended.length} ETFs` },
    { id: 'dashboard', label: 'Dashboard', badge: '6 featured' },
    { id: 'compare',   label: 'Compare',   badge: selected.length > 0 ? `${selected.length} selected` : '2–4 ETFs' },
  ];

  return (
    <div className="px-4 py-5 md:px-8 md:py-8 space-y-6 pb-32">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-low)' }}>Discover</p>
        <h1 className="text-3xl font-bold mt-1" style={{ color: 'var(--text-hi)' }}>Find your next ETF</h1>
        <p className="text-sm mt-1.5" style={{ color: 'var(--text-mid)' }}>{etfsExtended.length} income ETFs · sourced from Erica's DIY Investing Package</p>
      </header>

      {/* Tab bar */}
      <div className="overflow-x-auto -mx-1 px-1">
      <div className="flex gap-1 p-1 rounded-2xl"
        style={{ background: 'var(--bg-card)', border: `1px solid ${C.border}`, width: 'fit-content' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-2 px-5 rounded-xl cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            style={{
              minHeight: '40px',
              background: tab === t.id ? 'var(--bg-page)' : 'transparent',
              color: tab === t.id ? C.accent : C.mid,
              fontWeight: tab === t.id ? 700 : 500,
              fontSize: '0.875rem',
              boxShadow: tab === t.id ? '0 1px 6px rgba(0,0,0,0.08)' : 'none',
            }}>
            {t.label}
            <span className="text-[10px] px-1.5 py-0.5 rounded-full"
              style={{
                background: tab === t.id ? 'rgba(245,166,35,0.14)' : 'var(--bg-subtle)',
                color: tab === t.id ? C.accent : C.low,
              }}>
              {t.badge}
            </span>
          </button>
        ))}
      </div>
      </div>{/* /overflow-x-auto */}

      {/* Content */}
      {tab === 'screener'  && <ScreenerTab selected={selected} toggleSelect={toggleSelect} setDetail={setDetail} />}
      {tab === 'dashboard' && <DashboardTab setDetail={setDetail} />}
      {tab === 'compare'   && <CompareTab selected={selected} selectedEtfs={selectedEtfs} toggleSelect={toggleSelect} />}

      {/* Floating compare drawer — only on Screener when 2+ picked */}
      {tab === 'screener' && selected.length >= 2 && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-30 rounded-2xl shadow-xl px-5 py-4 flex items-center gap-4"
          style={{ background: 'var(--bg-card)', border: `1px solid ${C.border}`, boxShadow: '0 10px 40px rgba(0,0,0,0.15)' }}>
          <GitCompare size={16} style={{ color: C.accent }} />
          <p className="text-sm font-medium" style={{ color: C.hi }}>{selected.length} ETFs selected</p>
          <div className="flex gap-1.5">
            {selected.map(t => (
              <span key={t} className="text-[10px] font-mono px-2 py-1 rounded" style={{ background: 'var(--bg-subtle)', color: C.hi }}>{t}</span>
            ))}
          </div>
          <button onClick={() => setTab('compare')}
            className="text-xs font-semibold text-white px-4 rounded-xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            style={{ background: C.accent, minHeight: '40px' }}>
            Compare →
          </button>
          <button onClick={() => setSelected([])}
            className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer focus-visible:outline-none"
            style={{ background: 'var(--bg-subtle)', color: C.low }}
            aria-label="Clear selection">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setDetail(null)}>
          <div className="rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)' }}>
            <div className="p-6 flex items-start justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
              <div>
                <p className="text-2xl font-mono font-bold" style={{ color: C.hi }}>{detail.ticker}</p>
                <p className="text-sm mt-1" style={{ color: C.mid }}>{detail.name}</p>
                <p className="text-[11px] mt-0.5 font-medium" style={{ color: C.low }}>{detail.manager} · {detail.payout} · {detail.region}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Stars n={detail.stars} />
                  {detail.coveredCall && <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(245,166,35,0.10)', color: C.accent }}>Covered Call</span>}
                  {detail.usListed && <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--bg-subtle)', color: C.mid }}>US Listed</span>}
                </div>
              </div>
              <button onClick={() => setDetail(null)} aria-label="Close"
                className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                style={{ background: 'var(--bg-subtle)', color: C.mid }}>
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Yield',  value: `${detail.yield}%`, color: C.accent },
                  { label: 'MER',    value: `${detail.mer}%`,   color: C.hi },
                  { label: 'Sector', value: detail.sector,       color: C.hi },
                ].map(s => (
                  <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: 'var(--bg-subtle)' }}>
                    <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.low }}>{s.label}</p>
                    <p className="text-lg font-bold font-mono mt-1" style={{ color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: C.low }}>Next dividend dates</p>
                <div className="grid grid-cols-3 gap-2">
                  {[['Ex-Date', detail.exDate], ['Record', detail.recDate], ['Pay', detail.payDate]].map(([l, v]) => (
                    <div key={l} className="rounded-lg p-2" style={{ background: 'var(--bg-subtle)' }}>
                      <p className="text-[10px]" style={{ color: C.low }}>{l}</p>
                      <p className="font-medium mt-0.5 text-xs" style={{ color: C.hi }}>{v}</p>
                    </div>
                  ))}
                </div>
              </div>

              {VIDEOS[detail.ticker] && (
                <div className="rounded-xl p-4 flex items-center gap-3 cursor-pointer" style={{ background: 'var(--bg-subtle)' }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#FEE2E2' }}>
                    <Play size={16} style={{ color: '#EF4444' }} fill="#EF4444" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: C.hi }}>Watch Erica's analysis</p>
                    <p className="text-[11px]" style={{ color: C.low }}>{VIDEOS[detail.ticker].duration} · YouTube</p>
                  </div>
                  <button className="text-xs font-medium cursor-pointer" style={{ color: C.accent }}>Watch →</button>
                </div>
              )}

              <button
                onClick={() => { toggleSelect(detail.ticker); setDetail(null); }}
                className="w-full flex items-center justify-center gap-2 rounded-xl text-sm font-semibold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                style={{
                  minHeight: '44px',
                  background: selected.includes(detail.ticker) ? 'var(--bg-subtle)' : C.accent,
                  color: selected.includes(detail.ticker) ? C.hi : '#fff',
                }}>
                {selected.includes(detail.ticker)
                  ? 'Remove from compare'
                  : <><GitCompare size={14} />&nbsp;Add to compare</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
