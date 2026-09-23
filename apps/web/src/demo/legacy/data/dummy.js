// ── Data seeded from "Ultimate DIY Investing Package v7" by Erica Villani ──
// Each export maps to a specific Excel tab. Replace with live API calls per milestone.

// ── Portfolio Stats (reflects Portfolio #1: Income ~12% yield) ──
export const portfolioStats = {
  totalValue: 148_320.54,
  totalValueChange: +2_841.22,
  totalValueChangePct: +1.95,
  monthlyIncome: 1_487.22,   // ~12% / 12 on $148k
  monthlyIncomePct: +4.2,
  yieldOnCost: 12.03,
  positions: 10,
};

// ── Recent Activity (real tickers from Portfolio #1) ──
export const recentActivity = [
  { id: 1, type: 'dividend', ticker: 'HDIV',  amount: +198.40, date: 'May 21, 2026', label: 'Distribution Received' },
  { id: 2, type: 'dividend', ticker: 'ZWQT',  amount: +142.80, date: 'May 20, 2026', label: 'Distribution Received' },
  { id: 3, type: 'buy',      ticker: 'QQCC',  amount: -1_500.00, date: 'May 19, 2026', label: 'Buy Order' },
  { id: 4, type: 'dividend', ticker: 'HYLD',  amount: +171.60, date: 'May 15, 2026', label: 'Distribution Received' },
  { id: 5, type: 'dividend', ticker: 'HHIS',  amount: +162.40, date: 'May 14, 2026', label: 'Distribution Received' },
  { id: 6, type: 'dividend', ticker: 'BMAX',  amount: +148.20, date: 'May 13, 2026', label: 'Distribution Received' },
  { id: 7, type: 'dividend', ticker: 'EQCL',  amount: +155.30, date: 'May 12, 2026', label: 'Distribution Received' },
];

// ── Income Projection ──
export const incomeProjection = [
  { month: 'Jan', actual: 1190, projected: 1200 },
  { month: 'Feb', actual: 1210, projected: 1225 },
  { month: 'Mar', actual: 1250, projected: 1260 },
  { month: 'Apr', actual: 1310, projected: 1320 },
  { month: 'May', actual: 1487, projected: 1500 },
  { month: 'Jun', actual: null, projected: 1530 },
  { month: 'Jul', actual: null, projected: 1560 },
  { month: 'Aug', actual: null, projected: 1590 },
  { month: 'Sep', actual: null, projected: 1620 },
  { month: 'Oct', actual: null, projected: 1660 },
  { month: 'Nov', actual: null, projected: 1700 },
  { month: 'Dec', actual: null, projected: 1750 },
];

// ── Allocation (based on Portfolio #1 mix) ──
export const allocationData = [
  { name: 'CDN Covered Call', value: 40, color: '#F59E0B' },
  { name: 'US Covered Call',  value: 30, color: '#8B5CF6' },
  { name: 'Global Mixed',     value: 20, color: '#10B981' },
  { name: 'Fixed Income',     value: 10, color: '#3B82F6' },
];

// ── ETF Screener (Tab 5 + Tab 2 + Tab 4 of Excel — income-focused selection) ──
// Fields: ticker, name, manager, mer (%), yield (% est.), payout, coveredCall, usListed,
//         sector, region, index, type, stars
// yield = estimated distribution yield (not in Excel; approximate based on fund strategy)
// type = screener category: 'CDN Covered Call' | 'US Covered Call' | 'CDN Equity' | 'US Equity' | 'Fixed Income' | 'REIT'

