export type RuleStatus = 'PASS' | 'WARNING' | 'FAIL' | 'CRITICAL';

export type RuleCategory =
  | 'DUPLICATE'
  | 'GST_VALIDATION'
  | 'TAX_VALIDATION'
  | 'AMOUNT_ANOMALY'
  | 'DATE_ANOMALY'
  | 'VENDOR_RISK'
  | 'PO_MATCHING'
  | 'MANIPULATION';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface InvoiceItemData {
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

export interface InvoiceData {
  id?: string;
  invoiceNumber: string;
  vendorId: string;
  purchaseOrderId?: string | null;
  invoiceDate: Date;
  dueDate?: Date | null;
  vendorGstin: string;
  customerGstin: string;
  placeOfSupply: string;
  placeOfSupplyStateCode: string;
  billingAddress: string;
  shippingAddress?: string | null;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTaxAmount: number;
  grandTotal: number;
  roundOff?: number;
  isInterState: boolean;
}

export interface VendorData {
  id: string;
  name: string;
  legalName: string;
  gstin: string;
  pan: string;
  state: string;
  stateCode: string;
  isVerified: boolean;
  riskScore: number;
  totalInvoicesCount: number;
  totalAmountBilled: number;
  fraudFlagCount: number;
}

export interface PurchaseOrderItemData {
  id: string;
  description: string;
  hsnSac: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  totalAmount: number;
}

export interface PurchaseOrderData {
  id: string;
  poNumber: string;
  vendorId: string;
  issueDate: Date;
  totalAmount: number;
  status: string;
  items?: PurchaseOrderItemData[];
}

export interface HistoricalInvoiceRecord {
  id: string;
  invoiceNumber: string;
  grandTotal: number;
  taxableAmount: number;
  invoiceDate: Date;
  status: string;
  fraudScore: number;
}

export interface EvaluationContext {
  invoice: InvoiceData;
  items: InvoiceItemData[];
  vendor?: VendorData | null;
  purchaseOrder?: PurchaseOrderData | null;
  historicalInvoices?: HistoricalInvoiceRecord[];
  allVendorInvoices?: HistoricalInvoiceRecord[];
  systemSettings?: Record<string, string>;
}

export interface RuleResult {
  ruleCode: string;
  ruleCategory: RuleCategory;
  ruleName: string;
  status: RuleStatus;
  scoreContribution: number; // 0 for PASS, positive number for penalty
  details: string;
  detectedValue?: string;
  expectedValue?: string;
}

export interface FraudRule {
  code: string;
  category: RuleCategory;
  name: string;
  description: string;
  evaluate(context: EvaluationContext): Promise<RuleResult> | RuleResult;
}

export interface FraudEvaluationResult {
  overallScore: number; // Capped 0 - 100
  riskLevel: RiskLevel;
  passedRulesCount: number;
  warningRulesCount: number;
  failedRulesCount: number;
  criticalRulesCount: number;
  summaryExplanation: string;
  ruleResults: RuleResult[];
  shouldGenerateAlert: boolean;
  suggestedAlert?: {
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    title: string;
    description: string;
  };
}
