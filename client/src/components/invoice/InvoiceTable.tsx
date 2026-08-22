import React from 'react';
import { Invoice } from '../../types';
import { formatINR, formatDateIndian } from '../../utils/formatters';
import { RiskBadge } from '../common/RiskBadge';
import { StatusBadge } from '../common/StatusBadge';
import { Link } from 'react-router-dom';
import { ChevronRight, ArrowUpDown, ShieldAlert, FileText, ChevronLeft } from 'lucide-react';

interface InvoiceTableProps {
  invoices: Invoice[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onSortChange?: (field: string) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const InvoiceTable: React.FC<InvoiceTableProps> = ({
  invoices,
  pagination,
  onPageChange,
  onSortChange,
  sortBy,
  sortOrder,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm space-y-0">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
              <th className="py-3.5 px-4">Invoice Number</th>
              <th className="py-3.5 px-4">Vendor & GSTIN</th>
              <th className="py-3.5 px-4 cursor-pointer select-none hover:text-slate-200" onClick={() => onSortChange && onSortChange('invoiceDate')}>
                <div className="flex items-center gap-1">
                  <span>Date</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3.5 px-4 cursor-pointer select-none hover:text-slate-200" onClick={() => onSortChange && onSortChange('grandTotal')}>
                <div className="flex items-center gap-1">
                  <span>Grand Total (₹)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3.5 px-4 cursor-pointer select-none hover:text-slate-200" onClick={() => onSortChange && onSortChange('fraudScore')}>
                <div className="flex items-center gap-1">
                  <span>Fraud Score</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3.5 px-4">Risk Level</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {invoices.map((inv) => (
              <tr
                key={inv.id}
                className="hover:bg-slate-850/60 transition-colors group"
              >
                {/* Invoice Number */}
                <td className="py-3.5 px-4 font-mono font-bold text-slate-100">
                  <Link
                    to={`/invoices/${inv.id}`}
                    className="hover:text-blue-400 transition-colors flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400" />
                    <span>{inv.invoiceNumber}</span>
                  </Link>
                </td>

                {/* Vendor & GSTIN */}
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-slate-200 leading-snug">
                    {inv.vendor?.name || 'Unknown Vendor'}
                  </div>
                  <div className="font-mono text-[11px] text-slate-400">
                    {inv.vendorGstin}
                  </div>
                </td>

                {/* Date */}
                <td className="py-3.5 px-4 text-slate-300 font-mono">
                  {formatDateIndian(inv.invoiceDate)}
                </td>

                {/* Grand Total */}
                <td className="py-3.5 px-4 font-mono font-bold text-slate-100">
                  {formatINR(inv.grandTotal)}
                </td>

                {/* Fraud Score */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-slate-200">
                      {inv.fraudScore}
                    </span>
                    <span className="text-[10px] text-slate-500">/ 100</span>
                  </div>
                </td>

                {/* Risk Level Badge */}
                <td className="py-3.5 px-4">
                  <RiskBadge level={inv.riskLevel} size="sm" />
                </td>

                {/* Status Badge */}
                <td className="py-3.5 px-4">
                  <StatusBadge status={inv.status} size="sm" />
                </td>

                {/* Action Link */}
                <td className="py-3.5 px-4 text-right">
                  <Link
                    to={`/invoices/${inv.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-950/40 hover:bg-blue-900/50 border border-blue-800/40 px-2.5 py-1 rounded-lg transition-all"
                  >
                    <span>Inspect</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div>
          Showing{' '}
          <span className="font-semibold text-slate-200">
            {invoices.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}
          </span>{' '}
          to{' '}
          <span className="font-semibold text-slate-200">
            {Math.min(pagination.page * pagination.limit, pagination.total)}
          </span>{' '}
          of <span className="font-semibold text-slate-200">{pagination.total}</span> invoices
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-3 py-1 font-mono text-slate-300 font-semibold bg-slate-900 border border-slate-800 rounded-lg">
            Page {pagination.page} of {Math.max(1, pagination.totalPages)}
          </span>

          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
