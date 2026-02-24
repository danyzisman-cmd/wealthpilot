import { useState } from 'react';
import { useRSUs } from '../hooks/useRSUs';
import Card from '../components/shared/Card';
import MetricCard from '../components/shared/MetricCard';
import Button from '../components/shared/Button';
import Input from '../components/shared/Input';
import Modal from '../components/shared/Modal';
import EmptyState from '../components/shared/EmptyState';
import { formatCurrency } from '../utils/formatters';

export default function RSUPage() {
  const { rsus, addGrant, updateGrant, removeGrant, summary } = useRSUs();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGrant, setEditingGrant] = useState(null);

  const handleAdd = () => {
    setEditingGrant(null);
    setModalOpen(true);
  };

  const handleEdit = (grant) => {
    setEditingGrant(grant);
    setModalOpen(true);
  };

  if (rsus.length === 0) {
    return (
      <div className="max-w-5xl">
        <EmptyState
          title="No RSU grants tracked"
          description="Add your RSU grants to track vesting schedules and projected value."
          action={<Button onClick={handleAdd}>Add RSU Grant</Button>}
        />
        <RSUModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={addGrant}
          editingGrant={editingGrant}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">RSU Tracker</h1>
          <p className="text-sm text-gray-500 mt-1">Track your restricted stock units and vesting schedule</p>
        </div>
        <Button onClick={handleAdd}>+ Add Grant</Button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon="◆"
          label="Total RSU Value"
          value={formatCurrency(summary.totalCurrentValue, 2)}
          sub={`${summary.totalShares} total shares`}
          color="violet"
        />
        <MetricCard
          icon="✓"
          label="Vested Value"
          value={formatCurrency(summary.vestedValue, 2)}
          sub={`${summary.vestedShares} shares vested`}
          color="emerald"
        />
        <MetricCard
          icon="⏳"
          label="Unvested Value"
          value={formatCurrency(summary.unvestedValue, 2)}
          sub={`${summary.unvestedShares} shares remaining`}
          color="amber"
        />
        <MetricCard
          icon={summary.totalGain >= 0 ? '↑' : '↓'}
          label="Gain Since Grant"
          value={`${summary.totalGain >= 0 ? '+' : ''}${formatCurrency(summary.totalGain, 2)}`}
          color={summary.totalGain >= 0 ? 'emerald' : 'rose'}
        />
      </div>

      {/* Upcoming Vests */}
      {summary.upcomingVests.length > 0 && (
        <Card title="Upcoming Vests" subtitle="Next 12 months">
          <div className="space-y-3">
            {summary.upcomingVests.map((v, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-850 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-violet-500">{v.ticker}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-100">{v.shares} shares</p>
                    <p className="text-xs text-gray-500">{v.company}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-emerald-600">{formatCurrency(v.value, 2)}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(v.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Grant Cards */}
      <div className="space-y-4">
        {rsus.map((grant) => (
          <GrantCard
            key={grant.id}
            grant={grant}
            onEdit={() => handleEdit(grant)}
            onRemove={() => removeGrant(grant.id)}
            onUpdatePrice={(price) => updateGrant(grant.id, { currentPrice: price })}
            onUpdateVested={(vestedShares) => updateGrant(grant.id, { vestedShares })}
          />
        ))}
      </div>

      <RSUModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingGrant(null); }}
        onSave={(data) => {
          if (editingGrant) {
            updateGrant(editingGrant.id, data);
          } else {
            addGrant(data);
          }
        }}
        editingGrant={editingGrant}
      />
    </div>
  );
}

function GrantCard({ grant, onEdit, onRemove, onUpdatePrice, onUpdateVested }) {
  const currentValue = (grant.totalShares || 0) * (grant.currentPrice || 0);
  const grantValue = (grant.totalShares || 0) * (grant.grantPrice || 0);
  const gain = currentValue - grantValue;
  const vestedPct = grant.totalShares > 0 ? ((grant.vestedShares || 0) / grant.totalShares) * 100 : 0;

  return (
    <Card>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <span className="text-sm font-bold text-violet-500">{grant.ticker}</span>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-100">{grant.company}</h3>
            <p className="text-xs text-gray-500">
              Granted {new Date(grant.grantDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              {grant.vestingMonths && ` · ${grant.vestingMonths}-month vesting`}
              {grant.cliffMonths && ` · ${grant.cliffMonths}-month cliff`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onEdit} className="text-gray-600 hover:text-gray-300 transition-colors cursor-pointer">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </button>
          <button onClick={onRemove} className="text-gray-600 hover:text-rose-400 transition-colors cursor-pointer">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Key numbers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-gray-850 rounded-lg p-3">
          <p className="text-xs text-gray-500">Total Shares</p>
          <p className="text-lg font-bold text-gray-100">{grant.totalShares}</p>
        </div>
        <div className="bg-gray-850 rounded-lg p-3">
          <p className="text-xs text-gray-500">Current Price</p>
          <p className="text-lg font-bold text-gray-100">{formatCurrency(grant.currentPrice, 2)}</p>
        </div>
        <div className="bg-gray-850 rounded-lg p-3">
          <p className="text-xs text-gray-500">Current Value</p>
          <p className="text-lg font-bold text-gray-100">{formatCurrency(currentValue, 2)}</p>
        </div>
        <div className="bg-gray-850 rounded-lg p-3">
          <p className="text-xs text-gray-500">Gain Since Grant</p>
          <p className={`text-lg font-bold ${gain >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
            {gain >= 0 ? '+' : ''}{formatCurrency(gain, 2)}
          </p>
        </div>
      </div>

      {/* Vesting progress */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Vesting Progress</span>
          <span className="text-sm font-medium text-gray-100">
            {grant.vestedShares || 0} / {grant.totalShares} shares ({vestedPct.toFixed(0)}%)
          </span>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-violet-500 rounded-full transition-all duration-500"
            style={{ width: `${vestedPct}%` }}
          />
        </div>
      </div>

      {/* Quick update fields */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-800">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Update price:</label>
          <input
            type="number"
            step="any"
            className="w-24 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-100"
            value={grant.currentPrice || ''}
            onChange={(e) => onUpdatePrice(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Vested shares:</label>
          <input
            type="number"
            className="w-24 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-gray-100"
            value={grant.vestedShares || ''}
            onChange={(e) => onUpdateVested(parseInt(e.target.value) || 0)}
          />
        </div>
      </div>
    </Card>
  );
}

function RSUModal({ isOpen, onClose, onSave, editingGrant }) {
  const [form, setForm] = useState(getDefaults(editingGrant));

  // Reset form when modal opens
  useState(() => {
    setForm(getDefaults(editingGrant));
  }, [editingGrant, isOpen]);

  function getDefaults(grant) {
    if (grant) return { ...grant };
    return {
      company: '',
      ticker: '',
      totalShares: '',
      vestedShares: '',
      grantPrice: '',
      currentPrice: '',
      grantDate: new Date().toISOString().split('T')[0],
      vestingMonths: 48,
      cliffMonths: 12,
      vestingSchedule: [],
    };
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.company || !form.totalShares) return;

    // Auto-generate quarterly vesting schedule if empty
    let schedule = form.vestingSchedule;
    if ((!schedule || schedule.length === 0) && form.vestingMonths && form.grantDate) {
      schedule = generateVestingSchedule(form);
    }

    onSave({
      ...form,
      ticker: (form.ticker || '').toUpperCase(),
      totalShares: parseInt(form.totalShares) || 0,
      vestedShares: parseInt(form.vestedShares) || 0,
      grantPrice: parseFloat(form.grantPrice) || 0,
      currentPrice: parseFloat(form.currentPrice) || 0,
      vestingMonths: parseInt(form.vestingMonths) || 48,
      cliffMonths: parseInt(form.cliffMonths) || 12,
      vestingSchedule: schedule,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingGrant ? 'Edit RSU Grant' : 'Add RSU Grant'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Company"
            placeholder="Ramp"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
          />
          <Input
            label="Ticker"
            placeholder="RAMP"
            value={form.ticker}
            onChange={(e) => setForm({ ...form, ticker: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Total Shares"
            type="number"
            placeholder="1000"
            value={form.totalShares}
            onChange={(e) => setForm({ ...form, totalShares: e.target.value })}
          />
          <Input
            label="Vested Shares"
            type="number"
            placeholder="0"
            value={form.vestedShares}
            onChange={(e) => setForm({ ...form, vestedShares: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Grant Price (per share)"
            type="number"
            step="any"
            prefix="$"
            placeholder="25.00"
            value={form.grantPrice}
            onChange={(e) => setForm({ ...form, grantPrice: e.target.value })}
          />
          <Input
            label="Current Price (per share)"
            type="number"
            step="any"
            prefix="$"
            placeholder="35.00"
            value={form.currentPrice}
            onChange={(e) => setForm({ ...form, currentPrice: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Grant Date"
            type="date"
            value={form.grantDate}
            onChange={(e) => setForm({ ...form, grantDate: e.target.value })}
          />
          <Input
            label="Vesting (months)"
            type="number"
            placeholder="48"
            value={form.vestingMonths}
            onChange={(e) => setForm({ ...form, vestingMonths: e.target.value })}
          />
          <Input
            label="Cliff (months)"
            type="number"
            placeholder="12"
            value={form.cliffMonths}
            onChange={(e) => setForm({ ...form, cliffMonths: e.target.value })}
          />
        </div>
        <p className="text-xs text-gray-500">A quarterly vesting schedule will be auto-generated from your grant date and vesting period.</p>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">{editingGrant ? 'Save Changes' : 'Add Grant'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function generateVestingSchedule({ grantDate, vestingMonths, cliffMonths, totalShares }) {
  const schedule = [];
  const total = parseInt(totalShares) || 0;
  const months = parseInt(vestingMonths) || 48;
  const cliff = parseInt(cliffMonths) || 12;
  if (total <= 0 || months <= 0) return [];

  const start = new Date(grantDate);
  const quarterlyShares = Math.floor(total / (months / 3));
  const cliffShares = Math.floor(total * (cliff / months));

  for (let m = cliff; m <= months; m += 3) {
    const vestDate = new Date(start);
    vestDate.setMonth(vestDate.getMonth() + m);
    const shares = m === cliff ? cliffShares : quarterlyShares;
    schedule.push({
      date: vestDate.toISOString().split('T')[0],
      shares: Math.min(shares, total),
      vested: false,
    });
  }

  return schedule;
}
