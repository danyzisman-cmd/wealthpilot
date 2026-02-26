import { useMemo } from 'react';
import { Link } from 'react-router';
import { useProfile } from '../hooks/useProfile';
import { useBudget } from '../hooks/useBudget';
import { usePortfolio } from '../hooks/usePortfolio';
import { useRSUs } from '../hooks/useRSUs';
import { computeAdvisory } from '../utils/advisorEngine';
import MetricCard from '../components/shared/MetricCard';
import Card from '../components/shared/Card';
import AllocationPieChart from '../components/charts/AllocationPieChart';
import BudgetBarChart from '../components/charts/BudgetBarChart';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { BUDGET_CATEGORIES } from '../constants/budgetCategories';

export default function DashboardPage() {
  const { profile } = useProfile();
  const { totals: budgetTotals } = useBudget();
  const { totals: portfolioTotals, enrichedHoldings, monthlyRecurring } = usePortfolio();
  const { summary: rsuSummary } = useRSUs();
  const advisory = useMemo(() => computeAdvisory(profile), [profile]);

  const hasProfile = advisory !== null;
  const hasBudget = budgetTotals.grandTotal > 0;
  const hasPortfolio = portfolioTotals.totalValue > 0;
  const hasRSUs = rsuSummary.totalShares > 0;

  const budgetChartData = Object.entries(budgetTotals.totals).map(([key, value]) => ({
    key,
    name: BUDGET_CATEGORIES[key].label,
    value,
  }));

  const portfolioPieData = portfolioTotals.allocations.map((a) => ({
    name: a.type.toUpperCase(),
    value: a.value,
    percent: (a.percent * 100).toFixed(1),
  }));

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-100">
          {profile.name ? `Welcome back, ${profile.name}` : 'Welcome to WealthPilot'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">Your personal financial command center</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon="$"
          label="Monthly Take-Home"
          value={hasProfile ? formatCurrency(advisory.monthlyTakeHome) : '—'}
          color="emerald"
        />
        <MetricCard
          icon="↗"
          label="Monthly Budget"
          value={hasBudget ? formatCurrency(budgetTotals.grandTotal) : '—'}
          sub={hasBudget ? `${formatPercent(budgetTotals.savingsRate, 0)} savings rate` : 'No budget set'}
          color="blue"
        />
        <MetricCard
          icon="◆"
          label="Portfolio Value"
          value={hasPortfolio ? formatCurrency(portfolioTotals.totalValue, 2) : '—'}
          sub={
            hasPortfolio
              ? `${portfolioTotals.totalGainLoss >= 0 ? '+' : ''}${formatCurrency(portfolioTotals.totalGainLoss, 2)}`
              : 'No holdings'
          }
          color={hasPortfolio && portfolioTotals.totalGainLoss >= 0 ? 'emerald' : 'rose'}
        />
        <MetricCard
          icon="⏳"
          label="RSU Value"
          value={hasRSUs ? formatCurrency(rsuSummary.totalCurrentValue, 2) : '—'}
          sub={hasRSUs ? `${rsuSummary.unvestedShares} unvested shares` : 'No RSUs tracked'}
          color="violet"
        />
      </div>

      {/* Quick Actions */}
      {(!hasProfile || !hasBudget || !hasPortfolio) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {!hasProfile && (
            <QuickAction
              to="/advisor"
              title="Set Up Profile"
              description="Enter your salary and preferences for personalized advice"
              color="emerald"
            />
          )}
          {!hasBudget && (
            <QuickAction
              to="/budget"
              title="Create Budget"
              description="Track your monthly spending with the spreadsheet editor"
              color="blue"
            />
          )}
          {!hasPortfolio && (
            <QuickAction
              to="/portfolio"
              title="Add Holdings"
              description="Track your investments and compare with recommendations"
              color="violet"
            />
          )}
        </div>
      )}

      {/* Annual Cash Flow */}
      {(hasProfile || hasBudget || monthlyRecurring > 0) && (() => {
        const annualTakeHome = hasProfile ? advisory.monthlyTakeHome * 12 : (profile.takeHomePay || 0);
        const monthlyNeeds = budgetTotals.totals.needs || 0;
        const monthlyWants = budgetTotals.totals.wants || 0;
        const monthlySpending = monthlyNeeds + monthlyWants;
        const annualSpending = monthlySpending * 12;
        const annualInvesting = monthlyRecurring * 12;
        const annualRemaining = annualTakeHome - annualSpending - annualInvesting;

        return (
          <Card title="Annual Cash Flow" action={<Link to="/tax-calc" className="text-xs text-emerald-400 hover:underline">Tax Calc</Link>}>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-gray-850 rounded-lg p-4">
                <p className="text-xs text-gray-500">Take-Home Pay</p>
                <p className="text-lg font-bold text-gray-100 mt-1">{formatCurrency(annualTakeHome)}/yr</p>
                <p className="text-xs text-gray-500 mt-1">{formatCurrency(annualTakeHome / 12)}/mo</p>
              </div>
              <div className="bg-gray-850 rounded-lg p-4">
                <p className="text-xs text-gray-500">Needs</p>
                <p className="text-lg font-bold text-rose-400 mt-1">{hasBudget ? formatCurrency(monthlyNeeds * 12) : '—'}/yr</p>
                <p className="text-xs text-gray-500 mt-1">{hasBudget ? `${formatCurrency(monthlyNeeds)}/mo` : 'Set up budget'}</p>
              </div>
              <div className="bg-gray-850 rounded-lg p-4">
                <p className="text-xs text-gray-500">Wants</p>
                <p className="text-lg font-bold text-amber-400 mt-1">{hasBudget ? formatCurrency(monthlyWants * 12) : '—'}/yr</p>
                <p className="text-xs text-gray-500 mt-1">{hasBudget ? `${formatCurrency(monthlyWants)}/mo` : 'Set up budget'}</p>
              </div>
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4">
                <p className="text-xs text-emerald-600">Investing</p>
                <p className="text-lg font-bold text-emerald-500 mt-1">{formatCurrency(annualInvesting)}/yr</p>
                <p className="text-xs text-emerald-600/70 mt-1">{formatCurrency(monthlyRecurring)}/mo recurring</p>
              </div>
              <div className={`rounded-lg p-4 ${annualRemaining >= 0 ? 'bg-blue-500/5 border border-blue-500/20' : 'bg-rose-500/5 border border-rose-500/20'}`}>
                <p className="text-xs text-gray-500">Remaining</p>
                <p className={`text-lg font-bold mt-1 ${annualRemaining >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>{formatCurrency(annualRemaining)}/yr</p>
                <p className="text-xs text-gray-500 mt-1">{formatCurrency(annualRemaining / 12)}/mo</p>
              </div>
            </div>
            {annualTakeHome > 0 && (
              <div className="mt-4">
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden flex">
                  {annualSpending > 0 && (
                    <div className="h-full bg-rose-400 transition-all" style={{ width: `${Math.min((annualSpending / annualTakeHome) * 100, 100)}%` }} title="Spending" />
                  )}
                  {annualInvesting > 0 && (
                    <div className="h-full bg-emerald-500 transition-all" style={{ width: `${Math.min((annualInvesting / annualTakeHome) * 100, 100)}%` }} title="Investing" />
                  )}
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400" />Spending {annualTakeHome > 0 ? `${((annualSpending / annualTakeHome) * 100).toFixed(0)}%` : ''}</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />Investing {annualTakeHome > 0 ? `${((annualInvesting / annualTakeHome) * 100).toFixed(0)}%` : ''}</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" />Remaining {annualTakeHome > 0 ? `${((Math.max(annualRemaining, 0) / annualTakeHome) * 100).toFixed(0)}%` : ''}</span>
                </div>
              </div>
            )}
          </Card>
        );
      })()}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {hasBudget && (
          <Card title="Budget Breakdown" action={<Link to="/budget" className="text-xs text-emerald-400 hover:underline">View All</Link>}>
            <BudgetBarChart data={budgetChartData} />
          </Card>
        )}
        {hasPortfolio && (
          <Card title="Portfolio Allocation" action={<Link to="/portfolio" className="text-xs text-emerald-400 hover:underline">View All</Link>}>
            <AllocationPieChart data={portfolioPieData} height={200} />
          </Card>
        )}
      </div>

      {/* Advisory Summary */}
      {hasProfile && (
        <Card title="Advisory Summary" action={<Link to="/advisor" className="text-xs text-emerald-400 hover:underline">Full Details</Link>}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Risk Profile</p>
              <p className="font-medium text-gray-200 mt-1">{advisory.risk.label}</p>
            </div>
            <div>
              <p className="text-gray-500">Budget Split</p>
              <p className="font-medium text-gray-200 mt-1">
                {advisory.risk.needs}/{advisory.risk.wants}/{advisory.risk.savings}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Monthly ETF</p>
              <p className="font-medium text-violet-400 mt-1">{formatCurrency(advisory.etfMonthly)}</p>
            </div>
            <div>
              <p className="text-gray-500">Monthly Crypto</p>
              <p className="font-medium text-amber-400 mt-1">{formatCurrency(advisory.cryptoMonthly)}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function QuickAction({ to, title, description, color }) {
  const borderColors = {
    emerald: 'border-emerald-500/20 hover:border-emerald-500/40',
    blue: 'border-blue-500/20 hover:border-blue-500/40',
    violet: 'border-violet-500/20 hover:border-violet-500/40',
  };

  return (
    <Link
      to={to}
      className={`block bg-gray-900 border rounded-xl p-5 transition-colors ${borderColors[color]}`}
    >
      <h3 className="text-sm font-semibold text-gray-200">{title}</h3>
      <p className="text-xs text-gray-500 mt-1">{description}</p>
    </Link>
  );
}
