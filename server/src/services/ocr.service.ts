import path from 'path';

export interface ParsedLineItem {
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

export interface ParsedInvoiceDocument {
  invoiceNumber: string;
  vendorGstin?: string;
  vendorName?: string;
  customerGstin?: string;
  invoiceDate: string; // ISO / YYYY-MM-DD
  dueDate?: string;
  placeOfSupply?: string;
  placeOfSupplyStateCode?: string;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTaxAmount: number;
  grandTotal: number;
  isInterState: boolean;
  items: ParsedLineItem[];
  confidenceScore: number; // 0.0 to 1.0 OCR confidence
  rawExtractedText?: string;
}

export interface IOCRService {
  parseInvoice(filePath: string, originalFilename: string): Promise<ParsedInvoiceDocument>;
}

/**
 * Service abstraction for Optical Character Recognition & PDF Parsing.
 * Simulates intelligent document extraction from Indian GST Invoices.
 * Architecture is ready to plug in Tesseract.js, Google Cloud Document AI, or AWS Textract.
 */
export class SimulatedOCRService implements IOCRService {
  public async parseInvoice(
    filePath: string,
    originalFilename: string
  ): Promise<ParsedInvoiceDocument> {
    const ext = path.extname(originalFilename).toLowerCase();
    const cleanBaseName = path.basename(originalFilename, ext).replace(/[^a-zA-Z0-9_-]/g, '_');

    // Simulate OCR processing latency (200ms)
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Simulated standard extracted Indian GST Invoice structure
    const invoiceNumber = `INV/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;
    const today = new Date();
    const invoiceDate = today.toISOString().split('T')[0];

    const taxableAmount = 150000;
    const gstRate = 18;
    const isInterState = false;
    const totalTax = (taxableAmount * gstRate) / 100;
    const cgstAmount = isInterState ? 0 : totalTax / 2;
    const sgstAmount = isInterState ? 0 : totalTax / 2;
    const igstAmount = isInterState ? totalTax : 0;
    const grandTotal = taxableAmount + totalTax;

    return {
      invoiceNumber,
      vendorGstin: '27AAACT2727Q1ZW',
      vendorName: 'Tata Steel Supplies Ltd',
      customerGstin: '27AAACG1234F1Z5',
      invoiceDate,
      placeOfSupply: 'Maharashtra',
      placeOfSupplyStateCode: '27',
      taxableAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalTaxAmount: totalTax,
      grandTotal,
      isInterState,
      confidenceScore: 0.96,
      rawExtractedText: `TAX INVOICE\nInvoice No: ${invoiceNumber}\nDate: ${invoiceDate}\nGSTIN: 27AAACT2727Q1ZW\nPlace of Supply: Maharashtra (27)\nTotal Taxable: INR 1,50,000.00\nCGST (9%): INR 13,500.00\nSGST (9%): INR 13,500.00\nGrand Total: INR 1,77,000.00`,
      items: [
        {
          itemDescription: 'High Grade Structural Steel Reinforcement Bars',
          hsnSac: '7214',
          quantity: 2.5,
          unitPrice: 60000,
          taxableValue: taxableAmount,
          gstRate,
          cgstAmount,
          sgstAmount,
          igstAmount,
          totalAmount: grandTotal,
        },
      ],
    };
  }
}

export const ocrService: IOCRService = new SimulatedOCRService();
