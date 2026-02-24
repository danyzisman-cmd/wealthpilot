export const RISK_PROFILES = {
  conservative: { needs: 50, wants: 30, savings: 20, label: 'Conservative' },
  moderate: { needs: 50, wants: 25, savings: 25, label: 'Moderate' },
  aggressive: { needs: 50, wants: 20, savings: 30, label: 'Aggressive' },
};

export const RETIREMENT_LIMITS = {
  rothIRA: 7500,
  max401k: 24500,
  hsaIndividual: 4300,
};

export const CRYPTO_ALLOCATION = {
  conservative: 0.05,
  moderate: 0.10,
  aggressive: 0.20,
};

export const ETF_SPLIT = [
  { ticker: 'VTI', name: 'Vanguard Total Stock Market', weight: 0.40 },
  { ticker: 'QQQ', name: 'Invesco QQQ Trust (Nasdaq-100)', weight: 0.25 },
  { ticker: 'VXUS', name: 'Vanguard Total International', weight: 0.20 },
  { ticker: 'AVUV', name: 'Avantis US Small Cap Value', weight: 0.10 },
  { ticker: 'BND', name: 'Vanguard Total Bond Market', weight: 0.05 },
];

export const CRYPTO_SPLIT = [
  { ticker: 'BTC', name: 'Bitcoin', weight: 0.60 },
  { ticker: 'ETH', name: 'Ethereum', weight: 0.25 },
  { ticker: 'ALT', name: 'Altcoins', weight: 0.15 },
];

export const DEBT_THRESHOLDS = {
  highInterest: 7,
  moderate: 4,
};

export const DEFAULT_PROFILE = {
  name: '',
  age: 23,
  annualSalary: 0,
  takeHomePay: 0,
  baseSalary: 0,
  commission: 0,
  riskTolerance: 'aggressive',
  employerMatch: 4,
  employerMatchLimit: 5,
  contribution401kPct: 5,
  hsaAnnual: 0,
  hasHSA: false,
  debts: [],
};

export const DEBT_TYPES = [
  'Student Loan',
  'Credit Card',
  'Car Loan',
  'Personal Loan',
  'Mortgage',
  'Other',
];
