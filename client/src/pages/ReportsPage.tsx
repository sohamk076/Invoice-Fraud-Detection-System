import React, { useEffect, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Modal } from '../components/common/Modal';
import { reportService } from '../services/report.service';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { formatINR, formatDateIndian, formatDateTimeIndian } from '../utils/formatters';
import {
  FileText,
  Download,
  FileSpreadsheet,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Eye,
  History,
  ShieldAlert,
  Clock,
  ArrowRight,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const toast = useToast();
  const { hasRole } = useAuth();

  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  // Invoices Custom Filters
  const [invoiceRisk, setInvoiceRisk] = useState<string>('');
  const [invoiceStatus, setInvoiceStatus] = useState<string>('');

  // Report Preview Modal State
  const [previewData, setPreviewData] = useState<any>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  const [previewTargetType, setPreviewTargetType] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setIsLoading(true);
        const data = await reportService.getFraudSummary();
        setSummary(data);
      } catch (err) {
        toast.error('Failed to load report summary.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const handleOpenPreview = async (type: string, customParams?: any) => {
    try {
      setPreviewTargetType(type);
      setIsPreviewLoading(true);
      const data = await reportService.getReportPreview(type, customParams);
      setPreviewData(data);
    } catch {
      toast.error('Failed to load report preview.');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleDownload = async (type: string) => {
    try {
      setIsExporting(type);
      if (type === 'INVOICES') {
        await reportService.downloadInvoicesCSV({
          riskLevel: invoiceRisk || undefined,
          status: invoiceStatus || undefined,
        });
      } else if (type === 'FRAUD_RISK') {
        await reportService.downloadFraudRiskCSV();
      } else if (type === 'VENDOR_RISK') {
        await reportService.downloadVendorRiskCSV();
      } else if (type === 'AUDIT_LOGS') {
        await reportService.downloadAuditCSV();
      }
      toast.success('Report successfully downloaded in CSV format.');
      setPreviewData(null);
      setPreviewTargetType(null);
    } catch {
      toast.error('Export download failed.');
    } finally {
      setIsExporting(null);
    }
  };

  const isAuditorOrAdmin = hasRole(['ADMIN', 'AUDITOR']);

  if (isLoading || !summary) {
    return <LoadingSpinner fullHeight label="Compiling statutory compliance and audit ledgers..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statutory Audit & Forensic Report Center"
        subtitle="Generate formatted CSV audit exports, vendor risk matrices, and compliance ledgers"
        breadcrumbs={[{ label: 'Reports' }]}
      />

      {/* 4 Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Report 1: Full Invoices CSV Export */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 text-[11px] font-mono font-semibold rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                CSV Format
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                1. Indian GST Invoices Forensic Ledger
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Complete transaction ledger including Vendor GSTIN, PAN, Place of Supply, CGST, SGST, IGST breakdown, and Rule Violation Scores.
              </p>
            </div>

            <div className="pt-1 grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Risk Tier:</label>
                <select
                  value={invoiceRisk}
                  onChange={(e) => setInvoiceRisk(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                >
                  <option value="">All Risk Levels</option>
                  <option value="CRITICAL">Critical Only</option>
                  <option value="HIGH">High Only</option>
                  <option value="MEDIUM">Medium Only</option>
                  <option value="LOW">Low Only</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Invoice Status:</label>
                <select
                  value={invoiceStatus}
                  onChange={(e) => setInvoiceStatus(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                >
                  <option value="">All Statuses</option>
                  <option value="FLAGGED_FRAUD">Flagged Fraud</option>
                  <option value="SUSPICIOUS">Suspicious</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center gap-2">
            <button
              onClick={() => handleOpenPreview('INVOICES', { riskLevel: invoiceRisk, status: invoiceStatus })}
              className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => handleDownload('INVOICES')}
              disabled={isExporting === 'INVOICES'}
              className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting === 'INVOICES' ? 'Exporting...' : 'Export CSV'}</span>
            </button>
          </div>
        </div>

        {/* Report 2: High Risk Suspicious Transactions Report */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-2xl bg-red-600/10 border border-red-500/20 text-red-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 text-[11px] font-mono font-semibold rounded-full bg-red-950 text-red-300 border border-red-800">
                High Risk Exceptions
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                2. High-Risk & Fraud Exception Report
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Filtered audit schedule of all invoices in HIGH (50-74) and CRITICAL (75-100) risk tiers, including detailed rule violation breakdowns.
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Flagged Capital:</span>
                <span className="text-red-400 font-bold">{formatINR(summary.metrics.amountAtRiskINR)}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px] mt-1">
                <span>Critical / High Count:</span>
                <span>{summary.metrics.criticalRiskInvoices + summary.metrics.highRiskInvoices} invoices</span>
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center gap-2">
            <button
              onClick={() => handleOpenPreview('FRAUD_RISK')}
              className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-red-400" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => handleDownload('FRAUD_RISK')}
              disabled={isExporting === 'FRAUD_RISK'}
              className="flex-1 py-2.5 px-3 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting === 'FRAUD_RISK' ? 'Exporting...' : 'Export Exceptions'}</span>
            </button>
          </div>
        </div>

        {/* Report 3: Supplier & Vendor Risk Assessment Report */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-2xl bg-amber-600/10 border border-amber-500/20 text-amber-400">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 text-[11px] font-mono font-semibold rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                Supplier KYC & Risk
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                3. Supplier & Vendor Risk Assessment Matrix
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Master supplier compliance register including KYC verification status, registered GSTIN/PAN, lifetime billed volume, and fraud flag tallies.
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Flagged Suppliers:</span>
                <span className="text-amber-400 font-bold">{summary.flaggedVendors?.length || 0} flagged</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px] mt-1">
                <span>Total Master Suppliers:</span>
                <span>15 Vendors</span>
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center gap-2">
            <button
              onClick={() => handleOpenPreview('VENDOR_RISK')}
              className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => handleDownload('VENDOR_RISK')}
              disabled={isExporting === 'VENDOR_RISK'}
              className="flex-1 py-2.5 px-3 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting === 'VENDOR_RISK' ? 'Exporting...' : 'Export Vendor Matrix'}</span>
            </button>
          </div>
        </div>

        {/* Report 4: Immutable System Audit Activity Report */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-2xl bg-purple-600/10 border border-purple-500/20 text-purple-400">
                <History className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 text-[11px] font-mono font-semibold rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                Audit Trail
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                4. Immutable System Audit Activity Report
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Chronological compliance activity trail recording every user login, invoice status change, auditor review, and re-evaluation execution.
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Security Integrity:</span>
                <span className="text-emerald-400 font-bold">100% Immutable</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px] mt-1">
                <span>Access Permitted:</span>
                <span>ADMIN / AUDITOR</span>
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center gap-2">
            <button
              onClick={() => handleOpenPreview('AUDIT_LOGS')}
              disabled={!isAuditorOrAdmin}
              className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-purple-400" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => handleDownload('AUDIT_LOGS')}
              disabled={isExporting === 'AUDIT_LOGS' || !isAuditorOrAdmin}
              className="flex-1 py-2.5 px-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting === 'AUDIT_LOGS' ? 'Exporting...' : 'Export Audit Log'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Section 11: Report Preview Modal */}
      <Modal
        isOpen={Boolean(previewData || isPreviewLoading)}
        onClose={() => {
          setPreviewData(null);
          setPreviewTargetType(null);
        }}
        title="Statutory Report Preview & Pre-Export Validation"
        size="md"
      >
        {isPreviewLoading ? (
          <div className="py-8">
            <LoadingSpinner label="Compiling report preview metadata..." />
          </div>
        ) : previewData ? (
          <div className="space-y-4 text-xs font-mono">
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">
                {previewData.reportType}
              </span>
              <h4 className="text-base font-bold text-white font-sans">{previewData.reportName}</h4>
              <div className="text-slate-400 text-[11px]">
                Generated on: {formatDateTimeIndian(previewData.generatedTimestamp)} ({previewData.currency})
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px] font-sans">Total Records</span>
                <span className="text-lg font-bold text-white block mt-0.5">{previewData.recordCount} records</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px] font-sans">Total Value Exposure</span>
                <span className="text-lg font-bold text-emerald-400 block mt-0.5">{formatINR(previewData.totalAmountINR)}</span>
              </div>
            </div>

            {previewData.riskSummary && (previewData.riskSummary.high > 0 || previewData.riskSummary.critical > 0) && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] font-sans text-slate-400 block">Risk Tier Composition:</span>
                <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                  <div className="p-1.5 rounded bg-emerald-950 text-emerald-400">
                    Low: {previewData.riskSummary.low}
                  </div>
                  <div className="p-1.5 rounded bg-amber-950 text-amber-400">
                    Medium: {previewData.riskSummary.medium}
                  </div>
                  <div className="p-1.5 rounded bg-orange-950 text-orange-400">
                    High: {previewData.riskSummary.high}
                  </div>
                  <div className="p-1.5 rounded bg-red-950 text-red-400 font-bold">
                    Critical: {previewData.riskSummary.critical}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setPreviewData(null);
                  setPreviewTargetType(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold font-sans rounded-xl transition-colors"
              >
                Close Preview
              </button>
              {previewTargetType && (
                <button
                  type="button"
                  onClick={() => handleDownload(previewTargetType)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold font-sans rounded-xl shadow-md transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Full CSV</span>
                </button>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
