import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { FraudScoreGauge } from '../components/fraud/FraudScoreGauge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { invoiceService } from '../services/invoice.service';
import { vendorService } from '../services/vendor.service';
import { poService } from '../services/po.service';
import { useToast } from '../context/ToastContext';
import { Vendor, PurchaseOrder, Invoice } from '../types';
import { formatINR } from '../utils/formatters';
import {
  FilePlus,
  Building2,
  Calendar,
  Layers,
  Plus,
  Trash2,
  Calculator,
  ShieldAlert,
  ArrowRight,
  Upload,
  CheckCircle2,
  FileCheck,
  Info,
} from 'lucide-react';

interface ManualLineItem {
  id: string;
  itemDescription: string;
  hsnSac: string;
  quantity: number;
  unitPrice: number;
  taxableValue: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
}

export const CreateManualInvoicePage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [isLoadingMasters, setIsLoadingMasters] = useState<boolean>(true);

  // Form Header State
  const [invoiceNumber, setInvoiceNumber] = useState(`INV/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`);
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [selectedPoId, setSelectedPoId] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
  const [vendorGstin, setVendorGstin] = useState('');
  const [vendorPan, setVendorPan] = useState('');
  const [customerGstin, setCustomerGstin] = useState('27AAACG1234F1Z5');
  const [placeOfSupply, setPlaceOfSupply] = useState('Maharashtra');
  const [placeOfSupplyStateCode, setPlaceOfSupplyStateCode] = useState('27');
  const [billingAddress, setBillingAddress] = useState('Corporate Office, Level 8, Nariman Point, Mumbai - 400021');
  const [notes, setNotes] = useState('');

  // Line Items State
  const [items, setItems] = useState<ManualLineItem[]>([
    {
      id: '1',
      itemDescription: 'Industrial Consumables & Fasteners',
      hsnSac: '7318',
      quantity: 10,
      unitPrice: 5000,
      taxableValue: 50000,
      gstRate: 18,
      cgstAmount: 4500,
      sgstAmount: 4500,
      igstAmount: 0,
      totalAmount: 59000,
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdResult, setCreatedResult] = useState<Invoice | null>(null);

  // Load Vendor & PO masters
  useEffect(() => {
    const fetchMasters = async () => {
      try {
        setIsLoadingMasters(true);
        const [vendorsRes, poRes] = await Promise.all([
          vendorService.getVendors({ limit: 50 }),
          poService.getPurchaseOrders({ limit: 50 }),
        ]);
        setVendors(vendorsRes.data);
        setPurchaseOrders(poRes.data);

        if (vendorsRes.data.length > 0) {
          const first = vendorsRes.data[0];
          setSelectedVendorId(first.id);
          setVendorGstin(first.gstin);
          setVendorPan(first.pan || first.gstin.substring(2, 12));
          setPlaceOfSupply(first.state || 'Maharashtra');
          setPlaceOfSupplyStateCode(first.stateCode || first.gstin.substring(0, 2));
        }
      } catch {
        toast.error('Failed to load vendor masters.');
      } finally {
        setIsLoadingMasters(false);
      }
    };
    fetchMasters();
  }, []);

  // When vendor changes, auto-populate vendor details
  const handleVendorChange = (vendorId: string) => {
    setSelectedVendorId(vendorId);
    const v = vendors.find((vend) => vend.id === vendorId);
    if (v) {
      setVendorGstin(v.gstin);
      setVendorPan(v.pan || v.gstin.substring(2, 12));
      setPlaceOfSupply(v.state || 'Maharashtra');
      setPlaceOfSupplyStateCode(v.stateCode || v.gstin.substring(0, 2));
    }
  };

  // Recompute line item taxes & totals
  const recalculateItems = (
    currentItems: ManualLineItem[],
    posCode: string,
    vendStateCode: string
  ): ManualLineItem[] => {
    const isInter = posCode !== vendStateCode;

    return currentItems.map((item) => {
      const taxable = Math.round(item.quantity * item.unitPrice * 100) / 100;
      const totalTax = Math.round(((taxable * item.gstRate) / 100) * 100) / 100;
      const cgst = isInter ? 0 : Math.round((totalTax / 2) * 100) / 100;
      const sgst = isInter ? 0 : Math.round((totalTax / 2) * 100) / 100;
      const igst = isInter ? totalTax : 0;
      const total = Math.round((taxable + cgst + sgst + igst) * 100) / 100;

      return {
        ...item,
        taxableValue: taxable,
        cgstAmount: cgst,
        sgstAmount: sgst,
        igstAmount: igst,
        totalAmount: total,
      };
    });
  };

  // Handle line item field change
  const handleItemChange = (index: number, field: keyof ManualLineItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    const currentVendor = vendors.find((v) => v.id === selectedVendorId);
    const vendCode = currentVendor ? currentVendor.stateCode : vendorGstin.substring(0, 2);
    const recomputed = recalculateItems(updated, placeOfSupplyStateCode, vendCode);
    setItems(recomputed);
  };

  const handleAddItem = () => {
    const newItem: ManualLineItem = {
      id: `${Date.now()}`,
      itemDescription: 'Standard Engineering Supplies',
      hsnSac: '8482',
      quantity: 1,
      unitPrice: 10000,
      taxableValue: 10000,
      gstRate: 18,
      cgstAmount: 900,
      sgstAmount: 900,
      igstAmount: 0,
      totalAmount: 11800,
    };
    const currentVendor = vendors.find((v) => v.id === selectedVendorId);
    const vendCode = currentVendor ? currentVendor.stateCode : vendorGstin.substring(0, 2);
    const recomputed = recalculateItems([...items, newItem], placeOfSupplyStateCode, vendCode);
    setItems(recomputed);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      toast.warning('An invoice must have at least one line item.');
      return;
    }
    const filtered = items.filter((_, i) => i !== index);
    setItems(filtered);
  };

  // Calculations for summary
  const totalTaxable = items.reduce((acc, it) => acc + it.taxableValue, 0);
  const totalCgst = items.reduce((acc, it) => acc + it.cgstAmount, 0);
  const totalSgst = items.reduce((acc, it) => acc + it.sgstAmount, 0);
  const totalIgst = items.reduce((acc, it) => acc + it.igstAmount, 0);
  const grandTotal = Math.round((totalTaxable + totalCgst + totalSgst + totalIgst) * 100) / 100;
  const currentVendor = vendors.find((v) => v.id === selectedVendorId);
  const isInterState = placeOfSupplyStateCode !== (currentVendor?.stateCode || vendorGstin.substring(0, 2));

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invoiceNumber.trim()) {
      toast.warning('Please enter an invoice number.');
      return;
    }
    if (!selectedVendorId) {
      toast.warning('Please select a vendor.');
      return;
    }
    if (vendorGstin.length !== 15) {
      toast.warning('Vendor GSTIN must be exactly 15 characters.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        invoiceNumber: invoiceNumber.trim(),
        vendorId: selectedVendorId,
        purchaseOrderId: selectedPoId || undefined,
        invoiceDate,
        dueDate,
        vendorGstin: vendorGstin.trim().toUpperCase(),
        customerGstin: customerGstin.trim().toUpperCase(),
        placeOfSupply,
        placeOfSupplyStateCode,
        billingAddress,
        taxableAmount: totalTaxable,
        cgstAmount: totalCgst,
        sgstAmount: totalSgst,
        igstAmount: totalIgst,
        grandTotal,
        isInterState,
        items: items.map((it) => ({
          itemDescription: it.itemDescription,
          hsnSac: it.hsnSac,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
          taxableValue: Number(it.taxableValue),
          gstRate: Number(it.gstRate),
          cgstAmount: Number(it.cgstAmount),
          sgstAmount: Number(it.sgstAmount),
          igstAmount: Number(it.igstAmount),
          totalAmount: Number(it.totalAmount),
        })),
      };

      const res = await invoiceService.createInvoice(payload);
      setCreatedResult(res.data);
      toast.success(`Invoice #${res.data.invoiceNumber} created and evaluated for fraud!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Invoice creation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingMasters) {
    return <LoadingSpinner fullHeight label="Loading Indian master registries..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manual GST Invoice Entry"
        subtitle="Create and submit Indian GST invoices with real-time tax calculation and automated fraud analysis"
        breadcrumbs={[
          { label: 'Invoices', path: '/invoices' },
          { label: 'Manual Entry' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Link
              to="/invoices/upload"
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5 text-blue-400" />
              <span>Switch to Document Upload</span>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: The Multi-Section Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Statutory Header & Vendor Selection */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  1. Statutory GST & Vendor Details
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  Indian GST Invoice Header
                </span>
              </div>

              {/* Vendor Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Select Registered Vendor Master *
                </label>
                <select
                  value={selectedVendorId}
                  onChange={(e) => handleVendorChange(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} • GSTIN: {v.gstin} ({v.city}, {v.state})
                    </option>
                  ))}
                </select>
              </div>

              {/* Invoice Number & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Invoice Number *
                  </label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    required
                    placeholder="INV/2026/001"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Invoice Date *
                  </label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Payment Due Date
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* GSTIN and PAN Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Vendor GSTIN (15 Digits) *
                  </label>
                  <input
                    type="text"
                    value={vendorGstin}
                    onChange={(e) => setVendorGstin(e.target.value.toUpperCase())}
                    maxLength={15}
                    required
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-blue-400 font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Vendor PAN
                  </label>
                  <input
                    type="text"
                    value={vendorPan}
                    onChange={(e) => setVendorPan(e.target.value.toUpperCase())}
                    maxLength={10}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Linked Purchase Order
                  </label>
                  <select
                    value={selectedPoId}
                    onChange={(e) => setSelectedPoId(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">No PO Linked (Direct Invoice)</option>
                    {purchaseOrders
                      .filter((po) => po.vendorId === selectedVendorId)
                      .map((po) => (
                        <option key={po.id} value={po.id}>
                          {po.poNumber} (Authorized: {formatINR(po.totalAmount)})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Place of Supply & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Place of Supply (POS) State *
                  </label>
                  <input
                    type="text"
                    value={placeOfSupply}
                    onChange={(e) => setPlaceOfSupply(e.target.value)}
                    required
                    placeholder="Maharashtra"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    POS State Code (2 Digits) *
                  </label>
                  <input
                    type="text"
                    value={placeOfSupplyStateCode}
                    onChange={(e) => {
                      setPlaceOfSupplyStateCode(e.target.value);
                      const recomputed = recalculateItems(items, e.target.value, currentVendor?.stateCode || '27');
                      setItems(recomputed);
                    }}
                    maxLength={2}
                    required
                    placeholder="27"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Dynamic Line Items */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-400" />
                    2. Line Items & HSN/SAC Tax Schedule
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isInterState ? 'Inter-State Supply (IGST Applicable)' : 'Intra-State Supply (CGST + SGST 50/50 Split)'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-400" />
                  <span>Add Line Item</span>
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono text-slate-400">
                        Item #{idx + 1}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                      <div className="sm:col-span-2">
                        <label className="block text-slate-400 mb-1 font-medium">Item Description *</label>
                        <input
                          type="text"
                          value={item.itemDescription}
                          onChange={(e) => handleItemChange(idx, 'itemDescription', e.target.value)}
                          required
                          placeholder="e.g. Structural Steel Beams"
                          className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 font-medium">HSN/SAC Code *</label>
                        <input
                          type="text"
                          value={item.hsnSac}
                          onChange={(e) => handleItemChange(idx, 'hsnSac', e.target.value)}
                          required
                          placeholder="7214"
                          className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg font-mono text-blue-300"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 font-medium">GST Rate (%)</label>
                        <select
                          value={item.gstRate}
                          onChange={(e) => handleItemChange(idx, 'gstRate', Number(e.target.value))}
                          className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-purple-400 font-semibold"
                        >
                          <option value={0}>0% (Exempt)</option>
                          <option value={5}>5% (Basic)</option>
                          <option value={12}>12% (Standard 1)</option>
                          <option value={18}>18% (Standard 2)</option>
                          <option value={28}>28% (Luxury)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                      <div>
                        <label className="block text-slate-400 mb-1 font-medium">Quantity</label>
                        <input
                          type="number"
                          step="any"
                          min="0.01"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                          required
                          className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-right font-mono text-slate-200"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 font-medium">Unit Price (₹)</label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                          required
                          className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-right font-mono text-slate-200"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 font-medium">Taxable (₹)</label>
                        <div className="p-2 bg-slate-900/60 border border-slate-800/80 rounded-lg text-right font-mono font-semibold text-slate-100">
                          {formatINR(item.taxableValue)}
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 font-medium">Line Total (₹)</label>
                        <div className="p-2 bg-blue-950/40 border border-blue-900/50 rounded-lg text-right font-mono font-bold text-blue-400">
                          {formatINR(item.totalAmount)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <span>{isSubmitting ? 'Evaluating 20 Deterministic Fraud Rules...' : 'Submit Invoice & Run Fraud Detection Engine'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Instant Analysis Results Card */}
          {createdResult && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5 animate-slide-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Invoice Created & Evaluated Successfully
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  #{createdResult.invoiceNumber}
                </span>
              </div>

              <FraudScoreGauge
                score={createdResult.fraudScore}
                riskLevel={createdResult.riskLevel}
                summaryExplanation={createdResult.detection?.summaryExplanation}
                passedCount={createdResult.detection?.passedRulesCount}
                warningCount={createdResult.detection?.warningRulesCount}
                failedCount={createdResult.detection?.failedRulesCount}
                criticalCount={createdResult.detection?.criticalRulesCount}
              />

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => navigate(`/invoices/${createdResult.id}`)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md transition-colors flex items-center gap-2"
                >
                  <span>Open Full Invoice Inspector</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Real-time Live GST Financial Summary */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4 sticky top-20">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-400" />
                Live GST Computation
              </h4>
              <span className="text-[10px] font-mono text-slate-400">₹ INR</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>Supply Classification:</span>
                <span className="font-semibold text-purple-400">
                  {isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800/60">
                <span>Total Taxable Value:</span>
                <span className="font-mono font-bold text-slate-100">{formatINR(totalTaxable)}</span>
              </div>

              {!isInterState ? (
                <>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Central GST (CGST 50%):</span>
                    <span className="font-mono text-slate-200">{formatINR(totalCgst)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>State GST (SGST 50%):</span>
                    <span className="font-mono text-slate-200">{formatINR(totalSgst)}</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between text-slate-400">
                  <span>Integrated GST (IGST 100%):</span>
                  <span className="font-mono text-slate-200">{formatINR(totalIgst)}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800/60">
                <span>Total Tax Charged:</span>
                <span className="font-mono font-bold text-blue-400">
                  {formatINR(totalCgst + totalSgst + totalIgst)}
                </span>
              </div>

              <div className="p-3.5 bg-blue-950/30 border border-blue-900/40 rounded-xl flex items-center justify-between mt-2">
                <span className="font-bold text-blue-300">Grand Total (₹):</span>
                <span className="font-mono font-extrabold text-base text-blue-400">
                  {formatINR(grandTotal)}
                </span>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-400 leading-relaxed border-t border-slate-800 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
              <span>
                Both manual and uploaded invoices are processed through the identical 20-rule deterministic fraud engine.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
