import prisma from '../utils/prisma';
import { formatDateIndian, formatDateTimeIndian } from '../utils/formatters';

export class ReportService {
  public static async generateInvoiceCSV(filters: {
    status?: string;
    riskLevel?: string;
    vendorId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<string> {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.riskLevel) where.riskLevel = filters.riskLevel;
    if (filters.vendorId) where.vendorId = filters.vendorId;
    if (filters.startDate || filters.endDate) {
      where.invoiceDate = {};
      if (filters.startDate) where.invoiceDate.gte = new Date(filters.startDate);
      if (filters.endDate) where.invoiceDate.lte = new Date(filters.endDate);
    }

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { invoiceDate: 'desc' },
      include: {
        vendor: { select: { name: true, gstin: true, state: true } },
        purchaseOrder: { select: { poNumber: true } },
        detection: { select: { overallScore: true, riskLevel: true, summaryExplanation: true } },
      },
    });

    const headers = [
      'Invoice Number',
      'Invoice Date',
      'Vendor Name',
      'Vendor GSTIN',
      'Place of Supply',
      'PO Number',
      'Taxable Value (INR)',
      'CGST (INR)',
      'SGST (INR)',
      'IGST (INR)',
      'Total Tax (INR)',
      'Grand Total (INR)',
      'Status',
      'Fraud Score (0-100)',
      'Risk Level',
      'Audit Summary',
    ];

