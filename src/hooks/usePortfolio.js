import { useLocalStorage } from './useLocalStorage';
import { computeHoldingValues, computePortfolioTotals } from '../utils/portfolioCalc';

export function usePortfolio() {
  const [holdings, setHoldings] = useLocalStorage('wp_portfolio', []);

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

  const enrichedHoldings = computeHoldingValues(holdings);
  const totals = computePortfolioTotals(enrichedHoldings);

  return { holdings, enrichedHoldings, totals, addHolding, updateHolding, removeHolding };
}
