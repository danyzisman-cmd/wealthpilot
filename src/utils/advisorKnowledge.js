import { formatCurrency, formatPercent } from './formatters';
import { RETIREMENT_LIMITS } from '../constants/advisorDefaults';

export const TOPICS = [
  { id: 'getting-started', label: 'Getting Started', icon: '🚀', description: 'Where should I begin investing?' },
  { id: 'retirement', label: 'Retirement Strategy', icon: '🏦', description: 'How to maximize retirement accounts' },
  { id: 'crypto', label: 'Crypto Investing', icon: '₿', description: 'How much crypto should I hold?' },
  { id: 'debt', label: 'Debt vs. Investing', icon: '⚖️', description: 'Should I pay off debt first?' },
  { id: 'emergency-fund', label: 'Emergency Fund', icon: '🛡️', description: 'How much cash to keep on hand' },
  { id: 'etf-portfolio', label: 'ETF Portfolio', icon: '📊', description: 'Which ETFs and why' },
  { id: 'tax-strategy', label: 'Tax Strategy', icon: '📋', description: 'Tax-advantaged accounts explained' },
  { id: 'budget', label: 'Budget Optimization', icon: '💰', description: 'How to optimize your spending' },
];

export function generateAdvice(topicId, profile, advisory) {
  const hasProfile = advisory !== null;
  const name = profile?.name || 'there';

  switch (topicId) {
    case 'getting-started':
      return generateGettingStarted(name, profile, advisory, hasProfile);
    case 'retirement':
      return generateRetirement(name, profile, advisory, hasProfile);
    case 'crypto':
      return generateCrypto(name, profile, advisory, hasProfile);
    case 'debt':
      return generateDebt(name, profile, advisory, hasProfile);
    case 'emergency-fund':
      return generateEmergencyFund(name, profile, advisory, hasProfile);
    case 'etf-portfolio':
      return generateETF(name, profile, advisory, hasProfile);
    case 'tax-strategy':
      return generateTaxStrategy(name, profile, advisory, hasProfile);
    case 'budget':
      return generateBudget(name, profile, advisory, hasProfile);
    default:
      return generateCustomAnswer(topicId, name, profile, advisory, hasProfile);
  }
}

function generateGettingStarted(name, profile, advisory, hasProfile) {
  const sections = [
    {
      title: 'Your Starting Point',
      content: hasProfile
        ? `Hey ${name}! With a ${formatCurrency(profile.annualSalary)} salary and a ${profile.riskTolerance} risk profile, here's your roadmap:`
        : `Hey ${name}! First, head to the **Advisor** page and enter your salary and preferences so I can personalize this for you. In the meantime, here's the general playbook:`,
    },
    {
      title: 'Step 1: Emergency Fund',
      content: hasProfile
        ? `Build 3-6 months of expenses in a high-yield savings account. Based on your take-home of ${formatCurrency(advisory.monthlyTakeHome)}/mo, aim for **${formatCurrency(advisory.monthlyTakeHome * 3)}–${formatCurrency(advisory.monthlyTakeHome * 6)}** in liquid savings before investing aggressively.`
        : 'Build 3-6 months of expenses in a high-yield savings account (currently 4-5% APY). This is your safety net before investing.',
    },
    {
      title: 'Step 2: Employer Match (Free Money)',
      content: hasProfile && profile.employerMatch > 0
        ? `Your employer matches **${profile.employerMatch}%** — always contribute at least enough to get the full match. That's an instant ${profile.employerMatch}% return on your money!`
        : "If your employer offers a 401k match, **always** contribute enough to get the full match. It's a 50-100% instant return. Don't leave free money on the table.",
    },
    {
      title: 'Step 3: Tax-Advantaged Accounts',
      content: `Max out your **Roth IRA** ($${RETIREMENT_LIMITS.rothIRA.toLocaleString()}/yr) — you pay taxes now but withdrawals in retirement are tax-free. At your age, this is massive because of decades of compound growth.`,
    },
    {
      title: 'Step 4: Invest the Rest',
      content: hasProfile
        ? `With your ${profile.riskTolerance} profile, put ${formatCurrency(advisory.etfMonthly)}/mo into diversified ETFs and ${formatCurrency(advisory.cryptoMonthly)}/mo into crypto. Automate it so you never have to think about it.`
        : 'Open a brokerage account (Fidelity, Schwab, or Vanguard) and invest in broad market ETFs. Set up automatic monthly contributions.',
    },
    {
      title: 'Key Principle',
      content: '**Time in the market beats timing the market.** Starting at 23, every dollar you invest has ~40 years to compound. $500/mo at 10% average returns = **$2.6M by age 65**. Start now, even if the amount is small.',
    },
  ];

  return { title: 'Getting Started with Investing', sections };
}