export const etfsExtended = [
  // ── Hamilton ETFs ──
  { ticker: 'HDIV',  name: 'Hamilton Enhanced Multi-Sector Covered Call ETF',  manager: 'Hamilton', mer: 0.65, yield: 8.72,  payout: 'Monthly', coveredCall: true,  usListed: false, sector: 'Mixed',     region: 'Global',        index: 'TSX60',      type: 'CDN Covered Call', stars: 5, exDate: 'May 28, 2026', recDate: 'May 29, 2026', payDate: 'Jun 4, 2026'  },
  { ticker: 'HYLD',  name: 'Hamilton Enhanced U.S. Covered Call ETF',           manager: 'Hamilton', mer: 0.65, yield: 9.48,  payout: 'Monthly', coveredCall: true,  usListed: false, sector: 'Mixed',     region: 'U.S.',          index: 'S&P 500',    type: 'CDN Covered Call', stars: 5, exDate: 'May 30, 2026', recDate: 'May 31, 2026', payDate: 'Jun 6, 2026'  },
  { ticker: 'HMAX',  name: 'Hamilton Canadian Financials Yield Maximizer ETF',  manager: 'Hamilton', mer: 0.65, yield: 11.2,  payout: 'Monthly', coveredCall: true,  usListed: false, sector: 'Financial', region: 'Canada',        index: '',           type: 'CDN Covered Call', stars: 4, exDate: 'Jun 2, 2026',  recDate: 'Jun 3, 2026',  payDate: 'Jun 10, 2026' },
  { ticker: 'QMAX',  name: 'Hamilton Technology Yield Maximizer ETF',           manager: 'Hamilton', mer: 0.65, yield: 12.5,  payout: 'Monthly', coveredCall: true,  usListed: false, sector: 'Technology',region: 'U.S.',          index: '',           type: 'CDN Covered Call', stars: 4, exDate: 'Jun 4, 2026',  recDate: 'Jun 5, 2026',  payDate: 'Jun 12, 2026' },
  { ticker: 'SMAX',  name: 'Hamilton U.S. Equity Yield Maximizer ETF',          manager: 'Hamilton', mer: 0.65, yield: 10.1,  payout: 'Monthly', coveredCall: true,  usListed: false, sector: 'Mixed',     region: 'U.S.',          index: 'S&P 500',    type: 'CDN Covered Call', stars: 4, exDate: 'Jun 6, 2026',  recDate: 'Jun 7, 2026',  payDate: 'Jun 14, 2026' },
  { ticker: 'UMAX',  name: 'Hamilton Utilities Yield Maximizer ETF',            manager: 'Hamilton', mer: 0.65, yield: 9.8,   payout: 'Monthly', coveredCall: true,  usListed: false, sector: 'Utilities', region: 'Canada',        index: '',           type: 'CDN Covered Call', stars: 4, exDate: 'Jun 3, 2026',  recDate: 'Jun 4, 2026',  payDate: 'Jun 11, 2026' },
  { ticker: 'RMAX',  name: 'Hamilton REITs Yield Maximizer ETF',                manager: 'Hamilton', mer: 0.65, yield: 10.0,  payout: 'Monthly', coveredCall: true,  usListed: false, sector: 'Real Estate',region: 'North America', index: '',           type: 'REIT',             stars: 3, exDate: 'Jun 5, 2026',  recDate: 'Jun 6, 2026',  payDate: 'Jun 13, 2026' },
  { ticker: 'HBND',  name: 'Hamilton U.S. Bond Yield Maximizer ETF',            manager: 'Hamilton', mer: 0.45, yield: 7.2,   payout: 'Monthly', coveredCall: true,  usListed: false, sector: 'Fixed Income',region: 'U.S.',         index: '',           type: 'Fixed Income',     stars: 4, exDate: 'Jun 7, 2026',  recDate: 'Jun 8, 2026',  payDate: 'Jun 15, 2026' },
  { ticker: 'HBIL',  name: 'Hamilton U.S. T-Bill Yield Maximizer ETF',          manager: 'Hamilton', mer: 0.35, yield: 6.1,   payout: 'Monthly', coveredCall: true,  usListed: false, sector: 'Fixed Income',region: 'U.S.',         index: '',           type: 'Fixed Income',     stars: 4, exDate: 'Jun 9, 2026',  recDate: 'Jun 10, 2026', payDate: 'Jun 17, 2026' },
  { ticker: 'CDAY',  name: 'Hamilton Enhanced Canadian Equity DayMAX ETF',      manager: 'Hamilton', mer: 0.85, yield: 14.5,  payout: 'Semi-Monthly', coveredCall: true, usListed: false, sector: 'Mixed', region: 'Canada',       index: '',           type: 'CDN Covered Call', stars: 3, exDate: 'Jun 1, 2026',  recDate: 'Jun 2, 2026',  payDate: 'Jun 9, 2026'  },
  { ticker: 'SDAY',  name: 'Hamilton Enhanced U.S. Equity DayMAX ETF',          manager: 'Hamilton', mer: 0.85, yield: 14.2,  payout: 'Semi-Monthly', coveredCall: true, usListed: false, sector: 'Mixed', region: 'U.S.',         index: '',           type: 'CDN Covered Call', stars: 3, exDate: 'Jun 8, 2026',  recDate: 'Jun 9, 2026',  payDate: 'Jun 16, 2026' },

  // ── BMO ETFs ──
  { ticker: 'ZWQT',  name: 'BMO Global Enhanced Income Fund ETF',               manager: 'BMO', mer: 0.65, yield: 7.6,   payout: 'Monthly', coveredCall: true,  usListed: false, sector: 'Mixed',     region: 'Global',        index: '',           type: 'CDN Covered Call', stars: 5, exDate: 'May 27, 2026', recDate: 'May 28, 2026', payDate: 'Jun 3, 2026'  },
  { ticker: 'ZWB',   name: 'BMO Covered Call Canadian Banks ETF',               manager: 'BMO', mer: 0.65, yield: 6.5,   payout: 'Monthly', coveredCall: true,  usListed: false, sector: 'Financial', region: 'Canada',        index: '',           type: 'CDN Covered Call', stars: 5, exDate: 'Jun 2, 2026',  recDate: 'Jun 3, 2026',  payDate: 'Jun 10, 2026' },
  { ticker: 'ZWC',   name: 'BMO Canada High Dividend Covered Call ETF',         manager: 'BMO', mer: 0.65, yield: 6.6,   payout: 'Monthly', coveredCall: true,  usListed: false, sector: 'Mixed',     region: 'Canada',        index: '',           type: 'CDN Covered Call', stars: 4, exDate: 'Jun 4, 2026',  recDate: 'Jun 5, 2026',  payDate: 'Jun 12, 2026' },
  { ticker: 'ZWU',   name: 'BMO Covered Call Utilities ETF',                    manager: 'BMO', mer: 0.65, yield: 7.1,   payout: 'Monthly', coveredCall: true,  usListed: false, sector: 'Utilities', region: 'North America', index: '',           type: 'CDN Covered Call', stars: 4, exDate: 'Jun 6, 2026',  recDate: 'Jun 7, 2026',  payDate: 'Jun 14, 2026' },
  { ticker: 'ZWT',   name: 'BMO Covered Call Technology ETF',                   manager: 'BMO', mer: 0.65, yield: 7.0,   payout: 'Monthly', coveredCall: true,  usListed: false, sector: 'Technology',region: 'U.S.',          index: '',           type: 'CDN Covered Call', stars: 4, exDate: 'Jun 8, 2026',  recDate: 'Jun 9, 2026',  payDate: 'Jun 16, 2026' },
  { ticker: 'ZPAY',  name: 'BMO Premium Yield ETF',                             manager: 'BMO', mer: 0.65, yield: 6.4,   payout: 'Monthly', coveredCall: true,  usListed: false, sector: 'Mixed',     region: 'U.S.',          index: '',           type: 'CDN Covered Call', stars: 4, exDate: 'Jun 10, 2026', recDate: 'Jun 11, 2026', payDate: 'Jun 18, 2026' },
  { ticker: 'ZRE',   name: 'BMO Equal Weight REITs Index ETF',                  manager: 'BMO', mer: 0.55, yield: 5.1,   payout: 'Monthly', coveredCall: false, usListed: false, sector: 'Real Estate',region: 'Canada',        index: '',           type: 'REIT',             stars: 4, exDate: 'Jun 3, 2026',  recDate: 'Jun 4, 2026',  payDate: 'Jun 11, 2026' },
  { ticker: 'ZPR',   name: 'BMO Laddered Preferred Share Index ETF',            manager: 'BMO', mer: 0.45, yield: 5.4,   payout: 'Monthly', coveredCall: false, usListed: false, sector: 'Fixed Income',region: 'Canada',        index: '',           type: 'Fixed Income',     stars: 4, exDate: 'Jun 5, 2026',  recDate: 'Jun 6, 2026',  payDate: 'Jun 13, 2026' },
  { ticker: 'XDIV',  name: 'iShares Core MSCI Canadian Quality Dividend Index', manager: 'iShares CA', mer: 0.10, yield: 4.8, payout: 'Monthly', coveredCall: false, usListed: false, sector: 'Mixed', region: 'Canada',       index: '',           type: 'CDN Equity',       stars: 5, exDate: 'May 29, 2026', recDate: 'May 30, 2026', payDate: 'Jun 5, 2026'  },
  { ticker: 'XEI',   name: 'iShares S&P/TSX Composite High Dividend Index ETF', manager: 'iShares CA', mer: 0.20, yield: 4.9, payout: 'Monthly', coveredCall: false, usListed: false, sector: 'Mixed', region: 'Canada',       index: 'TSX',        type: 'CDN Equity',       stars: 5, exDate: 'Jun 12, 2026', recDate: 'Jun 13, 2026', payDate: 'Jun 20, 2026' },
  { ticker: 'XDV',   name: 'iShares Canadian Select Dividend Index ETF',        manager: 'iShares CA', mer: 0.50, yield: 4.5, payout: 'Monthly', coveredCall: false, usListed: false, sector: 'Mixed', region: 'Canada',       index: '',           type: 'CDN Equity',       stars: 4, exDate: 'Jun 14, 2026', recDate: 'Jun 15, 2026', payDate: 'Jun 22, 2026' },

  // ── Global X Canada ──
  { ticker: 'QQCC',  name: 'Global X NASDAQ-100 Covered Call ETF',              manager: 'Global X CA', mer: 0.65, yield: 9.2,  payout: 'Monthly', coveredCall: true,  usListed: false, sector: 'Mixed',     region: 'U.S.',          index: 'NASDAQ 100', type: 'CDN Covered Call', stars: 4, exDate: 'May 29, 2026', recDate: 'May 30, 2026', payDate: 'Jun 5, 2026'  },
  { ticker: 'QQCL',  name: 'Global X Enhanced NASDAQ-100 Covered Call ETF',     manager: 'Global X CA', mer: 0.85, yield: 13.8, payout: 'Monthly', coveredCall: true,  usListed: false, sector: 'Mixed',     region: 'U.S.',          index: 'NASDAQ 100', type: 'CDN Covered Call', stars: 3, exDate: 'May 31, 2026', recDate: 'Jun 1, 2026',  payDate: 'Jun 7, 2026'  },
  { ticker: 'USCC',  name: 'Global X S&P 500 Covered Call ETF',                 manager: 'Global X CA', mer: 0.39, yield: 7.1,  payout: 'Monthly', coveredCall: true,  usListed: false, sector: 'Mixed',     region: 'U.S.',          index: 'S&P 500',    type: 'CDN Covered Call', stars: 5, exDate: 'Jun 2, 2026',  recDate: 'Jun 3, 2026',  payDate: 'Jun 9, 2026'  },
  { ticker: 'USCL',  name: 'Global X Enhanced S&P 500 Covered Call ETF',        manager: 'Global X CA', mer: 0.65, yield: 11.3, payout: 'Monthly', coveredCall: true,  usListed: false, sector: 'Mixed',     region: 'U.S.',          index: 'S&P 500',    type: 'CDN Covered Call', stars: 4, exDate: 'Jun 4, 2026',  recDate: 'Jun 5, 2026',  payDate: 'Jun 11, 2026' },
  { ticker: 'CNCC',  name: 'Global X S&P/TSX 60 Covered Call ETF',              manager: 'Global X CA', mer: 0.39, yield: 7.0,  payout: 'Monthly', coveredCall: true,  usListed: false, sector: 'Mixed',     region: 'Canada',        index: 'TSX60',      type: 'CDN Covered Call', stars: 4, exDate: 'Jun 6, 2026',  recDate: 'Jun 7, 2026',  payDate: 'Jun 13, 2026' },
  { ticker: 'CNCL',  name: 'Global X Enhanced S&P/TSX 60 Covered Call ETF',     manager: 'Global X CA', mer: 0.65, yield: 10.5, payout: 'Monthly', coveredCall: true,  usListed: false, sector: 'Mixed',     region: 'Canada',        index: 'TSX60',      type: 'CDN Covered Call', stars: 3, exDate: 'Jun 8, 2026',  recDate: 'Jun 9, 2026',  payDate: 'Jun 15, 2026' },
  { ticker: 'EQCL',  name: 'Global X Enhanced All-Equity Covered Call ETF',     manager: 'Global X CA', mer: 0.75, yield: 11.0, payout: 'Monthly', coveredCall: true,  usListed: false, sector: 'Mixed',     region: 'Global',        index: '',           type: 'CDN Covered Call', stars: 4, exDate: 'Jun 10, 2026', recDate: 'Jun 11, 2026', payDate: 'Jun 17, 2026' },
  { ticker: 'EQCC',  name: 'Global X All-Equity Asset Allocation Covered Call',  manager: 'Global X CA', mer: 0.49, yield: 7.5,  payout: 'Monthly', coveredCall: true,  usListed: false, sector: 'Mixed',     region: 'Global',        index: '',           type: 'CDN Covered Call', stars: 4, exDate: 'Jun 12, 2026', recDate: 'Jun 13, 2026', payDate: 'Jun 19, 2026' },
  { ticker: 'BKCC',  name: 'Global X Equal Weight Canadian Bank Covered Call',   manager: 'Global X CA', mer: 0.39, yield: 7.0,  payout: 'Monthly', coveredCall: true,  usListed: false, sector: 'Financial', region: 'Canada',        index: '',           type: 'CDN Covered Call', stars: 4, exDate: 'Jun 14, 2026', recDate: 'Jun 15, 2026', payDate: 'Jun 21, 2026' },
  { ticker: 'ENCC',  name: 'Global X Canadian Oil & Gas Equity Covered Call',    manager: 'Global X CA', mer: 0.65, yield: 8.4,  payout: 'Monthly', coveredCall: true,  usListed: false, sector: 'Energy',    region: 'Canada',        index: '',           type: 'CDN Covered Call', stars: 3, exDate: 'Jun 1, 2026',  recDate: 'Jun 2, 2026',  payDate: 'Jun 8, 2026'  },
  { ticker: 'GLCC',  name: 'Global X Gold Producer Equity Covered Call ETF',     manager: 'Global X CA', mer: 0.65, yield: 8.5,  payout: 'Monthly', coveredCall: true,  usListed: false, sector: 'Materials', region: 'Global',        index: '',           type: 'CDN Covered Call', stars: 3, exDate: 'Jun 3, 2026',  recDate: 'Jun 4, 2026',  payDate: 'Jun 10, 2026' },

  // ── Evolve ETFs ──
  { ticker: 'BIGY',  name: 'Evolve US Equity UltraYield ETF',                   manager: 'Evolve', mer: 0.40, yield: 13.2, payout: 'Semi-Monthly', coveredCall: true, usListed: false, sector: 'Mixed',    region: 'U.S.',          index: '',           type: 'CDN Covered Call', stars: 4, exDate: 'May 28, 2026', recDate: 'May 29, 2026', payDate: 'Jun 4, 2026'  },
  { ticker: 'CANY',  name: 'Evolve Canadian Equity UltraYield ETF',             manager: 'Evolve', mer: 0.40, yield: 12.4, payout: 'Semi-Monthly', coveredCall: true, usListed: false, sector: 'Mixed',    region: 'Canada',        index: '',           type: 'CDN Covered Call', stars: 4, exDate: 'May 30, 2026', recDate: 'May 31, 2026', payDate: 'Jun 6, 2026'  },
  { ticker: 'ESPX',  name: 'Evolve S&P 500 Enhanced Yield Fund',               manager: 'Evolve', mer: 0.45, yield: 7.8,  payout: 'Monthly', coveredCall: true,  usListed: false, sector: 'Mixed',     region: 'U.S.',          index: 'S&P 500',    type: 'CDN Covered Call', stars: 5, exDate: 'Jun 2, 2026',  recDate: 'Jun 3, 2026',  payDate: 'Jun 9, 2026'  },
  { ticker: 'ETSX',  name: 'Evolve S&P/TSX 60 Enhanced Yield Fund',            manager: 'Evolve', mer: 0.45, yield: 6.8,  payout: 'Monthly', coveredCall: true,  usListed: false, sector: 'Mixed',     region: 'Canada',        index: 'TSX60',      type: 'CDN Covered Call', stars: 4, exDate: 'Jun 4, 2026',  recDate: 'Jun 5, 2026',  payDate: 'Jun 11, 2026' },
  { ticker: 'BANK',  name: 'Evolve Canadian Banks & Lifecos Enhanced Yield ETF', manager: 'Evolve', mer: 0.60, yield: 8.1, payout: 'Monthly', coveredCall: true,  usListed: false, sector: 'Financial', region: 'Canada',        index: '',           type: 'CDN Covered Call', stars: 4, exDate: 'Jun 6, 2026',  recDate: 'Jun 7, 2026',  payDate: 'Jun 13, 2026' },
  { ticker: 'UTES',  name: 'Evolve Canadian Utilities Enhanced Yield Index ETF', manager: 'Evolve', mer: 0.60, yield: 7.8, payout: 'Monthly', coveredCall: true,  usListed: false, sector: 'Utilities', region: 'Canada',        index: '',           type: 'CDN Covered Call', stars: 4, exDate: 'Jun 8, 2026',  recDate: 'Jun 9, 2026',  payDate: 'Jun 15, 2026' },

  // ── Harvest ETFs ──
  { ticker: 'HDIF',  name: 'Harvest Diversified Monthly Income ETF',            manager: 'Harvest', mer: 0.00, yield: 8.2,  payout: 'Monthly', coveredCall: true,  usListed: false, sector: 'Mixed',     region: 'Global',        index: '',           type: 'CDN Covered Call', stars: 5, exDate: 'May 27, 2026', recDate: 'May 28, 2026', payDate: 'Jun 3, 2026'  },
  { ticker: 'HHIS',  name: 'Harvest Diversified High Income Shares ETF',        manager: 'Harvest', mer: 0.40, yield: 12.0, payout: 'Monthly', coveredCall: true,  usListed: false, sector: 'Mixed',     region: 'U.S.',          index: '',           type: 'CDN Covered Call', stars: 4, exDate: 'May 29, 2026', recDate: 'May 30, 2026', payDate: 'Jun 5, 2026'  },
  { ticker: 'HHIC',  name: 'Harvest Canadian High Income Shares ETF',           manager: 'Harvest', mer: 0.40, yield: 11.2, payout: 'Monthly', coveredCall: true,  usListed: false, sector: 'Mixed',     region: 'Canada',        index: '',           type: 'CDN Covered Call', stars: 4, exDate: 'May 31, 2026', recDate: 'Jun 1, 2026',  payDate: 'Jun 7, 2026'  },
  { ticker: 'HPYT',  name: 'Harvest Premium Yield Treasury ETF',               manager: 'Harvest', mer: 0.45, yield: 11.5, payout: 'Monthly', coveredCall: true,  usListed: false, sector: 'Fixed Income',region: 'U.S.',         index: '',           type: 'Fixed Income',     stars: 4, exDate: 'Jun 2, 2026',  recDate: 'Jun 3, 2026',  payDate: 'Jun 9, 2026'  },
  { ticker: 'HHL',   name: 'Harvest Healthcare Leaders Income ETF',             manager: 'Harvest', mer: 0.85, yield: 8.0,  payout: 'Monthly', coveredCall: true,  usListed: false, sector: 'Healthcare',region: 'Global',        index: '',           type: 'CDN Covered Call', stars: 4, exDate: 'Jun 4, 2026',  recDate: 'Jun 5, 2026',  payDate: 'Jun 11, 2026' },
  { ticker: 'HUTL',  name: 'Harvest Equal Weight Global Utilities Income ETF',  manager: 'Harvest', mer: 0.50, yield: 7.9,  payout: 'Monthly', coveredCall: true,  usListed: false, sector: 'Utilities', region: 'Global',        index: '',           type: 'CDN Covered Call', stars: 4, exDate: 'Jun 6, 2026',  recDate: 'Jun 7, 2026',  payDate: 'Jun 13, 2026' },
  { ticker: 'HTA',   name: 'Harvest Tech Achievers Growth & Income ETF',        manager: 'Harvest', mer: 0.85, yield: 9.5,  payout: 'Monthly', coveredCall: true,  usListed: false, sector: 'Technology',region: 'U.S.',          index: '',           type: 'CDN Covered Call', stars: 4, exDate: 'Jun 8, 2026',  recDate: 'Jun 9, 2026',  payDate: 'Jun 15, 2026' },
  { ticker: 'HGR',   name: 'Harvest Global REIT Leaders Income ETF',            manager: 'Harvest', mer: 0.85, yield: 8.5,  payout: 'Monthly', coveredCall: true,  usListed: false, sector: 'Real Estate',region: 'Global',        index: '',           type: 'REIT',             stars: 3, exDate: 'Jun 10, 2026', recDate: 'Jun 11, 2026', payDate: 'Jun 17, 2026' },

  // ── Brompton ETFs ──
  { ticker: 'BMAX',  name: 'Brompton Enhanced Multi-Asset Income ETF',          manager: 'Brompton', mer: 0.00, yield: 8.3,  payout: 'Monthly', coveredCall: true,  usListed: false, sector: 'Mixed',     region: 'Global',        index: '',           type: 'CDN Covered Call', stars: 5, exDate: 'May 28, 2026', recDate: 'May 29, 2026', payDate: 'Jun 4, 2026'  },
  { ticker: 'CLSA',  name: 'Brompton Split Corp. Class A Share ETF',            manager: 'Brompton', mer: 0.60, yield: 9.2,  payout: 'Monthly', coveredCall: true,  usListed: false, sector: 'Mixed',     region: 'Global',        index: '',           type: 'CDN Covered Call', stars: 3, exDate: 'May 30, 2026', recDate: 'May 31, 2026', payDate: 'Jun 6, 2026'  },
  { ticker: 'SPLT',  name: 'Brompton Split Corp. Preferred Share ETF',          manager: 'Brompton', mer: 0.50, yield: 5.8,  payout: 'Monthly', coveredCall: false, usListed: false, sector: 'Fixed Income',region: 'Global',        index: '',           type: 'Fixed Income',     stars: 4, exDate: 'Jun 2, 2026',  recDate: 'Jun 3, 2026',  payDate: 'Jun 9, 2026'  },

  // ── Ninepoint ──
  { ticker: 'ECHI',  name: 'Ninepoint Enhanced Canadian HighShares ETF',        manager: 'Ninepoint', mer: 0.29, yield: 11.3, payout: 'Monthly', coveredCall: true,  usListed: false, sector: 'Mixed',     region: 'Canada',        index: '',           type: 'CDN Covered Call', stars: 4, exDate: 'May 29, 2026', recDate: 'May 30, 2026', payDate: 'Jun 5, 2026'  },

  // ── JPMorgan (Canadian-listed) ──
  { ticker: 'JEPI',  name: 'JPMorgan Equity Premium Income ETF (CAD)',          manager: 'J.P. Morgan CA', mer: 0.35, yield: 7.5, payout: 'Monthly', coveredCall: true, usListed: false, sector: 'Mixed',   region: 'U.S.',          index: 'S&P 500',    type: 'CDN Covered Call', stars: 5, exDate: 'May 27, 2026', recDate: 'May 28, 2026', payDate: 'Jun 3, 2026'  },
  { ticker: 'JEPQ',  name: 'JPMorgan Nasdaq Equity Premium Income ETF (CAD)',   manager: 'J.P. Morgan CA', mer: 0.35, yield: 8.1, payout: 'Monthly', coveredCall: true, usListed: false, sector: 'Mixed',   region: 'U.S.',          index: 'NASDAQ 100', type: 'CDN Covered Call', stars: 5, exDate: 'May 29, 2026', recDate: 'May 30, 2026', payDate: 'Jun 5, 2026'  },

  // ── US-Listed ETFs ──
  { ticker: 'QYLD',  name: 'Global X NASDAQ 100 Covered Call ETF',              manager: 'Global X US', mer: 0.61, yield: 11.5, payout: 'Monthly', coveredCall: true,  usListed: true, sector: 'Technology',region: 'U.S.',          index: 'NASDAQ 100', type: 'US Covered Call',  stars: 4, exDate: 'May 28, 2026', recDate: 'May 29, 2026', payDate: 'Jun 4, 2026'  },
  { ticker: 'XYLD',  name: 'Global X S&P 500 Covered Call ETF',                 manager: 'Global X US', mer: 0.60, yield: 9.5,  payout: 'Monthly', coveredCall: true,  usListed: true, sector: 'Mixed',     region: 'U.S.',          index: 'S&P 500',    type: 'US Covered Call',  stars: 4, exDate: 'May 30, 2026', recDate: 'May 31, 2026', payDate: 'Jun 6, 2026'  },
  { ticker: 'RYLD',  name: 'Global X Russell 2000 Covered Call ETF',            manager: 'Global X US', mer: 0.63, yield: 12.0, payout: 'Monthly', coveredCall: true,  usListed: true, sector: 'Mixed',     region: 'U.S.',          index: 'Russell 2000',type: 'US Covered Call', stars: 3, exDate: 'Jun 1, 2026',  recDate: 'Jun 2, 2026',  payDate: 'Jun 8, 2026'  },
  { ticker: 'SPYI',  name: 'NEOS S&P 500 High Income ETF',                      manager: 'NEOS',    mer: 0.68, yield: 12.2, payout: 'Monthly', coveredCall: true,  usListed: true, sector: 'Mixed',     region: 'U.S.',          index: 'S&P 500',    type: 'US Covered Call',  stars: 4, exDate: 'Jun 3, 2026',  recDate: 'Jun 4, 2026',  payDate: 'Jun 10, 2026' },
  { ticker: 'QQQI',  name: 'NEOS NASDAQ-100 High Income ETF',                   manager: 'NEOS',    mer: 0.68, yield: 13.1, payout: 'Monthly', coveredCall: true,  usListed: true, sector: 'Mixed',     region: 'U.S.',          index: 'NASDAQ 100', type: 'US Covered Call',  stars: 4, exDate: 'Jun 5, 2026',  recDate: 'Jun 6, 2026',  payDate: 'Jun 12, 2026' },
  { ticker: 'JEPI',  name: 'JPMorgan Equity Premium Income ETF',                manager: 'J.P. Morgan', mer: 0.35, yield: 7.4, payout: 'Monthly', coveredCall: true, usListed: true, sector: 'Mixed',    region: 'U.S.',          index: 'S&P 500',    type: 'US Covered Call',  stars: 5, exDate: 'May 27, 2026', recDate: 'May 28, 2026', payDate: 'Jun 3, 2026'  },
  { ticker: 'JEPQ',  name: 'JPMorgan Nasdaq Equity Premium Income ETF',         manager: 'J.P. Morgan', mer: 0.35, yield: 8.0, payout: 'Monthly', coveredCall: true, usListed: true, sector: 'Mixed',    region: 'U.S.',          index: 'NASDAQ 100', type: 'US Covered Call',  stars: 5, exDate: 'May 29, 2026', recDate: 'May 30, 2026', payDate: 'Jun 5, 2026'  },
  { ticker: 'SCHD',  name: 'Schwab U.S. Dividend Equity ETF',                   manager: 'Charles Schwab', mer: 0.06, yield: 3.5, payout: 'Quarterly', coveredCall: false, usListed: true, sector: 'Mixed', region: 'U.S.',        index: '',           type: 'US Equity',        stars: 5, exDate: 'Jun 7, 2026',  recDate: 'Jun 8, 2026',  payDate: 'Jun 15, 2026' },
  { ticker: 'DVY',   name: 'iShares Select Dividend ETF',                        manager: 'iShares US', mer: 0.38, yield: 4.7, payout: 'Quarterly', coveredCall: false, usListed: true, sector: 'Mixed',  region: 'U.S.',          index: '',           type: 'US Equity',        stars: 4, exDate: 'Jun 9, 2026',  recDate: 'Jun 10, 2026', payDate: 'Jun 17, 2026' },
  { ticker: 'SDIV',  name: 'Global X SuperDividend ETF',                         manager: 'Global X US', mer: 0.59, yield: 10.5, payout: 'Monthly', coveredCall: false, usListed: true, sector: 'Mixed', region: 'Global',        index: '',           type: 'US Equity',        stars: 3, exDate: 'Jun 11, 2026', recDate: 'Jun 12, 2026', payDate: 'Jun 19, 2026' },
  { ticker: 'PFFD',  name: 'Global X U.S. Preferred ETF',                       manager: 'Global X US', mer: 0.23, yield: 6.2, payout: 'Monthly', coveredCall: false, usListed: true, sector: 'Fixed Income',region: 'U.S.',        index: '',           type: 'Fixed Income',     stars: 4, exDate: 'Jun 13, 2026', recDate: 'Jun 14, 2026', payDate: 'Jun 20, 2026' },
  { ticker: 'SRET',  name: 'Global X SuperDividend REIT ETF',                   manager: 'Global X US', mer: 0.59, yield: 8.2, payout: 'Monthly', coveredCall: false, usListed: true, sector: 'Real Estate',region: 'Global',       index: '',           type: 'REIT',             stars: 3, exDate: 'Jun 15, 2026', recDate: 'Jun 16, 2026', payDate: 'Jun 22, 2026' },

  // ── CDN Equity (non-covered-call) ──
  { ticker: 'XEQT',  name: 'iShares Core Equity ETF Portfolio',                 manager: 'iShares CA', mer: 0.18, yield: 2.1, payout: 'Quarterly', coveredCall: false, usListed: false, sector: 'Mixed',   region: 'Global',        index: '',           type: 'CDN Equity',       stars: 5, exDate: 'Jun 16, 2026', recDate: 'Jun 17, 2026', payDate: 'Jun 24, 2026' },
  { ticker: 'VDY',   name: 'Vanguard FTSE Canadian High Dividend Yield Index',  manager: 'Vanguard CA', mer: 0.22, yield: 4.2, payout: 'Monthly', coveredCall: false, usListed: false, sector: 'Mixed',    region: 'Canada',        index: 'TSX',        type: 'CDN Equity',       stars: 5, exDate: 'May 31, 2026', recDate: 'Jun 1, 2026',  payDate: 'Jun 7, 2026'  },
  { ticker: 'ZEB',   name: 'BMO Equal Weight Banks Index ETF',                  manager: 'BMO',     mer: 0.55, yield: 4.0,  payout: 'Monthly', coveredCall: false, usListed: false, sector: 'Financial', region: 'Canada',        index: '',           type: 'CDN Equity',       stars: 4, exDate: 'Jun 18, 2026', recDate: 'Jun 19, 2026', payDate: 'Jun 26, 2026' },
  { ticker: 'CPD',   name: 'iShares S&P/TSX Canadian Preferred Share Index',    manager: 'iShares CA', mer: 0.45, yield: 5.6, payout: 'Monthly', coveredCall: false, usListed: false, sector: 'Fixed Income',region: 'Canada',       index: 'TSX',        type: 'Fixed Income',     stars: 3, exDate: 'Jun 20, 2026', recDate: 'Jun 21, 2026', payDate: 'Jun 28, 2026' },
];

