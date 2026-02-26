import { useState } from 'react';
import { formatCurrency, formatPercent } from '../../utils/formatters';

export default function HoldingsTable({ holdings, onRemove, onEdit }) {
  const [sortField, setSortField] = useState('ticker');
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sorted = [...holdings].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ field }) => (
    <span className="ml-1 text-gray-600">
      {sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : ''}
    </span>
  );

  const ACCOUNT_LABELS = {
    taxable: 'Taxable',
    '401k': '401k',
    roth_ira: 'Roth IRA',
    traditional_ira: 'Trad IRA',
    hsa: 'HSA',
    crypto_exchange: 'Crypto',
    other: 'Other',
  };

  const columns = [
    { key: 'ticker', label: 'Ticker', align: 'left' },
    { key: 'name', label: 'Name', align: 'left' },
    { key: 'type', label: 'Type', align: 'left' },
    { key: 'account', label: 'Account', align: 'left' },
    { key: 'shares', label: 'Shares', align: 'right' },
    { key: 'avgCost', label: 'Avg Cost', align: 'right' },
    { key: 'currentPrice', label: 'Price', align: 'right' },
    { key: 'currentValue', label: 'Value', align: 'right' },
    { key: 'gainLoss', label: 'Gain/Loss', align: 'right' },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-800">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`py-3 px-4 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-300 transition-colors ${
                  col.align === 'right' ? 'text-right' : 'text-left'
                }`}
                onClick={() => handleSort(col.key)}
              >
                {col.label}
                <SortIcon field={col.key} />
              </th>
            ))}
            <th className="py-3 px-4 w-20"></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((h) => (
            <tr key={h.id} className="border-b border-gray-800/50 hover:bg-gray-850/50 transition-colors">
              <td className="py-3 px-4 text-sm font-medium text-gray-100">{h.ticker}</td>
              <td className="py-3 px-4 text-sm text-gray-300 max-w-[200px] truncate">{h.name}</td>
              <td className="py-3 px-4">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  h.type === 'crypto'
                    ? 'text-amber-400 bg-amber-400/10'
                    : h.type === 'etf'
                    ? 'text-violet-400 bg-violet-400/10'
                    : 'text-blue-400 bg-blue-400/10'
                }`}>
                  {h.type.toUpperCase()}
                </span>
              </td>
              <td className="py-3 px-4 text-sm text-gray-400">{ACCOUNT_LABELS[h.account] || h.account || 'Taxable'}</td>
              <td className="py-3 px-4 text-sm text-gray-200 text-right font-mono">{h.shares}</td>
              <td className="py-3 px-4 text-sm text-gray-300 text-right font-mono">{formatCurrency(h.avgCost, 2)}</td>
              <td className="py-3 px-4 text-sm text-gray-200 text-right font-mono">{formatCurrency(h.currentPrice, 2)}</td>
              <td className="py-3 px-4 text-sm text-gray-100 text-right font-mono font-medium">{formatCurrency(h.currentValue, 2)}</td>
              <td className="py-3 px-4 text-right">
                <div className={`text-sm font-mono font-medium ${h.gainLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {h.gainLoss >= 0 ? '+' : ''}{formatCurrency(h.gainLoss, 2)}
                  <span className="text-xs ml-1 opacity-70">
                    ({h.gainLoss >= 0 ? '+' : ''}{(h.gainLossPercent * 100).toFixed(1)}%)
                  </span>
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={() => onEdit(h)}
                    className="text-gray-600 hover:text-gray-300 transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onRemove(h.id)}
                    className="text-gray-600 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
