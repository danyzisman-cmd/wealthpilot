import Card from '../shared/Card';
import { formatCurrency, formatPercent } from '../../utils/formatters';

export default function ETFRecommendations({ etfBreakdown, monthlyTotal }) {
  if (!etfBreakdown || etfBreakdown.length === 0) return null;

  return (
    <Card
      title="ETF Allocation"
      subtitle={`${formatCurrency(monthlyTotal)}/mo into diversified ETFs`}
    >
      <div className="space-y-3">
        {etfBreakdown.map((etf) => (
          <div key={etf.ticker} className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-violet-400/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-violet-400">{etf.ticker}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-200 truncate">{etf.name}</p>
                <span className="text-sm font-semibold text-gray-100 ml-2">
                  {formatCurrency(etf.monthlyAmount)}/mo
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-400 rounded-full"
                    style={{ width: `${etf.weight * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-10 text-right">
                  {formatPercent(etf.weight, 0)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
