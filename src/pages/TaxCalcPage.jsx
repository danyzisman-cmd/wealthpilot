import { useState, useMemo } from 'react';
import { computeNYCTakeHome, computeRampMatch } from '../utils/nycTaxCalc';
import { useProfile } from '../hooks/useProfile';
import Card from '../components/shared/Card';
import Input from '../components/shared/Input';
import MetricCard from '../components/shared/MetricCard';
import Button from '../components/shared/Button';
import { formatCurrency, formatPercentRaw } from '../utils/formatters';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const DEDUCTION_COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#8b5cf6', '#10b981', '#06b6d4'];

export default function TaxCalcPage() {
  const { profile, updateProfile } = useProfile();
  const [baseSalary, setBaseSalary] = useState(profile.baseSalary || 0);
  const [monthlyCommission, setMonthlyCommission] = useState(profile.monthlyCommission || 8000);
  const [commissionTaxRate, setCommissionTaxRate] = useState(profile.commissionTaxRate || 40);
  const [contribution401k, setContribution401k] = useState(profile.contribution401kPct || 5);
  const [hsaContribution, setHsaContribution] = useState(profile.hsaAnnual || 0);
  const [ficaExempt, setFicaExempt] = useState(profile.ficaExempt ?? true);

  const annualCommission = monthlyCommission * 12;
  const grossIncome = baseSalary + annualCommission;
  const annual401k = Math.min((grossIncome * contribution401k) / 100, 24500);
  const rampMatch = useMemo(() => computeRampMatch(grossIncome, contribution401k), [grossIncome, contribution401k]);

  const result = useMemo(
    () => computeNYCTakeHome({
      baseSalary,
      commission: annualCommission,
      commissionWithholdingRate: commissionTaxRate / 100,
      pre401k: annual401k,
      preHSA: hsaContribution,
      ficaExempt,
    }),
    [baseSalary, annualCommission, commissionTaxRate, annual401k, hsaContribution, ficaExempt]
  );

  const handleSaveToProfile = () => {
    updateProfile({
      baseSalary,
      commission: annualCommission,
      monthlyCommission,
      commissionTaxRate,
      annualSalary: grossIncome,
      takeHomePay: result?.annualTakeHome || 0,
      contribution401kPct: contribution401k,
      hsaAnnual: hsaContribution,
      employerMatch: rampMatch.matchPercent,
      employerMatchLimit: 5,
      ficaExempt,
    });
  };

  const pieData = result
    ? [
        { name: 'Take-Home Pay', value: result.annualTakeHome, color: '#10b981' },
        ...result.breakdown.map((b, i) => ({ name: b.label, value: b.amount, color: DEDUCTION_COLORS[i % DEDUCTION_COLORS.length] })),
      ]
    : [];

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">NYC Take-Home Calculator</h1>
        <p className="text-sm text-gray-500 mt-1">Calculate your take-home pay with base salary + sales commission in New York City</p>
      </div>

      {/* Inputs */}
      <Card title="Your Compensation" subtitle="Base salary + monthly commission (commissions taxed at supplemental rate)">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Input
            label="Base Salary (annual)"
            type="number"
            prefix="$"
            placeholder="85000"
            value={baseSalary || ''}
            onChange={(e) => setBaseSalary(parseFloat(e.target.value) || 0)}
          />
          <Input
            label="Avg Monthly Commission"
            type="number"
            prefix="$"
            placeholder="8000"
            value={monthlyCommission || ''}
            onChange={(e) => setMonthlyCommission(parseFloat(e.target.value) || 0)}
          />
          <Input
            label="Commission Tax Rate"
            type="number"
            suffix="%"
            placeholder="40"
            value={commissionTaxRate || ''}
            onChange={(e) => setCommissionTaxRate(parseFloat(e.target.value) || 0)}
          />
          <Input
            label="401k Contribution"
            type="number"
            suffix="%"
            placeholder="5"
            value={contribution401k || ''}
            onChange={(e) => setContribution401k(parseFloat(e.target.value) || 0)}
          />
          <Input
            label="Annual HSA"
            type="number"
            prefix="$"
            placeholder="0"
            value={hsaContribution || ''}
            onChange={(e) => setHsaContribution(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="mt-4 flex items-center gap-4 flex-wrap">
          <div className="text-sm text-gray-400">
            Total Gross: <span className="font-semibold text-gray-100">{formatCurrency(grossIncome)}</span>
            <span className="text-gray-500 ml-2">({formatCurrency(baseSalary)} base + {formatCurrency(annualCommission)} commission)</span>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={ficaExempt}
              onChange={(e) => setFicaExempt(e.target.checked)}
              className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-emerald-500 focus:ring-emerald-500/25"
            />
            <span className="text-sm text-gray-400">FICA Exempt (International/NRA)</span>
          </label>
          <Button size="sm" onClick={handleSaveToProfile}>
            Save to Profile
          </Button>
        </div>
      </Card>

      {/* Commission Reality Check */}
      {result && annualCommission > 0 && (
        <Card title="Commission Take-Home" subtitle={`${commissionTaxRate}% withheld on all commission income`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-850 rounded-lg p-4">
              <p className="text-xs text-gray-500">Monthly Commission (Gross)</p>
              <p className="text-lg font-bold text-gray-100 mt-1">{formatCurrency(monthlyCommission)}</p>
            </div>
            <div className="bg-rose-500/5 border border-rose-500/20 rounded-lg p-4">
              <p className="text-xs text-rose-500">Tax Withheld ({commissionTaxRate}%)</p>
              <p className="text-lg font-bold text-rose-500 mt-1">-{formatCurrency(monthlyCommission * commissionTaxRate / 100)}</p>
              <p className="text-xs text-rose-500/60 mt-1">{formatCurrency(result.commissionTaxWithheld)}/yr</p>
            </div>
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4">
              <p className="text-xs text-emerald-600">Commission Take-Home</p>
              <p className="text-lg font-bold text-emerald-600 mt-1">{formatCurrency(result.commissionNetMonthly)}/mo</p>
              <p className="text-xs text-emerald-600/60 mt-1">{formatCurrency(result.commissionNetAnnual)}/yr</p>
            </div>
            <div className="bg-gray-850 rounded-lg p-4">
              <p className="text-xs text-gray-500">Base Take-Home (est.)</p>
              <p className="text-lg font-bold text-gray-100 mt-1">{formatCurrency(result.baseNetMonthly)}/mo</p>
              <p className="text-xs text-gray-500 mt-1">{formatCurrency(result.baseNetAnnual)}/yr</p>
            </div>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 text-sm text-amber-600">
            Every <strong>{formatCurrency(monthlyCommission)}</strong> commission check → you take home <strong>{formatCurrency(monthlyCommission * (1 - commissionTaxRate / 100))}</strong> after {commissionTaxRate}% withholding.
            {commissionTaxRate >= 35 && ' You may get some back as a refund if your effective rate is lower than the withholding rate.'}
          </div>
        </Card>
      )}

      {/* Ramp 401k Match */}
      <Card title="Ramp 401k Match" subtitle="100% match on first 3% + 50% match on next 2%">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-gray-850 rounded-lg p-4">
            <p className="text-xs text-gray-500">Your Contribution ({contribution401k}%)</p>
            <p className="text-lg font-bold text-gray-100 mt-1">{formatCurrency(rampMatch.employeeContribution)}/yr</p>
            <p className="text-xs text-gray-500 mt-1">{formatCurrency(rampMatch.employeeContribution / 12)}/mo</p>
          </div>
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4">
            <p className="text-xs text-emerald-600">Ramp Matches ({formatPercentRaw(rampMatch.matchPercent)})</p>
            <p className="text-lg font-bold text-emerald-600 mt-1">{formatCurrency(rampMatch.matchAmount)}/yr</p>
            <p className="text-xs text-emerald-600/70 mt-1">Free money!</p>
          </div>
          <div className="bg-gray-850 rounded-lg p-4">
            <p className="text-xs text-gray-500">Total Going to 401k</p>
            <p className="text-lg font-bold text-gray-100 mt-1">{formatCurrency(rampMatch.totalAnnual)}/yr</p>
            <p className="text-xs text-gray-500 mt-1">{formatCurrency(rampMatch.totalAnnual / 12)}/mo</p>
          </div>
        </div>
        {contribution401k < 5 && (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 text-sm text-amber-600">
            You're leaving money on the table! Contribute at least <strong>5%</strong> to get the full Ramp match of {formatCurrency(rampMatch.maxMatchAmount)}/yr.
          </div>
        )}
        <div className="mt-3 text-xs text-gray-500">
          <span className="font-medium">How it works:</span> Ramp matches 100% of your first 3% ({formatCurrency(rampMatch.first3Match)}/yr), then 50% of your next 2% ({formatCurrency(rampMatch.next2Match)}/yr). Max match = 4% of salary.
        </div>
      </Card>

      {result && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              icon="$"
              label="Annual Take-Home"
              value={formatCurrency(result.annualTakeHome)}
              color="emerald"
            />
            <MetricCard
              icon="$"
              label="Monthly Take-Home"
              value={formatCurrency(result.monthlyTakeHome)}
              sub={`${formatCurrency(result.biweeklyTakeHome)} bi-weekly`}
              color="blue"
            />
            <MetricCard
              icon="%"
              label="Effective Tax Rate"
              value={formatPercentRaw((result.effectiveRate * 100).toFixed(1))}
              sub={`${formatPercentRaw((result.marginalFederal * 100).toFixed(0))} federal marginal`}
              color="rose"
            />
            <MetricCard
              icon="↓"
              label="Total Deductions"
              value={formatCurrency(result.totalDeductions)}
              sub={`${formatPercentRaw(((result.totalDeductions / result.grossIncome) * 100).toFixed(1))} of gross`}
              color="amber"
            />
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Tax Breakdown">
              <div className="space-y-3">
                {result.breakdown.map((item, i) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: DEDUCTION_COLORS[i % DEDUCTION_COLORS.length] }} />
                      <span className="text-sm text-gray-400">{item.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-100">{formatCurrency(item.amount)}</span>
                      <span className="text-xs text-gray-500 ml-2">({formatPercentRaw((item.pct * 100).toFixed(1))})</span>
                    </div>
                  </div>
                ))}
                <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300">Total Deductions</span>
                  <span className="text-sm font-bold text-gray-100">{formatCurrency(result.totalDeductions)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-emerald-600">Take-Home Pay</span>
                  <span className="text-sm font-bold text-emerald-600">{formatCurrency(result.annualTakeHome)}</span>
                </div>
              </div>
            </Card>

            <Card title="Where Your Money Goes">
              <div style={{ height: 280 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs shadow-xl">
                            <p className="text-gray-100 font-medium">{d.name}</p>
                            <p className="text-gray-400">{formatCurrency(d.value)} ({formatPercentRaw(((d.value / result.grossIncome) * 100).toFixed(1))})</p>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 mt-2">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-400">{item.name}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Compensation Split */}
          <Card title="Compensation Split" subtitle="How your base and commission are structured">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <div className="h-4 bg-gray-800 rounded-full overflow-hidden flex">
                  <div className="h-full bg-blue-500 transition-all" style={{ width: `${grossIncome > 0 ? (baseSalary / grossIncome) * 100 : 0}%` }} />
                  <div className="h-full bg-amber-500 transition-all" style={{ width: `${grossIncome > 0 ? (annualCommission / grossIncome) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-850 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-xs text-gray-500">Base Salary</span>
                </div>
                <p className="text-lg font-bold text-gray-100">{formatCurrency(baseSalary)}</p>
                <p className="text-xs text-gray-500">{formatPercentRaw(grossIncome > 0 ? ((baseSalary / grossIncome) * 100).toFixed(0) : 0)} of total</p>
              </div>
              <div className="bg-gray-850 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-xs text-gray-500">Commission ({formatCurrency(monthlyCommission)}/mo × 12)</span>
                </div>
                <p className="text-lg font-bold text-gray-100">{formatCurrency(annualCommission)}</p>
                <p className="text-xs text-gray-500">{formatPercentRaw(grossIncome > 0 ? ((annualCommission / grossIncome) * 100).toFixed(0) : 0)} of total · {commissionTaxRate}% taxed</p>
              </div>
            </div>
          </Card>
        </>
      )}

      {!result && (
        <div className="text-center py-16">
          <p className="text-gray-500">Enter your compensation above to see your NYC take-home breakdown.</p>
        </div>
      )}
    </div>
  );
}
