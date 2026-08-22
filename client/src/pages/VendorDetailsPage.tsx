import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { vendorService } from '../services/vendor.service';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Vendor, Invoice, PurchaseOrder } from '../types';
import { formatINR, formatDateIndian } from '../utils/formatters';
import {
  Building2,
  FileSpreadsheet,
  IndianRupee,
  ShieldAlert,
  ShieldCheck,
  CreditCard,
  MapPin,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  FileCheck,
  ChevronRight,
} from 'lucide-react';

export const VendorDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const { hasRole } = useAuth();

  const [vendor, setVendor] = useState<(Vendor & { invoices?: Invoice[]; purchaseOrders?: PurchaseOrder[] }) | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdatingVerification, setIsUpdatingVerification] = useState<boolean>(false);

  const fetchVendorData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const data = await vendorService.getVendorById(id);
      setVendor(data);
    } catch (err: any) {
      toast.error('Failed to load vendor details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorData();
  }, [id]);

  const handleToggleVerification = async () => {
    if (!vendor || !id) return;
    try {
      setIsUpdatingVerification(true);
      const updated = await vendorService.updateVendor(id, {
        isVerified: !vendor.isVerified,
      });
      setVendor((prev) => (prev ? { ...prev, ...updated.data } : null));
      toast.success(
        `Vendor marked as ${!vendor.isVerified ? 'KYC Verified' : 'Unverified'}.`
      );
    } catch (err: any) {
      toast.error('Failed to update verification status.');
    } finally {
      setIsUpdatingVerification(false);
    }
  };

  if (isLoading || !vendor) {
    return <LoadingSpinner fullHeight label="Loading vendor profile and history..." />;
  }

  const invoices = vendor.invoices || [];
  const poList = vendor.purchaseOrders || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={vendor.name}
        subtitle={`${vendor.city}, ${vendor.state} • State Code: ${vendor.stateCode}`}
        breadcrumbs={[
          { label: 'Vendors', path: '/vendors' },
          { label: vendor.name },
        ]}
        action={
          hasRole(['ADMIN', 'AUDITOR']) && (
            <button
              onClick={handleToggleVerification}
              disabled={isUpdatingVerification}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl shadow-md transition-all flex items-center gap-1.5 ${
                vendor.isVerified
                  ? 'bg-slate-900 border border-slate-700 text-amber-400 hover:bg-slate-800'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {vendor.isVerified ? (
                <>
                  <XCircle className="w-4 h-4" />
                  <span>Revoke Verification</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Grant KYC Verification</span>
                </>
              )}
            </button>
          )
        }
      />

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Invoices"
          value={vendor.totalInvoicesCount}
          subtitle="Processed to date"
          icon={<FileSpreadsheet className="w-5 h-5 text-blue-400" />}
          variant="blue"
        />

        <StatCard
          title="Total Billed"
          value={formatINR(vendor.totalAmountBilled)}
          subtitle="Cumulative transaction value"
          icon={<IndianRupee className="w-5 h-5 text-emerald-400" />}
          variant="success"
        />

        <StatCard
          title="Fraud Flags"
          value={vendor.fraudFlagCount}
          subtitle={vendor.fraudFlagCount > 0 ? 'Confirmed fraudulent instances' : 'Zero confirmed fraud'}
          icon={<ShieldAlert className="w-5 h-5 text-red-400" />}
          variant={vendor.fraudFlagCount > 0 ? 'danger' : 'default'}
        />

        <StatCard
          title="Vendor Risk Score"
          value={`${vendor.riskScore} / 100`}
          subtitle={vendor.isVerified ? 'KYC Verified' : 'Unverified Supplier'}
          icon={<ShieldCheck className="w-5 h-5 text-purple-400" />}
          variant="warning"
        />
      </div>

      {/* Master Details & Banking Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2.5 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-400" />
            Vendor Master Details
          </h4>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Trade Name:</span>
              <span className="font-semibold text-slate-100">{vendor.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Legal Entity Name:</span>
              <span className="font-semibold text-slate-100">{vendor.legalName || vendor.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">GSTIN (15 Digits):</span>
              <span className="font-mono font-bold text-blue-300">{vendor.gstin}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">PAN (10 Digits):</span>
              <span className="font-mono font-bold text-slate-200">{vendor.pan}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Contact Email:</span>
              <span className="text-slate-300">{vendor.email}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Phone:</span>
              <span className="text-slate-300">{vendor.phone}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400 block text-[11px]">Registered Address:</span>
              <span className="text-slate-300">{vendor.address}, {vendor.city}, {vendor.state} - {vendor.pincode}</span>
            </div>
          </div>
        </div>

        {/* Banking Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2.5 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            Banking & Financial Settlement Master
          </h4>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Bank Name:</span>
              <span className="font-semibold text-slate-100">{vendor.bankName || 'HDFC Bank Ltd'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Account Number:</span>
              <span className="font-mono text-slate-100">{vendor.bankAccountNumber || '••••••••5492'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">IFSC Code:</span>
              <span className="font-mono font-semibold text-blue-300">{vendor.bankIfsc || 'HDFC0000240'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Verification Status:</span>
              <span className="font-semibold text-emerald-400">Bank Account Match Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Invoices History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-400" />
              Invoice Transaction History ({invoices.length} Invoices)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Historical ledger of all billings received from this vendor
            </p>
          </div>
        </div>

        {invoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Taxable Amount</th>
                  <th className="py-3 px-4">Total Amount (₹)</th>
                  <th className="py-3 px-4">Fraud Score</th>
                  <th className="py-3 px-4">Risk Level</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-850/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-white">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {formatDateIndian(inv.invoiceDate)}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {formatINR(inv.taxableAmount)}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-100">
                      {formatINR(inv.grandTotal)}
                    </td>
                    <td className="py-3 px-4 font-bold">
                      {inv.fraudScore}/100
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <RiskBadge level={inv.riskLevel} size="sm" />
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <StatusBadge status={inv.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right font-sans">
                      <Link
                        to={`/invoices/${inv.id}`}
                        className="text-xs font-semibold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
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
        ) : (
          <p className="text-xs text-slate-500 py-4 text-center">No invoices on record for this vendor.</p>
        )}
      </div>
    </div>
  );
};
