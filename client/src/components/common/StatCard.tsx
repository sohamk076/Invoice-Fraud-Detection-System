import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'default' | 'danger' | 'warning' | 'success' | 'blue';
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = 'default',
  trend,
}) => {
  let iconContainerClass = 'bg-slate-800 border-slate-700 text-slate-300';
  let accentBorderClass = 'border-slate-800/80';

  if (variant === 'danger') {
    iconContainerClass = 'bg-red-500/10 border-red-500/30 text-red-400';
    accentBorderClass = 'border-red-900/30';
  } else if (variant === 'warning') {
    iconContainerClass = 'bg-amber-500/10 border-amber-500/30 text-amber-400';
    accentBorderClass = 'border-amber-900/30';
  } else if (variant === 'success') {
    iconContainerClass = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
    accentBorderClass = 'border-emerald-900/30';
  } else if (variant === 'blue') {
    iconContainerClass = 'bg-blue-500/10 border-blue-500/30 text-blue-400';
    accentBorderClass = 'border-blue-900/30';
  }

  return (
    <div className={`bg-slate-900/90 dark:bg-slate-900/90 border rounded-xl p-5 shadow-sm hover:shadow-md transition-all ${accentBorderClass}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-slate-100 tracking-tight">
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-400 pt-0.5">{subtitle}</p>
          )}
        </div>
        <div className={`p-2.5 rounded-xl border ${iconContainerClass}`}>
          {icon}
        </div>
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center text-xs text-slate-400">
          <span
            className={`font-semibold mr-1.5 ${
              trend.isPositive ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {trend.value}
          </span>
          <span>{trend.label || 'vs last month'}</span>
        </div>
      )}
    </div>
  );
};