// ── Advisor chat seed ──
export const advisorMessages = [
  {
    role: 'assistant',
    content: "Hello! I'm your AI Advisor, trained on Erica's passive income investing strategies. I can help you analyze your portfolio, compare ETFs from the DIY Investing Package, or build a cash-flow plan. What would you like to explore today?",
  },
];

// ── Goals (M4 — Goal Engine) ──
export const goals = [
  { id: 1, label: 'Monthly Passive Income',  current: 1487,   target: 3000,   unit: '$/mo', color: '#F59E0B' },
  { id: 2, label: 'Total Portfolio Value',    current: 148320, target: 300000, unit: '$',    color: '#8B5CF6' },
  { id: 3, label: 'Yield on Cost',            current: 12.03,  target: 15.0,   unit: '%',    color: '#10B981' },
];

// ── Brokerage Accounts (manual CSV import — updated monthly) ──
// Canadian brokers from Excel Tab 9
export const brokerageAccounts = [
  { id: 1, broker: 'Questrade',       accountType: 'TFSA',  value: 72_450.20, lastImport: 'May 1, 2026',  status: 'imported',  logo: 'QT'  },
  { id: 2, broker: 'Wealthsimple',    accountType: 'RRSP',  value: 48_120.00, lastImport: 'May 1, 2026',  status: 'imported',  logo: 'WS'  },
  { id: 3, broker: 'RBC Direct',      accountType: 'Cash',  value: 27_750.34, lastImport: 'May 1, 2026',  status: 'imported',  logo: 'RBC' },
  { id: 4, broker: 'TD Direct',       accountType: 'FHSA',  value: null,      lastImport: null,           status: 'pending',   logo: 'TD'  },
];

