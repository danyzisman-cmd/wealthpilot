import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine, Cell } from 'recharts';

export default function PortfolioDriftChart({ data, height = 250 }) {
  if (!data || data.length === 0) return null;

  return (
    <div style={{ height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
          <XAxis
            dataKey="ticker"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs shadow-xl">
                  <p className="text-gray-100 font-medium">{d.ticker}</p>
                  <p className="text-gray-400">
                    Target: {(d.recommendedPct * 100).toFixed(1)}% | Actual: {(d.actualPct * 100).toFixed(1)}%
                  </p>
                  <p className={d.drift >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    Drift: {(d.drift * 100).toFixed(1)}%
                  </p>
                </div>
              );
            }}
          />
          <ReferenceLine y={0} stroke="#d1d5db" />
          <Bar dataKey="drift" radius={[4, 4, 0, 0]} barSize={32}>
            {data.map((entry) => (
              <Cell
                key={entry.ticker}
                fill={entry.drift >= 0 ? '#10b981' : '#f43f5e'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
