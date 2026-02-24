import { useLocalStorage } from './useLocalStorage';

export function useRSUs() {
  const [rsus, setRSUs] = useLocalStorage('wp_rsus', []);

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