// ── Portfolio Holdings (Portfolio #1 from Excel Tab 1) ──
// 10 ETFs × 10% each — ~12% blended yield
export const portfolioHoldings = [
  { ticker: 'ZWQT', name: 'BMO Global Enhanced Income Fund ETF',               currentPct: 11.2, targetPct: 10, value: 16_611, drift: +1.2,  color: '#F59E0B' },
  { ticker: 'HDIV', name: 'Hamilton Enhanced Multi-Sector Covered Call ETF',   currentPct: 9.8,  targetPct: 10, value: 14_535, drift: -0.2,  color: '#8B5CF6' },
  { ticker: 'HYLD', name: 'Hamilton Enhanced U.S. Covered Call ETF',           currentPct: 8.4,  targetPct: 10, value: 12_459, drift: -1.6,  color: '#10B981' },
  { ticker: 'HDIF', name: 'Harvest Diversified Monthly Income ETF',            currentPct: 10.5, targetPct: 10, value: 15_573, drift: +0.5,  color: '#3B82F6' },
  { ticker: 'HHIS', name: 'Harvest Diversified High Income Shares ETF',        currentPct: 11.8, targetPct: 10, value: 17_501, drift: +1.8,  color: '#EC4899' },
  { ticker: 'EQCL', name: 'Global X Enhanced All-Equity Asset Allocation CC',  currentPct: 9.2,  targetPct: 10, value: 13_645, drift: -0.8,  color: '#06B6D4' },
  { ticker: 'USCC', name: 'Global X S&P 500 Covered Call ETF',                 currentPct: 10.1, targetPct: 10, value: 14_980, drift: +0.1,  color: '#F97316' },
  { ticker: 'QQCC', name: 'Global X NASDAQ-100 Covered Call ETF',              currentPct: 8.6,  targetPct: 10, value: 12_755, drift: -1.4,  color: '#A855F7' },
  { ticker: 'BMAX', name: 'Brompton Enhanced Multi-Asset Income ETF',          currentPct: 10.3, targetPct: 10, value: 15_277, drift: +0.3,  color: '#14B8A6' },
  { ticker: 'ECHI', name: 'Ninepoint Enhanced Canadian HighShares ETF',        currentPct: 10.1, targetPct: 10, value: 14_984, drift: +0.1,  color: '#EAB308' },
];

