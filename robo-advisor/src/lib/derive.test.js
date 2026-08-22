import { describe, it, expect } from 'vitest';
import { deriveHoldings, deriveStats, deriveAllocation, deriveDrift } from './derive';

const rows = [
  { symbol: 'HDIV', description: 'Hamilton Enhanced Multi-Sector Covered Call ETF', units: 100, price: 15, market_value: 1500, currency: 'CAD', instrument_kind: 'etf' },
  { symbol: 'ZWQT', description: 'BMO Global Enhanced Income Fund ETF',             units: 50,  price: 10, market_value: 500,  currency: 'CAD', instrument_kind: 'etf' },
];

describe('deriveHoldings', () => {
  it('maps rows to the view-model shape the views already consume', () => {
    const result = deriveHoldings(rows);
    expect(result[0]).toMatchObject({
      ticker: 'HDIV',
      name: 'Hamilton Enhanced Multi-Sector Covered Call ETF',
      value: 1500,
    });
    expect(result[0]).toHaveProperty('currentPct');
    expect(result[0]).toHaveProperty('targetPct');
    expect(result[0]).toHaveProperty('drift');
    expect(result[0]).toHaveProperty('color');
  });

  it('computes currentPct as a share of total market value', () => {
    const result = deriveHoldings(rows);
    expect(result[0].currentPct).toBeCloseTo(75, 5);
    expect(result[1].currentPct).toBeCloseTo(25, 5);
  });

  it('uses an equal-weight target and derives drift from it', () => {
    const result = deriveHoldings(rows);
    expect(result[0].targetPct).toBeCloseTo(50, 5);
    expect(result[0].drift).toBeCloseTo(25, 5);
    expect(result[1].drift).toBeCloseTo(-25, 5);
  });

  it('falls back to units x price when market_value is absent', () => {
    const [only] = deriveHoldings([{ symbol: 'X', units: 4, price: 25 }]);
    expect(only.value).toBe(100);
  });

  it('returns an empty array for no rows rather than throwing', () => {
    expect(deriveHoldings([])).toEqual([]);
    expect(deriveHoldings(null)).toEqual([]);
  });

  it('assigns a stable colour per symbol regardless of row order', () => {
    const a = deriveHoldings(rows).find(h => h.ticker === 'ZWQT').color;
    const b = deriveHoldings([...rows].reverse()).find(h => h.ticker === 'ZWQT').color;
    expect(a).toBe(b);
  });
});

describe('deriveStats', () => {
  it('sums market value and counts positions', () => {
    const stats = deriveStats(rows);
    expect(stats.totalValue).toBe(2000);
    expect(stats.positions).toBe(2);
  });

  it('reports zeroes for an empty portfolio instead of NaN', () => {
    const stats = deriveStats([]);
    expect(stats.totalValue).toBe(0);
    expect(stats.positions).toBe(0);
    expect(Number.isNaN(stats.monthlyIncome)).toBe(false);
    expect(Number.isNaN(stats.yieldOnCost)).toBe(false);
  });

  it('averages trailing twelve-month distributions into monthly income', () => {
    const recent = new Date();
    const iso = `${recent.getFullYear()}-${String(recent.getMonth() + 1).padStart(2, '0')}-01`;
    const stats = deriveStats(rows, [
      { amount: 120, trade_date: iso },
      { amount: 120, trade_date: iso },
    ]);
    expect(stats.monthlyIncome).toBeCloseTo(20, 5);   // 240 / 12
  });
});

describe('deriveAllocation', () => {
  it('produces one slice per holding with percentages', () => {
    const alloc = deriveAllocation(deriveHoldings(rows));
    expect(alloc).toHaveLength(2);
    expect(alloc[0]).toMatchObject({ name: 'HDIV', value: 75 });
    expect(alloc[0].color).toBeTruthy();
  });
});

describe('deriveDrift', () => {
  it('flags holdings drifting more than half a percentage point', () => {
    const alerts = deriveDrift(deriveHoldings(rows));
    expect(alerts.map(a => a.ticker).sort()).toEqual(['HDIV', 'ZWQT']);
    expect(alerts[0].severity).toBe('high');
  });

  it('returns nothing when a portfolio is balanced', () => {
    const balanced = deriveHoldings([
      { symbol: 'A', units: 1, price: 100 },
      { symbol: 'B', units: 1, price: 100 },
    ]);
    expect(deriveDrift(balanced)).toEqual([]);
  });
});
