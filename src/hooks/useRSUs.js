import { useLocalStorage } from './useLocalStorage';

// Dany's Ramp RSU grants
const SEED_GRANTS = [
  {
    id: 'ramp-jun-2025',
    company: 'Ramp',
    ticker: 'RAMP',
    totalShares: 400,
    vestedShares: 0,
    grantPrice: 19.24,
    currentPrice: 90,
    grantDate: '2025-06-01',
    vestingMonths: null,
    cliffMonths: null,
    vestingSchedule: [],
    note: 'Initial grant — vesting not tracked here',
  },
  {
    id: 'ramp-dec-2025',
    company: 'Ramp',
    ticker: 'RAMP',
    totalShares: 438,
    vestedShares: 36, // Jan 2026 vested (36 × 1)
    grantPrice: 90,
    currentPrice: 90,
    grantDate: '2025-12-01',
    vestingMonths: 13,
    cliffMonths: 0,
    vestingSchedule: [
      { date: '2026-01-01', shares: 36, vested: true },
      { date: '2026-02-01', shares: 36, vested: false },
      { date: '2026-03-01', shares: 36, vested: false },
      { date: '2026-04-01', shares: 36, vested: false },
      { date: '2026-05-01', shares: 36, vested: false },
      { date: '2026-06-01', shares: 36, vested: false },
      { date: '2026-07-01', shares: 36, vested: false },
      { date: '2026-08-01', shares: 36, vested: false },
      { date: '2026-09-01', shares: 36, vested: false },
      { date: '2026-10-01', shares: 36, vested: false },
      { date: '2026-11-01', shares: 36, vested: false },
      { date: '2026-12-01', shares: 36, vested: false },
      { date: '2027-01-01', shares: 6, vested: false },
    ],
  },
];

export function useRSUs() {
  const [rsus, setRSUs] = useLocalStorage('wp_rsus', SEED_GRANTS);

  // Re-seed if data is stale (checks seed version)
  const [seedVersion, setSeedVersion] = useLocalStorage('wp_rsus_seed', 0);
  if (seedVersion < 2) {
    setRSUs(SEED_GRANTS);
    setSeedVersion(2);
  }

  const addGrant = (grant) => {
    setRSUs((prev) => [...prev, { ...grant, id: crypto.randomUUID() }]);
  };

  const updateGrant = (id, updates) => {
    setRSUs((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));
  };

  const removeGrant = (id) => {
    setRSUs((prev) => prev.filter((g) => g.id !== id));
  };

  // Compute summary
  const totalShares = rsus.reduce((s, g) => s + (g.totalShares || 0), 0);
  const vestedShares = rsus.reduce((s, g) => s + (g.vestedShares || 0), 0);
  const unvestedShares = totalShares - vestedShares;

  const totalCurrentValue = rsus.reduce(
    (s, g) => s + (g.totalShares || 0) * (g.currentPrice || 0),
    0
  );
  const vestedValue = rsus.reduce(
    (s, g) => s + (g.vestedShares || 0) * (g.currentPrice || 0),
    0
  );
  const unvestedValue = totalCurrentValue - vestedValue;
  const totalGrantValue = rsus.reduce(
    (s, g) => s + (g.totalShares || 0) * (g.grantPrice || 0),
    0
  );
  const totalGain = totalCurrentValue - totalGrantValue;

  // Upcoming vests (next 12 months)
  const now = new Date();
  const nextYear = new Date(now);
  nextYear.setFullYear(nextYear.getFullYear() + 1);

  const upcomingVests = rsus
    .flatMap((g) =>
      (g.vestingSchedule || [])
        .filter((v) => {
          const d = new Date(v.date);
          return d >= now && d <= nextYear && !v.vested;
        })
        .map((v) => ({
          ...v,
          company: g.company,
          ticker: g.ticker,
          currentPrice: g.currentPrice,
          value: v.shares * (g.currentPrice || 0),
        }))
    )
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return {
    rsus,
    addGrant,
    updateGrant,
    removeGrant,
    summary: {
      totalShares,
      vestedShares,
      unvestedShares,
      totalCurrentValue,
      vestedValue,
      unvestedValue,
      totalGrantValue,
      totalGain,
      upcomingVests,
    },
  };
}
