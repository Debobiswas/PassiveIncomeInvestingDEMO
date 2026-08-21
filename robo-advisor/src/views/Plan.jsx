import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Send, Bot, User, Target, Calculator, ChevronDown, RefreshCw,
  AlertTriangle, Zap, ChevronRight, CheckCircle2,
  Wand2, ArrowRight, Info,
} from 'lucide-react';
import { advisorMessages, goals, portfolioStats, samplePortfolios } from '../data/dummy';
import {
  AreaChart, Area, XAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, CartesianGrid,
} from 'recharts';

const C = { hi: 'var(--text-hi)', mid: 'var(--text-mid)', low: 'var(--text-low)', accent: 'var(--accent)', border: 'var(--border)', subtle: 'var(--bg-subtle)' };

// ── Risk questionnaire ────────────────────────────────────────────────────────
const QUESTIONS = [
  {
    id: 'risk',
    q: 'How comfortable are you with portfolio fluctuations?',
    opts: [
      { val: 'low',    label: 'Conservative',  sub: "I prefer stability over high yield" },
      { val: 'medium', label: 'Balanced',       sub: "Some ups and downs are fine" },
      { val: 'high',   label: 'Aggressive',     sub: "I can handle -20% for higher income" },
    ],
  },
  {
    id: 'horizon',
    q: 'What is your investment time horizon?',
    opts: [
      { val: 'short',  label: '< 2 years',      sub: "Need access to funds soon" },
      { val: 'medium', label: '2–10 years',     sub: "Gradual income growth" },
      { val: 'long',   label: '10+ years',      sub: "Long-term compounding" },
    ],
  },
  {
    id: 'goal',
    q: 'What is your primary income goal?',
    opts: [
      { val: 'income',  label: 'Monthly cash flow',  sub: "Maximize distributions now" },
      { val: 'growth',  label: 'Capital + income',   sub: "Grow the portfolio too" },
      { val: 'drip',    label: 'DRIP & compound',    sub: "Reinvest everything" },
    ],
  },
  {
    id: 'account',
    q: 'Which account are you primarily investing in?',
    opts: [
      { val: 'TFSA',  label: 'TFSA',   sub: "Tax-free growth & withdrawals" },
      { val: 'RRSP',  label: 'RRSP',   sub: "Tax-deferred, US withholding exempt" },
      { val: 'Cash',  label: 'Cash',   sub: "Taxable account" },
    ],
  },
];

// ── AI responses ──────────────────────────────────────────────────────────────
const SUGGESTED = [
  'How do I reach $1,000/mo passive income?',
  'What ETFs match a 6% yield target?',
  'Explain covered call ETFs',
];

const CANNED = {
  default: "Based on your portfolio, I'd focus on consistent dividend ETFs with monthly payouts. Want me to run a detailed analysis or build a sample allocation?",
  yield:   "To hit 6%+ yield, consider ZWB (6.5%) blended with XDIV (4.8%). Higher yield often means higher MER — the sweet spot is 8–10% with a 0.65% MER. Want a sample portfolio?",
  income:  `At your current ${portfolioStats.yieldOnCost}% yield, you'd need ~$249,000 invested to hit $1,000/mo. You're ~$100K away — about 18–24 months at your savings rate. Want to model scenarios?`,
  covered: "Covered call ETFs sell options contracts on their holdings to generate extra income. They trade some upside participation for higher monthly cash flow — typically 2–4% more yield than the underlying index ETF. Watch for QMAX, QQCC, HYLD as examples.",
};

function pickResponse(text) {
  const t = text.toLowerCase();
  if (t.includes('covered') || t.includes('call')) return CANNED.covered;
  if (t.includes('yield') || t.includes('6%')) return CANNED.yield;
  if (t.includes('1,000') || t.includes('1000') || t.includes('income') || t.includes('passive')) return CANNED.income;
  return CANNED.default;
}

// ── What-If Simulator data (M5 — with inflation) ─────────────────────────────
function buildSimData({ invested, yield: yld, monthly, years, inflation = 0 }) {
  const data = [];
  let portfolio = invested;
  for (let mo = 0; mo <= years * 12; mo++) {
    const nominal = (portfolio * (yld / 100)) / 12;
    const inflFactor = Math.pow(1 + inflation / 100, mo / 12);
    const real = nominal / inflFactor;
    data.push({
      mo,
      label: mo % 12 === 0 ? `Yr ${mo / 12}` : '',
      income: Math.round(nominal),
      real:   Math.round(real),
      portfolio: Math.round(portfolio),
    });
    portfolio += monthly;
  }
  return data;
}

