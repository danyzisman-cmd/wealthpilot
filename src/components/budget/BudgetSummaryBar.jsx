import { formatCurrency, formatPercent } from '../../utils/formatters';
import { BUDGET_CATEGORIES } from '../../constants/budgetCategories';

export default function BudgetSummaryBar({ totals }) {
  if (!totals || totals.grandTotal === 0) return null;

  const items = [
    { key: 'needs', ...BUDGET_CATEGORIES.needs, amount: totals.totals.needs, pct: totals.percentages.needs },
    { key: 'wants', ...BUDGET_CATEGORIES.wants, amount: totals.totals.wants, pct: totals.percentages.wants },
    { key: 'savings', ...BUDGET_CATEGORIES.savings, amount: totals.totals.savings, pct: totals.percentages.savings },
  ];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-300">Monthly Budget</h3>
        <span className="text-lg font-bold text-gray-100">{formatCurrency(totals.grandTotal)}</span>
      </div>
      {/* Stacked bar */}
      <div className="h-3 bg-gray-800 rounded-full overflow-hidden flex">
        {items.map((item) => (
          <div
            key={item.key}
            className="h-full transition-all duration-500"
            style={{ width: `${item.pct * 100}%`, backgroundColor: item.color }}
          />
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-6 mt-3">
        {items.map((item) => (
          <div key={item.key} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-gray-400">{item.label}</span>
            <span className="text-xs font-medium text-gray-300">
              {formatCurrency(item.amount)} ({formatPercent(item.pct, 0)})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
