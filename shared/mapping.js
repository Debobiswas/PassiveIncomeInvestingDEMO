// Column detection and row normalization for broker CSV/XLSX imports.
// Pure JavaScript: no Node APIs and no browser APIs, so both the Vercel
// functions and the demo portal can import it unchanged.

export const FIELD_SYNONYMS = {
  symbol:             ['symbol', 'ticker', 'security', 'securitysymbol', 'stock', 'instrument', 'symbolticker'],
  units:              ['units', 'quantity', 'qty', 'shares', 'sharequantity', 'ofshares', 'position', 'noofshares'],
  price:              ['price', 'lastprice', 'marketprice', 'currentprice', 'close', 'last', 'closingprice'],
  market_value:       ['marketvalue', 'value', 'totalvalue', 'positionvalue', 'marketval', 'currentvalue'],
  avg_purchase_price: ['averagecost', 'avgcost', 'bookvalue', 'avgprice', 'costbasis', 'averageprice', 'acb'],
  currency:           ['currency', 'ccy', 'curr'],
  description:        ['description', 'name', 'securityname', 'company', 'companyname', 'securitydescription'],
};

// Ordered most specific first: 'marketvalue' must win over 'value' so a
// sheet with both columns maps each correctly.
const FIELD_ORDER = ['symbol', 'units', 'market_value', 'avg_purchase_price', 'price', 'currency', 'description'];

export const BROKER_PRESETS = [
  { name: 'Questrade',            signature: ['symbol', 'quantity', 'marketprice', 'marketvalue', 'averagecost'] },
  { name: 'Wealthsimple',         signature: ['symbol', 'quantity', 'bookvalue', 'marketvalue'] },
  { name: 'Interactive Brokers',  signature: ['symbol', 'position', 'marketprice', 'marketvalue', 'costbasis'] },
  { name: 'TD Direct Investing',  signature: ['symbol', 'quantity', 'lastprice', 'marketvalue'] },
  { name: 'Portfolio Template',   signature: ['ticker', 'shares', 'price'] },
];

export function normalizeHeader(header) {
  if (header === null || header === undefined) return '';
  return String(header)
    .replace(/^﻿/, '')          // strip byte-order mark
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');      // drop spaces, punctuation, currency marks
}

export function parseNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (value === null || value === undefined) return null;

  let text = String(value).trim();
  if (text === '' || text === '--' || /^n\/?a$/i.test(text)) return null;

  // Accounting negatives: (500.25) means -500.25
  let negative = false;
  if (/^\(.*\)$/.test(text)) { negative = true; text = text.slice(1, -1); }

  text = text.replace(/[$€£¥%\s]/g, '');

  // Disambiguate decimal separator: if both are present the rightmost wins.
  const lastComma = text.lastIndexOf(',');
  const lastDot   = text.lastIndexOf('.');
  if (lastComma > -1 && lastDot > -1) {
    text = lastComma > lastDot
      ? text.replace(/\./g, '').replace(',', '.')
      : text.replace(/,/g, '');
  } else if (lastComma > -1) {
    // A single comma is a decimal separator only when it is not a thousands group.
    text = /,\d{3}$/.test(text) ? text.replace(/,/g, '') : text.replace(',', '.');
  }

  if (text.startsWith('-')) { negative = true; text = text.slice(1); }
  if (!/^\d*\.?\d+$/.test(text)) return null;

  const parsed = Number(text);
  if (!Number.isFinite(parsed)) return null;
  return negative ? -parsed : parsed;
}

export function detectMapping(headers) {
  const list = Array.isArray(headers) ? headers : [];
  const normalized = list.map(h => ({ original: h, key: normalizeHeader(h) }));
  const present = new Set(normalized.map(n => n.key));

  const preset = BROKER_PRESETS.find(p => p.signature.every(sig => present.has(sig)))?.name ?? null;

  const mapping = {
    symbol: null, units: null, price: null, market_value: null,
    avg_purchase_price: null, currency: null, description: null,
  };

  const claimed = new Set();
  for (const field of FIELD_ORDER) {
    for (const synonym of FIELD_SYNONYMS[field]) {
      const hit = normalized.find(n => n.key === synonym && !claimed.has(n.original));
      if (hit) {
        mapping[field] = hit.original;
        claimed.add(hit.original);
        break;
      }
    }
  }

  return { mapping, preset };
}

export function normalizeRows(rawRows, mapping) {
  if (!mapping || !mapping.symbol) {
    throw new Error(
      'Cannot import without a symbol column. Map one of your columns to Symbol and try again.'
    );
  }
  const source = Array.isArray(rawRows) ? rawRows : [];
  if (source.length === 0) return { rows: [], warnings: [] };

  const warnings = [];
  const seen = new Map();

  const rows = source.map((raw, rowIndex) => {
    const read = field => (mapping[field] ? raw[mapping[field]] : null);

    const rawSymbol = read('symbol');
    const symbol = rawSymbol === null || rawSymbol === undefined
      ? ''
      : String(rawSymbol).trim().toUpperCase();

    const units       = parseNumber(read('units'));
    let price         = parseNumber(read('price'));
    let marketValue   = parseNumber(read('market_value'));
    const avgCost     = parseNumber(read('avg_purchase_price'));

    const rawCurrency = read('currency');
    const currency = rawCurrency ? String(rawCurrency).trim().toUpperCase() : 'CAD';

    const rawDescription = read('description');
    const description = rawDescription ? String(rawDescription).trim() : null;

    let excluded = false;

    if (!symbol) {
      warnings.push({ rowIndex, field: 'symbol', code: 'missing_symbol',
        message: 'No symbol on this row.' });
      excluded = true;
    }

    if (units === null) {
      const rawUnits = read('units');
      if (rawUnits !== null && rawUnits !== undefined && String(rawUnits).trim() !== '') {
        warnings.push({ rowIndex, field: 'units', code: 'not_a_number',
          message: `"${rawUnits}" is not a number of units.` });
      } else {
        warnings.push({ rowIndex, field: 'units', code: 'missing_units',
          message: 'No unit quantity on this row.' });
      }
      excluded = true;
    } else if (units <= 0) {
      warnings.push({ rowIndex, field: 'units', code: 'non_positive_units',
        message: `Unit quantity is ${units}.` });
      excluded = true;
    }

    // Fill in whichever of price / market_value is missing.
    if (marketValue === null && units !== null && price !== null) marketValue = units * price;
    if (price === null && marketValue !== null && units) price = marketValue / units;

    if (symbol) {
      if (seen.has(symbol)) {
        warnings.push({ rowIndex, field: 'symbol', code: 'duplicate_symbol',
          message: `${symbol} also appears on row ${seen.get(symbol) + 1}.` });
      } else {
        seen.set(symbol, rowIndex);
      }
    }

    return {
      rowIndex,
      symbol,
      description,
      units,
      price,
      market_value: marketValue,
      avg_purchase_price: avgCost,
      currency,
      instrument_kind: 'etf',   // this app's universe is income ETFs
      excluded,
    };
  });

  return { rows, warnings };
}
