import Card from '../shared/Card';
import { formatCurrency } from '../../utils/formatters';

const PRIORITY_COLORS = {
  high: 'text-rose-400 bg-rose-400/10',
  moderate: 'text-amber-400 bg-amber-400/10',
  low: 'text-emerald-400 bg-emerald-400/10',
};

export default function DebtStrategyCard({ debtStrategy }) {
  if (!debtStrategy || !debtStrategy.hasDebt) return null;

  return (
    <Card
      title="Debt Strategy"
      subtitle={debtStrategy.strategy === 'avalanche' ? 'Avalanche method — target highest interest first' : 'Standard — pay minimums and invest'}
    >
      <div className="space-y-3">
        {debtStrategy.items.map((debt) => {
          const colors = PRIORITY_COLORS[debt.priority] || PRIORITY_COLORS.low;
          return (
            <div key={debt.id} className="bg-gray-850 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors}`}>
                    {debt.priority} priority
                  </span>
                  <span className="text-sm font-medium text-gray-200">{debt.name}</span>
                </div>
                <span className="text-sm text-gray-300">{debt.interestRate}% APR</span>
              </div>
              <p className="text-xs text-gray-500">
                Balance: {formatCurrency(debt.balance)} — Min payment: {formatCurrency(debt.minimumPayment)}/mo
              </p>
              <p className="text-xs text-gray-400 mt-1">{debt.recommendation}</p>
            </div>
          );
        })}
        <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
          <span className="text-sm text-gray-400">Total minimum monthly</span>
          <span className="text-sm font-semibold text-gray-200">
            {formatCurrency(debtStrategy.totalMonthly)}/mo
          </span>
        </div>
      </div>
    </Card>
  );
}
