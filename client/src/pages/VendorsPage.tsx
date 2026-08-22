import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { vendorService } from '../services/vendor.service';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Vendor } from '../types';
import { formatINR, formatCompactINR } from '../utils/formatters';
import {
  Building2,
  Search,
  Plus,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  ShieldAlert,
  ChevronLeft,
} from 'lucide-react';

export const VendorsPage: React.FC = () => {
  const toast = useToast();
  const { hasRole } = useAuth();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  });
  const [search, setSearch] = useState('');
  const [isVerifiedFilter, setIsVerifiedFilter] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // New Vendor Modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newVendor, setNewVendor] = useState({
    name: '',
    legalName: '',
    gstin: '',
    pan: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: 'Maharashtra',
    stateCode: '27',
    pincode: '',
    bankAccountNumber: '',
    bankIfsc: '',
    bankName: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchVendors = async (page = 1) => {
    try {
      setIsLoading(true);
      const res = await vendorService.getVendors({
        page,
        limit: 15,
        search: search || undefined,
        isVerified: isVerifiedFilter || undefined,
      });
      setVendors(res.data);
      setPagination(res.pagination);
    } catch (err: any) {
      toast.error('Failed to load vendors from server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors(pagination.page);
  }, [isVerifiedFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVendors(1);
  };

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await vendorService.createVendor(newVendor);
      toast.success(`Vendor "${newVendor.name}" registered successfully.`);
      setShowAddModal(false);
      fetchVendors(1);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create vendor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Indian Vendor Master Registry"
        subtitle="Manage supplier profiles, verified GSTINs, and forensic fraud flag history"
        breadcrumbs={[{ label: 'Vendors' }]}
        action={
          hasRole(['ADMIN', 'FINANCE_USER']) && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Vendor</span>
            </button>
          )
        }
      />

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendor name, GSTIN, PAN..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={isVerifiedFilter}
            onChange={(e) => setIsVerifiedFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Verification Statuses</option>
            <option value="true">KYC Verified Vendors</option>
            <option value="false">Unverified / High Risk</option>
          </select>
        </div>
      </div>

      {/* Vendor Table */}
      {isLoading ? (
        <LoadingSpinner fullHeight label="Loading vendor master database..." />
      ) : vendors.length > 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Vendor Details</th>
                  <th className="py-3.5 px-4">GSTIN & PAN</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Total Invoices</th>
                  <th className="py-3.5 px-4">Total Billed (₹)</th>
                  <th className="py-3.5 px-4">Fraud Flags</th>
                  <th className="py-3.5 px-4">KYC Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {vendors.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-850/60 transition-colors">
                    {/* Vendor Details */}
                    <td className="py-3.5 px-4">
                      <Link
                        to={`/vendors/${v.id}`}
                        className="font-bold text-slate-100 hover:text-blue-400 transition-colors flex items-center gap-2"
                      >
                        <Building2 className="w-4 h-4 text-slate-500" />
                        <span>{v.name}</span>
                      </Link>
                      <p className="text-[11px] text-slate-400 pl-6 truncate max-w-xs">
                        {v.email} • {v.phone}
                      </p>
                    </td>

                    {/* GSTIN & PAN */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="text-slate-200 font-semibold">{v.gstin}</div>
                      <div className="text-[11px] text-slate-400">PAN: {v.pan}</div>
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4 text-slate-300">
                      <div>{v.city}, {v.state}</div>
                      <div className="text-[11px] text-slate-500">State Code: {v.stateCode}</div>
                    </td>

                    {/* Total Invoices */}
                    <td className="py-3.5 px-4 font-mono text-slate-200 font-semibold">
                      {v.totalInvoicesCount} invoices
                    </td>

                    {/* Total Billed */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-100">
                      {formatINR(v.totalAmountBilled)}
                    </td>

                    {/* Fraud Flags */}
                    <td className="py-3.5 px-4 font-mono">
                      {v.fraudFlagCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-red-400 font-bold bg-red-950/40 border border-red-800/50 px-2 py-0.5 rounded-full text-xs">
                          <ShieldAlert className="w-3 h-3" />
                          {v.fraudFlagCount} flags
                        </span>
                      ) : (
                        <span className="text-emerald-400 text-xs font-semibold">
                          0 flags (Clean)
                        </span>
                      )}
                    </td>

                    {/* KYC Status */}
                    <td className="py-3.5 px-4">
                      {v.isVerified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                          <ShieldCheck className="w-3 h-3" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/40">
                          <AlertTriangle className="w-3 h-3" />
                          Unverified
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/vendors/${v.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-950/40 hover:bg-blue-900/50 border border-blue-800/40 px-2.5 py-1 rounded-lg transition-all"
                      >
                        <span>Profile</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing {vendors.length} of {pagination.total} vendors
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => fetchVendors(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 font-mono text-slate-200">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchVendors(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          title="No Vendors Found"
          description="No vendors match the current search filters."
        />
      )}

      {/* Add Vendor Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Register New Indian Vendor"
        subtitle="Add master profile with verified GSTIN and PAN details"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateVendor} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Vendor Trade Name *
              </label>
              <input
                type="text"
                value={newVendor.name}
                onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                required
                placeholder="e.g. Tata Steel Supplies Ltd"
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Legal Entity Name
              </label>
              <input
                type="text"
                value={newVendor.legalName}
                onChange={(e) => setNewVendor({ ...newVendor, legalName: e.target.value })}
                placeholder="Tata Steel Supplies Limited"
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                GSTIN (15 Characters) *
              </label>
              <input
                type="text"
                value={newVendor.gstin}
                onChange={(e) => setNewVendor({ ...newVendor, gstin: e.target.value.toUpperCase() })}
                required
                maxLength={15}
                placeholder="27AAACT2727Q1ZW"
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-blue-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                PAN (10 Characters)
              </label>
              <input
                type="text"
                value={newVendor.pan}
                onChange={(e) => setNewVendor({ ...newVendor, pan: e.target.value.toUpperCase() })}
                maxLength={10}
                placeholder="AAACT2727Q"
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Email *
              </label>
              <input
                type="email"
                value={newVendor.email}
                onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
                required
                placeholder="sales@vendor.in"
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Phone Number *
              </label>
              <input
                type="text"
                value={newVendor.phone}
                onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })}
                required
                placeholder="+91 98201 11223"
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Registered Address *
            </label>
            <input
              type="text"
              value={newVendor.address}
              onChange={(e) => setNewVendor({ ...newVendor, address: e.target.value })}
              required
              placeholder="e.g. 24 Homi Mody Street, Fort"
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">City *</label>
              <input
                type="text"
                value={newVendor.city}
                onChange={(e) => setNewVendor({ ...newVendor, city: e.target.value })}
                required
                placeholder="Mumbai"
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">State *</label>
              <input
                type="text"
                value={newVendor.state}
                onChange={(e) => setNewVendor({ ...newVendor, state: e.target.value })}
                required
                placeholder="Maharashtra"
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">State Code *</label>
              <input
                type="text"
                value={newVendor.stateCode}
                onChange={(e) => setNewVendor({ ...newVendor, stateCode: e.target.value })}
                required
                maxLength={2}
                placeholder="27"
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
            >
              {isSubmitting ? 'Registering...' : 'Register Vendor Master'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
