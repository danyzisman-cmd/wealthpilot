import { useMemo } from 'react';
import { useProfile } from '../hooks/useProfile';
import { computeAdvisory } from '../utils/advisorEngine';
import ProfileForm from '../components/advisor/ProfileForm';
import AllocationCard from '../components/advisor/AllocationCard';
import RetirementWaterfall from '../components/advisor/RetirementWaterfall';
import ETFRecommendations from '../components/advisor/ETFRecommendations';
import CryptoAllocationCard from '../components/advisor/CryptoAllocationCard';
import DebtStrategyCard from '../components/advisor/DebtStrategyCard';
import MetricCard from '../components/shared/MetricCard';
import { formatCurrency, formatPercent } from '../utils/formatters';

export default function AdvisorPage() {
  const { profile, updateProfile, addDebt, removeDebt } = useProfile();
  const advisory = useMemo(() => computeAdvisory(profile), [profile]);

  return (
    <div className="space-y-6 max-w-6xl">
      <ProfileForm
        profile={profile}
        onUpdate={updateProfile}
        onAddDebt={addDebt}
        onRemoveDebt={removeDebt}
      />

      {advisory && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              icon="$"
              label="Monthly Take-Home"
              value={formatCurrency(advisory.monthlyTakeHome)}
              color="emerald"
            />
            <MetricCard
              icon="↗"
              label="Monthly Savings"
              value={formatCurrency(advisory.budgetSplit.savings)}
              sub={`${advisory.risk.savings}% of take-home`}
              color="blue"
            />
            <MetricCard
              icon="◆"
              label="Monthly Investing"
              value={formatCurrency(advisory.investableMonthly)}
              sub="After retirement accounts"
              color="violet"
            />
            <MetricCard
              icon="₿"
              label="Monthly Crypto"
              value={formatCurrency(advisory.cryptoMonthly)}
              sub={formatPercent(advisory.cryptoPct, 0) + ' of investable'}
              color="amber"
            />
          </div>

          {/* Budget Split */}
          <AllocationCard advisory={advisory} />

          {/* Debt Strategy */}
          <DebtStrategyCard debtStrategy={advisory.debtStrategy} />

          {/* Retirement Waterfall */}
          <RetirementWaterfall waterfall={advisory.waterfall} />

          {/* Investment Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ETFRecommendations
              etfBreakdown={advisory.etfBreakdown}
              monthlyTotal={advisory.etfMonthly}
            />
            <CryptoAllocationCard
              cryptoBreakdown={advisory.cryptoBreakdown}
              monthlyTotal={advisory.cryptoMonthly}
              cryptoPct={advisory.cryptoPct}
            />
          </div>
        </>
      )}

      {!advisory && (
        <div className="text-center py-16">
          <p className="text-gray-500">Enter your salary above to see personalized recommendations.</p>
        </div>
      )}
    </div>
  );
}
