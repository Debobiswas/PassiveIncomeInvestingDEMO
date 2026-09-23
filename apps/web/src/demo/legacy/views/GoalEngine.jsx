import { useState } from 'react';
import { Target, Zap, TrendingUp, Plus, Sparkles, Flag, Globe } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import BentoCard from '../components/BentoCard';
import { goals } from '../data/dummy';

const C = { hi: 'var(--text-hi)', body: 'var(--text-body)', mid: 'var(--text-mid)', low: 'var(--text-low)', accent: 'var(--accent)', border: 'var(--border)', subtle: 'var(--bg-subtle)' };

function GoalBar({ label, current, target, unit, color }) {
  const pct = Math.min((current / target) * 100, 100);
  const fmt = (v) => unit === '$' ? `$${v.toLocaleString()}` : `${v}${unit}`;
  return (
    <div className="card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold" style={{ color: C.hi }}>{label}</p>
        <span className="text-xs font-mono font-bold" style={{ color }}>{pct.toFixed(0)}%</span>
      </div>
      <div className="flex items-end gap-4 mb-4">
        <div><p className="text-2xl font-bold" style={{ color: C.hi }}>{fmt(current)}</p><p className="text-xs" style={{ color: C.low }}>Current</p></div>
        <div className="text-lg font-light mb-1" style={{ color: C.low }}>→</div>
        <div><p className="text-xl font-semibold" style={{ color: C.mid }}>{fmt(target)}</p><p className="text-xs" style={{ color: C.low }}>Target</p></div>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(26,26,26,0.08)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <p className="text-[10px] mt-2" style={{ color: C.low }}>{fmt(parseFloat((target - current).toFixed(2)))} remaining to target</p>
    </div>
  );
}

function buildMilestones(monthlyContrib, currentPortfolio, yieldPct, inflation, taxRate) {
  const data = [];
  let portfolio = currentPortfolio;
  const targets = [100000, 150000, 200000, 250000, 300000];
  const hit = {};
  for (let m = 0; m <= 60; m++) {
    const monthlyIncome = (portfolio * (yieldPct / 100) / 12) * (1 - taxRate / 100);
    portfolio += monthlyContrib + monthlyIncome;
    const real = portfolio / Math.pow(1 + inflation / 100 / 12, m);
    targets.forEach(t => { if (!hit[t] && portfolio >= t) hit[t] = m; });
    if (m % 3 === 0) data.push({ month: m, nominal: Math.round(portfolio), real: Math.round(real) });
  }
  return { data, milestones: hit };
}

const AI_PORTFOLIO = [
  { ticker: 'XDIV.TO', weight: 25, rationale: 'Core CDN dividend — low MER, stable 5-year payout history' },
  { ticker: 'JEPI',    weight: 20, rationale: 'US covered-call income — diversifies currency & sector' },
  { ticker: 'ZWB.TO',  weight: 20, rationale: 'Big-6 banks covered-call — reliable CDN financial income' },
  { ticker: 'SCHD',    weight: 15, rationale: 'US dividend growth — quality factor with appreciation' },
  { ticker: 'VDY.TO',  weight: 10, rationale: 'Broad CDN high-yield — complements XDIV with energy & utilities' },
  { ticker: 'XBB.TO',  weight: 10, rationale: 'Bond buffer — reduces volatility, rebalancing reserve' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card rounded-xl px-3 py-2 text-xs shadow-lg">
      <p className="mb-1" style={{ color: C.mid }}>Month {label}</p>
      {payload.map(p => <p key={p.dataKey} style={{ color: p.color }} className="font-mono">{p.name}: ${p.value?.toLocaleString()}</p>)}
    </div>
  );
};

