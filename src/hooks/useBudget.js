import { useLocalStorage } from './useLocalStorage';
import { computeBudgetTotals, groupEntriesByCategory } from '../utils/budgetCalc';

export function useBudget() {
  const [entries, setEntries] = useLocalStorage('wp_budget', []);

  const addEntry = (entry) => {
    setEntries((prev) => [
      ...prev,
      { ...entry, id: crypto.randomUUID() },
    ]);
  };

  const updateEntry = (id, updates) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  };

  const removeEntry = (id) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const totals = computeBudgetTotals(entries);
  const grouped = groupEntriesByCategory(entries);

  return { entries, addEntry, updateEntry, removeEntry, totals, grouped };
}