    const rows = invoices.map((inv) => {
      const summary = (inv.detection?.summaryExplanation || '').replace(/"/g, '""');
      return [
        `"${inv.invoiceNumber}"`,
        `"${formatDateIndian(inv.invoiceDate)}"`,
        `"${inv.vendor.name.replace(/"/g, '""')}"`,
        `"${inv.vendorGstin}"`,
        `"${inv.placeOfSupply}"`,
        `"${inv.purchaseOrder?.poNumber || 'N/A'}"`,
        inv.taxableAmount.toFixed(2),
        inv.cgstAmount.toFixed(2),
        inv.sgstAmount.toFixed(2),
        inv.igstAmount.toFixed(2),
        inv.totalTaxAmount.toFixed(2),
        inv.grandTotal.toFixed(2),
        `"${inv.status}"`,
        inv.fraudScore,
        `"${inv.riskLevel}"`,
        `"${summary}"`,
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\r\n');
  }

  public static async generateFraudRiskCSV(filters: {
    minScore?: number;
    riskLevel?: string;
  }): Promise<string> {
    const where: any = {
      riskLevel: { in: ['HIGH', 'CRITICAL'] },
    };
    if (filters.riskLevel) where.riskLevel = filters.riskLevel;
    if (filters.minScore !== undefined) where.fraudScore = { gte: filters.minScore };

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: [{ fraudScore: 'desc' }, { invoiceDate: 'desc' }],
      include: {
        vendor: { select: { name: true, gstin: true } },
        detection: {
          include: {
            ruleResults: {
              where: { status: { in: ['FAIL', 'CRITICAL', 'WARNING'] } },
            },
          },
        },
        alerts: true,
      },
    });

    const headers = [
      'Invoice Number',
      'Invoice Date',
      'Vendor Name',
      'Vendor GSTIN',
      'Grand Total (INR)',
      'Fraud Risk Score',
      'Risk Level',
      'Status',
      'Triggered Rule Violations',
      'Total Penalty Pts',
      'Audit Summary',
    ];

    const rows = invoices.map((inv) => {
      const triggeredRules = (inv.detection?.ruleResults || [])
        .map((r) => `${r.ruleCode}: ${r.ruleName} (+${r.scoreContribution}pts)`)
        .join('; ')
        .replace(/"/g, '""');
      const summary = (inv.detection?.summaryExplanation || '').replace(/"/g, '""');

      return [
        `"${inv.invoiceNumber}"`,
        `"${formatDateIndian(inv.invoiceDate)}"`,
        `"${inv.vendor.name.replace(/"/g, '""')}"`,
        `"${inv.vendorGstin}"`,
        inv.grandTotal.toFixed(2),
        inv.fraudScore,
        `"${inv.riskLevel}"`,
        `"${inv.status}"`,
        `"${triggeredRules}"`,
        inv.fraudScore,
        `"${summary}"`,
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\r\n');
  }

  public static async generateVendorRiskCSV(): Promise<string> {
    const vendors = await prisma.vendor.findMany({
      orderBy: [{ fraudFlagCount: 'desc' }, { riskScore: 'desc' }],
      include: {
        invoices: {
          select: { riskLevel: true, fraudScore: true },
        },
      },
    });

    const headers = [
      'Vendor Name',
      'GSTIN',
      'PAN',
      'State',
      'KYC Verified',
      'Total Invoices',
      'Total Billed Value (INR)',
      'Historical Risk Score (0-100)',
      'Active Fraud Flags',
      'High Risk Invoices Count',
    ];

    const rows = vendors.map((v) => {
      const highRisk = v.invoices.filter((i) => i.riskLevel === 'HIGH' || i.riskLevel === 'CRITICAL').length;
      return [
        `"${v.name.replace(/"/g, '""')}"`,
        `"${v.gstin}"`,
        `"${v.pan}"`,
        `"${v.state}"`,
        `"${v.isVerified ? 'YES' : 'NO'}"`,
        v.totalInvoicesCount,
        v.totalAmountBilled.toFixed(2),
        v.riskScore.toFixed(1),
        v.fraudFlagCount,
        highRisk,
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\r\n');
  }

  public static async generateAuditCSV(filters: { action?: string; entityType?: string }): Promise<string> {
    const where: any = {};
    if (filters.action) where.action = filters.action;
    if (filters.entityType) where.entityType = filters.entityType;

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      include: {
        user: { select: { name: true, email: true, role: true } },
      },
    });

    const headers = [
      'Timestamp (IST)',
      'Actor Name',
      'Actor Email',
      'Role',
      'Action Performed',
      'Entity Type',
      'Entity ID',
      'Operation Details',
      'IP Address',
    ];

    const rows = logs.map((l) => [
      `"${formatDateTimeIndian(l.timestamp)}"`,
      `"${l.user?.name || 'System Worker'}"`,
      `"${l.user?.email || 'system@fraudshield.in'}"`,
      `"${l.user?.role || 'SYSTEM'}"`,
      `"${l.action}"`,
      `"${l.entityType}"`,
      `"${l.entityId || 'N/A'}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
      `"${l.ipAddress || '127.0.0.1'}"`,
    ].join(','));

    return [headers.join(','), ...rows].join('\r\n');
  }

  public static async getReportPreview(type: string, filters: any = {}) {
    let reportName = 'Invoice Forensic Report';
    let recordCount = 0;
    let totalAmount = 0;
    let riskSummary = { low: 0, medium: 0, high: 0, critical: 0 };

    if (type === 'FRAUD_RISK') {
      reportName = 'High-Risk & Fraud Exception Report';
      recordCount = await prisma.invoice.count({ where: { riskLevel: { in: ['HIGH', 'CRITICAL'] } } });
      const agg = await prisma.invoice.aggregate({
        where: { riskLevel: { in: ['HIGH', 'CRITICAL'] } },
        _sum: { grandTotal: true },
      });
      totalAmount = agg._sum.grandTotal || 0;
      riskSummary.high = await prisma.invoice.count({ where: { riskLevel: 'HIGH' } });
      riskSummary.critical = await prisma.invoice.count({ where: { riskLevel: 'CRITICAL' } });
    } else if (type === 'VENDOR_RISK') {
      reportName = 'Supplier & Vendor Risk Assessment Report';
      recordCount = await prisma.vendor.count();
      const agg = await prisma.vendor.aggregate({ _sum: { totalAmountBilled: true } });
      totalAmount = agg._sum.totalAmountBilled || 0;
    } else if (type === 'AUDIT_LOGS') {
      reportName = 'Immutable System Audit Activity Report';
      recordCount = await prisma.auditLog.count();
    } else {
      // Default: INVOICES
      reportName = 'Indian GST Invoices Forensic Ledger';
      const where: any = {};
      if (filters.status) where.status = filters.status;
      if (filters.riskLevel) where.riskLevel = filters.riskLevel;
      recordCount = await prisma.invoice.count({ where });
      const agg = await prisma.invoice.aggregate({ where, _sum: { grandTotal: true } });
      totalAmount = agg._sum.grandTotal || 0;
      riskSummary.low = await prisma.invoice.count({ where: { ...where, riskLevel: 'LOW' } });
      riskSummary.medium = await prisma.invoice.count({ where: { ...where, riskLevel: 'MEDIUM' } });
      riskSummary.high = await prisma.invoice.count({ where: { ...where, riskLevel: 'HIGH' } });
      riskSummary.critical = await prisma.invoice.count({ where: { ...where, riskLevel: 'CRITICAL' } });
    }

    return {
      reportType: type,
      reportName,
      generatedTimestamp: new Date().toISOString(),
      currency: 'INR (₹)',
      recordCount,
      totalAmountINR: totalAmount,
      riskSummary,
    };
  }

  public static async getFraudSummaryReport() {
    const totalInvoices = await prisma.invoice.count();
    const cleanCount = await prisma.invoice.count({ where: { riskLevel: 'LOW' } });
    const mediumCount = await prisma.invoice.count({ where: { riskLevel: 'MEDIUM' } });
    const highCount = await prisma.invoice.count({ where: { riskLevel: 'HIGH' } });
    const criticalCount = await prisma.invoice.count({ where: { riskLevel: 'CRITICAL' } });

    const totalBilledAgg = await prisma.invoice.aggregate({ _sum: { grandTotal: true } });
    const totalAtRiskAgg = await prisma.invoice.aggregate({
      where: { riskLevel: { in: ['HIGH', 'CRITICAL'] } },
      _sum: { grandTotal: true },
    });

    const flaggedVendors = await prisma.vendor.findMany({
      where: { fraudFlagCount: { gt: 0 } },
      select: {
        id: true,
        name: true,
        gstin: true,
        fraudFlagCount: true,
        totalInvoicesCount: true,
        totalAmountBilled: true,
      },
    });

    return {
      generatedAt: new Date().toISOString(),
      currency: 'INR (₹)',
      metrics: {
        totalInvoices,
        totalBilledINR: totalBilledAgg._sum.grandTotal || 0,
        amountAtRiskINR: totalAtRiskAgg._sum.grandTotal || 0,
        cleanInvoices: cleanCount,
        mediumRiskInvoices: mediumCount,
        highRiskInvoices: highCount,
        criticalRiskInvoices: criticalCount,
      },
      flaggedVendors,
    };
  }
}
