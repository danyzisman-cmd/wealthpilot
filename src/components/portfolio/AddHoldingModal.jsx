import { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import Input from '../shared/Input';
import Select from '../shared/Select';
import Button from '../shared/Button';

const HOLDING_TYPES = [
  { value: 'etf', label: 'ETF' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'stock', label: 'Stock' },
  { value: 'bond', label: 'Bond' },
];

const EMPTY = {
  ticker: '',
  name: '',
  type: 'etf',
  shares: '',
  avgCost: '',
  currentPrice: '',
};

export default function AddHoldingModal({ isOpen, onClose, onSave, editingHolding }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (editingHolding) {
      setForm({
        ticker: editingHolding.ticker,
        name: editingHolding.name,
        type: editingHolding.type,
        shares: editingHolding.shares,
        avgCost: editingHolding.avgCost,
        currentPrice: editingHolding.currentPrice,
      });
    } else {
      setForm(EMPTY);
    }
  }, [editingHolding, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.ticker || !form.shares || !form.avgCost || !form.currentPrice) return;
    onSave({
      ...form,
      ticker: form.ticker.toUpperCase(),
      shares: parseFloat(form.shares) || 0,
      avgCost: parseFloat(form.avgCost) || 0,
      currentPrice: parseFloat(form.currentPrice) || 0,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingHolding ? 'Edit Holding' : 'Add Holding'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Ticker"
            placeholder="VTI"
            value={form.ticker}
            onChange={(e) => setForm({ ...form, ticker: e.target.value })}
          />
          <Select
            label="Type"
            options={HOLDING_TYPES}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          />
        </div>
        <Input
          label="Name"
          placeholder="Vanguard Total Stock Market"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Shares"
            type="number"
            step="any"
            placeholder="10"
            value={form.shares}
            onChange={(e) => setForm({ ...form, shares: e.target.value })}
          />
          <Input
            label="Avg Cost"
            type="number"
            step="any"
            prefix="$"
            placeholder="250.00"
            value={form.avgCost}
            onChange={(e) => setForm({ ...form, avgCost: e.target.value })}
          />
          <Input
            label="Current Price"
            type="number"
            step="any"
            prefix="$"
            placeholder="265.00"
            value={form.currentPrice}
            onChange={(e) => setForm({ ...form, currentPrice: e.target.value })}
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">{editingHolding ? 'Save Changes' : 'Add Holding'}</Button>
        </div>
      </form>
    </Modal>
  );
}
