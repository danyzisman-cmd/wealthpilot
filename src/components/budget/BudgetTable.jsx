import { useState } from 'react';
import BudgetRow from './BudgetRow';
import Button from '../shared/Button';
import { BUDGET_CATEGORIES } from '../../constants/budgetCategories';
import { formatCurrency } from '../../utils/formatters';

export default function BudgetTable({ category, entries, onAdd, onUpdate, onRemove }) {
  const config = BUDGET_CATEGORIES[category];
  const [adding, setAdding] = useState(false);

  const categoryTotal = entries.reduce((sum, e) => sum + (e.amount || 0), 0);

  const handleQuickAdd = () => {
    onAdd({
      name: '',
      category,
      subcategory: config.subcategories[0],
      amount: 0,
      type: 'fixed',
    });
    setAdding(false);
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }} />
          <h3 className="text-sm font-semibold text-gray-100">{config.label}</h3>
          <span className="text-sm text-gray-500">({entries.length} items)</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-200">{formatCurrency(categoryTotal)}</span>
          <Button variant="secondary" size="sm" onClick={handleQuickAdd}>+ Add</Button>
        </div>
      </div>

      {/* Table */}
      {entries.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Subcategory</th>
                <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="py-2 px-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="py-2 px-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <BudgetRow
                  key={entry.id}
                  entry={entry}
                  onUpdate={onUpdate}
                  onRemove={onRemove}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-8 text-center text-sm text-gray-600">
          No entries yet. Click "+ Add" to get started.
        </div>
      )}
    </div>
  );
}
