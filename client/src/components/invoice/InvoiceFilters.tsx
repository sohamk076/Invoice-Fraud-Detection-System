import React from 'react';
import { Search, Filter, RefreshCw, X } from 'lucide-react';
import { InvoiceFilterParams } from '../../services/invoice.service';

interface InvoiceFiltersProps {
  filters: InvoiceFilterParams;
  onFilterChange: (newFilters: Partial<InvoiceFilterParams>) => void;
  onReset: () => void;
  vendors?: Array<{ id: string; name: string }>;
}

export const InvoiceFilters: React.FC<InvoiceFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
  vendors = [],
}) => {
  const hasActiveFilters = Boolean(
    filters.search ||
      filters.status ||
      filters.riskLevel ||
      filters.vendorId ||
      filters.minAmount ||
      filters.maxAmount ||
      filters.startDate ||
      filters.endDate
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
      {/* Search and Main Filters Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Text Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
            placeholder="Search invoice # or GSTIN..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Risk Level Filter */}
        <div>
          <select
            value={filters.riskLevel || ''}
            onChange={(e) => onFilterChange({ riskLevel: e.target.value || undefined, page: 1 })}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="">All Risk Levels</option>
            <option value="CRITICAL">Critical Risk (75-100)</option>
            <option value="HIGH">High Risk (50-74)</option>
            <option value="MEDIUM">Medium Risk (25-49)</option>
            <option value="LOW">Low Risk (0-24)</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={filters.status || ''}
            onChange={(e) => onFilterChange({ status: e.target.value || undefined, page: 1 })}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="">All Statuses</option>
            <option value="VERIFIED">Verified</option>
            <option value="SUSPICIOUS">Suspicious</option>
            <option value="FLAGGED_FRAUD">Flagged Fraud</option>
            <option value="PENDING">Pending Review</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {/* Vendor Filter */}
        <div>
          <select
            value={filters.vendorId || ''}
            onChange={(e) => onFilterChange({ vendorId: e.target.value || undefined, page: 1 })}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="">All Indian Vendors</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Secondary Row: Amount and Date Range & Reset Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/60 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Min Amount */}
          <input
            type="number"
            value={filters.minAmount || ''}
            onChange={(e) =>
              onFilterChange({
                minAmount: e.target.value ? Number(e.target.value) : undefined,
                page: 1,
              })
            }
            placeholder="Min ₹ Amount"
            className="w-28 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />

          {/* Max Amount */}
          <input
            type="number"
            value={filters.maxAmount || ''}
            onChange={(e) =>
              onFilterChange({
                maxAmount: e.target.value ? Number(e.target.value) : undefined,
                page: 1,
              })
            }
            placeholder="Max ₹ Amount"
            className="w-28 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />

          {/* Start Date */}
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => onFilterChange({ startDate: e.target.value || undefined, page: 1 })}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          />

          {/* End Date */}
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => onFilterChange({ endDate: e.target.value || undefined, page: 1 })}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <X className="w-3.5 h-3.5" />
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );
};
