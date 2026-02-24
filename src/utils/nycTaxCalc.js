// 2024/2025 tax brackets and rates for NYC sales comp (base + commission)

const FEDERAL_BRACKETS = [
  { min: 0, max: 11600, rate: 0.10 },
  { min: 11600, max: 47150, rate: 0.12 },
  { min: 47150, max: 100525, rate: 0.22 },
  { min: 100525, max: 191950, rate: 0.24 },
  { min: 191950, max: 243725, rate: 0.32 },
  { min: 243725, max: 609350, rate: 0.35 },
  { min: 609350, max: Infinity, rate: 0.37 },
];

const NY_STATE_BRACKETS = [
  { min: 0, max: 8500, rate: 0.04 },
  { min: 8500, max: 11700, rate: 0.045 },
  { min: 11700, max: 13900, rate: 0.0525 },
  { min: 13900, max: 80650, rate: 0.0585 },
  { min: 80650, max: 215400, rate: 0.0625 },
  { min: 215400, max: 1077550, rate: 0.0685 },
  { min: 1077550, max: 5000000, rate: 0.0965 },
  { min: 5000000, max: 25000000, rate: 0.103 },
  { min: 25000000, max: Infinity, rate: 0.109 },
];

const NYC_LOCAL_BRACKETS = [
  { min: 0, max: 12000, rate: 0.03078 },
  { min: 12000, max: 25000, rate: 0.03762 },
  { min: 25000, max: 50000, rate: 0.03819 },
  { min: 50000, max: Infinity, rate: 0.03876 },
];

const FEDERAL_STANDARD_DEDUCTION = 14600;
const NY_STANDARD_DEDUCTION = 8000;
const SS_RATE = 0.062;
const SS_WAGE_CAP = 168600;
const MEDICARE_RATE = 0.0145;
const MEDICARE_ADDITIONAL_RATE = 0.009;
const MEDICARE_ADDITIONAL_THRESHOLD = 200000;

function computeBracketTax(taxableIncome, brackets) {
  let tax = 0;
  for (const bracket of brackets) {
    if (taxableIncome <= bracket.min) break;
    const taxableInBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
    tax += taxableInBracket * bracket.rate;
  }
  return tax;
}

export function computeNYCTakeHome({ baseSalary, commission, commissionWithholdingRate = 0.40, pre401k = 0, preHSA = 0 }) {
  const grossIncome = baseSalary + commission;
  if (grossIncome <= 0) return null;

  // Pre-tax deductions reduce federal and state taxable income
  const totalPreTax = pre401k + preHSA;

  // Federal (bracket-based on total income for true liability)
  const federalTaxable = Math.max(grossIncome - totalPreTax - FEDERAL_STANDARD_DEDUCTION, 0);
  const federalTax = computeBracketTax(federalTaxable, FEDERAL_BRACKETS);

  // NY State
  const nyTaxable = Math.max(grossIncome - totalPreTax - NY_STANDARD_DEDUCTION, 0);
  const nyStateTax = computeBracketTax(nyTaxable, NY_STATE_BRACKETS);

  // NYC Local
  const nycLocalTax = computeBracketTax(nyTaxable, NYC_LOCAL_BRACKETS);

  // FICA (based on gross — 401k does not reduce FICA wages)
  const ssWages = Math.min(grossIncome, SS_WAGE_CAP);
  const socialSecurity = ssWages * SS_RATE;
  const medicare = grossIncome * MEDICARE_RATE;
  const medicareAdditional = grossIncome > MEDICARE_ADDITIONAL_THRESHOLD
    ? (grossIncome - MEDICARE_ADDITIONAL_THRESHOLD) * MEDICARE_ADDITIONAL_RATE
    : 0;
  const totalMedicare = medicare + medicareAdditional;
  const totalFICA = socialSecurity + totalMedicare;

  const totalTax = federalTax + nyStateTax + nycLocalTax + totalFICA;
  const totalDeductions = totalTax + totalPreTax;
  const annualTakeHome = grossIncome - totalDeductions;
  const monthlyTakeHome = annualTakeHome / 12;
  const effectiveRate = grossIncome > 0 ? totalTax / grossIncome : 0;

  // Commission withholding breakdown (what you actually see on paychecks)
  const commissionTaxWithheld = commission * commissionWithholdingRate;
  const commissionNetAnnual = commission - commissionTaxWithheld;
  const commissionNetMonthly = commissionNetAnnual / 12;

  // Base salary effective tax (total tax minus commission withholding, applied to base)
  const baseTaxEstimate = totalTax - commissionTaxWithheld;
  const baseNetAnnual = baseSalary - Math.max(baseTaxEstimate, 0) - totalPreTax;
  const baseNetMonthly = baseNetAnnual / 12;

  return {
    grossIncome,
    baseSalary,
    commission,
    commissionWithholdingRate,
    pre401k,
    preHSA,
    federalTaxable,
    federalTax,
    nyTaxable,
    nyStateTax,
    nycLocalTax,
    socialSecurity,
    totalMedicare,
    totalFICA,
    totalTax,
    totalPreTax,
    totalDeductions,
    annualTakeHome,
    monthlyTakeHome,
    biweeklyTakeHome: annualTakeHome / 26,
    effectiveRate,
    marginalFederal: getMarginalRate(federalTaxable, FEDERAL_BRACKETS),
    marginalState: getMarginalRate(nyTaxable, NY_STATE_BRACKETS),
    // Commission-specific
    commissionTaxWithheld,
    commissionNetAnnual,
    commissionNetMonthly,
    commissionEffectiveRate: commissionWithholdingRate,
    baseNetAnnual,
    baseNetMonthly,
    breakdown: [
      { label: 'Federal Income Tax', amount: federalTax, pct: federalTax / grossIncome },
      { label: 'NY State Tax', amount: nyStateTax, pct: nyStateTax / grossIncome },
      { label: 'NYC Local Tax', amount: nycLocalTax, pct: nycLocalTax / grossIncome },
      { label: 'Social Security', amount: socialSecurity, pct: socialSecurity / grossIncome },
      { label: 'Medicare', amount: totalMedicare, pct: totalMedicare / grossIncome },
      { label: '401k Contribution', amount: pre401k, pct: pre401k / grossIncome },
      ...(preHSA > 0 ? [{ label: 'HSA Contribution', amount: preHSA, pct: preHSA / grossIncome }] : []),
    ],
  };
}

function getMarginalRate(taxableIncome, brackets) {
  for (let i = brackets.length - 1; i >= 0; i--) {
    if (taxableIncome > brackets[i].min) return brackets[i].rate;
  }
  return brackets[0].rate;
}

// Compute Ramp's 401k match: 100% on first 3%, 50% on next 2%
export function computeRampMatch(annualSalary, contributionPercent) {
  const first3 = Math.min(contributionPercent, 3);
  const next2 = Math.max(0, Math.min(contributionPercent - 3, 2));
  const matchPercent = first3 * 1.0 + next2 * 0.5;
  const matchAmount = (annualSalary * matchPercent) / 100;
  const employeeContribution = (annualSalary * Math.min(contributionPercent, 100)) / 100;

  return {
    matchPercent,
    matchAmount,
    employeeContribution,
    totalAnnual: employeeContribution + matchAmount,
    first3Match: (annualSalary * first3) / 100,
    next2Match: (annualSalary * next2 * 0.5) / 100,
    maxMatchPercent: 4, // 3% + 50% of 2% = 4%
    maxMatchAmount: (annualSalary * 4) / 100,
    optimalContribution: 5, // contribute 5% to get full match
  };
}