// ── Drift Alerts (M6 — Rebalance) ──
export const driftAlerts = [
  { ticker: 'HHIS',  severity: 'high',   message: '+1.8% above target — consider trimming ~$2,670' },
  { ticker: 'ZWQT',  severity: 'medium', message: '+1.2% above target — consider trimming ~$1,780' },
  { ticker: 'HYLD',  severity: 'medium', message: '-1.6% below target — consider adding ~$2,373' },
  { ticker: 'QQCC',  severity: 'medium', message: '-1.4% below target — consider adding ~$2,076' },
];

// ── Upcoming Distribution Dates (M2.5b) ──
export const upcomingDates = [
  { ticker: 'HDIV',  type: 'Ex-Div',   date: 'May 28, 2026', amount: 0.182, daysUntil: 5  },
  { ticker: 'ZWQT',  type: 'Pay Date', date: 'Jun 3, 2026',  amount: 0.096, daysUntil: 11 },
  { ticker: 'HYLD',  type: 'Ex-Div',   date: 'May 30, 2026', amount: 0.201, daysUntil: 7  },
  { ticker: 'HHIS',  type: 'Pay Date', date: 'Jun 5, 2026',  amount: 0.145, daysUntil: 13 },
  { ticker: 'BMAX',  type: 'Record',   date: 'Jun 2, 2026',  amount: 0.118, daysUntil: 10 },
  { ticker: 'EQCL',  type: 'Pay Date', date: 'Jun 11, 2026', amount: 0.162, daysUntil: 19 },
  { ticker: 'USCC',  type: 'Ex-Div',   date: 'Jun 2, 2026',  amount: 0.095, daysUntil: 10 },
  { ticker: 'QQCC',  type: 'Pay Date', date: 'Jun 5, 2026',  amount: 0.138, daysUntil: 13 },
];

