import React from 'react';
import { PurchaseOrder, InvoiceItem } from '../../types';
import { formatINR, formatDateIndian } from '../../utils/formatters';
import { FileCheck, AlertTriangle, CheckCircle2, XCircle, Building2, PackageCheck } from 'lucide-react';

interface POMatchCardProps {
  po?: PurchaseOrder | null;
  invoiceAmount: number;
  invoiceVendorId: string;
  invoiceItems?: InvoiceItem[];
}

export const POMatchCard: React.FC<POMatchCardProps> = ({
  po,
  invoiceAmount,
  invoiceVendorId,
  invoiceItems = [],
}) => {
  if (!po) {
    const isHighValue = invoiceAmount >= 50000;
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div>
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-slate-400" />
              3-Way Purchase Order Matching Inspector
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              3-way cross-check between Authorized PO, Goods Received, and Invoiced Amount
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            Direct / Unlinked PO
          </span>
        </div>

        <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 flex items-start gap-3">
          {isHighValue ? (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-200 block">
              {isHighValue ? 'Mandatory PO Threshold Exceeded (PO-01 Violation)' : 'Direct Settlement Permissible'}
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isHighValue
                ? `Invoice total (${formatINR(invoiceAmount)}) exceeds the corporate mandatory ₹50,000 threshold without an approved Purchase Order reference (+15 penalty points).`
                : `Invoice total (${formatINR(invoiceAmount)}) is below the ₹50,000 corporate purchase order threshold. Direct Accounts Payable disbursement allowed without penalty.`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // PO vs Invoice Validations
  const isVendorMatch = po.vendorId === invoiceVendorId;
  const isAmountWithinTolerance = invoiceAmount <= po.totalAmount * 1.05;
  const overrunDiff = invoiceAmount - po.totalAmount;
  const overrunPercent = po.totalAmount > 0 ? ((overrunDiff / po.totalAmount) * 100).toFixed(1) : '0';

  const poItems = po.items || [];
  const poTotalTaxable = poItems.reduce((acc, it) => acc + (it.unitPrice * it.quantity), 0);
  const poTotalTax = poItems.reduce((acc, it) => acc + (it.totalAmount - (it.unitPrice * it.quantity)), 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3.5">
        <div>
          <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-blue-400" />
            3-Way Purchase Order Matching: PO #{po.poNumber}
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Issued on {formatDateIndian(po.issueDate)} • Status: <span className="font-semibold text-slate-200">{po.status}</span>
          </p>
        </div>

        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full border self-start sm:self-auto ${
            isVendorMatch && isAmountWithinTolerance
              ? 'bg-emerald-950/70 border-emerald-800/50 text-emerald-300'
              : 'bg-red-950/70 border-red-800/50 text-red-300'
          }`}
        >
          {isVendorMatch && isAmountWithinTolerance ? '3-Way Matched (Valid)' : 'PO Discrepancy Flagged'}
        </span>
      </div>

      {/* 3-Way High Level Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
        <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800">
          <span className="text-slate-400 block mb-1 font-sans text-xs">1. Purchase Order Authorized</span>
          <span className="text-base font-bold text-white block">{formatINR(po.totalAmount)}</span>
          <span className="text-[10px] text-slate-500 font-sans mt-0.5 block">Status: {po.status}</span>
        </div>

        <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800">
          <span className="text-slate-400 block mb-1 font-sans text-xs">2. Invoiced / Billed Amount</span>
          <span className="text-base font-bold text-blue-400 block">{formatINR(invoiceAmount)}</span>
          <span className="text-[10px] text-slate-500 font-sans mt-0.5 block">Current Submission</span>
        </div>

        <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800">
          <span className="text-slate-400 block mb-1 font-sans text-xs">3. Tolerance (+5% Allowed)</span>
          <span className={`text-base font-bold block ${isAmountWithinTolerance ? 'text-emerald-400' : 'text-red-400'}`}>
            {overrunDiff > 0 ? `+${formatINR(overrunDiff)} (${overrunPercent}%)` : 'Within Budget'}
          </span>
          <span className="text-[10px] text-slate-500 font-sans mt-0.5 block">Limit: {formatINR(po.totalAmount * 1.05)}</span>
        </div>
      </div>

      {/* Line Item Cross-Match Breakdown */}
      {poItems.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-sans">
            <PackageCheck className="w-3.5 h-3.5 text-purple-400" />
            PO Line Items vs Invoice Line Items Match
          </h5>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-800 font-sans">
                  <th className="py-2 px-3">Item Description</th>
                  <th className="py-2 px-3 text-right">PO Ordered Qty</th>
                  <th className="py-2 px-3 text-right">Invoiced Qty</th>
                  <th className="py-2 px-3 text-right">PO Unit Rate</th>
                  <th className="py-2 px-3 text-right">PO Total (₹)</th>
                  <th className="py-2 px-3 text-right">Match</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {poItems.map((poIt, idx) => {
                  const matchedInvIt = invoiceItems[idx];
                  const isQtyMatch = matchedInvIt ? matchedInvIt.quantity <= poIt.quantity * 1.05 : true;
                  const isRateMatch = matchedInvIt ? Math.abs(matchedInvIt.unitPrice - poIt.unitPrice) <= 1.0 : true;

                  return (
                    <tr key={poIt.id || idx} className="hover:bg-slate-850/40">
                      <td className="py-2 px-3 font-sans font-medium text-slate-200">
                        {poIt.description}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-300">{poIt.quantity}</td>
                      <td className="py-2 px-3 text-right text-slate-100 font-bold">
                        {matchedInvIt ? matchedInvIt.quantity : poIt.quantity}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-300">{formatINR(poIt.unitPrice)}</td>
                      <td className="py-2 px-3 text-right text-white font-bold">{formatINR(poIt.totalAmount)}</td>
                      <td className="py-2 px-3 text-right font-sans">
                        {isQtyMatch && isRateMatch ? (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                            MATCH
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded-full">
                            VARIANCE
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Forensic Verdict Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-start gap-2.5">
          {isVendorMatch ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-0.5">
            <span className="font-bold text-slate-200 block font-sans">
              PO Vendor Identity Check (PO-03)
            </span>
            <span className={isVendorMatch ? 'text-slate-300' : 'text-red-400 font-semibold'}>
              {isVendorMatch
                ? 'Vendor on invoice strictly matches the vendor authorized on PO.'
                : 'CRITICAL: Vendor on invoice does NOT match the vendor on the Purchase Order (+30 penalty points)!'}
            </span>
          </div>
        </div>

        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-start gap-2.5">
          {isAmountWithinTolerance ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-0.5">
            <span className="font-bold text-slate-200 block font-sans">
              PO Value Limit Check (PO-02)
            </span>
            <span className={isAmountWithinTolerance ? 'text-slate-300' : 'text-red-400 font-semibold'}>
              {isAmountWithinTolerance
                ? `Billed total is within the approved PO ceiling (${formatINR(po.totalAmount * 1.05)}).`
                : `PO budget exceeded by ${overrunPercent}% (+${formatINR(overrunDiff)}) over tolerance limit (+25 penalty points)!`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