export default function GoalEngine() {
  const [monthlyContrib, setMonthlyContrib] = useState(1500);
  const [targetIncome,   setTargetIncome]   = useState(1000);
  const [currentYield,   setCurrentYield]   = useState(4.82);
  const [taxRegion,      setTaxRegion]       = useState('CA');
  const [inflation,      setInflation]       = useState(2.5);
  const [showAI,         setShowAI]          = useState(false);

  const taxRate = taxRegion === 'CA' ? 15 : 22;
  const currentPortfolio = 148320;
  const requiredPortfolio = parseFloat(((targetIncome * 12) / ((currentYield / 100) * (1 - taxRate / 100))).toFixed(0));
  const gap = Math.max(0, requiredPortfolio - currentPortfolio);
  const { data: projData, milestones } = buildMilestones(monthlyContrib, currentPortfolio, currentYield, inflation, taxRate);
  const monthsToGoal = monthlyContrib > 0 ? Math.ceil(gap / monthlyContrib) : null;

  const inputStyle = { background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-hi)' };
  const inputFocus = e => { e.target.style.borderColor = 'rgba(245,166,35,0.45)'; e.target.style.background = '#fff'; };
  const inputBlur  = e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--bg-subtle)'; };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: C.hi }}>Goal Engine</h1>
          <p className="text-sm mt-0.5" style={{ color: C.mid }}>Model your path to financial freedom · M4 + M5</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAI(!showAI)}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl font-semibold cursor-pointer active:scale-95 transition-all duration-200"
            style={showAI
              ? { background: 'rgba(124,58,237,0.10)', border: '1px solid rgba(124,58,237,0.25)', color: '#7C3AED' }
              : { background: 'var(--accent)', color: '#fff' }}>
            <Sparkles size={14} />AI Portfolio
          </button>
          <button className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl cursor-pointer transition-all duration-200"
            style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: C.mid }}>
            <Plus size={14} />New Goal
          </button>
        </div>
      </div>

      {showAI && (
        <BentoCard style={{ border: '1px solid rgba(124,58,237,0.20)', background: 'rgba(124,58,237,0.02)' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.10)' }}>
              <Sparkles size={14} style={{ color: '#7C3AED' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: C.hi }}>AI-Generated Portfolio</p>
              <p className="text-[10px]" style={{ color: C.low }}>Based on $1,000/mo target at {currentYield}% yield · plain-English rationale</p>
            </div>
          </div>
          <div className="space-y-2">
            {AI_PORTFOLIO.map(({ ticker, weight, rationale }) => (
              <div key={ticker} className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(245,166,35,0.10)', border: '1px solid rgba(245,166,35,0.18)' }}>
                  <span className="text-[9px] font-bold font-mono" style={{ color: C.accent }}>{ticker.replace('.TO','').slice(0,4)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-mono font-semibold" style={{ color: C.hi }}>{ticker}</span>
                    <span className="text-[10px] font-mono font-semibold" style={{ color: C.accent }}>{weight}%</span>
                  </div>
                  <p className="text-[10px] leading-relaxed" style={{ color: C.mid }}>{rationale}</p>
                </div>
                <div className="w-16 shrink-0">
                  <div className="h-1.5 rounded-full overflow-hidden mt-2" style={{ background: 'rgba(26,26,26,0.10)' }}>
                    <div className="h-full rounded-full" style={{ width: `${weight * 3}%`, background: C.accent }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-center mt-3" style={{ color: C.low }}>Generated by RAG advisor · Not financial advice · For demo purposes</p>
        </BentoCard>
      )}

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-7 space-y-3">
          {goals.map(g => <GoalBar key={g.id} {...g} />)}

          <BentoCard>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold" style={{ color: C.hi }}>60-Month Projection</p>
                <p className="text-[10px]" style={{ color: C.low }}>Nominal vs. real ({inflation}% CPI)</p>
              </div>
              <div className="flex items-center gap-3 text-[10px]" style={{ color: C.low }}>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block rounded" style={{ background: C.accent }}></span>Nominal</span>
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block rounded" style={{ background: '#7C3AED' }}></span>Real</span>
              </div>
            </div>
            <div style={{ height: 150 }}>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={projData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <XAxis dataKey="month" tick={{ fill: 'var(--text-low)', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `M${v}`} />
                  <YAxis tick={{ fill: 'var(--text-low)', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={requiredPortfolio} stroke="rgba(26,26,26,0.15)" strokeDasharray="4 3" label={{ value: 'Goal', position: 'right', fill: 'var(--text-low)', fontSize: 9 }} />
                  <Line type="monotone" dataKey="nominal" name="Nominal" stroke="#F5A623" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="real"    name="Real"    stroke="#7C3AED" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-3 pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
              {Object.entries(milestones).map(([target, month]) => (
                <div key={target} className="flex items-center gap-1 text-[10px]" style={{ color: C.low }}>
                  <Flag size={9} style={{ color: C.accent }} />
                  <span className="font-mono">${parseInt(target)/1000}k</span>
                  <span style={{ color: C.low }}>@ M{month}</span>
                </div>
              ))}
            </div>
          </BentoCard>
        </div>

        <div className="col-span-12 md:col-span-5 space-y-3">
          <BentoCard accent>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,166,35,0.12)' }}>
                <Zap size={15} style={{ color: C.accent }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: C.hi }}>Passive Income Calc</p>
                <p className="text-[10px]" style={{ color: C.low }}>Reverse-engineering engine · M5</p>
              </div>
            </div>

            {/* Tax Toggle */}
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: C.low }}>Tax Jurisdiction</p>
              <div className="flex gap-2">
                {['CA', 'US'].map(region => (
                  <button key={region} onClick={() => setTaxRegion(region)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all duration-200"
                    style={taxRegion === region
                      ? { background: 'rgba(245,166,35,0.12)', borderColor: 'rgba(245,166,35,0.30)', color: C.accent }
                      : { background: 'var(--bg-subtle)', borderColor: 'var(--border)', color: C.mid }}>
                    <Globe size={11} />
                    {region === 'CA' ? '🍁 Canada' : '🦅 USA'}
                    <span className="text-[9px] opacity-60">{region === 'CA' ? '~15%' : '~22%'}</span>
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-center mt-1" style={{ color: C.low }}>Tax-drag applied to net income calculation</p>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Monthly Contribution', value: monthlyContrib, set: setMonthlyContrib, prefix: '$', step: 100 },
                { label: 'Target Monthly Income (After Tax)', value: targetIncome, set: setTargetIncome, prefix: '$', step: 50 },
                { label: 'Expected Distribution Yield (%)', value: currentYield, set: setCurrentYield, prefix: '%', step: 0.1 },
                { label: 'Inflation Rate (%)', value: inflation, set: setInflation, prefix: '%', step: 0.1 },
              ].map(({ label, value, set, prefix, step }) => (
                <div key={label}>
                  <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: C.low }}>{label}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono" style={{ color: C.low }}>{prefix}</span>
                    <input type="number" value={value} step={step} min={0} onChange={e => set(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-xl pl-8 pr-4 py-2.5 text-sm focus:outline-none transition-all duration-200 font-mono"
                      style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 space-y-2" style={{ borderTop: `1px solid ${C.border}` }}>
              <div className="rounded-xl p-4" style={{ background: C.subtle }}>
                <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: C.low }}>Portfolio Needed</p>
                <p className="text-2xl font-bold font-mono" style={{ color: C.hi }}>${requiredPortfolio.toLocaleString()}</p>
                <p className="text-xs mt-1" style={{ color: C.low }}>at {currentYield}% yield after {taxRate}% {taxRegion} tax → ${targetIncome}/mo net</p>
              </div>
              {gap > 0 && (
                <div className="rounded-xl p-4" style={{ background: C.subtle }}>
                  <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: C.low }}>Estimated Timeline</p>
                  <p className="text-2xl font-bold font-mono" style={{ color: C.accent }}>{monthsToGoal ? `${monthsToGoal} mo` : '—'}</p>
                  <p className="text-xs mt-1" style={{ color: C.low }}>${monthlyContrib.toLocaleString()}/mo · gap ${gap.toLocaleString()} · {inflation}% inflation</p>
                </div>
              )}
              {gap === 0 && (
                <div className="flex items-center gap-2 text-sm rounded-xl p-3" style={{ background: '#DCFCE7', color: '#16A34A' }}>
                  <Target size={14} />Goal achieved at current portfolio value!
                </div>
              )}
            </div>
          </BentoCard>

          <BentoCard>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={13} style={{ color: '#7C3AED' }} />
              <p className="text-xs font-semibold" style={{ color: C.hi }}>Advisor Insight</p>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: C.mid }}>
              {taxRegion === 'CA'
                ? <>Holding dividends in a <span className="font-semibold" style={{ color: C.accent }}>TFSA</span> eliminates the 15% tax drag entirely, reducing your portfolio target by ~$40K.</>
                : <>US investors can shelter dividends in a <span className="font-semibold" style={{ color: C.accent }}>Roth IRA</span>. JEPI distributions may be treated as ordinary income.</>
              }
            </p>
          </BentoCard>
        </div>
      </div>
    </div>
  );
}
