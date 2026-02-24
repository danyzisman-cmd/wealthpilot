export default function MetricCard({ label, value, sub, color = 'emerald', icon }) {
  const colorMap = {
    emerald: 'text-emerald-400 bg-emerald-400/10',
    rose: 'text-rose-400 bg-rose-400/10',
    violet: 'text-violet-400 bg-violet-400/10',
    amber: 'text-amber-400 bg-amber-400/10',
    blue: 'text-blue-400 bg-blue-400/10',
  };
  const colors = colorMap[color] || colorMap.emerald;
  const [textColor, bgColor] = colors.split(' ');

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-start gap-4">
      {icon && (
        <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center flex-shrink-0`}>
          <span className={`text-lg ${textColor}`}>{icon}</span>
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm text-gray-500 truncate">{label}</p>
        <p className={`text-2xl font-bold mt-1 ${textColor}`}>{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
      </div>
    </div>
  );
}
