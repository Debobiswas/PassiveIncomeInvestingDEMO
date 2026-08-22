// Turns raw holding rows into the view-model the four views already consume.
// dummy.js exports { ticker, name, currentPct, targetPct, value, drift, color };
// matching that shape exactly is what keeps the views source-agnostic.

export const HOLDING_COLORS = [
  '#F59E0B', '#8B5CF6', '#10B981', '#3B82F6', '#EC4899',
  '#06B6D4', '#F97316', '#A855F7', '#14B8A6', '#EAB308',
];

const DRIFT_THRESHOLD = 0.5;   // percentage points
const HIGH_DRIFT      = 1.5;

function marketValue(row) {
  const stored = Number(row.market_value);
  if (Number.isFinite(stored) && stored !== 0) return stored;
  const units = Number(row.units);
  const price = Number(row.price);
  if (Number.isFinite(units) && Number.isFinite(price)) return units * price;
  return 0;
}

// Stable per-symbol colour: hashing the symbol means a holding keeps its
// colour across reorderings, syncs, and re-imports.
function colorFor(symbol) {
  let hash = 0;
  const s = String(symbol || '');
  for (let i = 0; i < s.length; i += 1) {
    hash = (hash * 31 + s.charCodeAt(i)) % 100000;
  }
  return HOLDING_COLORS[hash % HOLDING_COLORS.length];
}

export function deriveHoldings(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  const withValue = rows.map(row => ({ row, value: marketValue(row) }));
  const total = withValue.reduce((sum, r) => sum + r.value, 0);
  const targetPct = 100 / withValue.length;   // equal-weight until the user sets targets

  return withValue.map(({ row, value }) => {
    const currentPct = total > 0 ? (value / total) * 100 : 0;
    return {
      ticker: row.symbol,
      name: row.description || row.symbol,
      currentPct,
      targetPct,
      value,
      drift: currentPct - targetPct,
      color: row.color || colorFor(row.symbol),
      units: Number(row.units) || 0,
      currency: row.currency || 'CAD',
      instrumentKind: row.instrument_kind || 'stock',
    };
  });
}

export function deriveStats(rows, distributions = []) {
  const holdings = deriveHoldings(rows);
  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);

  // Monthly income comes from the trailing twelve months of actual
  // distributions, which is the honest number. With no history it is zero,
  // not an estimate dressed up as a fact.
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 12);
  const trailing = (distributions || []).filter(
    d => d && d.trade_date && new Date(d.trade_date) >= cutoff
  );
  const trailingTotal = trailing.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const monthlyIncome = trailing.length > 0 ? trailingTotal / 12 : 0;

  return {
    totalValue,
    positions: holdings.length,
    monthlyIncome,
    // Home.jsx:68 interpolates this directly as `${yieldOnCost}%`, so round here
    // rather than shipping 12.034567901234568 to the UI.
    yieldOnCost: totalValue > 0
      ? Number((((monthlyIncome * 12) / totalValue) * 100).toFixed(2))
      : 0,
    totalValueChange: 0,        // needs a value-history table; out of scope
    totalValueChangePct: 0,
    monthlyIncomePct: 0,
  };
}

export function deriveAllocation(viewHoldings) {
  if (!Array.isArray(viewHoldings)) return [];
  return viewHoldings.map(h => ({
    name: h.ticker,
    value: Number(h.currentPct.toFixed(1)),
    color: h.color,
  }));
}

export function deriveDrift(viewHoldings) {
  if (!Array.isArray(viewHoldings)) return [];
  const total = viewHoldings.reduce((sum, h) => sum + h.value, 0);

  return viewHoldings
    .filter(h => Math.abs(h.drift) > DRIFT_THRESHOLD)
    .sort((a, b) => Math.abs(b.drift) - Math.abs(a.drift))
    .map(h => {
      const over = h.drift > 0;
      const dollars = Math.abs((h.drift / 100) * total);
      return {
        ticker: h.ticker,
        severity: Math.abs(h.drift) >= HIGH_DRIFT ? 'high' : 'medium',
        message: `${over ? '+' : ''}${h.drift.toFixed(1)}% ${over ? 'above' : 'below'} target — ` +
                 `consider ${over ? 'trimming' : 'adding'} ~$${Math.round(dollars).toLocaleString()}`,
      };
    });
}
