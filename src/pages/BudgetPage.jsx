import { useBudget } from '../hooks/useBudget';
import BudgetTable from '../components/budget/BudgetTable';
import BudgetSummaryBar from '../components/budget/BudgetSummaryBar';
import BudgetBarChart from '../components/charts/BudgetBarChart';
import Card from '../components/shared/Card';
import EmptyState from '../components/shared/EmptyState';
import Button from '../components/shared/Button';
import { BUDGET_CATEGORIES } from '../constants/budgetCategories';

export default function BudgetPage() {
  const { entries, addEntry, updateEntry, removeEntry, totals, grouped } = useBudget();

  const chartData = Object.entries(totals.totals).map(([key, value]) => ({
    key,
    name: BUDGET_CATEGORIES[key].label,
    value,
  }));

  if (entries.length === 0) {
    return (
      <div className="max-w-5xl">
        <EmptyState
          title="No budget entries yet"
          description="Start tracking your monthly expenses by adding entries to each category."
          action={
            <Button
              onClick={() =>
                addEntry({
                  name: 'Rent',
                  category: 'needs',
                  subcategory: 'Rent/Mortgage',
                  amount: 0,
                  type: 'fixed',
                })
              }
            >
              Add Your First Entry
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <BudgetSummaryBar totals={totals} />

      {totals.grandTotal > 0 && (
        <Card title="Spending Breakdown">
          <BudgetBarChart data={chartData} />
        </Card>
      )}

      {['needs', 'wants', 'savings'].map((category) => (
        <BudgetTable
          key={category}
          category={category}
          entries={grouped[category]}
          onAdd={addEntry}
          onUpdate={updateEntry}
          onRemove={removeEntry}
        />
      ))}
    </div>
  );
}