// ── Distribution History (M2.5b — 12 months) ──
export const distributionHistory = [
  { month: 'Jun 2025', hdiv: 0.180, zwqt: 0.092, hyld: 0.196, hhis: 0.140 },
  { month: 'Jul 2025', hdiv: 0.181, zwqt: 0.093, hyld: 0.197, hhis: 0.141 },
  { month: 'Aug 2025', hdiv: 0.182, zwqt: 0.092, hyld: 0.196, hhis: 0.142 },
  { month: 'Sep 2025', hdiv: 0.183, zwqt: 0.094, hyld: 0.198, hhis: 0.143 },
  { month: 'Oct 2025', hdiv: 0.182, zwqt: 0.093, hyld: 0.197, hhis: 0.142 },
  { month: 'Nov 2025', hdiv: 0.183, zwqt: 0.094, hyld: 0.199, hhis: 0.143 },
  { month: 'Dec 2025', hdiv: 0.184, zwqt: 0.095, hyld: 0.200, hhis: 0.144 },
  { month: 'Jan 2026', hdiv: 0.181, zwqt: 0.093, hyld: 0.198, hhis: 0.142 },
  { month: 'Feb 2026', hdiv: 0.182, zwqt: 0.094, hyld: 0.199, hhis: 0.143 },
  { month: 'Mar 2026', hdiv: 0.183, zwqt: 0.095, hyld: 0.200, hhis: 0.144 },
  { month: 'Apr 2026', hdiv: 0.183, zwqt: 0.095, hyld: 0.200, hhis: 0.144 },
  { month: 'May 2026', hdiv: 0.182, zwqt: 0.096, hyld: 0.201, hhis: 0.145 },
];