function generateRetirement(name, profile, advisory, hasProfile) {
  const sections = [
    {
      title: 'The Retirement Waterfall',
      content: 'Prioritize your retirement savings in this exact order to maximize tax benefits and free money:',
    },
  ];

  if (hasProfile && advisory.waterfall.steps.length > 0) {
    advisory.waterfall.steps.forEach((step, i) => {
      let extra = '';
      if (step.freeMatch) extra = ` ✨ Plus ${formatCurrency(step.freeMatch)}/yr in free employer match!`;
      sections.push({
        title: `Priority ${i + 1}: ${step.label}`,
        content: `**${formatCurrency(step.amount)}/yr** — ${step.description}${extra}`,
      });
    });

    sections.push({
      title: 'Your Numbers',
      content: `Based on your ${formatCurrency(profile.annualSalary)} salary with ${advisory.risk.savings}% going to savings, you have **${formatCurrency(advisory.budgetSplit.savings * 12)}/yr** available for retirement + investing. After funding retirement accounts, **${formatCurrency(advisory.waterfall.remainingAnnual)}/yr** goes to taxable investing.`,
    });
  } else {
    sections.push(
      { title: 'Priority 1: Employer 401k Match', content: `Contribute enough to get the full match — it's free money.` },
      { title: 'Priority 2: Roth IRA', content: `Max out at $${RETIREMENT_LIMITS.rothIRA.toLocaleString()}/yr. Tax-free growth for decades. Use Fidelity, Schwab, or Vanguard.` },
      { title: 'Priority 3: HSA (if eligible)', content: `$${RETIREMENT_LIMITS.hsaIndividual.toLocaleString()}/yr with triple tax advantage. Best retirement account that exists.` },
      { title: 'Priority 4: Max 401k', content: `Fill up to $${RETIREMENT_LIMITS.max401k.toLocaleString()}/yr for more tax-deferred growth.` },
      { title: 'Priority 5: Taxable Brokerage', content: 'Everything left goes into a regular brokerage account with diversified ETFs.' },
    );
  }

  sections.push({
    title: 'Why Roth at Your Age?',
    content: "At 23, you're likely in a lower tax bracket than you'll be later in life. Paying taxes NOW on Roth contributions means decades of **tax-free** growth. A Roth IRA is one of the most powerful wealth-building tools available to young investors.",
  });

  return { title: 'Retirement Strategy', sections };
}

function generateCrypto(name, profile, advisory, hasProfile) {
  const sections = [
    {
      title: 'Crypto Allocation',
      content: hasProfile
        ? `With your **${profile.riskTolerance}** risk profile, I recommend **${formatPercent(advisory.cryptoPct, 0)}** of your investable money goes to crypto — that's **${formatCurrency(advisory.cryptoMonthly)}/mo**.`
        : 'For a mid-to-aggressive investor, **10-20%** of your investable portfolio in crypto is a solid range. Conservative: 5%, Moderate: 10%, Aggressive: 20%.',
    },
    {
      title: 'Recommended Split',
      content: '**Bitcoin (60%)** — Digital gold, best risk-adjusted returns in crypto, most institutional adoption.\n\n**Ethereum (25%)** — Smart contract platform, DeFi ecosystem, staking yield.\n\n**Altcoins (15%)** — Higher risk/reward. Only invest in projects you understand. SOL, LINK, AVAX are popular picks.',
    },
  ];

  if (hasProfile && advisory.cryptoBreakdown) {
    sections.push({
      title: 'Your Monthly Crypto Plan',
      content: advisory.cryptoBreakdown.map(c =>
        `**${c.name}**: ${formatCurrency(c.monthlyAmount)}/mo (${formatPercent(c.weight, 0)})`
      ).join('\n\n'),
    });
  }

  sections.push(
    {
      title: 'DCA Strategy',
      content: "**Dollar-cost average** — buy the same dollar amount every week/month regardless of price. This removes emotion and averages out volatility. Don't try to time the market.",
    },
    {
      title: 'Security Tips',
      content: '1. Use a **hardware wallet** (Ledger, Trezor) for holdings over $1,000\n2. Enable **2FA** on all exchanges (use an authenticator app, not SMS)\n3. Never share your seed phrase\n4. Only keep trading amounts on exchanges\n5. Consider **self-custody** for long-term holds',
    },
    {
      title: 'Tax Awareness',
      content: 'Crypto is taxed as **property**. Every sell, swap, or spend is a taxable event. Hold for >1 year for long-term capital gains (lower tax rate). Use a crypto tax tracker like Koinly or CoinTracker.',
    },
  );

  return { title: 'Crypto Investment Strategy', sections };
}

