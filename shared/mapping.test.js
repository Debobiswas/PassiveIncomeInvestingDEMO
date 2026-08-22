import { describe, it, expect } from 'vitest';
import { normalizeHeader, detectMapping, parseNumber, normalizeRows } from './mapping.js';

describe('normalizeHeader', () => {
  it('lowercases and strips punctuation, spacing, and BOM', () => {
    expect(normalizeHeader('  Market Value ($) ')).toBe('marketvalue');
    expect(normalizeHeader('﻿Symbol')).toBe('symbol');
    expect(normalizeHeader('# of Shares')).toBe('ofshares');
  });

  it('survives null and non-string input', () => {
    expect(normalizeHeader(null)).toBe('');
    expect(normalizeHeader(42)).toBe('42');
  });
});

describe('parseNumber', () => {
  it('strips currency symbols, thousands separators, and percent signs', () => {
    expect(parseNumber('$1,234.56')).toBeCloseTo(1234.56, 6);
    expect(parseNumber('1 234,56')).toBeCloseTo(1234.56, 6);
    expect(parseNumber('12.5%')).toBeCloseTo(12.5, 6);
  });

  it('reads accounting-style negatives in parentheses', () => {
    expect(parseNumber('(500.25)')).toBeCloseTo(-500.25, 6);
  });

  it('returns null for values that are not numbers', () => {
    expect(parseNumber('N/A')).toBeNull();
    expect(parseNumber('')).toBeNull();
    expect(parseNumber(null)).toBeNull();
    expect(parseNumber('--')).toBeNull();
  });

  it('passes through real numbers unchanged', () => {
    expect(parseNumber(1500)).toBe(1500);
    expect(parseNumber(0)).toBe(0);
  });
});

describe('detectMapping', () => {
  it('detects a Questrade-style header row', () => {
    const { mapping } = detectMapping(['Symbol', 'Quantity', 'Market Price', 'Market Value', 'Average Cost', 'Currency']);
    expect(mapping.symbol).toBe('Symbol');
    expect(mapping.units).toBe('Quantity');
    expect(mapping.price).toBe('Market Price');
    expect(mapping.market_value).toBe('Market Value');
    expect(mapping.avg_purchase_price).toBe('Average Cost');
    expect(mapping.currency).toBe('Currency');
  });

  it('detects ticker and shares as symbol and units', () => {
    const { mapping } = detectMapping(['Ticker', 'Shares', 'Last Price']);
    expect(mapping.symbol).toBe('Ticker');
    expect(mapping.units).toBe('Shares');
    expect(mapping.price).toBe('Last Price');
  });

  it('leaves unmatched fields null rather than guessing', () => {
    const { mapping } = detectMapping(['Symbol', 'Quantity']);
    expect(mapping.market_value).toBeNull();
    expect(mapping.currency).toBeNull();
  });

  it('names the preset when a signature matches', () => {
    const { preset } = detectMapping(['Symbol', 'Quantity', 'Market Price', 'Market Value', 'Average Cost', 'Currency']);
    expect(preset).toBe('Questrade');
  });

  it('reports no preset for an unrecognised layout', () => {
    const { preset } = detectMapping(['Thing', 'Amount']);
    expect(preset).toBeNull();
  });

  it('does not map the same header to two fields', () => {
    const { mapping } = detectMapping(['Value']);
    const used = Object.values(mapping).filter(Boolean);
    expect(used.length).toBe(new Set(used).size);
  });
});

describe('normalizeRows', () => {
  const mapping = {
    symbol: 'Symbol', units: 'Quantity', price: 'Price', market_value: 'Market Value',
    avg_purchase_price: null, currency: null, description: null,
  };

  it('normalizes a clean row', () => {
    const { rows, warnings } = normalizeRows(
      [{ Symbol: 'hdiv.to', Quantity: '100', Price: '$15.00', 'Market Value': '$1,500.00' }],
      mapping
    );
    expect(warnings).toEqual([]);
    expect(rows[0]).toMatchObject({
      symbol: 'HDIV.TO', units: 100, price: 15, market_value: 1500, currency: 'CAD',
    });
  });

  it('derives market_value from units x price when absent', () => {
    const { rows } = normalizeRows(
      [{ Symbol: 'X', Quantity: '4', Price: '25', 'Market Value': '' }],
      mapping
    );
    expect(rows[0].market_value).toBe(100);
  });

  it('derives price from market_value / units when price is absent', () => {
    const { rows } = normalizeRows(
      [{ Symbol: 'X', Quantity: '4', Price: '', 'Market Value': '100' }],
      mapping
    );
    expect(rows[0].price).toBe(25);
  });

  it('warns and excludes a row with non-numeric units', () => {
    const { rows, warnings } = normalizeRows(
      [{ Symbol: 'X', Quantity: 'abc', Price: '10', 'Market Value': '' }],
      mapping
    );
    expect(rows[0].excluded).toBe(true);
    expect(warnings[0]).toMatchObject({ rowIndex: 0, field: 'units', code: 'not_a_number' });
  });

  it('warns and excludes a row with zero or negative units', () => {
    const { warnings } = normalizeRows(
      [{ Symbol: 'X', Quantity: '0', Price: '10', 'Market Value': '' }],
      mapping
    );
    expect(warnings[0].code).toBe('non_positive_units');
  });

  it('warns and excludes a row with a missing symbol', () => {
    const { warnings } = normalizeRows(
      [{ Symbol: '', Quantity: '10', Price: '10', 'Market Value': '' }],
      mapping
    );
    expect(warnings[0]).toMatchObject({ field: 'symbol', code: 'missing_symbol' });
  });

  it('flags duplicate symbols within one file', () => {
    const { warnings } = normalizeRows(
      [
        { Symbol: 'X', Quantity: '1', Price: '10', 'Market Value': '' },
        { Symbol: 'x', Quantity: '2', Price: '10', 'Market Value': '' },
      ],
      mapping
    );
    expect(warnings.some(w => w.code === 'duplicate_symbol')).toBe(true);
  });

  it('throws a clear error when the symbol column is unmapped', () => {
    expect(() => normalizeRows([{ a: 1 }], { ...mapping, symbol: null }))
      .toThrow(/symbol column/i);
  });

  it('returns empty results for no rows', () => {
    expect(normalizeRows([], mapping)).toEqual({ rows: [], warnings: [] });
  });
});
