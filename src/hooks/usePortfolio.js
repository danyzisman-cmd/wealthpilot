import { useRef, useState, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { computeHoldingValues, computePortfolioTotals } from '../utils/portfolioCalc';

// Dany's Fidelity portfolio — Feb 24, 2026
const SEED_HOLDINGS = [
  // ── ROTH IRA (266001579) ──
  { id: 'roth-spaxx', ticker: 'SPAXX', name: 'Fidelity Government Money Market', type: 'bond', account: 'roth_ira', shares: 17.75, avgCost: 1.00, currentPrice: 1.00 },
  { id: 'roth-fxaix', ticker: 'FXAIX', name: 'Fidelity 500 Index Fund', type: 'etf', account: 'roth_ira', shares: 3.364, avgCost: 222.95, currentPrice: 237.85 },
  { id: 'roth-qqqm', ticker: 'QQQM', name: 'Invesco Nasdaq 100 ETF', type: 'etf', account: 'roth_ira', shares: 2.077, avgCost: 240.57, currentPrice: 250.31 },
  { id: 'roth-spy', ticker: 'SPY', name: 'SPDR S&P 500 ETF', type: 'etf', account: 'roth_ira', shares: 2.078, avgCost: 633.64, currentPrice: 687.35 },

  // ── RAMP 401k (5826K) ──
  { id: '401k-fsmdx', ticker: 'FSMDX', name: 'Fidelity Mid Cap Index', type: 'etf', account: '401k', shares: 38.002, avgCost: 37.47, currentPrice: 38.86 },
  { id: '401k-fspgx', ticker: 'FSPGX', name: 'Fidelity Large Cap Growth Index', type: 'etf', account: '401k', shares: 54.259, avgCost: 45.79, currentPrice: 43.81 },
  { id: '401k-fxaix', ticker: 'FXAIX', name: 'Fidelity 500 Index', type: 'etf', account: '401k', shares: 13.551, avgCost: 235.81, currentPrice: 237.85 },

  // ── Individual / Taxable (Z34456988) ──
  { id: 'tax-spaxx', ticker: 'SPAXX', name: 'Fidelity Government Money Market', type: 'bond', account: 'taxable', shares: 574.86, avgCost: 1.00, currentPrice: 1.00 },
  { id: 'tax-btc', ticker: 'BTC', name: 'Grayscale Bitcoin Mini Trust ETF', type: 'crypto', account: 'taxable', shares: 125.652, avgCost: 33.26, currentPrice: 28.53 },
  { id: 'tax-fcntx', ticker: 'FCNTX', name: 'Fidelity Contrafund', type: 'etf', account: 'taxable', shares: 16.227, avgCost: 24.65, currentPrice: 24.32 },
  { id: 'tax-qqqm', ticker: 'QQQM', name: 'Invesco Nasdaq 100 ETF', type: 'etf', account: 'taxable', shares: 7.067, avgCost: 244.54, currentPrice: 250.31 },
  { id: 'tax-spy', ticker: 'SPY', name: 'SPDR S&P 500 ETF', type: 'etf', account: 'taxable', shares: 15.364, avgCost: 675.09, currentPrice: 687.35 },
];

// Recurring investment transfers
const SEED_RECURRING = [
  // Taxable brokerage recurring buys
  { id: 'rec-btc', ticker: 'BTC', name: 'Grayscale Bitcoin Mini Trust ETF', amount: 300, frequency: 'biweekly', day: 'Tuesday', nextDate: '2026-02-24', account: 'taxable' },
  { id: 'rec-spy', ticker: 'SPY', name: 'SPDR S&P 500 ETF', amount: 400, frequency: 'biweekly', day: 'Monday', nextDate: '2026-03-09', account: 'taxable' },
  { id: 'rec-fcntx', ticker: 'FCNTX', name: 'Fidelity Contrafund', amount: 400, frequency: 'biweekly', day: 'Tuesday', nextDate: '2026-03-10', account: 'taxable' },
  // 401k from BASE salary (biweekly paychecks): 5% + 4% match on $66,500 = $230.19/paycheck
  { id: 'rec-401k-base-fxaix', ticker: 'FXAIX', name: 'Fidelity 500 Index (401k base)', amount: 104.74, frequency: 'biweekly', day: 'Friday', nextDate: '2026-03-06', account: '401k' },
  { id: 'rec-401k-base-fspgx', ticker: 'FSPGX', name: 'Fidelity Large Cap Growth (401k base)', amount: 77.34, frequency: 'biweekly', day: 'Friday', nextDate: '2026-03-06', account: '401k' },
  { id: 'rec-401k-base-fsmdx', ticker: 'FSMDX', name: 'Fidelity Mid Cap Index (401k base)', amount: 48.11, frequency: 'biweekly', day: 'Friday', nextDate: '2026-03-06', account: '401k' },
  // 401k from COMMISSION (monthly): 5% + 4% match on $8k/mo commission = $720/month
  { id: 'rec-401k-comm-fxaix', ticker: 'FXAIX', name: 'Fidelity 500 Index (401k commission)', amount: 327.60, frequency: 'monthly', day: 'Last', nextDate: '2026-02-28', account: '401k' },
  { id: 'rec-401k-comm-fspgx', ticker: 'FSPGX', name: 'Fidelity Large Cap Growth (401k commission)', amount: 241.92, frequency: 'monthly', day: 'Last', nextDate: '2026-02-28', account: '401k' },
  { id: 'rec-401k-comm-fsmdx', ticker: 'FSMDX', name: 'Fidelity Mid Cap Index (401k commission)', amount: 150.48, frequency: 'monthly', day: 'Last', nextDate: '2026-02-28', account: '401k' },
];

function advanceDate(dateStr, frequency) {
  const d = new Date(dateStr + 'T12:00:00');
  if (frequency === 'weekly') d.setDate(d.getDate() + 7);
  else if (frequency === 'biweekly') d.setDate(d.getDate() + 14);
  else if (frequency === 'monthly') d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function usePortfolio() {
  const [holdings, setHoldings] = useLocalStorage('wp_portfolio', []);
  const [recurringTransfers, setRecurringTransfers] = useLocalStorage('wp_recurring_transfers', []);

  // Seed portfolio if empty
  const [seedVersion, setSeedVersion] = useLocalStorage('wp_portfolio_seed', 0);
  if (seedVersion < 6) {
    setHoldings(SEED_HOLDINGS);
    setRecurringTransfers(SEED_RECURRING);
    setSeedVersion(6);
  }

  // Auto-apply recurring transfers that have passed their nextDate.
  // Runs once per page load — adds each transfer's amount to the matching
  // holding's currentPrice (since shares=1, price = total dollar value)
  // and advances nextDate until it's in the future.
  const appliedRef = useRef(false);
  if (!appliedRef.current) {
    appliedRef.current = true;
    const today = todayStr();
    let holdingsChanged = false;
    let transfersChanged = false;
    const updatedHoldings = [...holdings];
    const updatedTransfers = recurringTransfers.map((t) => {
      let next = t.nextDate;
      while (next <= today) {
        // Find matching holding by ticker + account
        const idx = updatedHoldings.findIndex(
          (h) => h.ticker === t.ticker && h.account === t.account
        );
        if (idx !== -1) {
          const h = updatedHoldings[idx];
          const price = h.currentPrice || 1;
          const newShares = t.amount / price;
          const totalShares = h.shares + newShares;
          // Weighted average cost basis
          const newAvgCost = ((h.avgCost * h.shares) + (price * newShares)) / totalShares;
          updatedHoldings[idx] = {
            ...h,
            shares: Math.round(totalShares * 1000) / 1000,
            avgCost: Math.round(newAvgCost * 100) / 100,
          };
          holdingsChanged = true;
        }
        next = advanceDate(next, t.frequency);
        transfersChanged = true;
      }
      return { ...t, nextDate: next };
    });
    if (holdingsChanged) setHoldings(updatedHoldings);
    if (transfersChanged) setRecurringTransfers(updatedTransfers);
  }

  const addHolding = (holding) => {
    setHoldings((prev) => [
      ...prev,
      { ...holding, id: crypto.randomUUID() },
    ]);
  };

  const updateHolding = (id, updates) => {
    setHoldings((prev) =>
      prev.map((h) => (h.id === id ? { ...h, ...updates } : h))
    );
  };

  const removeHolding = (id) => {
    setHoldings((prev) => prev.filter((h) => h.id !== id));
  };

  const addRecurring = (transfer) => {
    setRecurringTransfers((prev) => [...prev, { ...transfer, id: crypto.randomUUID() }]);
  };

  const removeRecurring = (id) => {
    setRecurringTransfers((prev) => prev.filter((t) => t.id !== id));
  };

  const enrichedHoldings = computeHoldingValues(holdings);
  const totals = computePortfolioTotals(enrichedHoldings);

  // Monthly recurring total
  const monthlyRecurring = recurringTransfers.reduce((sum, t) => {
    if (t.frequency === 'weekly') return sum + t.amount * 52 / 12;
    if (t.frequency === 'biweekly') return sum + t.amount * 26 / 12;
    if (t.frequency === 'monthly') return sum + t.amount;
    return sum;
  }, 0);

  // Live price refresh via Financial Modeling Prep API
  const [apiKey, setApiKey] = useLocalStorage('wp_fmp_api_key', '');
  const [lastRefresh, setLastRefresh] = useLocalStorage('wp_last_price_refresh', null);
  const [refreshing, setRefreshing] = useState(false);

  const refreshPrices = useCallback(async () => {
    if (!apiKey || refreshing) return { success: false, error: 'No API key set' };
    setRefreshing(true);
    try {
      // Get unique tickers (skip SPAXX — always $1)
      const tickers = [...new Set(holdings.filter((h) => h.ticker !== 'SPAXX').map((h) => h.ticker))];
      if (tickers.length === 0) { setRefreshing(false); return { success: true }; }

      const url = `https://financialmodelingprep.com/api/v3/quote/${tickers.join(',')}?apikey=${apiKey}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();

      if (data['Error Message']) throw new Error(data['Error Message']);

      const priceMap = {};
      for (const q of data) {
        if (q.symbol && q.price) priceMap[q.symbol] = q.price;
      }

      setHoldings((prev) =>
        prev.map((h) => {
          if (h.ticker === 'SPAXX') return h;
          const newPrice = priceMap[h.ticker];
          return newPrice ? { ...h, currentPrice: newPrice } : h;
        })
      );

      const now = new Date().toISOString();
      setLastRefresh(now);
      setRefreshing(false);
      return { success: true, updated: Object.keys(priceMap).length };
    } catch (err) {
      setRefreshing(false);
      return { success: false, error: err.message };
    }
  }, [apiKey, holdings, refreshing, setHoldings, setLastRefresh]);

  return {
    holdings,
    enrichedHoldings,
    totals,
    addHolding,
    updateHolding,
    removeHolding,
    recurringTransfers,
    addRecurring,
    removeRecurring,
    monthlyRecurring,
    // Price refresh
    apiKey,
    setApiKey,
    refreshPrices,
    refreshing,
    lastRefresh,
  };
}