function generateDebt(name, profile, advisory, hasProfile) {
  const sections = [];

  if (hasProfile && advisory.debtStrategy.hasDebt) {
    sections.push({
      title: 'Your Debt Situation',
      content: `You have **${advisory.debtStrategy.items.length} debt(s)** with total minimum payments of **${formatCurrency(advisory.debtStrategy.totalMonthly)}/mo**. Here's the plan:`,
    });

    advisory.debtStrategy.items.forEach(debt => {
      const emoji = debt.priority === 'high' ? '🔴' : debt.priority === 'moderate' ? '🟡' : '🟢';
      sections.push({
        title: `${emoji} ${debt.name} (${debt.interestRate}% APR)`,
        content: `**Balance:** ${formatCurrency(debt.balance)} | **Priority:** ${debt.priority}\n\n**Recommendation:** ${debt.recommendation}`,
      });
    });

    if (advisory.debtStrategy.strategy === 'avalanche') {
      sections.push({
        title: 'Strategy: Avalanche Method',
        content: "You have high-interest debt (>7%). **Pay minimums on everything, then throw all extra money at the highest interest rate debt first.** Once it's gone, move to the next. This saves you the most in interest.",
      });
    }
  } else {
    sections.push({
      title: 'The Decision Framework',
      content: "Whether to pay off debt or invest depends on the **interest rate** of your debt vs. expected **investment returns** (~10% long-term for stocks).",
    });
  }

  sections.push(
    {
      title: 'High Interest (>7%): Pay First',
      content: 'Credit cards, personal loans, high-rate student loans — **pay these off aggressively**. No investment consistently beats 15-25% guaranteed return from eliminating credit card debt.',
    },
    {
      title: 'Medium Interest (4-7%): Split',
      content: 'Pay minimums and invest the rest. The math slightly favors investing, but paying off debt has psychological benefits and reduces risk.',
    },
    {
      title: 'Low Interest (<4%): Invest',
      content: "Mortgages, subsidized student loans — **pay minimums and invest the difference**. With 10% average market returns vs. 3-4% interest, you're better off investing. Inflation is also working in your favor on low-rate debt.",
    },
    {
      title: 'Always Do Both',
      content: "Even while aggressively paying debt, still contribute enough to get your **employer 401k match**. It's an instant 50-100% return that beats any debt interest rate.",
    },
  );

  return { title: 'Debt vs. Investing', sections };
}

function generateEmergencyFund(name, profile, advisory, hasProfile) {
  const months3 = hasProfile ? formatCurrency(advisory.monthlyTakeHome * 3) : '$X';
  const months6 = hasProfile ? formatCurrency(advisory.monthlyTakeHome * 6) : '$Y';

  const sections = [
    {
      title: 'How Much?',
      content: hasProfile
        ? `Based on your ${formatCurrency(advisory.monthlyTakeHome)}/mo take-home, aim for **${months3}–${months6}** (3-6 months of expenses).`
        : '**3-6 months** of essential expenses. Single income or unstable job? Lean toward 6 months. Dual income, stable job? 3 months may suffice.',
    },
    {
      title: 'Where to Keep It',
      content: 'Put it in a **high-yield savings account** (HYSA). Currently paying 4-5% APY. Good options: Marcus (Goldman Sachs), Ally, Wealthfront Cash. It needs to be **liquid** — accessible within 1-2 days.',
    },
    {
      title: 'Build It Fast',
      content: hasProfile
        ? `Try to save ${formatCurrency(advisory.monthlyTakeHome * 0.2)}/mo until you hit your target. You could have a full 3-month fund in about 15 months.`
        : 'Dedicate 20% of your take-home to the emergency fund until it is fully funded. Then redirect that money to investments.',
    },
    {
      title: 'What Counts as Emergency',
      content: '✅ Job loss, medical bills, car repair, essential home repair\n\n❌ Vacation, new phone, crypto dip you want to buy, holiday shopping',
    },
    {
      title: 'Once Funded, Move On',
      content: "Don't over-save in cash. Once you hit 3-6 months, redirect that savings rate to investments. Cash loses to inflation over time.",
    },
  ];

  return { title: 'Emergency Fund Guide', sections };
}

