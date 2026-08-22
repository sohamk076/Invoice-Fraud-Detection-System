import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { InvoiceFilters } from '../components/invoice/InvoiceFilters';
import { InvoiceTable } from '../components/invoice/InvoiceTable';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { invoiceService, InvoiceFilterParams } from '../services/invoice.service';
import { vendorService } from '../services/vendor.service';
import { reportService } from '../services/report.service';
import { useToast } from '../context/ToastContext';
import { Invoice, Vendor } from '../types';
import { Upload, Download, RefreshCw, PenTool } from 'lucide-react';

export const InvoicesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [pagination, setPagination] = useState({
    page: Number(searchParams.get('page')) || 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Parse filters from URL search params
  const currentFilters: InvoiceFilterParams = {
    page: Number(searchParams.get('page')) || 1,
    limit: 15,
    search: searchParams.get('search') || undefined,
    status: searchParams.get('status') || undefined,
    riskLevel: searchParams.get('riskLevel') || undefined,
    vendorId: searchParams.get('vendorId') || undefined,
    minAmount: searchParams.get('minAmount') ? Number(searchParams.get('minAmount')) : undefined,
    maxAmount: searchParams.get('maxAmount') ? Number(searchParams.get('maxAmount')) : undefined,
    startDate: searchParams.get('startDate') || undefined,
    endDate: searchParams.get('endDate') || undefined,
    sortBy: searchParams.get('sortBy') || 'invoiceDate',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
  };

  const fetchInvoices = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await invoiceService.getInvoices(currentFilters);
      setInvoices(res.data);
      setPagination(res.pagination);
    } catch (err: any) {
      toast.error('Failed to load invoices from server.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  useEffect(() => {
    const fetchVendorsList = async () => {
      try {
        const res = await vendorService.getVendors({ limit: 50 });
        setVendors(res.data);
      } catch {
        // Ignore background vendor fetch errors
      }
    };
    fetchVendorsList();
  }, []);

  const handleFilterChange = (newFilters: Partial<InvoiceFilterParams>) => {
    const updated = { ...currentFilters, ...newFilters };
    const params: Record<string, string> = {};

    Object.entries(updated).forEach(([key, val]) => {
      if (val !== undefined && val !== '') {
        params[key] = String(val);
      }
    });

    setSearchParams(params);
  };

  const handleResetFilters = () => {
    setSearchParams({});
  };

  const handleSortChange = (field: string) => {
    const isCurrentSort = currentFilters.sortBy === field;
    const nextOrder = isCurrentSort && currentFilters.sortOrder === 'asc' ? 'desc' : 'asc';
    handleFilterChange({ sortBy: field, sortOrder: nextOrder, page: 1 });
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      await reportService.downloadInvoicesCSV(currentFilters);
      toast.success('Invoices report downloaded in CSV format.');
    } catch (error) {
      toast.error('Failed to export CSV report.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoice Explorer & Fraud Audit Hub"
        subtitle="Search, filter, and inspect all Indian GST invoices with transparent rule-based risk scoring"
        breadcrumbs={[{ label: 'Invoices' }]}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={isExporting}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
            </button>

            <Link
              to="/invoices/create"
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
            >
              <PenTool className="w-3.5 h-3.5 text-blue-400" />
              <span>Manual Entry</span>
            </Link>

            <Link
              to="/invoices/upload"
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </Link>
          </div>
        }
      />

      {/* Filter Component */}
      <InvoiceFilters
        filters={currentFilters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        vendors={vendors}
      />

      {/* Invoice Data Table */}
      {isLoading ? (
        <LoadingSpinner fullHeight label="Filtering invoice records..." />
      ) : invoices.length > 0 ? (
        <InvoiceTable
          invoices={invoices}
          pagination={pagination}
          onPageChange={(page) => handleFilterChange({ page })}
          onSortChange={handleSortChange}
          sortBy={currentFilters.sortBy}
          sortOrder={currentFilters.sortOrder}
        />
      ) : (
        <EmptyState
          title="No Invoices Found"
          description="No invoices match the specified search or filter criteria. Try adjusting or resetting the filters."
          action={{
            label: 'Clear All Filters',
            onClick: handleResetFilters,
          }}
        />
      )}
    </div>
  );
};
