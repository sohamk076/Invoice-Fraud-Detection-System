import React from 'react';
import { RiskLevel } from '../../types';
import { ShieldCheck, AlertCircle, AlertTriangle, AlertOctagon } from 'lucide-react';

interface RiskBadgeProps {
  level: RiskLevel | string;
  score?: number;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  score,
  showIcon = true,
  size = 'md',
}) => {
  const normLevel = (level || 'LOW').toUpperCase();

  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';
  let icon = <ShieldCheck className="w-3.5 h-3.5" />;
  let label = 'Low Risk';

  if (normLevel === 'CRITICAL') {
    colorClasses = 'bg-red-950/70 text-red-400 border-red-800/60';
    icon = <AlertOctagon className="w-3.5 h-3.5 text-red-400" />;
    label = 'Critical Risk';
  } else if (normLevel === 'HIGH') {
    colorClasses = 'bg-orange-950/70 text-orange-400 border-orange-800/60';
    icon = <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />;
    label = 'High Risk';
  } else if (normLevel === 'MEDIUM') {
    colorClasses = 'bg-amber-950/70 text-amber-400 border-amber-800/60';
    icon = <AlertCircle className="w-3.5 h-3.5 text-amber-400" />;
    label = 'Medium Risk';
  } else if (normLevel === 'LOW') {
    colorClasses = 'bg-emerald-950/70 text-emerald-400 border-emerald-800/60';
    icon = <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />;
    label = 'Low Risk';
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs font-medium gap-1',
    md: 'px-2.5 py-1 text-xs font-semibold gap-1.5',
    lg: 'px-3 py-1.5 text-sm font-semibold gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-sm ${sizeClasses} ${colorClasses}`}
    >
      {showIcon && icon}
      <span>{label}</span>
      {score !== undefined && (
        <span className="font-mono opacity-80 pl-0.5">({score})</span>
      )}
    </span>
  );
};
