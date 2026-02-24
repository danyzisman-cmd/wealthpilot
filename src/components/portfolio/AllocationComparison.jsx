import Card from '../shared/Card';
import { formatPercent } from '../../utils/formatters';
import { computeAllocationDrift } from '../../utils/portfolioCalc';
import { ETF_SPLIT, CRYPTO_SPLIT } from '../../constants/advisorDefaults';
import PortfolioDriftChart from '../charts/PortfolioDriftChart';

export default function AllocationComparison({ holdings }) {
  if (!holdings || holdings.length === 0) return null;

  const allRecommended = [...ETF_SPLIT, ...CRYPTO_SPLIT];
  const drift = computeAllocationDrift(holdings, allRecommended);
  const hasDrift = drift.some((d) => d.actualPct > 0);

  if (!hasDrift) return null;

  return (
    <Card title="Allocation vs. Recommended" subtitle="Drift from target allocation">
      <PortfolioDriftChart data={drift} />
      <div className="mt-4 space-y-2">
        {drift
          .filter((d) => d.actualPct > 0 || d.recommendedPct > 0)
          .map((d) => (
            <div key={d.ticker} className="flex items-center justify-between text-sm">
              <span className="text-gray-400">{d.ticker}</span>
              <div className="flex items-center gap-4">
                <span className="text-gray-500">
                  Target: {formatPercent(d.recommendedPct, 0)}
                </span>
                <span className="text-gray-300">
                  Actual: {formatPercent(d.actualPct, 1)}
                </span>
                <span className={`font-medium ${d.drift >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {d.drift >= 0 ? '+' : ''}{formatPercent(d.drift, 1)}
                </span>
              </div>
            </div>
          ))}
      </div>
    </Card>
  );
}
