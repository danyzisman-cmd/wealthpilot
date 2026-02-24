import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ALLOCATION_COLORS } from '../../constants/theme';
import { formatCurrency, formatPercentRaw } from '../../utils/formatters';

export default function AllocationPieChart({ data, title, height = 250 }) {
  if (!data || data.length === 0) return null;

  return (
    <div>
      {title && <h4 className="text-sm font-medium text-gray-400 mb-3">{title}</h4>}
      <div className="flex items-center gap-6">
        <div style={{ width: height, height }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={height * 0.28}
                outerRadius={height * 0.42}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={ALLOCATION_COLORS[i % ALLOCATION_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs shadow-xl">
                      <p className="text-gray-100 font-medium">{d.name}</p>
                      <p className="text-gray-400">
                        {formatPercentRaw(d.percent)} — {formatCurrency(d.value)}
                      </p>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2">
          {data.map((item, i) => (
            <div key={item.name} className="flex items-center gap-2 text-sm">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: ALLOCATION_COLORS[i % ALLOCATION_COLORS.length] }}
              />
              <span className="text-gray-400 flex-1 truncate">{item.name}</span>
              <span className="text-gray-200 font-medium">{formatPercentRaw(item.percent)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
