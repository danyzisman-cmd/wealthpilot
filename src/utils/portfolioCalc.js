export function computeHoldingValues(holdings) {
  return holdings.map((h) => {
    const costBasis = h.shares * h.avgCost;
    const currentValue = h.shares * h.currentPrice;
    const gainLoss = currentValue - costBasis;
    const gainLossPercent = costBasis > 0 ? gainLoss / costBasis : 0;
    return { ...h, costBasis, currentValue, gainLoss, gainLossPercent };
  });
}

export function computePortfolioTotals(enrichedHoldings) {
  const totalValue = enrichedHoldings.reduce((s, h) => s + h.currentValue, 0);
  const totalCost = enrichedHoldings.reduce((s, h) => s + h.costBasis, 0);
  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPercent = totalCost > 0 ? totalGainLoss / totalCost : 0;

  const byType = {};
  for (const h of enrichedHoldings) {
    byType[h.type] = (byType[h.type] || 0) + h.currentValue;
  }

  const allocations = Object.entries(byType).map(([type, value]) => ({
    type,
    value,
    percent: totalValue > 0 ? value / totalValue : 0,
  }));

  return {
    totalValue,
    totalCost,
    totalGainLoss,
    totalGainLossPercent,
    allocations,
  };
}

export function computeAllocationDrift(holdings, recommendedSplit) {
  const enriched = computeHoldingValues(holdings);
  const totals = computePortfolioTotals(enriched);

  const actualByTicker = {};
  for (const h of enriched) {
    actualByTicker[h.ticker] =
      (actualByTicker[h.ticker] || 0) + h.currentValue;
  }

  return recommendedSplit.map((rec) => {
    const actual = actualByTicker[rec.ticker] || 0;
    const actualPct = totals.totalValue > 0 ? actual / totals.totalValue : 0;
    return {
      ticker: rec.ticker,
      name: rec.name,
      recommendedPct: rec.weight,
      actualPct,
      drift: actualPct - rec.weight,
    };
  });
}