// ── Rebalance History (M6) ──
export const rebalanceHistory = [
  { date: 'Apr 15, 2026', action: 'Trim HHIS → Add QQCC + HYLD', amount: '$3,240', status: 'completed' },
  { date: 'Mar 1, 2026',  action: 'Rebalanced to Portfolio #1 targets', amount: '$2,100', status: 'completed' },
  { date: 'Jan 20, 2026', action: 'Annual rebalance — all 10 positions', amount: '$5,400', status: 'completed' },
];

// ── Notifications (M7) ──
export const notifications = [
  { id: 1, type: 'distribution', title: 'HDIV distribution received',  body: '$198.40 landed in your Questrade TFSA',        time: '2 min ago',   read: false },
  { id: 2, type: 'drift',        title: 'Portfolio drift detected',     body: '4 positions off target · rebalance suggested', time: '1 hour ago',  read: false },
  { id: 3, type: 'checkin',      title: 'May check-in ready',           body: '$1,487/mo · +4.2% vs April · review now',      time: '3 hours ago', read: false },
  { id: 4, type: 'distribution', title: 'ZWQT distribution received',   body: '$142.80 landed in your Questrade TFSA',        time: 'Yesterday',   read: true  },
  { id: 5, type: 'distribution', title: 'HYLD distribution received',   body: '$171.60 landed in your Questrade TFSA',        time: 'Yesterday',   read: true  },
  { id: 6, type: 'import',       title: 'Holdings imported',            body: 'Questrade · Wealthsimple · RBC · May 1 import', time: '2 days ago',  read: true  },
];

// ── Monthly Check-in (M6) ──
export const monthlyCheckin = {
  month: 'May 2026',
  income: 1487.22,
  incomeChange: +4.2,
  distributionsReceived: 7,
  totalReceived: 1018.70,
  nextRebalance: 'Suggested now — 4 positions drifted',
  topPerformer: { ticker: 'HDIV', gain: '+2.3%' },
  status: 'ready',
};

