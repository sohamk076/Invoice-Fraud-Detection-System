import React from 'react';
import { Link } from 'react-router-dom';
import { Vendor } from '../../types';
import { formatINR } from '../../utils/formatters';
import { RiskBadge } from '../common/RiskBadge';
import { Building2, ShieldCheck, ShieldAlert, ArrowUpRight, CheckCircle2, AlertOctagon, Landmark } from 'lucide-react';

interface VendorRiskCardProps {
  vendor?: Vendor | null;
  vendorGstin: string;
}

export const VendorRiskCard: React.FC<VendorRiskCardProps> = ({ vendor, vendorGstin }) => {
  if (!vendor) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            Vendor Risk Context
          </h4>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400">
            Unregistered Vendor
          </span>
        </div>
        <p className="text-xs text-slate-400">
          GSTIN: <span className="font-mono text-slate-200">{vendorGstin}</span> is not registered in the Supplier Master database (+20 penalty points).
        </p>
      </div>
    );
  }

  const isVerified = vendor.isVerified;
  const isHighRiskVendor = vendor.riskScore >= 50 || vendor.fraudFlagCount > 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-950/60 text-blue-400 rounded-xl border border-blue-900/40">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              {vendor.name}
              {isVerified ? (
                <span className="px-2 py-0.5 bg-emerald-950/70 border border-emerald-800/50 text-emerald-300 text-[10px] font-bold rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  KYC Verified
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-amber-950/70 border border-amber-800/50 text-amber-300 text-[10px] font-bold rounded-full flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  Unverified
                </span>
              )}
            </h4>
            <p className="text-xs text-slate-400">
              {vendor.city}, {vendor.state} • GSTIN: <span className="font-mono text-slate-200">{vendor.gstin}</span>
            </p>
          </div>
        </div>

        <Link
          to={`/vendors/${vendor.id}`}
          className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition-colors"
        >
          <span>Vendor Master</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 4 Risk Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800">
          <span className="text-slate-400 block mb-1">Historical Risk Score</span>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-white font-mono">{vendor.riskScore}</span>
            <RiskBadge
              level={vendor.riskScore >= 75 ? 'CRITICAL' : vendor.riskScore >= 50 ? 'HIGH' : vendor.riskScore >= 25 ? 'MEDIUM' : 'LOW'}
              score={vendor.riskScore}
              size="sm"
            />
          </div>
        </div>

        <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800">
          <span className="text-slate-400 block mb-1">Fraud Flags Raised</span>
          <div className="flex items-center gap-1.5">
            <span className={`text-base font-bold font-mono ${vendor.fraudFlagCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {vendor.fraudFlagCount}
            </span>
            {vendor.fraudFlagCount > 0 && <AlertOctagon className="w-3.5 h-3.5 text-red-400" />}
          </div>
        </div>

        <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800">
          <span className="text-slate-400 block mb-1">Total Invoiced Volume</span>
          <span className="text-sm font-bold text-slate-100 font-mono">
            {formatINR(vendor.totalAmountBilled)}
          </span>
        </div>

        <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800">
          <span className="text-slate-400 block mb-1">Invoices Count</span>
          <span className="text-sm font-bold text-slate-100 font-mono">
            {vendor.totalInvoicesCount} invoices
          </span>
        </div>
      </div>

      {/* Banking & Statutory Details */}
      <div className="p-3 bg-slate-950/40 rounded-2xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Landmark className="w-3.5 h-3.5 text-slate-400" />
          <span>Bank: <strong className="text-slate-200">{vendor.bankName || 'HDFC Bank Ltd'}</strong></span>
          <span>• A/C: <span className="font-mono text-slate-200">{vendor.bankAccountNumber || '••••••••1092'}</span></span>
          <span>• IFSC: <span className="font-mono text-slate-200">{vendor.bankIfsc || 'HDFC0000240'}</span></span>
        </div>
        <div className="text-slate-400 text-[11px]">
          PAN: <span className="font-mono text-slate-200">{vendor.pan || vendor.gstin.substring(2, 12)}</span>
        </div>
      </div>
    </div>
  );
};
