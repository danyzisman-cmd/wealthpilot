import { useState } from 'react';
import { usePortfolio } from '../hooks/usePortfolio';
import HoldingsTable from '../components/portfolio/HoldingsTable';
import AddHoldingModal from '../components/portfolio/AddHoldingModal';
import AllocationComparison from '../components/portfolio/AllocationComparison';
import PortfolioScreenshot from '../components/portfolio/PortfolioScreenshot';
import AllocationPieChart from '../components/charts/AllocationPieChart';
import GainLossChart from '../components/charts/GainLossChart';
import Card from '../components/shared/Card';
import MetricCard from '../components/shared/MetricCard';
import Button from '../components/shared/Button';
import EmptyState from '../components/shared/EmptyState';
import { formatCurrency, formatPercent } from '../utils/formatters';

export default function PortfolioPage() {
  const { holdings, enrichedHoldings, totals, addHolding, updateHolding, removeHolding } = usePortfolio();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHolding, setEditingHolding] = useState(null);

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

  const pieData = totals.allocations.map((a) => ({
    name: a.type.toUpperCase(),
    value: a.value,
    percent: (a.percent * 100).toFixed(1),
  }));

  if (holdings.length === 0) {
    return (
      <div className="max-w-5xl space-y-6">
        <EmptyState
          title="No holdings yet"
          description="Add your investment holdings to track performance and allocation."
          action={<Button onClick={handleAdd}>Add Your First Holding</Button>}
        />
        <PortfolioScreenshot />
        <AddHoldingModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
          editingHolding={editingHolding}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
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

      {/* Allocation Comparison */}
      <AllocationComparison holdings={holdings} />

      {/* Holdings Table */}
      <Card
        title="Holdings"
        action={<Button size="sm" onClick={handleAdd}>+ Add Holding</Button>}
      >
        <HoldingsTable
          holdings={enrichedHoldings}
          onRemove={removeHolding}
          onEdit={handleEdit}
        />
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
