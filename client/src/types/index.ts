export type UserRole = 'ADMIN' | 'AUDITOR' | 'FINANCE_USER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  createdAt: string;
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type InvoiceStatus = 'PENDING' | 'VERIFIED' | 'SUSPICIOUS' | 'FLAGGED_FRAUD' | 'REJECTED';
export type RuleStatus = 'PASS' | 'WARNING' | 'FAIL' | 'CRITICAL' | 'NOT_CHECKED';
export type AlertStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED';

export interface Vendor {
  id: string;
  name: string;
  legalName?: string;
  gstin: string;
  pan: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  bankAccountNumber?: string | null;
  bankIfsc?: string | null;
  bankName?: string | null;
  isVerified: boolean;
  riskScore: number;
  totalInvoicesCount: number;
  totalAmountBilled: number;
  fraudFlagCount: number;
  createdAt: string;
  updatedAt?: string;
  _count?: {
    invoices: number;
    purchaseOrders?: number;
  };
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  description: string;
  hsnSac: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  totalAmount: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorId: string;
  issueDate: string;
  deliveryDate?: string | null;
  totalAmount: number;
  status: 'OPEN' | 'FULFILLED' | 'CANCELLED';
  notes?: string | null;
  vendor?: Vendor;
  items?: PurchaseOrderItem[];
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
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

export interface FraudRuleResult {
  id: string;
  ruleCode: string;
  ruleCategory: string;
  ruleName: string;
  status: RuleStatus;
  scoreContribution: number;
  details?: string | null;
  detectedValue?: string | null;
  expectedValue?: string | null;
}

export interface FraudDetection {
  id: string;
  invoiceId: string;
  overallScore: number;
  riskLevel: RiskLevel;
  passedRulesCount: number;
  warningRulesCount: number;
  failedRulesCount: number;
  criticalRulesCount: number;
  summaryExplanation?: string | null;
  evaluatedAt: string;
  ruleResults: FraudRuleResult[];
}

export interface FraudAlert {
  id: string;
  invoiceId: string;
  alertType: string;
  severity: RiskLevel;
  title: string;
  description: string;
  status: AlertStatus;
  assignedToId?: string | null;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  resolutionNotes?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
  invoice?: {
    id: string;
    invoiceNumber: string;
    grandTotal: number;
    fraudScore: number;
    riskLevel: RiskLevel;
    status: InvoiceStatus;
    vendor: {
      id: string;
      name: string;
      gstin: string;
    };
  };
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  vendorId: string;
  vendor: Vendor;
  purchaseOrderId?: string | null;
  purchaseOrder?: PurchaseOrder | null;
  invoiceDate: string;
  dueDate?: string | null;
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
  roundOff: number;
  isInterState: boolean;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  status: InvoiceStatus;
  fraudScore: number;
  riskLevel: RiskLevel;
  reviewedById?: string | null;
  reviewedBy?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: InvoiceItem[];
  detection?: FraudDetection | null;
  alerts?: FraudAlert[];
  auditLogs?: AuditLog[];
  _count?: {
    items: number;
    alerts: number;
  };
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  invoiceId?: string | null;
  invoice?: {
    id: string;
    invoiceNumber: string;
    grandTotal: number;
    riskLevel: RiskLevel;
  } | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  previousState?: string | null;
  newState?: string | null;
  details: string;
  ipAddress?: string | null;
  timestamp: string;
}

export interface DashboardStats {
  totalInvoices: number;
  totalInvoiceValue: number;
  verifiedInvoices: number;
  suspiciousInvoices: number;
  fraudulentInvoices: number;
  rejectedInvoices?: number;
  pendingReviews: number;
  highRiskInvoices?: number;
  criticalRiskInvoices?: number;
  duplicateInvoices?: number;
  fraudRate: number;
  totalAmountAtRisk: number;
  openAlerts: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
    lowAmount?: number;
    mediumAmount?: number;
    highAmount?: number;
    criticalAmount?: number;
  };
  statusDistribution?: {
    pending: number;
    verified: number;
    suspicious: number;
    flaggedFraud: number;
    rejected: number;
  };
  amountAtRiskBreakdown?: {
    highRiskAmount: number;
    criticalRiskAmount: number;
    duplicateAmount: number;
    taxMismatchAmount: number;
    poMismatchAmount: number;
  };
  categoryStats?: {
    duplicateCount: number;
    duplicateAmount: number;
    taxMismatchCount: number;
    taxMismatchAmount: number;
    poMismatchCount: number;
    poMismatchAmount: number;
  };
  recentSuspiciousInvoices: Invoice[];
}

export interface MonthlyTrend {
  month: string;
  totalInvoices: number;
  totalValue: number;
  cleanInvoices: number;
  suspiciousInvoices: number;
  fraudulentInvoices: number;
  amountAtRisk: number;
}

export interface VendorRiskRanking {
  id: string;
  name: string;
  gstin: string;
  state: string;
  isVerified: boolean;
  totalInvoices: number;
  totalBilled: number;
  fraudFlagCount: number;
  highRiskInvoicesCount: number;
  averageFraudScore: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}