// ── Sample Portfolios (Excel Tab 1 — Canadian) ──
export const samplePortfolios = [
  {
    id: 1,
    name: 'Portfolio #1 — Income',
    targetYield: '≈12%',
    description: 'Beginner-friendly. 10 diversified covered call ETFs across multiple fund managers. No crypto, split funds, or closed-end funds.',
    holdings: [
      { ticker: 'ZWQT', name: 'BMO Global Enhanced Income Fund ETF',             pct: 10, type: 'ETF', alt: '', coveredCall: true, leveraged: false },
      { ticker: 'HDIV', name: 'Hamilton Enhanced Multi-Sector Covered Call ETF', pct: 10, type: 'ETF', alt: '',      coveredCall: true, leveraged: true  },
      { ticker: 'HYLD', name: 'Hamilton Enhanced U.S. Covered Call ETF',         pct: 10, type: 'ETF', alt: 'USCL',  coveredCall: true, leveraged: true  },
      { ticker: 'HDIF', name: 'Harvest Diversified Monthly Income ETF',          pct: 10, type: 'ETF', alt: '',      coveredCall: true, leveraged: true  },
      { ticker: 'HHIS', name: 'Harvest Diversified High Income Shares ETF',      pct: 10, type: 'ETF', alt: 'BIGY',  coveredCall: true, leveraged: true  },
      { ticker: 'EQCL', name: 'Global X Enhanced All-Equity Covered Call ETF',   pct: 10, type: 'ETF', alt: '',      coveredCall: true, leveraged: true  },
      { ticker: 'USCC', name: 'Global X S&P 500 Covered Call ETF',               pct: 10, type: 'ETF', alt: 'ESPX/USCL', coveredCall: true, leveraged: false },
      { ticker: 'QQCC', name: 'Global X NASDAQ-100 Covered Call ETF',            pct: 10, type: 'ETF', alt: 'QQCL/JEPQ', coveredCall: true, leveraged: false },
      { ticker: 'BMAX', name: 'Brompton Enhanced Multi-Asset Income ETF',        pct: 10, type: 'ETF', alt: '',      coveredCall: true, leveraged: true  },
      { ticker: 'ECHI', name: 'Ninepoint Enhanced Canadian HighShares ETF',      pct: 10, type: 'ETF', alt: 'HHIC/CANY/CLSA', coveredCall: true, leveraged: true },
    ],
  },
  {
    id: 2,
    name: 'Portfolio #2 — Lower Volatility',
    targetYield: '≈9%+',
    description: 'Conservative income portfolio. Less yield but less capital fluctuation. Includes defensive sectors (healthcare, utilities) and bonds.',
    holdings: [
      { ticker: 'ZWQT', name: 'BMO Global Enhanced Income Fund ETF',             pct: 10, type: 'ETF', alt: '',         coveredCall: true,  leveraged: false },
      { ticker: 'SPLT', name: 'Brompton Split Corp. Preferred Share ETF',        pct: 10, type: 'ETF', alt: 'PREF',     coveredCall: false, leveraged: false },
      { ticker: 'BMAX', name: 'Brompton Enhanced Multi-Asset Income ETF',        pct: 20, type: 'ETF', alt: '',         coveredCall: true,  leveraged: true  },
      { ticker: 'HDIV', name: 'Hamilton Enhanced Multi-Sector Covered Call ETF', pct: 10, type: 'ETF', alt: '',         coveredCall: true,  leveraged: true  },
      { ticker: 'HYLD', name: 'Hamilton Enhanced U.S. Covered Call ETF',         pct: 10, type: 'ETF', alt: 'USCL',     coveredCall: true,  leveraged: true  },
      { ticker: 'HDIF', name: 'Harvest Diversified Monthly Income ETF',          pct: 10, type: 'ETF', alt: 'HBIE/HVOI', coveredCall: true, leveraged: true  },
      { ticker: 'ESPX', name: 'Evolve S&P 500 Enhanced Yield Fund',              pct: 10, type: 'ETF', alt: 'USCC/USCL', coveredCall: true, leveraged: false },
      { ticker: 'HHL',  name: 'Harvest Healthcare Leaders Income ETF',           pct:  5, type: 'ETF', alt: 'HHLE/LIFE', coveredCall: true, leveraged: false },
      { ticker: 'HUTL', name: 'Harvest Equal Weight Global Utilities Income ETF',pct:  5, type: 'ETF', alt: 'UMAX/UTES', coveredCall: true, leveraged: false },
      { ticker: 'HBND', name: 'Hamilton U.S. Bond Yield Maximizer ETF',          pct: 10, type: 'ETF', alt: 'GLCC/GLCL', coveredCall: true, leveraged: false },
    ],
  },
  {
    id: 3,
    name: 'Portfolio #3 — Maximum Income',
    targetYield: '15%+',
    description: 'All leveraged covered call ETFs. Higher yield, higher volatility. No single-stock ETFs or direct crypto in this version.',
    holdings: [
      { ticker: 'HDIV', name: 'Hamilton Enhanced Multi-Sector Covered Call ETF', pct: 10, type: 'ETF', alt: '',      coveredCall: true, leveraged: true },
      { ticker: 'HYLD', name: 'Hamilton Enhanced U.S. Covered Call ETF',         pct: 10, type: 'ETF', alt: 'USCL',  coveredCall: true, leveraged: true },
      { ticker: 'SDAY', name: 'Hamilton Enhanced U.S. Equity DayMAX ETF',        pct: 10, type: 'ETF', alt: '',      coveredCall: true, leveraged: true },
      { ticker: 'EQCL', name: 'Global X Enhanced All-Equity Covered Call ETF',   pct: 10, type: 'ETF', alt: '',      coveredCall: true, leveraged: true },
      { ticker: 'QQCL', name: 'Global X Enhanced NASDAQ-100 Covered Call ETF',   pct: 15, type: 'ETF', alt: '',      coveredCall: true, leveraged: true },
      { ticker: 'HHIS', name: 'Harvest Diversified High Income Shares ETF',      pct: 15, type: 'ETF', alt: 'BIGY',  coveredCall: true, leveraged: true },
      { ticker: 'BIGY', name: 'Evolve US Equity UltraYield ETF',                 pct: 15, type: 'ETF', alt: 'HHIS',  coveredCall: true, leveraged: true },
      { ticker: 'CANY', name: 'Evolve Canadian Equity UltraYield ETF',           pct: 15, type: 'ETF', alt: 'HHIC/ECHI/CDAY', coveredCall: true, leveraged: true },
    ],
  },
];
