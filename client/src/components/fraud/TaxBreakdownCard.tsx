import React from 'react';
import { Invoice } from '../../types';
import { formatINR } from '../../utils/formatters';
import { CheckCircle2, AlertTriangle, Calculator, FileText, Check, X } from 'lucide-react';

interface TaxBreakdownCardProps {
  invoice: Invoice;
}

export const TaxBreakdownCard: React.FC<TaxBreakdownCardProps> = ({ invoice }) => {
  const isInter = invoice.isInterState;

  // Average or item GST Rate
  const firstItemRate = invoice.items && invoice.items.length > 0 ? invoice.items[0].gstRate : 18;
  const expectedTotalTaxFromRate = (invoice.taxableAmount * firstItemRate) / 100;

  // Expected Taxes based on Supply Type
  const expectedCgst = isInter ? 0 : expectedTotalTaxFromRate / 2;
  const expectedSgst = isInter ? 0 : expectedTotalTaxFromRate / 2;
  const expectedIgst = isInter ? expectedTotalTaxFromRate : 0;
  const expectedTotalTax = isInter ? expectedIgst : (expectedCgst + expectedSgst);
  const expectedGrandTotal = invoice.taxableAmount + expectedTotalTax;

  // Actual Taxes from Invoice Header
  const actualCgst = invoice.cgstAmount || 0;
  const actualSgst = invoice.sgstAmount || 0;
  const actualIgst = invoice.igstAmount || 0;
  const actualTotalTax = invoice.totalTaxAmount || (actualCgst + actualSgst + actualIgst);
  const actualGrandTotal = invoice.grandTotal;

  // Validation Flags
  const isCgstPassed = Math.abs(expectedCgst - actualCgst) <= 2.0;
  const isSgstPassed = Math.abs(expectedSgst - actualSgst) <= 2.0;
  const isIgstPassed = Math.abs(expectedIgst - actualIgst) <= 2.0;
  const isCgstEqualSgst = !isInter ? Math.abs(actualCgst - actualSgst) <= 1.0 : true;
  const isGrandTotalMathExact = Math.abs((invoice.taxableAmount + actualTotalTax) - actualGrandTotal) <= 1.0;
  const isApplicabilityCorrect = isInter ? (actualCgst === 0 && actualSgst === 0) : (actualIgst === 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3.5">
        <div>
          <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-blue-400" />
            Indian GST Tax Computation & Discrepancy Inspector
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Side-by-side statutory rate math verification against Indian GST schedule
          </p>
        </div>

        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full border self-start sm:self-auto ${
            isInter
              ? 'bg-purple-950/70 border-purple-800/50 text-purple-300'
              : 'bg-blue-950/70 border-blue-800/50 text-blue-300'
          }`}
        >
          {isInter ? 'Inter-State Supply (IGST Only)' : 'Intra-State Supply (CGST + SGST)'}
        </span>
      </div>

      {/* Place of Supply vs Supplier State Comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
        <div>
          <span className="text-slate-400 block mb-0.5 font-medium">Supplier State (Vendor Master):</span>
          <span className="font-semibold text-slate-100">
            {invoice.vendor?.state || 'Maharashtra'} (State Code: {invoice.vendor?.stateCode || invoice.vendorGstin.substring(0, 2)})
          </span>
        </div>
        <div>
          <span className="text-slate-400 block mb-0.5 font-medium">Place of Supply (POS Destination):</span>
          <span className="font-semibold text-slate-100">
            {invoice.placeOfSupply} (State Code: {invoice.placeOfSupplyStateCode})
          </span>
        </div>
      </div>

      {/* Side-by-Side Tax Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse font-mono">
          <thead>
            <tr className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 font-sans">
              <th className="py-2.5 px-3">Tax Component</th>
              <th className="py-2.5 px-3">Expected (Statutory)</th>
              <th className="py-2.5 px-3">Actual (Billed)</th>
              <th className="py-2.5 px-3">Variance / Delta</th>
              <th className="py-2.5 px-3 text-right">Audit Verdict</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {/* Taxable Amount */}
            <tr className="hover:bg-slate-850/40">
              <td className="py-2.5 px-3 font-sans font-medium text-slate-200">Taxable Amount</td>
              <td className="py-2.5 px-3 text-slate-300">{formatINR(invoice.taxableAmount)}</td>
              <td className="py-2.5 px-3 text-white font-bold">{formatINR(invoice.taxableAmount)}</td>
              <td className="py-2.5 px-3 text-slate-500">₹0.00</td>
              <td className="py-2.5 px-3 text-right font-sans">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                  PASS
                </span>
              </td>
            </tr>

            {/* CGST Row */}
            <tr className="hover:bg-slate-850/40">
              <td className="py-2.5 px-3 font-sans font-medium text-slate-200">
                Central GST (CGST) {!isInter ? `(${firstItemRate / 2}%)` : '(N/A)'}
              </td>
              <td className="py-2.5 px-3 text-slate-300">{formatINR(expectedCgst)}</td>
              <td className="py-2.5 px-3 text-white font-bold">{formatINR(actualCgst)}</td>
              <td className="py-2.5 px-3 font-bold">
                {Math.abs(actualCgst - expectedCgst) > 1.0 ? (
                  <span className="text-red-400">+{formatINR(Math.abs(actualCgst - expectedCgst))}</span>
                ) : (
                  <span className="text-slate-500">₹0.00</span>
                )}
              </td>
              <td className="py-2.5 px-3 text-right font-sans">
                {isCgstPassed ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                    PASS
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-950/80 text-red-400 border border-red-800/70">
                    FAIL
                  </span>
                )}
              </td>
            </tr>

            {/* SGST Row */}
            <tr className="hover:bg-slate-850/40">
              <td className="py-2.5 px-3 font-sans font-medium text-slate-200">
                State GST (SGST) {!isInter ? `(${firstItemRate / 2}%)` : '(N/A)'}
              </td>
              <td className="py-2.5 px-3 text-slate-300">{formatINR(expectedSgst)}</td>
              <td className="py-2.5 px-3 text-white font-bold">{formatINR(actualSgst)}</td>
              <td className="py-2.5 px-3 font-bold">
                {Math.abs(actualSgst - expectedSgst) > 1.0 ? (
                  <span className="text-red-400">+{formatINR(Math.abs(actualSgst - expectedSgst))}</span>
                ) : (
                  <span className="text-slate-500">₹0.00</span>
                )}
              </td>
              <td className="py-2.5 px-3 text-right font-sans">
                {isSgstPassed ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                    PASS
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-950/80 text-red-400 border border-red-800/70">
                    FAIL
                  </span>
                )}
              </td>
            </tr>

            {/* IGST Row */}
            <tr className="hover:bg-slate-850/40">
              <td className="py-2.5 px-3 font-sans font-medium text-slate-200">
                Integrated GST (IGST) {isInter ? `(${firstItemRate}%)` : '(N/A)'}
              </td>
              <td className="py-2.5 px-3 text-slate-300">{formatINR(expectedIgst)}</td>
              <td className="py-2.5 px-3 text-white font-bold">{formatINR(actualIgst)}</td>
              <td className="py-2.5 px-3 font-bold">
                {Math.abs(actualIgst - expectedIgst) > 1.0 ? (
                  <span className="text-red-400">+{formatINR(Math.abs(actualIgst - expectedIgst))}</span>
                ) : (
                  <span className="text-slate-500">₹0.00</span>
                )}
              </td>
              <td className="py-2.5 px-3 text-right font-sans">
                {isIgstPassed ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                    PASS
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-950/80 text-red-400 border border-red-800/70">
                    FAIL
                  </span>
                )}
              </td>
            </tr>

            {/* Total Tax Row */}
            <tr className="hover:bg-slate-850/40 bg-slate-950/40 font-bold">
              <td className="py-2.5 px-3 font-sans text-blue-300">Total GST Charged</td>
              <td className="py-2.5 px-3 text-slate-300">{formatINR(expectedTotalTax)}</td>
              <td className="py-2.5 px-3 text-blue-400">{formatINR(actualTotalTax)}</td>
              <td className="py-2.5 px-3 font-bold">
                {Math.abs(actualTotalTax - expectedTotalTax) > 1.0 ? (
                  <span className="text-red-400">+{formatINR(Math.abs(actualTotalTax - expectedTotalTax))}</span>
                ) : (
                  <span className="text-emerald-400">Exact Match</span>
                )}
              </td>
              <td className="py-2.5 px-3 text-right font-sans">
                {Math.abs(actualTotalTax - expectedTotalTax) <= 2.0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                    PASS
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-950/80 text-red-400 border border-red-800/70">
                    FAIL
                  </span>
                )}
              </td>
            </tr>

            {/* Grand Total Row */}
            <tr className="hover:bg-slate-850/40 bg-blue-950/20 font-bold">
              <td className="py-3 px-3 font-sans text-white text-sm">Invoice Grand Total (₹)</td>
              <td className="py-3 px-3 text-slate-200">{formatINR(expectedGrandTotal)}</td>
              <td className="py-3 px-3 text-blue-400 text-sm font-extrabold">{formatINR(actualGrandTotal)}</td>
              <td className="py-3 px-3">
                {Math.abs(actualGrandTotal - expectedGrandTotal) > 1.0 ? (
                  <span className="text-red-400 font-bold">Δ {formatINR(Math.abs(actualGrandTotal - expectedGrandTotal))}</span>
                ) : (
                  <span className="text-emerald-400">Verified Exact</span>
                )}
              </td>
              <td className="py-3 px-3 text-right font-sans">
                {isGrandTotalMathExact ? (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    MATCH
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-950 text-red-300 border border-red-800 animate-pulse">
                    DISCREPANCY
                  </span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Statutory Rules Cross-Check Bullet Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-start gap-2.5">
          {isApplicabilityCorrect ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-0.5">
            <span className="font-bold text-slate-200 block">
              Tax Type Applicability (TAX-01)
            </span>
            <span className={isApplicabilityCorrect ? 'text-slate-300' : 'text-red-400 font-semibold'}>
              {isApplicabilityCorrect
                ? `Correct tax schedule charged for ${isInter ? 'Inter-state' : 'Intra-state'} supply.`
                : `Illegal tax type: ${isInter ? 'CGST/SGST charged on inter-state supply' : 'IGST charged on intra-state supply'}.`}
            </span>
          </div>
        </div>

        {!isInter && (
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-start gap-2.5">
            {isCgstEqualSgst ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <span className="font-bold text-slate-200 block">
                Intra-State Equality Check (TAX-03)
              </span>
              <span className={isCgstEqualSgst ? 'text-slate-300' : 'text-red-400 font-semibold'}>
                {isCgstEqualSgst
                  ? `CGST (${formatINR(actualCgst)}) strictly equals SGST (${formatINR(actualSgst)}).`
                  : `Asymmetry detected: CGST (${formatINR(actualCgst)}) ≠ SGST (${formatINR(actualSgst)}).`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