// ── Market Crash scenarios ────────────────────────────────────────────────────
const CRASHES = [
  {
    id: '2008',
    label: '2008 Financial Crisis',
    subtitle: 'Oct 2007 – Mar 2009',
    drawdown: -42,
    incomeImpact: -38,
    recoveryMonths: 54,
    color: '#DC2626',
    desc: 'The worst global recession since the Great Depression. TSX fell ~49%, US markets -57%. Covered call ETFs saw distributions cut significantly as volatility exploded but option premiums also surged.',
    recovery: [100, 58, 61, 65, 70, 76, 82, 87, 92, 96, 100, 102, 100],
  },
  {
    id: 'covid',
    label: 'COVID-19 Crash',
    subtitle: 'Feb – Mar 2020',
    drawdown: -35,
    incomeImpact: -20,
    recoveryMonths: 7,
    color: '#D97706',
    desc: 'The fastest crash in market history — down 34% in 22 trading days. Covered call ETFs held better than pure equity. Recovery was equally historic — new highs by August 2020.',
    recovery: [100, 65, 70, 78, 85, 91, 97, 101, 103, 104, 103, 104, 105],
  },
  {
    id: '2022',
    label: '2022 Rate Hike Cycle',
    subtitle: 'Jan – Oct 2022',
    drawdown: -18,
    incomeImpact: -5,
    recoveryMonths: 14,
    color: '#7C3AED',
    desc: 'The Fed hiked rates 425bps in 12 months. Bond-heavy portfolios fell ~-16%, equities -20%. Covered call ETFs with floating-rate bond exposure actually saw income increase as yields rose.',
    recovery: [100, 82, 83, 85, 87, 90, 92, 94, 96, 97, 98, 100, 101],
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

// ── M4 AI Portfolio Match Card ─────────────────────────────────────────────────
function PortfolioMatchCard({ riskAnswer, incomeTarget, onNav }) {
  // Pick portfolio based on risk profile (M4)
  let portfolioIdx = 0; // default: Portfolio #1
  if (riskAnswer === 'low')  portfolioIdx = 1; // Portfolio #2 — Lower Volatility
  if (riskAnswer === 'high') portfolioIdx = 0; // Portfolio #1 is still best for high risk in this dataset

  const portfolio = samplePortfolios[portfolioIdx];
  if (!portfolio) return null;

  const topHoldings = portfolio.holdings.slice(0, 4);
  // How long to reach income target at 12%
  const reqPortfolio = incomeTarget ? Math.round((incomeTarget * 12) / 0.12) : null;
  const monthsToGoal = reqPortfolio ? Math.ceil((reqPortfolio - portfolioStats.totalValue) / 500) : null;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(124,58,237,0.25)', background: 'rgba(124,58,237,0.04)' }}>
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(124,58,237,0.15)' }}>
        <Wand2 size={14} style={{ color: '#7C3AED' }} />
        <p className="text-xs font-semibold" style={{ color: '#7C3AED' }}>AI Portfolio Match</p>
        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium"
          style={{ background: 'rgba(124,58,237,0.12)', color: '#7C3AED' }}>
          {riskAnswer === 'low' ? 'Conservative' : riskAnswer === 'high' ? 'Aggressive' : 'Balanced'}
        </span>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <p className="text-sm font-semibold" style={{ color: C.hi }}>{portfolio.name}</p>
          <p className="text-xs mt-0.5" style={{ color: C.mid }}>{portfolio.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl px-3 py-2 text-center" style={{ background: 'var(--bg-subtle)' }}>
            <p className="text-base font-bold font-mono" style={{ color: C.accent }}>{portfolio.targetYield}</p>
            <p className="text-[9px] uppercase tracking-wide" style={{ color: C.low }}>Target yield</p>
          </div>
          {reqPortfolio && (
            <div className="flex-1 text-xs" style={{ color: C.mid }}>
              <span>Need </span>
              <span className="font-semibold font-mono" style={{ color: C.hi }}>${(reqPortfolio / 1000).toFixed(0)}K</span>
              <span> for ${incomeTarget}/mo · est. </span>
              <span className="font-semibold" style={{ color: C.hi }}>~{Math.ceil(monthsToGoal / 12)} yrs</span>
              <span> at $500/mo contributions</span>
            </div>
          )}
        </div>
        {/* Top holdings */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.low }}>Top holdings</p>
          <div className="flex flex-wrap gap-1.5">
            {topHoldings.map(h => (
              <span key={h.ticker} className="text-[10px] font-mono font-semibold px-2 py-1 rounded-lg"
                style={{ background: 'rgba(124,58,237,0.10)', color: '#7C3AED' }}>
                {h.ticker} {h.pct}%
              </span>
            ))}
          </div>
        </div>
        <button onClick={() => onNav('discover')}
          className="w-full flex items-center justify-center gap-2 rounded-xl text-xs font-semibold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 transition-all"
          style={{ minHeight: '36px', background: 'rgba(124,58,237,0.12)', color: '#7C3AED' }}>
          Explore this portfolio in Discover <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}

function RightPanelGoal({ calcOpen, setCalcOpen, target, setTarget, taxRegion, setTaxRegion, riskAnswer, onNav }) {
  const [goalTarget, setGoalTarget] = useState(1000);
  const [goalTimeline, setGoalTimeline] = useState(5);
  const [wizardStep, setWizardStep] = useState(0); // 0=income, 1=timeline, 2=match
  const [wizardDone, setWizardDone] = useState(false);

  const goal = goals[0];
  const goalPct = Math.min(100, (goal.current / goal.target) * 100);
  const taxRate = taxRegion === 'CA' ? 0.15 : 0.22;
  const requiredPortfolio = (target * 12) / (portfolioStats.yieldOnCost / 100 * (1 - taxRate));
  const gap = requiredPortfolio - portfolioStats.totalValue;

  return (
    <div className="space-y-5">

      {/* M4 Goal Wizard */}
      {!wizardDone ? (
        <div className="card rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Target size={14} style={{ color: C.accent }} />
            <p className="text-sm font-semibold" style={{ color: C.hi }}>Set your income goal</p>
            <span className="ml-auto text-[10px]" style={{ color: C.low }}>Step {wizardStep + 1} of 2</span>
          </div>

          {wizardStep === 0 && (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium" style={{ color: C.mid }}>Target monthly income</label>
                  <span className="text-sm font-bold font-mono" style={{ color: C.accent }}>${goalTarget.toLocaleString()}/mo</span>
                </div>
                <input type="range" min={250} max={5000} step={250} value={goalTarget}
                  onChange={e => setGoalTarget(parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer" />
                <div className="flex justify-between mt-1">
                  {[500, 1000, 2000, 3000, 5000].map(v => (
                    <button key={v} onClick={() => setGoalTarget(v)}
                      className="text-[10px] cursor-pointer px-1.5 py-0.5 rounded focus-visible:outline-none"
                      style={{ color: goalTarget === v ? C.accent : C.low, fontWeight: goalTarget === v ? 700 : 400 }}>
                      ${(v/1000).toFixed(v < 1000 ? 1 : 0)}k
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => setWizardStep(1)}
                className="w-full flex items-center justify-center gap-2 rounded-xl text-xs font-semibold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                style={{ minHeight: '38px', background: C.accent, color: '#fff' }}>
                Next: set timeline <ChevronRight size={13} />
              </button>
            </div>
          )}

          {wizardStep === 1 && (
            <div className="space-y-3">
              <p className="text-xs" style={{ color: C.mid }}>When do you want to hit ${goalTarget.toLocaleString()}/mo?</p>
              <div className="grid grid-cols-4 gap-2">
                {[2, 5, 10, 20].map(y => (
                  <button key={y} onClick={() => setGoalTimeline(y)}
                    className="rounded-xl py-2.5 text-xs font-semibold cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                    style={{
                      background: goalTimeline === y ? 'rgba(245,166,35,0.12)' : 'var(--bg-subtle)',
                      color: goalTimeline === y ? C.accent : C.mid,
                      border: `1px solid ${goalTimeline === y ? 'rgba(245,166,35,0.30)' : C.border}`,
                    }}>
                    {y} yr
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setWizardStep(0)}
                  className="flex-1 rounded-xl text-xs font-medium cursor-pointer focus-visible:outline-none"
                  style={{ minHeight: '38px', background: 'var(--bg-subtle)', color: C.mid }}>
                  ← Back
                </button>
                <button onClick={() => setWizardDone(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl text-xs font-semibold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  style={{ minHeight: '38px', background: C.accent, color: '#fff' }}>
                  <Wand2 size={12} /> Get AI match
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* M4 — AI Portfolio Match result */
        <PortfolioMatchCard riskAnswer={riskAnswer} incomeTarget={goalTarget} onNav={onNav} />
      )}

      {/* Goal card */}
      <div className="card rounded-2xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,166,35,0.10)' }}>
            <Target size={18} style={{ color: C.accent }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.low }}>Your current goal</p>
            <p className="text-base font-semibold mt-1" style={{ color: C.hi }}>{goal.label}</p>
            <div className="mt-3 flex items-baseline gap-2">
              <p className="text-2xl font-bold font-mono" style={{ color: C.hi }}>
                {goal.unit === '$' ? '$' : ''}{goal.current.toLocaleString()}{goal.unit !== '$' ? goal.unit : ''}
              </p>
              <p className="text-sm" style={{ color: C.mid }}>
                of {goal.unit === '$' ? '$' : ''}{goal.target.toLocaleString()}{goal.unit !== '$' ? goal.unit : ''}
              </p>
            </div>
            <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-subtle)' }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${goalPct}%`, background: C.accent }} />
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs" style={{ color: C.mid }}>{goalPct.toFixed(0)}% complete</p>
              <button className="text-xs font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded px-1"
                style={{ color: C.accent }}>Edit goal →</button>
            </div>
          </div>
        </div>
      </div>

      {/* Income calculator */}
      <div className="card rounded-2xl overflow-hidden">
        <button onClick={() => setCalcOpen(o => !o)}
          className="w-full px-5 py-4 flex items-center gap-4 cursor-pointer focus-visible:outline-none"
          aria-expanded={calcOpen}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--bg-subtle)' }}>
            <Calculator size={16} style={{ color: C.mid }} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold" style={{ color: C.hi }}>Income calculator</p>
            <p className="text-[11px] mt-0.5" style={{ color: C.low }}>How much do I need invested?</p>
          </div>
          <ChevronDown size={16} style={{ color: C.mid, transform: calcOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 200ms' }} />
        </button>

        {calcOpen && (
          <div className="px-5 pb-5 space-y-4 border-t" style={{ borderColor: C.border, paddingTop: '20px' }}>
            <div>
              <label className="text-xs font-medium block mb-2" style={{ color: C.mid }}>Target monthly income</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-mono" style={{ color: C.low }}>$</span>
                <input type="number" inputMode="numeric" value={target} onChange={e => setTarget(parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-3 rounded-xl text-base font-mono focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  style={{ minHeight: '48px', background: 'var(--bg-subtle)', border: `1px solid ${C.border}`, color: C.hi }} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium" style={{ color: C.mid }}>Tax region</label>
              <div className="flex gap-1 rounded-lg p-0.5" style={{ background: 'var(--bg-subtle)' }}>
                {['CA', 'US'].map(r => (
                  <button key={r} onClick={() => setTaxRegion(r)}
                    className="px-3 py-1 rounded-md text-xs font-medium cursor-pointer focus-visible:outline-none"
                    style={{ background: taxRegion === r ? 'var(--bg-card)' : 'transparent', color: taxRegion === r ? C.hi : C.mid }}>
                    {r === 'CA' ? 'Canada' : 'US'}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl p-4"
              style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.06), rgba(245,166,35,0.02))', border: '1px solid rgba(245,166,35,0.20)' }}>
              <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: C.accent }}>You'll need to invest</p>
              <p className="text-3xl font-bold font-mono mt-2" style={{ color: C.hi }}>
                ${requiredPortfolio.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs mt-2" style={{ color: C.mid }}>
                {gap > 0
                  ? <>You're <span className="font-semibold" style={{ color: C.hi }}>${gap.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span> away</>
                  : <>You've already passed this target ✓</>}
              </p>
              <p className="text-[10px] mt-1.5" style={{ color: C.low }}>
                Based on {portfolioStats.yieldOnCost}% yield · {taxRegion === 'CA' ? '15% tax-favoured' : '22% effective'} rate
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="rounded-2xl p-5 space-y-3"
        style={{ background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.15)' }}>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#7C3AED' }}>Quick tips</p>
        {[
          'Enable DRIP in your TFSA to compound faster',
          'Covered-call ETFs add yield but cap upside',
          'Diversify across 4–6 ETF types to reduce risk',
        ].map((tip, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: '#7C3AED' }} />
            <p className="text-xs leading-relaxed" style={{ color: C.mid }}>{tip}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function RightPanelSimulator() {
  const [invested, setInvested] = useState(148320);
  const [yld, setYld] = useState(12);
  const [monthly, setMonthly] = useState(500);
  const [years, setYears] = useState(5);
  const [inflation, setInflation] = useState(0);
  const [showInflation, setShowInflation] = useState(false);

  const simData = useMemo(() =>
    buildSimData({ invested, yield: yld, monthly, years, inflation: showInflation ? inflation : 0 }),
    [invested, yld, monthly, years, inflation, showInflation]
  );

  const endIncome     = simData[simData.length - 1]?.income ?? 0;
  const endReal       = simData[simData.length - 1]?.real   ?? 0;
  const endPortfolio  = simData[simData.length - 1]?.portfolio ?? 0;
  const startIncome   = simData[0]?.income ?? 0;
  const purchaseLoss  = showInflation && inflation > 0 ? endIncome - endReal : 0;

  // Sample every 6 months for chart
  const chartData = simData.filter(d => d.mo % 6 === 0);

  // Milestone: first month income exceeds 2× start
  const milestone = simData.find(d => d.income >= startIncome * 2);

  const sliders = [
    { label: 'Invested today', val: invested, set: setInvested, min: 10000, max: 500000, step: 5000, fmt: v => `$${(v / 1000).toFixed(0)}K`, key: 'invested' },
    { label: 'Yield %',        val: yld,      set: setYld,      min: 3,     max: 18,     step: 0.5,  fmt: v => `${v}%`,                     key: 'yield'    },
    { label: 'Monthly add',    val: monthly,  set: setMonthly,  min: 0,     max: 5000,   step: 100,  fmt: v => `$${v}`,                      key: 'monthly'  },
    { label: 'Years',          val: years,    set: setYears,    min: 1,     max: 20,     step: 1,    fmt: v => `${v} yr`,                    key: 'years'    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <Zap size={14} style={{ color: C.accent }} />
          <p className="text-sm font-semibold" style={{ color: C.hi }}>What-If Simulator</p>
        </div>
        <p className="text-[11px]" style={{ color: C.low }}>Adjust sliders to model your income future · M5 inflation-adjusted</p>
      </div>

      {/* Sliders */}
      <div className="space-y-3">
        {sliders.map(s => (
          <div key={s.key}>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium" style={{ color: C.mid }}>{s.label}</label>
              <span className="text-xs font-mono font-semibold" style={{ color: C.accent }}>{s.fmt(s.val)}</span>
            </div>
            <input type="range" min={s.min} max={s.max} step={s.step} value={s.val}
              onChange={e => s.set(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer" />
          </div>
        ))}
      </div>

      {/* Inflation toggle (M5) */}
      <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--bg-subtle)', border: `1px solid ${C.border}` }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info size={12} style={{ color: C.low }} />
            <span className="text-xs font-medium" style={{ color: C.mid }}>Inflation adjustment</span>
          </div>
          <button onClick={() => setShowInflation(o => !o)}
            className="relative w-9 h-5 rounded-full cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            style={{ background: showInflation ? C.accent : C.border }}>
            <div className="absolute top-0.5 rounded-full w-4 h-4 bg-white transition-all duration-200"
              style={{ left: showInflation ? '18px' : '2px' }} />
          </button>
        </div>
        {showInflation && (
          <div className="flex items-center gap-2">
            <input type="range" min={0} max={6} step={0.5} value={inflation}
              onChange={e => setInflation(parseFloat(e.target.value))}
              className="flex-1 accent-amber-500 cursor-pointer" />
            <span className="text-xs font-mono font-semibold w-10 text-right" style={{ color: '#DC2626' }}>{inflation}%</span>
          </div>
        )}
      </div>

      {/* Result strip */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl p-3 text-center" style={{ background: 'var(--bg-subtle)' }}>
          <p className="text-base font-bold font-mono" style={{ color: C.mid }}>${startIncome.toLocaleString()}</p>
          <p className="text-[9px] uppercase tracking-wide font-medium" style={{ color: C.low }}>Now/mo</p>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.20)' }}>
          <p className="text-base font-bold font-mono" style={{ color: C.accent }}>${endIncome.toLocaleString()}</p>
          <p className="text-[9px] uppercase tracking-wide font-medium" style={{ color: C.low }}>In {years}yr</p>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ background: 'var(--bg-subtle)' }}>
          <p className="text-base font-bold font-mono" style={{ color: C.hi }}>${(endPortfolio / 1000).toFixed(0)}K</p>
          <p className="text-[9px] uppercase tracking-wide font-medium" style={{ color: C.low }}>Portfolio</p>
        </div>
      </div>

      {/* Inflation erosion note (M5) */}
      {showInflation && inflation > 0 && (
        <div className="rounded-xl px-3 py-2.5 flex items-center gap-2"
          style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.18)' }}>
          <AlertTriangle size={12} style={{ color: '#DC2626' }} />
          <p className="text-[11px]" style={{ color: '#DC2626' }}>
            At {inflation}% inflation, your real purchasing power in {years}yr will be
            <strong> ${endReal.toLocaleString()}/mo</strong> — $<strong>{purchaseLoss.toLocaleString()}</strong> less than nominal
          </p>
        </div>
      )}

      {/* Milestone badge (M5) */}
      {milestone && (
        <div className="rounded-xl px-3 py-2.5 flex items-center gap-2"
          style={{ background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.18)' }}>
          <CheckCircle2 size={12} style={{ color: '#16A34A' }} />
          <p className="text-[11px]" style={{ color: '#16A34A' }}>
            2× income milestone at <strong>Year {(milestone.mo / 12).toFixed(1)}</strong> — ${milestone.income.toLocaleString()}/mo
          </p>
        </div>
      )}

      {/* Projection chart */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: C.low }}>Monthly income projection</p>
        <div style={{ height: 120 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="simGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F5A623" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#F5A623" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="realGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#DC2626" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#DC2626" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'var(--text-low)' }} axisLine={false} tickLine={false} interval={0} />
              <Tooltip
                formatter={(v, name) => [`$${Number(v).toLocaleString()}`, name === 'income' ? 'Nominal' : 'Real (inflation-adj.)']}
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }} />
              <Area type="monotone" dataKey="income" stroke="#F5A623" strokeWidth={2} fill="url(#simGrad)" />
              {showInflation && inflation > 0 && (
                <Area type="monotone" dataKey="real" stroke="#DC2626" strokeWidth={1.5} strokeDasharray="4 3" fill="url(#realGrad)" />
              )}
              {milestone && (
                <ReferenceLine x={`Yr ${Math.round(milestone.mo / 12)}`} stroke="#16A34A" strokeDasharray="4 3"
                  label={{ value: '2×', fill: '#16A34A', fontSize: 9 }} />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {showInflation && inflation > 0 && (
          <div className="flex items-center gap-4 mt-1.5 justify-center">
            <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 rounded" style={{ background: '#F5A623' }} /><span className="text-[9px]" style={{ color: C.low }}>Nominal</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 border-t border-dashed" style={{ borderColor: '#DC2626' }} /><span className="text-[9px]" style={{ color: C.low }}>Real</span></div>
          </div>
        )}
      </div>
    </div>
  );
}

function RightPanelCrash() {
  const [selected, setSelected] = useState(CRASHES[1].id); // default COVID
  const crash = CRASHES.find(c => c.id === selected);

  const portfolioValue = portfolioStats.totalValue;
  const crashedValue  = portfolioValue * (1 + crash.drawdown / 100);
  const crashedIncome = portfolioStats.monthlyIncome * (1 + crash.incomeImpact / 100);

  const chartData = crash.recovery.map((v, i) => ({
    mo: i === 0 ? 'Crash' : `M${i * 4}`,
    pct: v,
  }));

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <AlertTriangle size={14} style={{ color: '#DC2626' }} />
          <p className="text-sm font-semibold" style={{ color: C.hi }}>Market Crash Mode</p>
        </div>
        <p className="text-[11px]" style={{ color: C.low }}>Simulate a historical downturn on your current portfolio</p>
      </div>

      {/* Scenario selector */}
      <div className="flex flex-col gap-2">
        {CRASHES.map(c => (
          <button key={c.id} onClick={() => setSelected(c.id)}
            className="flex items-center gap-3 p-3 rounded-xl cursor-pointer text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            style={{
              background: selected === c.id ? `${c.color}0F` : 'var(--bg-subtle)',
              border: `1px solid ${selected === c.id ? `${c.color}40` : C.border}`,
            }}>
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold" style={{ color: C.hi }}>{c.label}</p>
              <p className="text-[10px]" style={{ color: C.low }}>{c.subtitle}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold font-mono" style={{ color: c.color }}>{c.drawdown}%</p>
            </div>
          </button>
        ))}
      </div>

      {/* Impact table */}
      <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
        <div className="px-4 py-2.5" style={{ background: 'var(--bg-subtle)', borderBottom: `1px solid ${C.border}` }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.low }}>Your portfolio · estimated impact</p>
        </div>
        {[
          { label: 'Portfolio value',   before: `$${portfolioValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, after: `$${crashedValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, bad: true },
          { label: 'Monthly income',   before: `$${portfolioStats.monthlyIncome.toFixed(0)}`, after: `$${crashedIncome.toFixed(0)}`,    bad: true },
          { label: 'Recovery time',    before: '—',                                           after: `~${crash.recoveryMonths} months`, bad: false },
        ].map(row => (
          <div key={row.label} className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
            <p className="text-xs font-medium" style={{ color: C.mid }}>{row.label}</p>
            <div className="flex items-center gap-3 text-right">
              <span className="text-xs font-mono" style={{ color: C.low }}>{row.before}</span>
              <ChevronRight size={12} style={{ color: C.low }} />
              <span className="text-xs font-bold font-mono" style={{ color: row.bad ? crash.color : '#16A34A' }}>{row.after}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Description */}
      <p className="text-[11px] leading-relaxed" style={{ color: C.mid }}>{crash.desc}</p>

      {/* Recovery chart */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: C.low }}>Portfolio recovery index (100 = pre-crash)</p>
        <div style={{ height: 90 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="crashGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={crash.color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={crash.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="mo" tick={{ fontSize: 8, fill: 'var(--text-low)' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={v => [`${v}`, 'Index']}
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }} />
              <ReferenceLine y={100} stroke={C.border} strokeDasharray="4 4" />
              <Area type="monotone" dataKey="pct" stroke={crash.color} strokeWidth={2} fill="url(#crashGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── Main Plan ─────────────────────────────────────────────────────────────────
export default function Plan({ onNav }) {
  const [messages, setMessages] = useState(advisorMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [rightTab, setRightTab] = useState('goal');
  const [calcOpen, setCalcOpen] = useState(false);
  const [target, setTarget] = useState(1000);
  const [taxRegion, setTaxRegion] = useState('CA');

  // Risk questionnaire state
  const [qStep, setQStep] = useState(0);           // 0–3 = answering, 4 = done
  const [answers, setAnswers] = useState({});
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  const send = (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }, { role: 'assistant', typing: true }]);
    setLoading(true);
    setTimeout(() => {
      setMessages(prev => [...prev.filter(m => !m.typing), { role: 'assistant', content: pickResponse(msg) }]);
      setLoading(false);
    }, 1300);
  };

  const answerQ = (val) => {
    setAnswers(prev => ({ ...prev, [QUESTIONS[qStep].id]: val }));
    if (qStep < QUESTIONS.length - 1) {
      setQStep(s => s + 1);
    } else {
      setQStep(4); // done
    }
  };

  const RIGHT_TABS = [
    { id: 'goal',      label: 'Goals' },
    { id: 'simulator', label: 'Simulator' },
    { id: 'crash',     label: 'Crash Mode' },
  ];

  const questionnaireDone = qStep >= QUESTIONS.length;
  const currentQ = QUESTIONS[qStep];

  return (
    <div className="px-4 py-5 md:px-8 md:py-8 flex flex-col md:h-screen" style={{ touchAction: 'pan-y' }}>
      <header className="mb-6 shrink-0">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: C.low }}>Plan</p>
        <h1 className="text-3xl font-bold mt-1" style={{ color: C.hi }}>What's next for you</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 flex-1 md:min-h-0">

        {/* LEFT — Questionnaire → Chat (3/5) */}
        <div className="col-span-1 md:col-span-3 flex flex-col rounded-3xl overflow-hidden md:min-h-0"
          style={{ background: 'var(--bg-card)', border: `1px solid ${C.border}` }}>

          {/* Header */}
          <div className="px-6 py-4 flex items-center gap-3 shrink-0" style={{ borderBottom: `1px solid ${C.border}` }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: questionnaireDone ? 'rgba(124,58,237,0.10)' : 'rgba(245,166,35,0.10)' }}>
              {questionnaireDone
                ? <Bot size={16} style={{ color: '#7C3AED' }} />
                : <CheckCircle2 size={16} style={{ color: C.accent }} />}
            </div>
            <div className="flex-1">
              {questionnaireDone ? (
                <>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold" style={{ color: C.hi }}>AI Advisor</p>
                    <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={{ background: '#DCFCE7', color: '#16A34A' }}>
                      <span className="w-1 h-1 rounded-full" style={{ background: '#16A34A' }} />Online
                    </span>
                  </div>
                  <p className="text-[10px] mt-0.5" style={{ color: C.low }}>Trained on Erica's content · Powered by RAG</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold" style={{ color: C.hi }}>Risk Profile</p>
                  <p className="text-[10px] mt-0.5" style={{ color: C.low }}>Question {qStep + 1} of {QUESTIONS.length} · takes ~30 seconds</p>
                </>
              )}
            </div>
            {questionnaireDone && (
              <button onClick={() => { setMessages(advisorMessages); setQStep(0); setAnswers({}); }}
                aria-label="Reset"
                className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                style={{ background: 'var(--bg-subtle)', color: C.mid }}>
                <RefreshCw size={14} />
              </button>
            )}
          </div>

          {/* Body */}
          {!questionnaireDone ? (
            /* ── Questionnaire ── */
            <div className="flex flex-col items-center px-5 py-5 md:px-8 md:py-6 gap-4 md:gap-6 md:flex-1 md:justify-center overflow-y-auto">
              {/* Progress dots */}
              <div className="flex gap-2">
                {QUESTIONS.map((_, i) => (
                  <div key={i} className="rounded-full transition-all duration-300"
                    style={{
                      width: i === qStep ? 24 : 8,
                      height: 8,
                      background: i < qStep ? C.accent : i === qStep ? C.accent : C.border,
                    }} />
                ))}
              </div>

              <div className="w-full max-w-md text-center">
                <p className="text-base md:text-lg font-semibold leading-snug" style={{ color: C.hi }}>{currentQ.q}</p>
              </div>

              <div className="w-full max-w-md space-y-2.5">
                {currentQ.opts.map(opt => (
                  <button key={opt.val} onClick={() => answerQ(opt.val)}
                    className="w-full flex items-center gap-4 rounded-2xl cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 text-left active:scale-[0.98]"
                    style={{ touchAction: 'manipulation', background: 'var(--bg-card)', border: `1px solid ${C.border}`, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,166,35,0.05)'; e.currentTarget.style.borderColor = 'rgba(245,166,35,0.35)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(245,166,35,0.12)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; }}>
                    <div className="w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center" style={{ borderColor: 'rgba(245,166,35,0.40)' }}>
                      <div className="w-2 h-2 rounded-full" style={{ background: 'rgba(245,166,35,0.30)' }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: C.hi }}>{opt.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: C.mid }}>{opt.sub}</p>
                    </div>
                    <ChevronRight size={14} style={{ color: C.low, flexShrink: 0 }} />
                  </button>
                ))}
              </div>

              {qStep > 0 && (
                <button onClick={() => setQStep(s => s - 1)}
                  className="text-xs cursor-pointer focus-visible:outline-none"
                  style={{ color: C.low }}>
                  ← Back
                </button>
              )}
            </div>
          ) : (
            /* ── Chat ── */
            <>
              {/* Profile summary pill */}
              {Object.keys(answers).length > 0 && (
                <div className="px-6 pt-3 shrink-0">
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(answers).map(([k, v]) => (
                      <span key={k} className="text-[10px] px-2.5 py-1 rounded-full font-medium"
                        style={{ background: 'rgba(245,166,35,0.10)', color: C.accent }}>
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 min-h-0">
                {messages.map((m, i) => {
                  const isAI = m.role === 'assistant';
                  return (
                    <div key={i} className={`flex gap-3 ${isAI ? '' : 'flex-row-reverse'}`}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: isAI ? 'rgba(124,58,237,0.10)' : 'rgba(245,166,35,0.12)' }}>
                        {isAI ? <Bot size={13} style={{ color: '#7C3AED' }} /> : <User size={13} style={{ color: C.accent }} />}
                      </div>
                      <div className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                        style={isAI
                          ? { background: 'var(--bg-subtle)', color: C.hi, borderTopLeftRadius: 4 }
                          : { background: 'rgba(245,166,35,0.10)', color: C.hi, borderTopRightRadius: 4 }}>
                        {m.typing
                          ? <span className="flex gap-1 items-center h-4">
                              {[0, 1, 2].map(j => (
                                <span key={j} className="w-1.5 h-1.5 rounded-full animate-bounce"
                                  style={{ background: C.low, animationDelay: `${j * 0.15}s` }} />
                              ))}
                            </span>
                          : m.content}
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Suggested prompts — only when fresh */}
              {messages.length <= 1 && (
                <div className="px-6 pb-3 flex flex-wrap gap-2 shrink-0">
                  {SUGGESTED.map(s => (
                    <button key={s} onClick={() => send(s)}
                      className="text-xs cursor-pointer rounded-full px-3 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                      style={{ background: 'var(--bg-subtle)', border: `1px solid ${C.border}`, color: C.mid }}>
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <form onSubmit={e => { e.preventDefault(); send(); }}
                className="px-3 py-3 flex items-center gap-2 shrink-0"
                style={{ borderTop: `1px solid ${C.border}` }}>
                <input value={input} onChange={e => setInput(e.target.value)}
                  placeholder="Ask anything…" aria-label="Message to advisor" disabled={loading}
                  className="flex-1 px-4 bg-transparent text-sm focus:outline-none disabled:opacity-50"
                  style={{ minHeight: '44px', color: C.hi }} />
                <button type="submit" disabled={loading || !input.trim()}
                  aria-label="Send message"
                  className="rounded-xl flex items-center justify-center cursor-pointer active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  style={{ background: C.accent, minWidth: '44px', minHeight: '44px' }}>
                  <Send size={15} className="text-white" />
                </button>
              </form>
            </>
          )}
        </div>

        {/* RIGHT — Tabs: Goal | Simulator | Crash Mode (2/5) */}
        <div className="col-span-1 md:col-span-2 flex flex-col md:min-h-0">
          {/* Tab bar */}
          <div className="flex gap-1 p-1 rounded-xl mb-4 shrink-0"
            style={{ background: 'var(--bg-subtle)', border: `1px solid ${C.border}` }}>
            {RIGHT_TABS.map(t => (
              <button key={t.id} onClick={() => setRightTab(t.id)}
                className="flex-1 rounded-lg text-xs cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                style={{
                  minHeight: '38px',
                  background: rightTab === t.id ? 'var(--bg-card)' : 'transparent',
                  color: rightTab === t.id ? C.accent : C.mid,
                  fontWeight: rightTab === t.id ? 700 : 500,
                  boxShadow: rightTab === t.id ? '0 1px 6px rgba(0,0,0,0.08)' : 'none',
                }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content — scrollable on desktop, natural height on mobile */}
          <div className="md:flex-1 md:overflow-y-auto md:min-h-0 space-y-0">
            {rightTab === 'goal' && (
              <RightPanelGoal
                calcOpen={calcOpen} setCalcOpen={setCalcOpen}
                target={target} setTarget={setTarget}
                taxRegion={taxRegion} setTaxRegion={setTaxRegion}
                riskAnswer={answers.risk}
                onNav={onNav} />
            )}
            {rightTab === 'simulator' && (
              <div className="card rounded-2xl p-5">
                <RightPanelSimulator />
              </div>
            )}
            {rightTab === 'crash' && (
              <div className="card rounded-2xl p-5">
                <RightPanelCrash />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
