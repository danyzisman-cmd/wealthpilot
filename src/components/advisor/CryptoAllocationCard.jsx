import Card from '../shared/Card';
import { formatCurrency, formatPercent } from '../../utils/formatters';

const CRYPTO_ICONS = {
  BTC: '₿',
  ETH: 'Ξ',
  ALT: '◈',
};

export default function CryptoAllocationCard({ cryptoBreakdown, monthlyTotal, cryptoPct }) {
  if (!cryptoBreakdown || cryptoBreakdown.length === 0) return null;

  return (
    <Card
      title="Crypto Allocation"
      subtitle={`${formatPercent(cryptoPct, 0)} of investable → ${formatCurrency(monthlyTotal)}/mo`}
    >
      <div className="space-y-3">
        {cryptoBreakdown.map((coin) => (
          <div key={coin.ticker} className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-amber-400/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-amber-400">
                {CRYPTO_ICONS[coin.ticker] || '●'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-200">{coin.name}</p>
                <span className="text-sm font-semibold text-gray-100">
                  {formatCurrency(coin.monthlyAmount)}/mo
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: `${coin.weight * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-10 text-right">
                  {formatPercent(coin.weight, 0)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
