export function computeBudgetTotals(entries) {
  const totals = { needs: 0, wants: 0, savings: 0 };
  const bySubcategory = {};

  for (const entry of entries) {
    const cat = entry.category;
    if (totals[cat] !== undefined) {
      totals[cat] += entry.amount || 0;
    }
    const key = `${cat}:${entry.subcategory}`;
    bySubcategory[key] = (bySubcategory[key] || 0) + (entry.amount || 0);
  }

  const grandTotal = totals.needs + totals.wants + totals.savings;

  return {
    totals,
    bySubcategory,
    grandTotal,
    percentages: {
      needs: grandTotal > 0 ? totals.needs / grandTotal : 0,
      wants: grandTotal > 0 ? totals.wants / grandTotal : 0,
      savings: grandTotal > 0 ? totals.savings / grandTotal : 0,
    },
    savingsRate: grandTotal > 0 ? totals.savings / grandTotal : 0,
  };
}

export function groupEntriesByCategory(entries) {
  const groups = { needs: [], wants: [], savings: [] };
  for (const entry of entries) {
    if (groups[entry.category]) {
      groups[entry.category].push(entry);
    }
  }
  return groups;
}
