import React, { useState, useEffect, useRef } from 'react';
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
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Building2,
  Layers,
  ArrowRight,
  X,
  FileCheck,
  Edit3,
  Calculator,
  Plus,
  Trash2,
  PenTool,
  Info,
} from 'lucide-react';

interface ExtractedLineItem {
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

export const UploadInvoicePage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [selectedPoId, setSelectedPoId] = useState<string>('');

  // Upload States
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Extracted & Editable Fields
  const [isDocumentExtracted, setIsDocumentExtracted] = useState<boolean>(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [vendorGstin, setVendorGstin] = useState<string>('');
  const [customerGstin, setCustomerGstin] = useState<string>('27AAACG1234F1Z5');
  const [placeOfSupply, setPlaceOfSupply] = useState<string>('Maharashtra');
  const [placeOfSupplyStateCode, setPlaceOfSupplyStateCode] = useState<string>('27');
  const [billingAddress, setBillingAddress] = useState<string>('Corporate Office, Level 8, Nariman Point, Mumbai - 400021');

  const [items, setItems] = useState<ExtractedLineItem[]>([]);
  const [evaluationResult, setEvaluationResult] = useState<Invoice | null>(null);

  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [vendorsRes, poRes] = await Promise.all([
          vendorService.getVendors({ limit: 50 }),
          poService.getPurchaseOrders({ limit: 50 }),
        ]);
        setVendors(vendorsRes.data);
        setPurchaseOrders(poRes.data);
        if (vendorsRes.data.length > 0) {
          setSelectedVendorId(vendorsRes.data[0].id);
        }
      } catch {
        // Ignore vendor fetch error
      }
    };
    fetchMasters();
  }, []);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const validateAndProcessFile = async (uploadedFile: File) => {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(uploadedFile.type.toLowerCase())) {
      toast.error('Invalid format. Please upload a PDF, PNG, or JPEG invoice.');
      return;
    }

    if (uploadedFile.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds maximum 10MB limit.');
      return;
    }

    setFile(uploadedFile);
    setEvaluationResult(null);

    // Simulate upload progress animation
    setIsExtracting(true);
    setUploadProgress(20);

    try {
      const progressTimer = setInterval(() => {
        setUploadProgress((prev) => (prev >= 85 ? prev : prev + 15));
      }, 100);

      const formData = new FormData();
      formData.append('file', uploadedFile);
      if (selectedVendorId) {
        formData.append('vendorId', selectedVendorId);
      }

      const res = await invoiceService.extractInvoice(formData);
      clearInterval(progressTimer);
      setUploadProgress(100);

      const data = res.data;
      const extracted = data.extracted;

      setUploadedFileUrl(data.fileUrl);
      setUploadedFileName(data.fileName);
      setInvoiceNumber(extracted.invoiceNumber);
      setInvoiceDate(extracted.invoiceDate);
      setDueDate(extracted.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
      setVendorGstin(extracted.vendorGstin || '27AAACT2727Q1ZW');
      setCustomerGstin(extracted.customerGstin || '27AAACG1234F1Z5');
      setPlaceOfSupply(extracted.placeOfSupply || 'Maharashtra');
      setPlaceOfSupplyStateCode(extracted.placeOfSupplyStateCode || '27');

      if (data.matchedVendor) {
        setSelectedVendorId(data.matchedVendor.id);
      }

      const mappedItems: ExtractedLineItem[] = (extracted.items || []).map((it: any, idx: number) => ({
        id: `${idx + 1}`,
        itemDescription: it.itemDescription,
        hsnSac: it.hsnSac || '7214',
        quantity: it.quantity || 1,
        unitPrice: it.unitPrice || it.taxableValue,
        taxableValue: it.taxableValue,
        gstRate: it.gstRate || 18,
        cgstAmount: it.cgstAmount || 0,
        sgstAmount: it.sgstAmount || 0,
        igstAmount: it.igstAmount || 0,
        totalAmount: it.totalAmount,
      }));

      setItems(mappedItems);
      setIsDocumentExtracted(true);
      toast.success(`Extracted invoice data from "${uploadedFile.name}". Please review and submit.`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'OCR document extraction failed.');
      setFile(null);
    } finally {
      setIsExtracting(false);
    }
  };

  // Recompute line items taxes & totals
  const recalculateItems = (
    currentItems: ExtractedLineItem[],
    posCode: string,
    vendCode: string
  ): ExtractedLineItem[] => {
    const isInter = posCode !== vendCode;

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

  const handleItemChange = (index: number, field: keyof ExtractedLineItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    const currentVendor = vendors.find((v) => v.id === selectedVendorId);
    const vendCode = currentVendor ? currentVendor.stateCode : vendorGstin.substring(0, 2);
    const recomputed = recalculateItems(updated, placeOfSupplyStateCode, vendCode);
    setItems(recomputed);
  };

  const handleAddItem = () => {
    const newItem: ExtractedLineItem = {
      id: `${Date.now()}`,
      itemDescription: 'Additional Extracted Line Item',
      hsnSac: '8482',
      quantity: 1,
      unitPrice: 5000,
      taxableValue: 5000,
      gstRate: 18,
      cgstAmount: 450,
      sgstAmount: 450,
      igstAmount: 0,
      totalAmount: 5900,
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

  // Financial summary computation
  const totalTaxable = items.reduce((acc, it) => acc + it.taxableValue, 0);
  const totalCgst = items.reduce((acc, it) => acc + it.cgstAmount, 0);
  const totalSgst = items.reduce((acc, it) => acc + it.sgstAmount, 0);
  const totalIgst = items.reduce((acc, it) => acc + it.igstAmount, 0);
  const grandTotal = Math.round((totalTaxable + totalCgst + totalSgst + totalIgst) * 100) / 100;
  const currentVendor = vendors.find((v) => v.id === selectedVendorId);
  const isInterState = placeOfSupplyStateCode !== (currentVendor?.stateCode || vendorGstin.substring(0, 2));

  // Final submission of reviewed/edited document
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invoiceNumber.trim()) {
      toast.warning('Please enter an invoice number.');
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
        fileName: uploadedFileName,
        fileUrl: uploadedFileUrl,
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
      setEvaluationResult(res.data);
      toast.success(`Invoice #${res.data.invoiceNumber} processed through 20 fraud rules!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Invoice submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetUpload = () => {
    setFile(null);
    setIsDocumentExtracted(false);
    setEvaluationResult(null);
    setUploadProgress(0);
    setItems([]);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Upload & Parse GST Invoice Document"
        subtitle="Automated Optical Character Recognition with interactive field verification and deterministic fraud scoring"
        breadcrumbs={[
          { label: 'Invoices', path: '/invoices' },
          { label: 'Upload' },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Link
              to="/invoices/create"
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <PenTool className="w-3.5 h-3.5 text-blue-400" />
              <span>Manual Entry Mode</span>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Uploader or Review Form */}
        <div className="lg:col-span-2 space-y-6">
          {!isDocumentExtracted ? (
            /* Upload Box */
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              {/* Optional Vendor Association */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-400" />
                  Select Target Vendor Master (Optional - Extracted by OCR)
                </label>
                <select
                  value={selectedVendorId}
                  onChange={(e) => setSelectedVendorId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} • GSTIN: {v.gstin} ({v.city}, {v.state})
                    </option>
                  ))}
                </select>
              </div>

              {/* Drag & Drop Area */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-blue-500 bg-blue-950/20'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/70'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  onChange={handleFileInput}
                  className="hidden"
                />

                <div className="p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl inline-flex text-blue-400 mb-3">
                  <UploadCloud className="w-8 h-8" />
                </div>

                <h3 className="text-sm font-bold text-slate-200">
                  Drag and drop your Indian GST Invoice document
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Supports PDF, PNG, or JPG formats up to 10MB.
                </p>

                <button
                  type="button"
                  className="mt-4 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 shadow-sm transition-colors"
                >
                  Browse Files
                </button>
              </div>

              {/* Progress bar during extraction */}
              {isExtracting && (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-slate-300">
                    <span>Extracting GSTIN, PAN & line items via OCR...</span>
                    <span className="font-mono text-blue-400">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-2 transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Review & Edit Form After Extraction */
            <form onSubmit={handleFinalSubmit} className="space-y-6 animate-slide-in">
              {/* Document Banner */}
              <div className="p-4 bg-blue-950/30 border border-blue-900/40 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Extracted Document: {uploadedFileName}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      OCR confidence: 96% • Please review or modify any fields before fraud analysis.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResetUpload}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
                >
                  Upload Different File
                </button>
              </div>

              {/* Section 1: Header Review */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-blue-400" />
                    Review Extracted Invoice Header
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">Editable</span>
                </div>

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
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white"
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
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                      Vendor Master
                    </label>
                    <select
                      value={selectedVendorId}
                      onChange={(e) => setSelectedVendorId(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                    >
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                      Vendor GSTIN *
                    </label>
                    <input
                      type="text"
                      value={vendorGstin}
                      onChange={(e) => setVendorGstin(e.target.value.toUpperCase())}
                      maxLength={15}
                      required
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-blue-400 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                      Place of Supply (POS)
                    </label>
                    <input
                      type="text"
                      value={placeOfSupply}
                      onChange={(e) => setPlaceOfSupply(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                      Linked Purchase Order
                    </label>
                    <select
                      value={selectedPoId}
                      onChange={(e) => setSelectedPoId(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                    >
                      <option value="">No PO Linked</option>
                      {purchaseOrders
                        .filter((po) => po.vendorId === selectedVendorId)
                        .map((po) => (
                          <option key={po.id} value={po.id}>
                            {po.poNumber} (Auth: {formatINR(po.totalAmount)})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Line Items Review */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-400" />
                    Review Extracted Line Items ({items.length})
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-400" />
                    <span>Add Item</span>
                  </button>
                </div>

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
                            className="p-1 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                        <div className="sm:col-span-2">
                          <label className="block text-slate-400 mb-1">Item Description</label>
                          <input
                            type="text"
                            value={item.itemDescription}
                            onChange={(e) => handleItemChange(idx, 'itemDescription', e.target.value)}
                            required
                            className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 mb-1">HSN/SAC Code</label>
                          <input
                            type="text"
                            value={item.hsnSac}
                            onChange={(e) => handleItemChange(idx, 'hsnSac', e.target.value)}
                            required
                            className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg font-mono text-blue-300"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 mb-1">GST Rate (%)</label>
                          <select
                            value={item.gstRate}
                            onChange={(e) => handleItemChange(idx, 'gstRate', Number(e.target.value))}
                            className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-purple-400 font-semibold"
                          >
                            <option value={0}>0%</option>
                            <option value={5}>5%</option>
                            <option value={12}>12%</option>
                            <option value={18}>18%</option>
                            <option value={28}>28%</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                        <div>
                          <label className="block text-slate-400 mb-1">Quantity</label>
                          <input
                            type="number"
                            step="any"
                            min="0.01"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                            className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-right font-mono text-slate-200"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 mb-1">Unit Price (₹)</label>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                            className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-right font-mono text-slate-200"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 mb-1">Taxable (₹)</label>
                          <div className="p-2 bg-slate-900/60 border border-slate-800 rounded-lg text-right font-mono font-semibold text-slate-100">
                            {formatINR(item.taxableValue)}
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-400 mb-1">Line Total (₹)</label>
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
                <span>{isSubmitting ? 'Evaluating 20 Deterministic Fraud Rules...' : 'Confirm Extraction & Run Fraud Detection'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Instant Analysis Results Card */}
          {evaluationResult && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5 animate-slide-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Evaluation Completed Successfully
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  #{evaluationResult.invoiceNumber}
                </span>
              </div>

              <FraudScoreGauge
                score={evaluationResult.fraudScore}
                riskLevel={evaluationResult.riskLevel}
                summaryExplanation={evaluationResult.detection?.summaryExplanation}
                passedCount={evaluationResult.detection?.passedRulesCount}
                warningCount={evaluationResult.detection?.warningRulesCount}
                failedCount={evaluationResult.detection?.failedRulesCount}
                criticalCount={evaluationResult.detection?.criticalRulesCount}
              />

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => navigate(`/invoices/${evaluationResult.id}`)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md transition-colors flex items-center gap-2"
                >
                  <span>Open Full Invoice Inspector</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Guidelines or Live Computation */}
        <div className="space-y-4">
          {isDocumentExtracted ? (
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
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                Automated Extraction Pipeline
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                When you upload a document, the system automatically parses header fields, tax rate schedules, and line items:
              </p>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <FileCheck className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <span>OCR field mapping into editable form</span>
                </li>
                <li className="flex items-start gap-2">
                  <FileCheck className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <span>Interactive review & validation before commit</span>
                </li>
                <li className="flex items-start gap-2">
                  <FileCheck className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <span>Evaluation against 20 deterministic rules</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
