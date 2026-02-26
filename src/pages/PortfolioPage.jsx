import { useState, useMemo } from 'react';
import { usePortfolio } from '../hooks/usePortfolio';
import HoldingsTable from '../components/portfolio/HoldingsTable';
import AddHoldingModal from '../components/portfolio/AddHoldingModal';

import PortfolioScreenshot from '../components/portfolio/PortfolioScreenshot';
import AllocationPieChart from '../components/charts/AllocationPieChart';
import GainLossChart from '../components/charts/GainLossChart';
import Card from '../components/shared/Card';
import MetricCard from '../components/shared/MetricCard';
import Button from '../components/shared/Button';
import EmptyState from '../components/shared/EmptyState';
import Input from '../components/shared/Input';
import { formatCurrency, formatPercent } from '../utils/formatters';

const ACCOUNT_LABELS = {
  taxable: 'Taxable Brokerage',
  '401k': '401k',
  roth_ira: 'Roth IRA',
  traditional_ira: 'Traditional IRA',
  hsa: 'HSA',
  crypto_exchange: 'Crypto Exchange',
  other: 'Other',
};

export default function PortfolioPage() {
  const { holdings, enrichedHoldings, totals, addHolding, updateHolding, removeHolding, recurringTransfers, removeRecurring, monthlyRecurring, apiKey, setApiKey, refreshPrices, refreshing, lastRefresh } = usePortfolio();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHolding, setEditingHolding] = useState(null);
  const [refreshStatus, setRefreshStatus] = useState(null);

  const handleSave = (data) => {
    if (editingHolding) {
      updateHolding(editingHolding.id, data);
    } else {
      addHolding(data);
    }
    setEditingHolding(null);
  };

  const handleEdit = (holding) => {
    setEditingHolding(holding);
    setModalOpen(true);
  };

  const handleAdd = () => {
    setEditingHolding(null);
    setModalOpen(true);
  };

  const handleRefresh = async () => {
    setRefreshStatus(null);
    const result = await refreshPrices();
    if (result.success) {
      setRefreshStatus({ type: 'success', message: `Prices updated (${result.updated || 0} tickers)` });
    } else {
      setRefreshStatus({ type: 'error', message: result.error });
    }
    setTimeout(() => setRefreshStatus(null), 5000);
  };

  // Account breakdown
  const accountBreakdown = useMemo(() => {
    const byAccount = {};
    for (const h of enrichedHoldings) {
      const acct = h.account || 'taxable';
      if (!byAccount[acct]) byAccount[acct] = { value: 0, cost: 0, holdings: 0 };
      byAccount[acct].value += h.currentValue;
      byAccount[acct].cost += h.costBasis;
      byAccount[acct].holdings += 1;
    }
    return Object.entries(byAccount)
      .map(([key, data]) => ({
        key,
        label: ACCOUNT_LABELS[key] || key,
        ...data,
        gainLoss: data.value - data.cost,
      }))
      .sort((a, b) => b.value - a.value);
  }, [enrichedHoldings]);

  const handleDownloadCSV = () => {
    const headers = ['Account', 'Ticker', 'Name', 'Type', 'Shares', 'Avg Cost', 'Current Price', 'Cost Basis', 'Current Value', 'Gain/Loss', 'Gain/Loss %'];
    const rows = enrichedHoldings
      .sort((a, b) => (a.account || 'taxable').localeCompare(b.account || 'taxable'))
      .map((h) => [
        ACCOUNT_LABELS[h.account] || h.account || 'Taxable Brokerage',
        h.ticker,
        `"${h.name}"`,
        h.type.toUpperCase(),
        h.shares,
        h.avgCost.toFixed(2),
        h.currentPrice.toFixed(2),
        h.costBasis.toFixed(2),
        h.currentValue.toFixed(2),
        h.gainLoss.toFixed(2),
        (h.gainLossPercent * 100).toFixed(1) + '%',
      ]);

    // Add account subtotals
    for (const acct of accountBreakdown) {
      rows.push([]);
      rows.push([`${acct.label} Total`, '', '', '', '', '', '', acct.cost.toFixed(2), acct.value.toFixed(2), acct.gainLoss.toFixed(2), '']);
    }
    rows.push([]);
    rows.push(['PORTFOLIO TOTAL', '', '', '', '', '', '', totals.totalCost.toFixed(2), totals.totalValue.toFixed(2), totals.totalGainLoss.toFixed(2), (totals.totalGainLossPercent * 100).toFixed(1) + '%']);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pieData = totals.allocations.map((a) => ({
    name: a.type.toUpperCase(),
    value: a.value,
    percent: (a.percent * 100).toFixed(1),
  }));

  return (
    <div className="space-y-6 max-w-6xl">
      {holdings.length > 0 && (
        <>
          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              icon="◆"
              label="Total Value"
              value={formatCurrency(totals.totalValue, 2)}
              color="blue"
            />
            <MetricCard
              icon="$"
              label="Total Cost"
              value={formatCurrency(totals.totalCost, 2)}
              color="violet"
            />
            <MetricCard
              icon={totals.totalGainLoss >= 0 ? '↑' : '↓'}
              label="Total Gain/Loss"
              value={`${totals.totalGainLoss >= 0 ? '+' : ''}${formatCurrency(totals.totalGainLoss, 2)}`}
              sub={`${totals.totalGainLoss >= 0 ? '+' : ''}${(totals.totalGainLossPercent * 100).toFixed(1)}%`}
              color={totals.totalGainLoss >= 0 ? 'emerald' : 'rose'}
            />
            <MetricCard
              icon="#"
              label="Holdings"
              value={holdings.length}
              sub={`${totals.allocations.length} asset types`}
              color="amber"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Asset Allocation">
              <AllocationPieChart data={pieData} />
            </Card>
            <Card title="Gain/Loss by Holding">
              <GainLossChart data={enrichedHoldings} />
            </Card>
          </div>

          {/* Account Breakdown */}
          {accountBreakdown.length > 1 && (
            <Card title="By Account">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {accountBreakdown.map((acct) => (
                  <div key={acct.key} className="bg-gray-850 rounded-lg p-4">
                    <p className="text-xs text-gray-500">{acct.label}</p>
                    <p className="text-lg font-bold text-gray-100 mt-1">{formatCurrency(acct.value, 2)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs font-medium ${acct.gainLoss >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {acct.gainLoss >= 0 ? '+' : ''}{formatCurrency(acct.gainLoss, 2)}
                      </span>
                      <span className="text-xs text-gray-500">{acct.holdings} holding{acct.holdings !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {/* Holdings Table */}
      <Card
        title="Holdings"
        subtitle={lastRefresh ? `Prices updated ${new Date(lastRefresh).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}` : undefined}
        action={
          <div className="flex items-center gap-2">
            {holdings.length > 0 && apiKey && (
              <Button size="sm" variant="secondary" onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? 'Refreshing...' : 'Refresh Prices'}
              </Button>
            )}
            {holdings.length > 0 && (
              <Button size="sm" variant="secondary" onClick={handleDownloadCSV}>Download CSV</Button>
            )}
            <Button size="sm" onClick={handleAdd}>+ Add Holding</Button>
          </div>
        }
      >
        {holdings.length > 0 ? (
          <HoldingsTable
            holdings={enrichedHoldings}
            onRemove={removeHolding}
            onEdit={handleEdit}
          />
        ) : (
          <p className="text-sm text-gray-500 text-center py-8">No holdings yet. Click "+ Add Holding" to get started.</p>
        )}
        {refreshStatus && (
          <div className={`mt-3 text-sm px-3 py-2 rounded-lg ${refreshStatus.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
            {refreshStatus.message}
          </div>
        )}
      </Card>

      {/* Recurring Transfers */}
      {recurringTransfers.length > 0 && (
        <Card
          title="Recurring Investments"
          subtitle={`${formatCurrency(monthlyRecurring)}/mo auto-invested`}
        >
          <div className="space-y-3">
            {recurringTransfers.map((t) => (
              <div key={t.id} className="flex items-center justify-between bg-gray-850 rounded-lg px-4 py-3">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-emerald-500">{t.ticker.slice(0, 3)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-100">{formatCurrency(t.amount)} → {t.ticker}</p>
                    <p className="text-xs text-gray-500">{t.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-gray-300">
                      {t.frequency === 'weekly' ? 'Every' : t.frequency === 'monthly' ? 'Monthly' : 'Every other'} {t.frequency !== 'monthly' ? t.day : ''}
                    </p>
                    <p className="text-xs text-gray-500">Next: {new Date(t.nextDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  </div>
                  <button
                    onClick={() => removeRecurring(t.id)}
                    className="text-gray-600 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-gray-500">
            Annual auto-investment: <span className="font-medium text-gray-400">{formatCurrency(monthlyRecurring * 12)}/yr</span>
          </div>
        </Card>
      )}

      {/* Price Refresh API Key */}
      <Card title="Live Price Refresh" subtitle="Uses Financial Modeling Prep (free, 250 requests/day)">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Input
              label="API Key"
              type="password"
              placeholder="Paste your free FMP API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
          <Button size="sm" onClick={handleRefresh} disabled={!apiKey || refreshing}>
            {refreshing ? 'Refreshing...' : 'Test & Refresh'}
          </Button>
        </div>
        {!apiKey && (
          <p className="text-xs text-gray-500 mt-2">
            Get a free key at <a href="https://site.financialmodelingprep.com/register" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">financialmodelingprep.com/register</a> (email only, no credit card)
          </p>
        )}
      </Card>

      {/* Portfolio Screenshots */}
      <PortfolioScreenshot />

      <AddHoldingModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingHolding(null); }}
        onSave={handleSave}
        editingHolding={editingHolding}
      />
    </div>
  );
}
