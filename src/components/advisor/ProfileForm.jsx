import { useState } from 'react';
import Input from '../shared/Input';
import Select from '../shared/Select';
import Button from '../shared/Button';
import Card from '../shared/Card';
import { DEBT_TYPES } from '../../constants/advisorDefaults';

const RISK_OPTIONS = [
  { value: 'conservative', label: 'Conservative' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'aggressive', label: 'Aggressive (Crypto Enthusiast)' },
];

export default function ProfileForm({ profile, onUpdate, onAddDebt, onRemoveDebt }) {
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [newDebt, setNewDebt] = useState({
    name: '',
    type: 'Student Loan',
    balance: 0,
    interestRate: 0,
    minimumPayment: 0,
  });

  const handleAddDebt = () => {
    if (!newDebt.name || !newDebt.balance) return;
    onAddDebt(newDebt);
    setNewDebt({ name: '', type: 'Student Loan', balance: 0, interestRate: 0, minimumPayment: 0 });
    setShowDebtForm(false);
  };

  return (
    <Card title="Your Financial Profile" subtitle="Enter your details for personalized advice">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Name"
          placeholder="Your name"
          value={profile.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
        />
        <Input
          label="Age"
          type="number"
          value={profile.age || ''}
          onChange={(e) => onUpdate({ age: parseInt(e.target.value) || 0 })}
        />
        <Input
          label="Annual Salary (Gross)"
          type="number"
          prefix="$"
          placeholder="75000"
          value={profile.annualSalary || ''}
          onChange={(e) => onUpdate({ annualSalary: parseFloat(e.target.value) || 0 })}
        />
        <Input
          label="Annual Take-Home Pay"
          type="number"
          prefix="$"
          placeholder="54000"
          value={profile.takeHomePay || ''}
          onChange={(e) => onUpdate({ takeHomePay: parseFloat(e.target.value) || 0 })}
        />
        <Select
          label="Risk Tolerance"
          options={RISK_OPTIONS}
          value={profile.riskTolerance}
          onChange={(e) => onUpdate({ riskTolerance: e.target.value })}
        />
        <div className="md:col-span-2 bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4">
          <p className="text-sm font-medium text-emerald-600 mb-1">Ramp 401k Match</p>
          <p className="text-xs text-gray-500">100% on first 3% + 50% on next 2% = up to 4% free match. Contribute at least 5% to maximize.</p>
          <p className="text-xs text-gray-500 mt-1">Calculated automatically on the NYC Tax Calc page.</p>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer py-2">
            <input
              type="checkbox"
              checked={profile.hasHSA}
              onChange={(e) => onUpdate({ hasHSA: e.target.checked })}
              className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-emerald-500 focus:ring-emerald-500/25"
            />
            <span className="text-sm text-gray-300">Has HSA-eligible plan</span>
          </label>
        </div>
      </div>

      {/* Debts Section */}
      <div className="mt-6 pt-6 border-t border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-gray-300">Debts</h4>
          <Button variant="secondary" size="sm" onClick={() => setShowDebtForm(!showDebtForm)}>
            {showDebtForm ? 'Cancel' : '+ Add Debt'}
          </Button>
        </div>

        {showDebtForm && (
          <div className="bg-gray-850 rounded-lg p-4 mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Name"
                placeholder="e.g. Chase Student Loan"
                value={newDebt.name}
                onChange={(e) => setNewDebt({ ...newDebt, name: e.target.value })}
              />
              <Select
                label="Type"
                options={DEBT_TYPES}
                value={newDebt.type}
                onChange={(e) => setNewDebt({ ...newDebt, type: e.target.value })}
              />
              <Input
                label="Balance"
                type="number"
                prefix="$"
                value={newDebt.balance || ''}
                onChange={(e) => setNewDebt({ ...newDebt, balance: parseFloat(e.target.value) || 0 })}
              />
              <Input
                label="Interest Rate"
                type="number"
                suffix="%"
                value={newDebt.interestRate || ''}
                onChange={(e) => setNewDebt({ ...newDebt, interestRate: parseFloat(e.target.value) || 0 })}
              />
              <Input
                label="Min. Monthly Payment"
                type="number"
                prefix="$"
                value={newDebt.minimumPayment || ''}
                onChange={(e) => setNewDebt({ ...newDebt, minimumPayment: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <Button size="sm" onClick={handleAddDebt}>Add Debt</Button>
          </div>
        )}

        {(profile.debts || []).length > 0 ? (
          <div className="space-y-2">
            {profile.debts.map((debt) => (
              <div key={debt.id} className="flex items-center justify-between bg-gray-850 rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm text-gray-200">{debt.name}</p>
                  <p className="text-xs text-gray-500">{debt.type} — {debt.interestRate}% APR</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-300">${debt.balance.toLocaleString()}</span>
                  <button
                    onClick={() => onRemoveDebt(debt.id)}
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
        ) : (
          <p className="text-sm text-gray-600">No debts added. Lucky you!</p>
        )}
      </div>
    </Card>
  );
}
