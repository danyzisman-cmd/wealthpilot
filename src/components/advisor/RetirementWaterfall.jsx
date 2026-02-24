import Card from '../shared/Card';
import { formatCurrency } from '../../utils/formatters';

export default function RetirementWaterfall({ waterfall }) {
  if (!waterfall || !waterfall.steps.length) return null;

  return (
    <Card title="Retirement Savings Waterfall" subtitle="Priority order for tax-advantaged investing">
      <div className="relative">
        {waterfall.steps.map((step, i) => (
          <div key={step.label} className="flex gap-4 pb-6 last:pb-0">
            {/* Timeline */}
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-emerald-400/10 text-emerald-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {i + 1}
              </div>
              {i < waterfall.steps.length - 1 && (
                <div className="w-0.5 flex-1 bg-gray-800 mt-1" />
              )}
            </div>
            {/* Content */}
            <div className="flex-1 pb-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-200">{step.label}</h4>
                <span className="text-sm font-semibold text-emerald-400">
                  {formatCurrency(step.amount)}/yr
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{step.description}</p>
              {step.freeMatch && (
                <p className="text-xs text-amber-400 mt-1">
                  + {formatCurrency(step.freeMatch)}/yr free employer match!
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
