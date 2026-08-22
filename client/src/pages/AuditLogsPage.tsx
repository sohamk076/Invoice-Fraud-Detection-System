import React, { useEffect, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { auditService } from '../services/audit.service';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { AuditLog } from '../types';
import { formatDateTimeIndian } from '../utils/formatters';
import {
  History,
  Search,
  ShieldCheck,
  User,
  ChevronLeft,
  ChevronRight,
  Filter,
  FileText,
  AlertTriangle,
  Lock,
  Globe,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AuditLogsPage: React.FC = () => {
  const toast = useToast();
  const { user, hasRole } = useAuth();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchLogs = async (page = 1) => {
    try {
      setIsLoading(true);
      const res = await auditService.getAuditLogs({
        page,
        limit: 20,
        action: actionFilter || undefined,
        entityType: entityFilter || undefined,
      });
      setLogs(res.data);
      setPagination(res.pagination);
    } catch {
      toast.error('Failed to load audit logs.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(pagination.page);
  }, [actionFilter, entityFilter]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setPagination((prev) => ({ ...prev, page: newPage }));
    fetchLogs(newPage);
  };

  const isAuditorOrAdmin = hasRole(['ADMIN', 'AUDITOR']);

  if (!isAuditorOrAdmin) {
    return (
      <div className="p-8">
        <EmptyState
          title="Access Restricted"
          description="The immutable system audit log is restricted to authorized Compliance Auditors and Administrators only."
          icon={<Lock className="w-12 h-12 text-red-400" />}
        />
      </div>
    );
  }

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (log.details && log.details.toLowerCase().includes(q)) ||
      (log.user?.name && log.user.name.toLowerCase().includes(q)) ||
      (log.action && log.action.toLowerCase().includes(q)) ||
      (log.entityType && log.entityType.toLowerCase().includes(q)) ||
      (log.ipAddress && log.ipAddress.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Immutable System Audit Trail & Forensic Ledger"
        subtitle="Cryptographically tracked compliance log recording every user operation, fraud status transition, and rule evaluation"
        breadcrumbs={[{ label: 'Audit Logs' }]}
      />

      {/* Filter and Search Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Action filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Action Types</option>
            <option value="INVOICE_CREATED">Invoice Created</option>
            <option value="STATUS_UPDATED">Status Updated</option>
            <option value="ALERT_UPDATED">Alert Updated</option>
            <option value="FRAUD_EVALUATED">Fraud Evaluated</option>
            <option value="VENDOR_CREATED">Vendor Created</option>
            <option value="RE_EVALUATION">Re-evaluation</option>
            <option value="USER_LOGIN">User Login</option>
          </select>

          {/* Entity Type filter */}
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Entity Types</option>
            <option value="INVOICE">Invoice</option>
            <option value="ALERT">Fraud Alert</option>
            <option value="VENDOR">Vendor</option>
            <option value="PURCHASE_ORDER">Purchase Order</option>
            <option value="USER">User Session</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search audit trail..."
            className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      {isLoading ? (
        <LoadingSpinner fullHeight label="Retrieving chronological audit ledger..." />
      ) : filteredLogs.length > 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm space-y-3 p-1">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp (IST)</th>
                  <th className="py-3 px-4">Actor & Role</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Forensic Operation Details</th>
                  <th className="py-3 px-4">Client IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-850/40 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {formatDateTimeIndian(log.timestamp)}
                    </td>

                    {/* User */}
                    <td className="py-3 px-4 font-sans font-medium text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-slate-500" />
                        <span>{log.user ? log.user.name : 'System Worker'}</span>
                      </div>
                      {log.user?.role && (
                        <span className="text-[10px] font-mono text-slate-500 pl-4 block">
                          [{log.user.role}]
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 font-sans">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-950/60 text-blue-300 border border-blue-800/40">
                        {log.action}
                      </span>
                    </td>

                    {/* Entity */}
                    <td className="py-3 px-4 text-slate-300 text-[11px]">
                      {log.entityType}
                    </td>

                    {/* Operation Details */}
                    <td className="py-3 px-4 font-sans text-slate-200 max-w-md truncate">
                      {log.details}
                    </td>

                    {/* IP */}
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-sans">
            <div>
              Showing Page <strong className="text-white">{pagination.page}</strong> of <strong className="text-white">{pagination.totalPages}</strong> ({pagination.total} total log entries)
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 disabled:opacity-30 hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 disabled:opacity-30 hover:bg-slate-800 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          title="No Audit Records Found"
          description="No log events match the specified action or entity type criteria."
          icon={<History className="w-12 h-12 text-slate-600" />}
        />
      )}
    </div>
  );
};