function generateETF(name, profile, advisory, hasProfile) {
  const sections = [
    {
      title: 'Recommended ETF Portfolio',
      content: 'A diversified, low-cost portfolio designed for long-term growth:',
    },
    {
      title: 'VTI — 40% (Total US Stock Market)',
      content: "Your core holding. Gives you exposure to **4,000+ US stocks** — large, mid, and small cap. Expense ratio: 0.03%. This alone is a solid investment.\n\nWhy: Broad diversification, incredibly low cost, covers the entire US market.",
    },
    {
      title: 'QQQ — 25% (Nasdaq-100)',
      content: "Heavy tech tilt with the 100 largest Nasdaq companies (Apple, Microsoft, NVIDIA, Amazon, Meta). Higher growth potential, higher volatility.\n\nWhy: Overweight in innovation and tech — where the growth is for the next decade.",
    },
    {
      title: 'VXUS — 20% (International Stocks)',
      content: "**7,000+ stocks** outside the US. International diversification is important — the US won't outperform forever.\n\nWhy: Reduces concentration risk, captures growth in emerging markets.",
    },
    {
      title: 'AVUV — 10% (US Small Cap Value)',
      content: "Small cap value stocks have historically outperformed the broad market by 2-3%/yr over long periods (the **size + value premium**).\n\nWhy: Academic research strongly supports this factor tilt for young investors.",
    },
    {
      title: 'BND — 5% (Total Bond Market)',
      content: "A small bond allocation provides stability and dry powder for rebalancing during crashes.\n\nWhy: Even aggressive investors benefit from a small bond cushion. You'll be glad it's there during a -30% stock crash.",
    },
  ];

  if (hasProfile && advisory.etfBreakdown) {
    sections.push({
      title: 'Your Monthly ETF Plan',
      content: advisory.etfBreakdown.map(e =>
        `**${e.ticker}**: ${formatCurrency(e.monthlyAmount)}/mo`
      ).join('\n\n') + `\n\n**Total**: ${formatCurrency(advisory.etfMonthly)}/mo`,
    });
  }

  sections.push({
    title: 'Where to Buy',
    content: '**Fidelity** — $0 commissions, fractional shares, great Roth IRA\n\n**Schwab** — Similar to Fidelity, excellent customer service\n\n**Vanguard** — The OG, owns VTI/VXUS/BND directly\n\nAll three are excellent. Pick one and stick with it.',
  });

  return { title: 'ETF Portfolio Deep Dive', sections };
}

function generateTaxStrategy(name, profile, advisory, hasProfile) {
  const sections = [
    {
      title: 'Tax-Advantaged Account Priority',
      content: 'Use accounts in this order to minimize lifetime taxes:',
    },
    {
      title: '1. 401k (Pre-tax)',
      content: `**Limit: $${RETIREMENT_LIMITS.max401k.toLocaleString()}/yr.** Contributions reduce your taxable income NOW. Great if you're in a high tax bracket. Money grows tax-deferred — you pay taxes on withdrawal in retirement.`,
    },
    {
      title: '2. Roth IRA (Post-tax)',
      content: `**Limit: $${RETIREMENT_LIMITS.rothIRA.toLocaleString()}/yr.** You pay taxes now, but ALL growth and withdrawals are **tax-free forever**. At 23, this is your best friend — decades of tax-free compounding.`,
    },
    {
      title: '3. HSA (Triple Tax Advantage)',
      content: hasProfile && profile.hasHSA
        ? `You have an HSA! **Limit: $${RETIREMENT_LIMITS.hsaIndividual.toLocaleString()}/yr.** Tax-deductible contributions + tax-free growth + tax-free withdrawals for medical expenses. The BEST tax-advantaged account. Pro tip: pay medical bills out of pocket and let HSA grow — withdraw tax-free decades later.`
        : `**Limit: $${RETIREMENT_LIMITS.hsaIndividual.toLocaleString()}/yr** (if you have a high-deductible health plan). Triple tax advantage: deductible going in, tax-free growth, tax-free withdrawals for medical. If eligible, this is arguably the best retirement account.`,
    },
    {
      title: '4. Tax-Loss Harvesting',
      content: "In your taxable brokerage, sell losing positions to offset gains. You can deduct up to **$3,000/yr** in net capital losses against ordinary income. Immediately reinvest in a similar (not identical) fund to maintain exposure.",
    },
    {
      title: 'Crypto Tax Tips',
      content: '• Hold >1 year for **long-term capital gains** (0%, 15%, or 20% rate vs. ordinary income)\n• Track every transaction — swaps are taxable\n• Use **specific identification** accounting to minimize gains\n• Gifting crypto under $18,000 is tax-free',
    },
  ];

  return { title: 'Tax Strategy', sections };
}

