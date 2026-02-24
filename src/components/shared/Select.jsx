export default function Select({ label, options, className = '', ...props }) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm text-gray-400 mb-1.5">{label}</label>
      )}
      <select
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25 transition-colors appearance-none cursor-pointer"
        {...props}
      >
        {options.map((opt) => {
          const val = typeof opt === 'string' ? opt : opt.value;
          const label = typeof opt === 'string' ? opt : opt.label;
          return (
            <option key={val} value={val}>
              {label}
            </option>
          );
        })}
      </select>
    </div>
  );
}
