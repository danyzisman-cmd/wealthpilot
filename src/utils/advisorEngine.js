import {
  RISK_PROFILES,
  RETIREMENT_LIMITS,
  CRYPTO_ALLOCATION,
  ETF_SPLIT,
  CRYPTO_SPLIT,
  DEBT_THRESHOLDS,
} from '../constants/advisorDefaults';

export function computeAdvisory(profile) {
  if (!profile || !profile.annualSalary) return null;

  const risk = RISK_PROFILES[profile.riskTolerance] || RISK_PROFILES.aggressive;
  const monthlyGross = profile.annualSalary / 12;
  const monthlyTakeHome = profile.takeHomePay
    ? profile.takeHomePay / 12
    : monthlyGross * 0.72;

  // Budget split
  const budgetSplit = {
    needs: monthlyTakeHome * (risk.needs / 100),
    wants: monthlyTakeHome * (risk.wants / 100),
    savings: monthlyTakeHome * (risk.savings / 100),
  };

  // Debt strategy
  const debtStrategy = computeDebtStrategy(profile.debts || []);

  // Retirement waterfall
  const waterfall = computeRetirementWaterfall(
    budgetSplit.savings * 12,
    profile.employerMatch || 0,
    profile.employerMatchLimit || 0,
    profile.annualSalary,
    profile.hasHSA
  );

  // Investment allocation (after retirement)
  const investableMonthly = waterfall.remainingMonthly;
  const cryptoPct = CRYPTO_ALLOCATION[profile.riskTolerance] || 0.10;
  const cryptoMonthly = investableMonthly * cryptoPct;
  const etfMonthly = investableMonthly * (1 - cryptoPct);

  // ETF breakdown
  const etfBreakdown = ETF_SPLIT.map((etf) => ({
    ...etf,
    monthlyAmount: etfMonthly * etf.weight,
    annualAmount: etfMonthly * etf.weight * 12,
  }));

  // Crypto breakdown
  const cryptoBreakdown = CRYPTO_SPLIT.map((coin) => ({
    ...coin,
    monthlyAmount: cryptoMonthly * coin.weight,
    annualAmount: cryptoMonthly * coin.weight * 12,
  }));

  return {
    risk,
    monthlyGross,
    monthlyTakeHome,
    annualTakeHome: monthlyTakeHome * 12,
    budgetSplit,
    debtStrategy,
    waterfall,
    investableMonthly,
    cryptoPct,
    cryptoMonthly,
    etfMonthly,
    etfBreakdown,
    cryptoBreakdown,
  };
}

function computeRetirementWaterfall(
  annualSavings,
  employerMatchPct,
  employerMatchLimit,
  annualSalary,
  hasHSA
) {
  let remaining = annualSavings;
  const steps = [];

  // Step 1: Employer match (Ramp: 100% on first 3%, 50% on next 2%)
  // employerMatchPct is the computed effective match %, employerMatchLimit is the contribution % needed
  const optimalContribution = employerMatchLimit > 0 ? employerMatchLimit : 0;
  const contribution401kForMatch = optimalContribution > 0
    ? Math.min((annualSalary * optimalContribution) / 100, remaining)
    : 0;
  const matchAmount = employerMatchPct > 0
    ? (annualSalary * employerMatchPct) / 100
    : 0;
  if (matchAmount > 0) {
    steps.push({
      label: '401k (Ramp Match)',
      amount: contribution401kForMatch,
      freeMatch: matchAmount,
      description: `Contribute ${optimalContribution}% to get full Ramp match (100% on first 3% + 50% on next 2%)`,
    });
    remaining -= contribution401kForMatch;
  }

  // Step 2: Roth IRA
  const rothAmount = Math.min(RETIREMENT_LIMITS.rothIRA, Math.max(remaining, 0));
  if (rothAmount > 0) {
    steps.push({
      label: 'Roth IRA',
      amount: rothAmount,
      description: `Max out Roth IRA ($${RETIREMENT_LIMITS.rothIRA.toLocaleString()}/yr) — tax-free growth`,
    });
    remaining -= rothAmount;
  }

  // Step 3: HSA
  if (hasHSA) {
    const hsaAmount = Math.min(RETIREMENT_LIMITS.hsaIndividual, Math.max(remaining, 0));
    if (hsaAmount > 0) {
      steps.push({
        label: 'HSA',
        amount: hsaAmount,
        description: `Max HSA ($${RETIREMENT_LIMITS.hsaIndividual.toLocaleString()}/yr) — triple tax advantage`,
      });
      remaining -= hsaAmount;
    }
  }

  // Step 4: Max 401k
  const alreadyIn401k = contribution401kForMatch;
  const additional401k = Math.min(
    RETIREMENT_LIMITS.max401k - alreadyIn401k,
    Math.max(remaining, 0)
  );
  if (additional401k > 0) {
    steps.push({
      label: '401k (Max Out)',
      amount: additional401k,
      description: `Fill remaining 401k to $${RETIREMENT_LIMITS.max401k.toLocaleString()}/yr`,
    });
    remaining -= additional401k;
  }

  // Step 5: Taxable brokerage (remainder)
  const taxable = Math.max(remaining, 0);
  if (taxable > 0) {
    steps.push({
      label: 'Taxable Brokerage',
      amount: taxable,
      description: 'Invest remainder in taxable account (ETFs + Crypto)',
    });
  }

  return {
    steps,
    totalAllocated: annualSavings - Math.max(remaining, 0),
    remainingAnnual: Math.max(remaining, 0),
    remainingMonthly: Math.max(remaining, 0) / 12,
  };
}

function computeDebtStrategy(debts) {
  if (!debts || debts.length === 0) {
    return { hasDebt: false, strategy: 'none', items: [], totalMonthly: 0 };
  }

  const sorted = [...debts].sort((a, b) => b.interestRate - a.interestRate);
  const hasHighInterest = sorted.some(
    (d) => d.interestRate >= DEBT_THRESHOLDS.highInterest
  );

  const strategy = hasHighInterest ? 'avalanche' : 'standard';
  const items = sorted.map((d) => ({
    ...d,
    priority:
      d.interestRate >= DEBT_THRESHOLDS.highInterest
        ? 'high'
        : d.interestRate >= DEBT_THRESHOLDS.moderate
        ? 'moderate'
        : 'low',
    recommendation:
      d.interestRate >= DEBT_THRESHOLDS.highInterest
        ? 'Pay off aggressively before investing'
        : d.interestRate >= DEBT_THRESHOLDS.moderate
        ? 'Pay minimums, invest the rest'
        : 'Low interest — invest instead, pay minimums',
  }));

  const totalMonthly = debts.reduce((sum, d) => sum + (d.minimumPayment || 0), 0);

  return { hasDebt: true, strategy, items, totalMonthly };
}