function generateBudget(name, profile, advisory, hasProfile) {
  const sections = [
    {
      title: 'The Budget Framework',
      content: hasProfile
        ? `With your **${advisory.risk.label}** profile, I recommend a **${advisory.risk.needs}/${advisory.risk.wants}/${advisory.risk.savings}** split (needs/wants/savings) of your ${formatCurrency(advisory.monthlyTakeHome)}/mo take-home.`
        : 'The classic framework: **50/30/20** (needs/wants/savings). Aggressive savers: **50/20/30**.',
    },
  ];

  if (hasProfile) {
    sections.push({
      title: 'Your Budget Targets',
      content: `**Needs** (${advisory.risk.needs}%): ${formatCurrency(advisory.budgetSplit.needs)}/mo — Rent, utilities, groceries, insurance, transportation\n\n**Wants** (${advisory.risk.wants}%): ${formatCurrency(advisory.budgetSplit.wants)}/mo — Dining, entertainment, subscriptions, shopping\n\n**Savings** (${advisory.risk.savings}%): ${formatCurrency(advisory.budgetSplit.savings)}/mo — Retirement, investing, emergency fund`,
    });
  }

  sections.push(
    {
      title: 'Biggest Wins',
      content: 'The top 3 expenses for most people are **housing, transportation, and food**. Optimizing these has 10x more impact than skipping lattes.\n\n• **Housing**: Keep rent under 30% of take-home\n• **Transportation**: Used cars + paid off = massive savings\n• **Food**: Meal prep 4-5 days, dine out 2-3 as a treat',
    },
    {
      title: 'Automate Everything',
      content: "On payday:\n1. Automatic transfer to savings/investment accounts\n2. Auto-pay all bills\n3. What's left = guilt-free spending money\n\n**Pay yourself first.** Automate savings so you never have to rely on willpower.",
    },
    {
      title: 'Track It',
      content: 'Use the **Budget** page to track every expense. Categorize into needs/wants/savings. Review monthly. The goal isn\'t to be cheap — it\'s to be **intentional** with your money.',
    },
  );

  return { title: 'Budget Optimization', sections };
}

function generateCustomAnswer(question, name, profile, advisory, hasProfile) {
  const q = question.toLowerCase();

  if (q.includes('real estate') || q.includes('house') || q.includes('rent')) {
    return {
      title: 'Renting vs. Buying',
      sections: [
        { title: 'At 23?', content: "For most 23-year-olds, **renting is the better financial move**. You maintain flexibility, avoid maintenance costs, and can invest the difference. The \"rent is throwing money away\" myth ignores opportunity cost." },
        { title: 'When to Buy', content: "Consider buying when: You'll stay 5+ years, you have 20% down payment, your total housing cost (PITI) is <28% of gross income, and you have a funded emergency fund AFTER the down payment." },
        { title: 'The Math', content: hasProfile ? `With a ${formatCurrency(profile.annualSalary)} salary, a safe mortgage payment would be ~${formatCurrency(profile.annualSalary * 0.28 / 12)}/mo (28% of gross). Factor in property tax, insurance, and maintenance (1-2% of home value/yr).` : 'Use the 28% rule: total housing costs should not exceed 28% of your gross monthly income.' },
      ],
    };
  }

  if (q.includes('side') || q.includes('income') || q.includes('earn more')) {
    return {
      title: 'Increasing Your Income',
      sections: [
        { title: 'Highest ROI', content: "**Invest in your career.** Negotiating a $5-10K raise has more impact than any side hustle. Update skills, switch jobs every 2-3 years in your 20s — job hoppers earn 30-50% more over 10 years." },
        { title: 'Side Income Ideas', content: "• **Freelancing** your day-job skills (highest $/hr)\n• **Teaching/tutoring** online\n• Building a **digital product** (courses, templates)\n• **Consulting** in your area of expertise" },
        { title: 'Invest the Extra', content: "Every extra dollar of income should go straight to investments. Don't let lifestyle creep absorb your raises." },
      ],
    };
  }

  return {
    title: 'Investment Advice',
    sections: [
      { title: 'General Guidance', content: `Great question! While I can't provide specific advice on "${question}", here are the core principles that apply to almost every financial decision:` },
      { title: 'Principle 1', content: '**Spend less than you earn.** The gap between income and spending is your most powerful wealth-building tool.' },
      { title: 'Principle 2', content: '**Invest early and consistently.** Time is your greatest asset at 23. Even small amounts compound into life-changing money over 40 years.' },
      { title: 'Principle 3', content: '**Keep it simple.** A few low-cost index funds + consistent contributions beats complex strategies 99% of the time.' },
      { title: 'Tip', content: 'Try selecting one of the specific topics above for more detailed, personalized advice!' },
    ],
  };
}
