import Card from '../shared/Card';
import { formatCurrency, formatPercentRaw } from '../../utils/formatters';

export default function AllocationCard({ advisory }) {
  if (!advisory) return null;

  const { budgetSplit, risk, monthlyTakeHome } = advisory;
  const items = [
    { label: 'Needs', amount: budgetSplit.needs, pct: risk.needs, color: 'bg-blue-400' },
    { label: 'Wants', amount: budgetSplit.wants, pct: risk.wants, color: 'bg-violet-400' },
    { label: 'Savings & Investing', amount: budgetSplit.savings, pct: risk.savings, color: 'bg-emerald-400' },
  ];

  return (
    <Card title="Monthly Budget Split" subtitle={`${risk.label} profile — ${formatCurrency(monthlyTakeHome)}/mo take-home`}>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-gray-300">{item.label}</span>
              <span className="text-sm font-medium text-gray-200">
                {formatCurrency(item.amount)} <span className="text-gray-500">({item.pct}%)</span>
              </span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${item.color} transition-all duration-500`}
                style={{ width: `${item.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
