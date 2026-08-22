import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { FraudScoreGauge } from '../components/fraud/FraudScoreGauge';
import { FraudAlertBanner } from '../components/fraud/FraudAlertBanner';
import { RuleResultsList } from '../components/fraud/RuleResultsList';
import { TaxBreakdownCard } from '../components/fraud/TaxBreakdownCard';
import { POMatchCard } from '../components/fraud/POMatchCard';
import { VendorRiskCard } from '../components/fraud/VendorRiskCard';
import { LineItemsTable } from '../components/invoice/LineItemsTable';
import { StatusBadge } from '../components/common/StatusBadge';
import { RiskBadge } from '../components/common/RiskBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Modal } from '../components/common/Modal';
import { invoiceService } from '../services/invoice.service';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Invoice, InvoiceStatus } from '../types';
import { formatINR, formatDateIndian, formatDateTimeIndian } from '../utils/formatters';
import {
  FileText,
  Building2,
  Calendar,
  Layers,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock,
  ShieldCheck,
  Download,
  FileCheck,
  User,
  HelpCircle,
  ArrowLeft,
  Coins,
  History,
  AlertOctagon,
} from 'lucide-react';

export const InvoiceDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole, user } = useAuth();
  const toast = useToast();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isReEvaluating, setIsReEvaluating] = useState<boolean>(false);

  // Status Action Modal State
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
  const [targetStatus, setTargetStatus] = useState<InvoiceStatus | string>('VERIFIED');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  // Active Forensic View Tabs
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'RULES' | 'GST' | 'PO' | 'ITEMS' | 'AUDIT'>('OVERVIEW');

  const fetchInvoice = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const data = await invoiceService.getInvoiceById(id);
      setInvoice(data);
    } catch (err: any) {
      toast.error('Failed to load invoice details.');
    } finally {
      setIsLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const handleOpenStatusModal = (status: InvoiceStatus | string) => {
    setTargetStatus(status);
    setReviewNotes('');
    setIsStatusModalOpen(true);
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      setIsUpdatingStatus(true);
      const res = await invoiceService.updateStatus(id, targetStatus, reviewNotes);
      setInvoice(res.data);
      setIsStatusModalOpen(false);
      toast.success(`Invoice status updated to "${targetStatus}".`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update invoice status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleReEvaluate = async () => {
    if (!id) return;
    try {
      setIsReEvaluating(true);
      const res = await invoiceService.reEvaluate(id);
      setInvoice(res.data);
      toast.success('Invoice re-evaluated against latest 20 deterministic rules.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Re-evaluation failed.');
    } finally {
      setIsReEvaluating(false);
    }
  };

  if (isLoading || !invoice) {
    return <LoadingSpinner fullHeight label="Loading forensic invoice intelligence..." />;
  }

  const detection = invoice.detection;
  const isAuditorOrAdmin = hasRole(['ADMIN', 'AUDITOR']);

  return (
    <div className="space-y-6">
      {/* Top Page Header with Auditor Actions */}
      <PageHeader
        title={`Invoice ${invoice.invoiceNumber}`}
        subtitle={`Submitted on ${formatDateIndian(invoice.invoiceDate)} • Vendor: ${invoice.vendor?.name}`}
        breadcrumbs={[
          { label: 'Invoices', path: '/invoices' },
          { label: invoice.invoiceNumber },
        ]}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleReEvaluate}
              disabled={isReEvaluating}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
              title="Re-run fraud engine across all 20 rules"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isReEvaluating ? 'animate-spin' : ''}`} />
              <span>{isReEvaluating ? 'Re-scoring...' : 'Re-Evaluate'}</span>
            </button>

            {isAuditorOrAdmin && (
              <>
                <button
                  onClick={() => handleOpenStatusModal('VERIFIED')}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-md transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Approve & Verify</span>
                </button>

                <button
                  onClick={() => handleOpenStatusModal('SUSPICIOUS')}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl shadow-md transition-colors flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Send for Review</span>
                </button>

                <button
                  onClick={() => handleOpenStatusModal('FLAGGED_FRAUD')}
                  className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl shadow-md transition-colors flex items-center gap-1.5"
                >
                  <AlertOctagon className="w-3.5 h-3.5" />
                  <span>Mark as Fraud</span>
                </button>

                <button
                  onClick={() => handleOpenStatusModal('REJECTED')}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reject</span>
                </button>
              </>
            )}
          </div>
        }
      />

      {/* Active Fraud Alert Connection Banner (Section 8) */}
      {(invoice.alerts && invoice.alerts.length > 0) && (
        <FraudAlertBanner
          alerts={invoice.alerts}
          invoiceId={invoice.id}
          onAlertUpdated={fetchInvoice}
        />
      )}

      {/* Prominent Fraud Score Gauge (Section C) */}
      <FraudScoreGauge
        score={invoice.fraudScore}
        riskLevel={invoice.riskLevel}
        summaryExplanation={detection?.summaryExplanation}
        passedCount={detection?.passedRulesCount}
        warningCount={detection?.warningRulesCount}
        failedCount={detection?.failedRulesCount}
        criticalCount={detection?.criticalRulesCount}
        totalRulesCount={detection?.ruleResults?.length || 20}
        riskContribution={invoice.fraudScore}
      />

      {/* Section A: Statutory Header & Section B: Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice Statutory Details Card */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              Statutory GST Invoice Header
            </h3>
            <div className="flex items-center gap-2">
              <StatusBadge status={invoice.status} size="md" />
              <RiskBadge level={invoice.riskLevel} score={invoice.fraudScore} size="sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">Invoice Number:</span>
              <span className="font-mono font-bold text-slate-100 text-sm">{invoice.invoiceNumber}</span>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Invoice Date:</span>
              <span className="font-semibold text-slate-200">{formatDateIndian(invoice.invoiceDate)}</span>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Payment Due Date:</span>
              <span className="font-semibold text-slate-200">
                {invoice.dueDate ? formatDateIndian(invoice.dueDate) : 'Immediate / N/A'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Vendor Name:</span>
              <span className="font-bold text-blue-400">{invoice.vendor?.name || 'Unknown Vendor'}</span>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Vendor GSTIN:</span>
              <span className="font-mono font-bold text-slate-100">{invoice.vendorGstin}</span>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Customer GSTIN:</span>
              <span className="font-mono text-slate-300">{invoice.customerGstin}</span>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Place of Supply (POS):</span>
              <span className="font-semibold text-slate-200">
                {invoice.placeOfSupply} (State Code: {invoice.placeOfSupplyStateCode})
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Supply Classification:</span>
              <span className="font-semibold text-purple-400">
                {invoice.isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Linked Purchase Order:</span>
              <span className="font-mono font-semibold text-slate-200">
                {invoice.purchaseOrder ? `#${invoice.purchaseOrder.poNumber}` : 'Direct (No PO Linked)'}
              </span>
            </div>
          </div>

          {invoice.fileName && (
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-300 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-400" />
                Original Document: <strong>{invoice.fileName}</strong>
              </span>
              {invoice.fileUrl && (
                <a
                  href={`http://localhost:5000${invoice.fileUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Document</span>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Section B: Financial Breakdown Summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-3.5 flex flex-col justify-between">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Coins className="w-4 h-4 text-emerald-400" />
              Financial Breakdown
            </h3>
            <span className="text-xs font-mono text-slate-400">₹ INR</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Taxable Value:</span>
              <span className="font-mono font-bold text-slate-100">{formatINR(invoice.taxableAmount)}</span>
            </div>

            {!invoice.isInterState ? (
              <>
                <div className="flex justify-between text-slate-400">
                  <span>CGST (Central):</span>
                  <span className="font-mono text-slate-200">{formatINR(invoice.cgstAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>SGST (State):</span>
                  <span className="font-mono text-slate-200">{formatINR(invoice.sgstAmount)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-slate-400">
                <span>IGST (Integrated):</span>
                <span className="font-mono text-slate-200">{formatINR(invoice.igstAmount)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
              <span>Total Tax Charged:</span>
              <span className="font-mono font-bold text-blue-400">{formatINR(invoice.totalTaxAmount)}</span>
            </div>
          </div>

          <div className="p-4 bg-blue-950/30 border border-blue-900/40 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs text-blue-300 font-bold block uppercase tracking-wider">Grand Total (₹)</span>
              <span className="text-[11px] text-slate-400">Net Payable Amount</span>
            </div>
            <span className="text-xl font-extrabold font-mono text-blue-400">
              {formatINR(invoice.grandTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Section D: Vendor Risk Intelligence Context */}
      <VendorRiskCard vendor={invoice.vendor} vendorGstin={invoice.vendorGstin} />

      {/* Forensic Intelligence Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-1 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'OVERVIEW'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Full Forensic Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('RULES')}
          className={`px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'RULES'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>20-Rule Audit Matrix ({detection?.ruleResults?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('GST')}
          className={`px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'GST'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Coins className="w-3.5 h-3.5" />
          <span>GST Tax Math Inspector</span>
        </button>

        <button
          onClick={() => setActiveTab('PO')}
          className={`px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'PO'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>3-Way PO Matching</span>
        </button>

        <button
          onClick={() => setActiveTab('ITEMS')}
          className={`px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'ITEMS'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Line Items ({invoice.items?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'AUDIT'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Audit Timeline</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Section E: GST Verification Card */}
          <TaxBreakdownCard invoice={invoice} />

          {/* Section F: PO 3-Way Match Card */}
          <POMatchCard
            po={invoice.purchaseOrder}
            invoiceAmount={invoice.grandTotal}
            invoiceVendorId={invoice.vendorId}
            invoiceItems={invoice.items}
          />

          {/* Section G: Line Items Schedule */}
          <LineItemsTable items={invoice.items || []} isInterState={invoice.isInterState} />

          {/* Section H: Complete 20-Rule Breakdown */}
          {detection?.ruleResults && detection.ruleResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Itemized 20-Rule Forensic Analysis Matrix
              </h3>
              <RuleResultsList rules={detection.ruleResults} />
            </div>
          )}
        </div>
      )}

      {activeTab === 'RULES' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Complete Deterministic 20-Rule Audit Matrix
          </h3>
          <RuleResultsList rules={detection?.ruleResults || []} />
        </div>
      )}

      {activeTab === 'GST' && (
        <div className="space-y-4">
          <TaxBreakdownCard invoice={invoice} />
        </div>
      )}

      {activeTab === 'PO' && (
        <div className="space-y-4">
          <POMatchCard
            po={invoice.purchaseOrder}
            invoiceAmount={invoice.grandTotal}
            invoiceVendorId={invoice.vendorId}
            invoiceItems={invoice.items}
          />
        </div>
      )}

      {activeTab === 'ITEMS' && (
        <div className="space-y-4">
          <LineItemsTable items={invoice.items || []} isInterState={invoice.isInterState} />
        </div>
      )}

      {activeTab === 'AUDIT' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-blue-400" />
              Invoice Lifecycle & Auditor Activity Trail
            </h4>
            <span className="text-xs font-mono text-slate-400">Immutable Audit Record</span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Direct Audit Log Trail from Database */}
            {invoice.auditLogs && invoice.auditLogs.length > 0 ? (
              invoice.auditLogs.map((log, idx) => (
                <div
                  key={log.id || idx}
                  className="flex items-start gap-3 relative pb-4 border-l-2 border-slate-800 pl-4 ml-2 last:border-0 last:pb-0"
                >
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 border-2 border-slate-900" />
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-white font-mono uppercase text-[11px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                        {log.action}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        {formatDateTimeIndian(log.timestamp)}
                      </span>
                    </div>

                    <p className="text-slate-300 text-xs">
                      Performed by <strong className="text-blue-400">{log.user?.name || log.userId || 'System'}</strong> ({log.user?.role || 'SYSTEM'})
                    </p>

                    {log.details && (
                      <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 text-slate-300 font-mono text-[11px] break-all mt-1">
                        {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <>
                {/* Timeline event 1: Ingestion */}
                <div className="flex items-start gap-3 relative pb-4 border-l-2 border-slate-800 pl-4 ml-2">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 border-2 border-slate-900" />
                  <div>
                    <span className="font-bold text-white block">Invoice Created & Ingested</span>
                    <span className="text-slate-400 text-[11px] block mt-0.5">
                      Created on {formatDateTimeIndian(invoice.createdAt)}
                    </span>
                    <p className="text-slate-300 mt-1">
                      Submitted with {invoice.items?.length || 0} line items. Place of supply: {invoice.placeOfSupply}.
                    </p>
                  </div>
                </div>

                {/* Timeline event 2: Fraud Evaluation */}
                <div className="flex items-start gap-3 relative pb-4 border-l-2 border-slate-800 pl-4 ml-2">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-purple-600 border-2 border-slate-900" />
                  <div>
                    <span className="font-bold text-white block">20-Rule Fraud Scoring Executed</span>
                    <span className="text-slate-400 text-[11px] block mt-0.5">
                      Evaluated with Risk Score: <strong className="font-mono text-slate-200">{invoice.fraudScore}/100</strong> ({invoice.riskLevel})
                    </span>
                    <p className="text-slate-300 mt-1">
                      Passed rules: {detection?.passedRulesCount || 0}, Warnings: {detection?.warningRulesCount || 0}, Violations: {detection?.failedRulesCount || 0}, Critical flags: {detection?.criticalRulesCount || 0}.
                    </p>
                  </div>
                </div>

                {/* Timeline event 3: Auditor Review (if reviewed) */}
                {invoice.reviewedAt && (
                  <div className="flex items-start gap-3 relative pl-4 ml-2">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-emerald-600 border-2 border-slate-900" />
                    <div>
                      <span className="font-bold text-white block">
                        Auditor Review: Status Updated to {invoice.status}
                      </span>
                      <span className="text-slate-400 text-[11px] block mt-0.5">
                        Reviewed on {formatDateTimeIndian(invoice.reviewedAt)} by {invoice.reviewedBy?.name || 'Auditor'}
                      </span>
                      {invoice.reviewNotes && (
                        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 mt-2 text-slate-200 font-medium">
                          "{invoice.reviewNotes}"
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Auditor Status Action Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title={`Confirm Action: Set Status to "${targetStatus}"`}
      >
        <form onSubmit={handleStatusSubmit} className="space-y-4">
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300">
            You are changing the audit status of invoice <strong className="text-white">#{invoice.invoiceNumber}</strong> to <strong className="text-blue-400">{targetStatus}</strong>. This event will be permanently recorded in the immutable audit log.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
              Auditor Review Notes / Justification *
            </label>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              required
              rows={3}
              placeholder="e.g. Verified physical delivery challan, GST returns 2B matched, approved for payment."
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsStatusModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdatingStatus}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-md transition-colors"
            >
              {isUpdatingStatus ? 'Saving Audit Record...' : 'Confirm & Save'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
