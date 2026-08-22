import React from 'react';
import { InvoiceStatus, AlertStatus, RuleStatus } from '../../types';

interface StatusBadgeProps {
  status: InvoiceStatus | AlertStatus | RuleStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const norm = (status || '').toUpperCase();

  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';
  let label = status;

  switch (norm) {
    // Invoice Statuses
    case 'VERIFIED':
      colorClasses = 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50';
      label = 'Verified';
      break;
    case 'SUSPICIOUS':
      colorClasses = 'bg-amber-950/60 text-amber-300 border-amber-800/50';
      label = 'Suspicious';
      break;
    case 'FLAGGED_FRAUD':
      colorClasses = 'bg-red-950/80 text-red-300 border-red-800/70 font-semibold';
      label = 'Flagged Fraud';
      break;
    case 'REJECTED':
      colorClasses = 'bg-slate-800/80 text-slate-400 border-slate-700';
      label = 'Rejected';
      break;
    case 'PENDING':
      colorClasses = 'bg-blue-950/60 text-blue-300 border-blue-800/50';
      label = 'Pending Review';
      break;

    // Alert Statuses
    case 'OPEN':
      colorClasses = 'bg-red-950/60 text-red-400 border-red-800/50';
      label = 'Open Alert';
      break;
    case 'IN_REVIEW':
      colorClasses = 'bg-blue-950/60 text-blue-400 border-blue-800/50';
      label = 'In Review';
      break;
    case 'RESOLVED':
      colorClasses = 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50';
      label = 'Resolved';
      break;
    case 'DISMISSED':
      colorClasses = 'bg-slate-800 text-slate-400 border-slate-700';
      label = 'Dismissed';
      break;

    // Rule Statuses
    case 'PASS':
      colorClasses = 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50';
      label = 'PASS';
      break;
    case 'WARNING':
      colorClasses = 'bg-amber-950/60 text-amber-400 border-amber-800/50';
      label = 'WARNING';
      break;
    case 'FAIL':
      colorClasses = 'bg-orange-950/60 text-orange-400 border-orange-800/50';
      label = 'FAIL';
      break;
    case 'CRITICAL':
      colorClasses = 'bg-red-950/80 text-red-400 border-red-800/70 font-bold';
      label = 'CRITICAL';
      break;
    case 'NOT_CHECKED':
      colorClasses = 'bg-slate-800/80 text-slate-400 border-slate-700';
      label = 'NOT CHECKED';
      break;

    default:
      label = status;
  }

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center font-medium rounded-full border shadow-sm ${sizeClass} ${colorClasses}`}>
      {label}
    </span>
  );
};
