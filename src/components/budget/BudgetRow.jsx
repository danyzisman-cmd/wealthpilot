import { useState } from 'react';
import { formatCurrency } from '../../utils/formatters';
import { BUDGET_CATEGORIES, EXPENSE_TYPES } from '../../constants/budgetCategories';

export default function BudgetRow({ entry, onUpdate, onRemove }) {
  const [editing, setEditing] = useState(null);

  const handleBlur = (field, value) => {
    if (field === 'amount') {
      onUpdate(entry.id, { [field]: parseFloat(value) || 0 });
    } else {
      onUpdate(entry.id, { [field]: value });
    }
    setEditing(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') e.target.blur();
    if (e.key === 'Escape') setEditing(null);
  };

  const renderCell = (field, value, type = 'text') => {
    if (editing === field) {
      if (field === 'subcategory') {
        const subs = BUDGET_CATEGORIES[entry.category]?.subcategories || [];
        return (
          <select
            autoFocus
            className="bg-gray-800 border border-emerald-500/50 rounded px-2 py-1 text-sm text-gray-100 w-full"
            defaultValue={value}
            onBlur={(e) => handleBlur(field, e.target.value)}
            onChange={(e) => handleBlur(field, e.target.value)}
          >
            {subs.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        );
      }
      if (field === 'type') {
        return (
          <select
            autoFocus
            className="bg-gray-800 border border-emerald-500/50 rounded px-2 py-1 text-sm text-gray-100 w-full"
            defaultValue={value}
            onBlur={(e) => handleBlur(field, e.target.value)}
            onChange={(e) => handleBlur(field, e.target.value)}
          >
            {EXPENSE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        );
      }
      return (
        <input
          autoFocus
          type={type}
          className="bg-gray-800 border border-emerald-500/50 rounded px-2 py-1 text-sm text-gray-100 w-full"
          defaultValue={type === 'number' ? value || '' : value}
          onBlur={(e) => handleBlur(field, e.target.value)}
          onKeyDown={handleKeyDown}
        />
      );
    }
    return (
      <span
        className="cursor-pointer hover:text-emerald-400 transition-colors px-2 py-1 rounded hover:bg-gray-800 block truncate"
        onClick={() => setEditing(field)}
      >
        {field === 'amount' ? formatCurrency(value) : value || '—'}
      </span>
    );
  };

  return (
    <tr className="border-b border-gray-800/50 hover:bg-gray-850/50 transition-colors">
      <td className="py-2 px-3 text-sm text-gray-200 max-w-[180px]">{renderCell('name', entry.name)}</td>
      <td className="py-2 px-3 text-sm text-gray-300 max-w-[160px]">{renderCell('subcategory', entry.subcategory)}</td>
      <td className="py-2 px-3 text-sm text-gray-300 w-24">{renderCell('type', entry.type)}</td>
      <td className="py-2 px-3 text-sm text-gray-200 w-32 text-right font-mono">{renderCell('amount', entry.amount, 'number')}</td>
      <td className="py-2 px-3 w-10">
        <button
          onClick={() => onRemove(entry.id)}
          className="text-gray-600 hover:text-rose-400 transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </td>
    </tr>
  );
}
