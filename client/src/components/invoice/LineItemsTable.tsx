import React from 'react';
import { InvoiceItem } from '../../types';
import { formatINR } from '../../utils/formatters';

interface LineItemsTableProps {
  items: InvoiceItem[];
  isInterState: boolean;
}

export const LineItemsTable: React.FC<LineItemsTableProps> = ({ items, isInterState }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-100">
          Line-Item Breakdown & Tax Computation ({items.length} items)
        </h4>
        <span className="text-xs text-slate-400 font-mono">
          Indian GST Standard Format
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950/40 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
              <th className="py-3 px-4">#</th>
              <th className="py-3 px-4">Item Description</th>
              <th className="py-3 px-4">HSN/SAC</th>
              <th className="py-3 px-4 text-right">Qty</th>
              <th className="py-3 px-4 text-right">Unit Rate (₹)</th>
              <th className="py-3 px-4 text-right">Taxable Value (₹)</th>
              <th className="py-3 px-4 text-right">GST Rate</th>
              {!isInterState ? (
                <>
                  <th className="py-3 px-4 text-right">CGST (₹)</th>
                  <th className="py-3 px-4 text-right">SGST (₹)</th>
                </>
              ) : (
                <th className="py-3 px-4 text-right">IGST (₹)</th>
              )}
              <th className="py-3 px-4 text-right font-bold text-slate-200">Total (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {items.map((item, idx) => (
              <tr key={item.id || idx} className="hover:bg-slate-850/40 transition-colors">
                <td className="py-3 px-4 text-slate-500">{idx + 1}</td>
                <td className="py-3 px-4 font-sans font-medium text-slate-200">
                  {item.itemDescription}
                </td>
                <td className="py-3 px-4 text-blue-400 font-semibold">
                  {item.hsnSac || <span className="text-red-400 font-bold">Missing</span>}
                </td>
                <td className="py-3 px-4 text-right text-slate-300">
                  {item.quantity}
                </td>
                <td className="py-3 px-4 text-right text-slate-300">
                  {formatINR(item.unitPrice)}
                </td>
                <td className="py-3 px-4 text-right text-slate-200 font-semibold">
                  {formatINR(item.taxableValue)}
                </td>
                <td className="py-3 px-4 text-right text-purple-400 font-semibold">
                  {item.gstRate}%
                </td>
                {!isInterState ? (
                  <>
                    <td className="py-3 px-4 text-right text-slate-300">
                      {formatINR(item.cgstAmount)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-300">
                      {formatINR(item.sgstAmount)}
                    </td>
                  </>
                ) : (
                  <td className="py-3 px-4 text-right text-slate-300">
                    {formatINR(item.igstAmount)}
                  </td>
                )}
                <td className="py-3 px-4 text-right font-bold text-white">
                  {formatINR(item.totalAmount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
