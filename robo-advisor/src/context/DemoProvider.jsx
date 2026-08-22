// Serves the sample portfolio from dummy.js. Uploads are parsed for real,
// in the browser, and held in memory only. This provider must never write
// to Supabase and never call /api/snaptrade/* — Task 25 asserts that.
import { useCallback, useMemo, useState } from 'react';
import { PortfolioContext } from './PortfolioContext';
import { parseWorkbook } from '../lib/demoParse';
import { detectMapping, normalizeRows } from '@shared/mapping.js';
import { deriveHoldings, deriveStats, deriveAllocation, deriveDrift } from '../lib/derive';
import {
  portfolioHoldings, brokerageAccounts, driftAlerts,
  upcomingDates, distributionHistory, portfolioStats,
} from '../data/dummy';

// dummy.js holdings are already in view-model shape; map them back to raw
// rows so both providers feed the derivation layer identically.
const SAMPLE_ROWS = portfolioHoldings.map(h => ({
  symbol: h.ticker,
  description: h.name,
  units: null,
  price: null,
  market_value: h.value,
  currency: 'CAD',
  instrument_kind: 'etf',
  color: h.color,
}));

export default function DemoProvider({ children }) {
  const [rows, setRows] = useState(SAMPLE_ROWS);
  const [imported, setImported] = useState(false);
  const [accounts, setAccounts] = useState(brokerageAccounts);
  const [error, setError] = useState(null);

  const previewImport = useCallback(async (file) => {
    setError(null);
    try {
      const { headers, rows: raw } = await parseWorkbook(file);
      const { mapping, preset } = detectMapping(headers);
      const { rows: normalized, warnings } = normalizeRows(raw, mapping);
      return {
        jobId: 'demo',
        headers,
        mapping,
        detectedPreset: preset,
        rows: normalized,
        warnings,
        totals: {
          rowCount: normalized.length,
          included: normalized.filter(r => !r.excluded).length,
          warningCount: warnings.length,
        },
      };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const commitImport = useCallback(async ({ rows: confirmed, filename }) => {
    setRows(confirmed);
    setImported(true);
    setAccounts([{
      id: 'demo-import',
      broker: filename || 'Imported file',
      accountType: 'Imported',
      value: confirmed.reduce((sum, r) => sum + (Number(r.market_value) || 0), 0),
      lastImport: 'just now',
      status: 'imported',
      logo: 'CSV',
    }]);
    return { imported: confirmed.length, skipped: 0 };
  }, []);

  // Connecting is simulated here. No login URL is requested, so demo and
  // marketing traffic never consumes SnapTrade account quota.
  const connect    = useCallback(async () => ({ simulated: true }), []);
  const sync       = useCallback(async () => ({ simulated: true }), []);
  const disconnect = useCallback(async () => ({ simulated: true }), []);
  const reset      = useCallback(() => {
    setRows(SAMPLE_ROWS);
    setImported(false);
    setAccounts(brokerageAccounts);
  }, []);

  const value = useMemo(() => {
    const holdings = deriveHoldings(rows);
    return {
      isDemo: true,
      loading: false,
      error,
      holdings,
      accounts,
      // Before an import the curated figures show as-is so the marketing
      // demo looks complete; after one, everything is derived from the file.
      stats:         imported ? deriveStats(rows) : portfolioStats,
      allocation:    deriveAllocation(holdings),
      drift:         imported ? deriveDrift(holdings) : driftAlerts,
      distributions: distributionHistory,
      upcomingDates,
      hasImported:   imported,
      actions: { previewImport, commitImport, connect, sync, disconnect, reset },
    };
  }, [rows, accounts, imported, error, previewImport, commitImport, connect, sync, disconnect, reset]);

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}
