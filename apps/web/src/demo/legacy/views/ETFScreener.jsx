import { useState } from 'react';
import { Search, SlidersHorizontal, Star, ExternalLink, TrendingUp, ChevronUp, ChevronDown, X, Play, GitCompare, Check } from 'lucide-react';
import BentoCard from '../components/BentoCard';
import { etfsExtended } from '../data/dummy';

const TYPES = ['All', 'CDN Equity', 'US Equity', 'REIT', 'Bond', 'Preferred'];
const C = { hi: 'var(--text-hi)', mid: 'var(--text-mid)', low: 'var(--text-low)', accent: 'var(--accent)', border: 'var(--border)', subtle: 'var(--bg-subtle)' };

function StarRating({ count }) {
  return <div className="flex gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} size={10} style={{ color: i <= count ? '#F5A623' : '#E5E5E5', fill: i <= count ? '#F5A623' : 'transparent' }} />)}</div>;
}

function SortIcon({ col, sort }) {
  if (sort.col !== col) return <ChevronUp size={11} style={{ color: '#D0D0D0' }} />;
  return sort.dir === 'asc' ? <ChevronUp size={11} style={{ color: C.accent }} /> : <ChevronDown size={11} style={{ color: C.accent }} />;
}

function DeepDiveModal({ etf, onClose, onCompare, compareList }) {
  const inCompare = compareList.includes(etf.ticker);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(26,26,26,0.35)', backdropFilter: 'blur(4px)' }} />
      <div className="relative z-10 rounded-3xl w-full max-w-2xl shadow-2xl" style={{ background: '#fff', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(245,166,35,0.10)', border: '1px solid rgba(245,166,35,0.20)' }}>
              <span className="text-xs font-bold font-mono" style={{ color: C.accent }}>{etf.ticker.replace('.TO','').slice(0,4)}</span>
            </div>
            <div>
              <h2 className="text-base font-semibold" style={{ color: C.hi }}>{etf.ticker}</h2>
              <p className="text-xs" style={{ color: C.low }}>{etf.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onCompare(etf.ticker)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl cursor-pointer transition-all duration-200"
              style={inCompare
                ? { background: 'rgba(124,58,237,0.10)', border: '1px solid rgba(124,58,237,0.25)', color: '#7C3AED' }
                : { background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: C.mid }}>
              {inCompare ? <Check size={11} /> : <GitCompare size={11} />}
              {inCompare ? 'Added' : 'Compare'}
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-colors"
              style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: C.mid }}>
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-2 gap-4">
          <div className="col-span-2 grid grid-cols-4 gap-3">
            {[
              { label: 'Dist. Yield', value: `${etf.yield.toFixed(2)}%`, good: etf.yield >= 5 },
              { label: 'MER',         value: `${etf.mer.toFixed(2)}%`,   good: etf.mer <= 0.40 },
              { label: 'AUM',         value: etf.aum,                    good: null },
              { label: 'Type',        value: etf.type,                   good: null },
            ].map(({ label, value, good }) => (
              <div key={label} className="rounded-xl p-3" style={{ background: C.subtle }}>
                <p className="text-[9px] uppercase tracking-wider mb-1" style={{ color: C.low }}>{label}</p>
                <p className="text-sm font-bold font-mono" style={{ color: good === true ? '#16A34A' : good === false ? '#DC2626' : C.hi }}>{value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl p-4" style={{ background: C.subtle }}>
            <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: C.low }}>Key Dates</p>
            {[
              { label: 'Ex-Dividend', date: etf.exDate, color: '#F5A623' },
              { label: 'Record Date', date: etf.recDate, color: '#7C3AED' },
              { label: 'Pay Date',    date: etf.payDate, color: '#16A34A' },
            ].map(({ label, date, color }) => (
              <div key={label} className="flex items-center justify-between mb-2">
                <span className="text-xs" style={{ color: C.mid }}>{label}</span>
                <span className="text-xs font-mono font-semibold" style={{ color }}>{date}, 2026</span>
              </div>
            ))}
          </div>

          <div className="rounded-2xl p-4 flex flex-col gap-2" style={{ background: C.subtle }}>
            <div className="flex items-center gap-2 mb-1">
              <Play size={12} className="fill-red-500" style={{ color: '#EF4444' }} />
              <p className="text-[10px] uppercase tracking-wider" style={{ color: C.low }}>Deep Dive Video</p>
            </div>
            <div className="relative rounded-xl overflow-hidden flex items-center justify-center aspect-video" style={{ background: '#1A1A1A' }}>
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                  <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[10px] border-l-white ml-1" />
                </div>
                <p className="text-[10px] text-white/60">{etf.ticker} Full Analysis</p>
              </div>
            </div>
            <p className="text-[9px] text-center" style={{ color: C.low }}>Embedded from Erica's channel</p>
          </div>

          <div className="col-span-2 flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: C.subtle }}>
            <span className="text-xs" style={{ color: C.mid }}>Advisor Rating</span>
            <StarRating count={etf.stars} />
            <span className="text-xs" style={{ color: C.low }}>{etf.stars}/5 · yield, MER, AUM, stability</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComparePanel({ tickers, etfs, onRemove, onClear }) {
  const items = tickers.map(t => etfs.find(e => e.ticker === t)).filter(Boolean);
  if (items.length < 2) return null;
  const fields = [
    { label: 'Yield', key: 'yield', fmt: v => `${v.toFixed(2)}%`, best: 'max' },
    { label: 'MER',   key: 'mer',   fmt: v => `${v.toFixed(2)}%`, best: 'min' },
    { label: 'AUM',   key: 'aum',   fmt: v => v,                   best: null  },
    { label: 'Stars', key: 'stars', fmt: v => '★'.repeat(v),      best: 'max' },
  ];
  const getBest = (key, dir) => { if (!dir) return null; const vals = items.map(e => e[key]); return dir === 'max' ? Math.max(...vals) : Math.min(...vals); };

  return (
    <BentoCard className="overflow-hidden p-0" style={{ border: '1px solid rgba(124,58,237,0.20)' }}>
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid var(--border)', background: 'rgba(124,58,237,0.04)' }}>
        <div className="flex items-center gap-2">
          <GitCompare size={13} style={{ color: '#7C3AED' }} />
          <p className="text-xs font-semibold" style={{ color: '#7C3AED' }}>Side-by-Side Comparison</p>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'rgba(124,58,237,0.10)', color: '#7C3AED' }}>{items.length} ETFs</span>
        </div>
        <button onClick={onClear} className="text-[10px] cursor-pointer transition-colors" style={{ color: C.low }}>Clear</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th className="text-left pl-5 py-2.5 text-[10px] font-medium uppercase tracking-wider" style={{ color: C.low }}>Metric</th>
              {items.map(e => (
                <th key={e.ticker} className="text-center py-2.5 px-4 min-w-28">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xs font-mono font-semibold" style={{ color: C.hi }}>{e.ticker}</span>
                    <button onClick={() => onRemove(e.ticker)} className="cursor-pointer transition-colors" style={{ color: C.low }}><X size={10} /></button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fields.map(({ label, key, fmt, best }) => {
              const bestVal = getBest(key, best);
              return (
                <tr key={key} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="pl-5 py-2.5" style={{ color: C.mid }}>{label}</td>
                  {items.map(e => {
                    const isBest = bestVal !== null && e[key] === bestVal;
                    return (
                      <td key={e.ticker} className="text-center py-2.5 px-4">
                        <span className="font-mono text-xs" style={{ color: isBest ? '#16A34A' : C.mid, fontWeight: isBest ? 600 : 400 }}>
                          {fmt(e[key])}{isBest && ' ✓'}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </BentoCard>
  );
}

export default function ETFScreener() {
  const [search, setSearch]           = useState('');
  const [activeType, setActiveType]   = useState('All');
  const [minYield, setMinYield]       = useState('');
  const [maxMer, setMaxMer]           = useState('');
  const [sort, setSort]               = useState({ col: 'yield', dir: 'desc' });
  const [deepDive, setDeepDive]       = useState(null);
  const [compareList, setCompareList] = useState([]);

  const handleSort = (col) => setSort(s => s.col === col ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'desc' });
  const toggleCompare = (ticker) => setCompareList(prev => prev.includes(ticker) ? prev.filter(t => t !== ticker) : prev.length < 4 ? [...prev, ticker] : prev);

  const filtered = etfsExtended
    .filter(e => {
      const q = search.toLowerCase();
      return (e.ticker.toLowerCase().includes(q) || e.name.toLowerCase().includes(q)) &&
        (activeType === 'All' || e.type === activeType) &&
        (minYield === '' || e.yield >= parseFloat(minYield)) &&
        (maxMer === '' || e.mer <= parseFloat(maxMer));
    })
    .sort((a, b) => (sort.dir === 'asc' ? 1 : -1) * (a[sort.col] - b[sort.col]));

  const inputStyle = { background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-hi)' };
  const inputFocus = e => { e.target.style.borderColor = 'rgba(245,166,35,0.45)'; e.target.style.background = '#fff'; };
  const inputBlur  = e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--bg-subtle)'; };

  return (
    <div className="p-6 space-y-4">
      {deepDive && <DeepDiveModal etf={deepDive} onClose={() => setDeepDive(null)} onCompare={toggleCompare} compareList={compareList} />}

      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: C.hi }}>ETF Screener</h1>
          <p className="text-sm mt-0.5" style={{ color: C.mid }}>{filtered.length} of {etfsExtended.length} ETFs · Sorted by {sort.col}</p>
        </div>
        <div className="flex items-center gap-3">
          {compareList.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full" style={{ background: 'rgba(124,58,237,0.10)', color: '#7C3AED', border: '1px solid rgba(124,58,237,0.20)' }}>
              <GitCompare size={11} />{compareList.length} selected
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs" style={{ color: C.low }}>
            <TrendingUp size={13} style={{ color: C.accent }} />
            Data refreshed May 21, 2026
          </div>
        </div>
      </div>

      {/* Filters */}
      <BentoCard className="flex-col gap-3">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.low }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ticker or name…"
              className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none transition-all duration-200"
              style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: C.low }}>Min %</span>
            <input type="number" value={minYield} onChange={e => setMinYield(e.target.value)} placeholder="Yield"
              className="w-28 rounded-xl pl-12 pr-3 py-2.5 text-sm focus:outline-none transition-all duration-200"
              style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: C.low }}>MER ≤</span>
            <input type="number" value={maxMer} onChange={e => setMaxMer(e.target.value)} step="0.01"
              className="w-28 rounded-xl pl-14 pr-3 py-2.5 text-sm focus:outline-none transition-all duration-200"
              style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
          </div>
          <div className="flex items-center gap-1.5 text-xs ml-auto" style={{ color: C.low }}>
            <SlidersHorizontal size={12} />{filtered.length} results
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {TYPES.map(t => (
            <button key={t} onClick={() => setActiveType(t)}
              className="text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-all duration-200"
              style={activeType === t
                ? { background: 'rgba(245,166,35,0.12)', borderColor: 'rgba(245,166,35,0.30)', color: C.accent }
                : { background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: C.mid }}>
              {t}
            </button>
          ))}
        </div>
      </BentoCard>

      {compareList.length >= 2 && <ComparePanel tickers={compareList} etfs={etfsExtended} onRemove={t => setCompareList(p => p.filter(x => x !== t))} onClear={() => setCompareList([])} />}

      {/* Table */}
      <BentoCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {[
                  { key: null,    label: 'ETF',     cls: 'text-left pl-5 py-3 w-64' },
                  { key: 'yield', label: 'Yield',   cls: 'text-right py-3 cursor-pointer select-none' },
                  { key: 'mer',   label: 'MER',     cls: 'text-right py-3 cursor-pointer select-none' },
                  { key: null,    label: 'Type',    cls: 'text-center py-3' },
                  { key: null,    label: 'Ex-Date', cls: 'text-center py-3' },
                  { key: null,    label: 'Rating',  cls: 'text-center py-3' },
                  { key: null,    label: 'Compare', cls: 'text-center py-3' },
                  { key: null,    label: 'Action',  cls: 'text-center pr-5 py-3' },
                ].map(({ key, label, cls }) => (
                  <th key={label} onClick={() => key && handleSort(key)}
                    className={`text-[10px] font-semibold uppercase tracking-wider ${cls}`}
                    style={{ color: C.low }}>
                    <span className="inline-flex items-center gap-1">{label}{key && <SortIcon col={key} sort={sort} />}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-sm" style={{ color: C.low }}>No ETFs match your filters.</td></tr>}
              {filtered.map((etf, i) => (
                <tr key={etf.ticker} className="transition-colors duration-150" style={{ borderBottom: i < filtered.length - 1 ? `1px solid var(--border)` : 'none' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td className="pl-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,166,35,0.10)', border: '1px solid rgba(245,166,35,0.18)' }}>
                        <span className="text-[9px] font-bold font-mono" style={{ color: C.accent }}>{etf.ticker.replace('.TO','').slice(0,4)}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-xs" style={{ color: C.hi }}>{etf.ticker}</p>
                        <p className="text-[10px] max-w-[180px] truncate" style={{ color: C.low }}>{etf.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-right py-3">
                    <span className="font-mono font-semibold text-xs" style={{ color: etf.yield >= 7 ? '#16A34A' : etf.yield >= 5 ? '#D97706' : C.mid }}>{etf.yield.toFixed(2)}%</span>
                  </td>
                  <td className="text-right py-3">
                    <span className="font-mono text-xs" style={{ color: etf.mer <= 0.25 ? '#16A34A' : etf.mer <= 0.65 ? C.mid : '#DC2626' }}>{etf.mer.toFixed(2)}%</span>
                  </td>
                  <td className="text-center py-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: C.mid }}>{etf.type}</span>
                  </td>
                  <td className="text-center py-3">
                    <span className="text-[10px] font-mono" style={{ color: C.mid }}>{etf.exDate}</span>
                  </td>
                  <td className="text-center py-3"><div className="flex justify-center"><StarRating count={etf.stars} /></div></td>
                  <td className="text-center py-3">
                    <button onClick={() => toggleCompare(etf.ticker)}
                      className="w-6 h-6 rounded-lg border flex items-center justify-center mx-auto cursor-pointer transition-all duration-200"
                      style={compareList.includes(etf.ticker)
                        ? { background: 'rgba(124,58,237,0.10)', borderColor: 'rgba(124,58,237,0.25)', color: '#7C3AED' }
                        : { borderColor: 'var(--border)', color: C.ghost }}>
                      {compareList.includes(etf.ticker) ? <Check size={10} /> : <GitCompare size={10} />}
                    </button>
                  </td>
                  <td className="text-center pr-5 py-3">
                    <button onClick={() => setDeepDive(etf)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl cursor-pointer transition-all duration-200"
                      style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.18)', color: '#7C3AED' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.15)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.08)'; }}>
                      <ExternalLink size={11} />Deep Dive
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </BentoCard>
    </div>
  );
}
