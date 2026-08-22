import prisma from '../utils/prisma';

export class AnalyticsService {
  public static async getDashboardStats() {
    const [
      totalInvoices,
      totalAmountResult,
      verifiedInvoices,
      suspiciousInvoices,
      flaggedFraudInvoices,
      rejectedInvoices,
      pendingReviews,
      criticalRiskInvoices,
      highRiskInvoices,
      mediumRiskInvoices,
      lowRiskInvoices,
      lowAmountResult,
      mediumAmountResult,
      highAmountResult,
      criticalAmountResult,
      amountAtRiskResult,
      openAlertsCount,
      recentSuspiciousInvoices,
      duplicateInvoices,
      taxMismatchInvoices,
      poMismatchInvoices,
    ] = await Promise.all([
      // Total Invoices
      prisma.invoice.count(),

      // Total Value
      prisma.invoice.aggregate({ _sum: { grandTotal: true } }),

      // Status breakdown
      prisma.invoice.count({ where: { status: 'VERIFIED' } }),
      prisma.invoice.count({ where: { status: 'SUSPICIOUS' } }),
      prisma.invoice.count({ where: { status: 'FLAGGED_FRAUD' } }),
      prisma.invoice.count({ where: { status: 'REJECTED' } }),
      prisma.invoice.count({ where: { status: 'PENDING' } }),

      // Risk breakdown counts
      prisma.invoice.count({ where: { riskLevel: 'CRITICAL' } }),
      prisma.invoice.count({ where: { riskLevel: 'HIGH' } }),
      prisma.invoice.count({ where: { riskLevel: 'MEDIUM' } }),
      prisma.invoice.count({ where: { riskLevel: 'LOW' } }),

      // Risk breakdown amounts
      prisma.invoice.aggregate({ where: { riskLevel: 'LOW' }, _sum: { grandTotal: true } }),
      prisma.invoice.aggregate({ where: { riskLevel: 'MEDIUM' }, _sum: { grandTotal: true } }),
      prisma.invoice.aggregate({ where: { riskLevel: 'HIGH' }, _sum: { grandTotal: true } }),
      prisma.invoice.aggregate({ where: { riskLevel: 'CRITICAL' }, _sum: { grandTotal: true } }),

      // Amount at Risk (Grand Total of High + Critical Risk invoices)
      prisma.invoice.aggregate({
        where: { riskLevel: { in: ['HIGH', 'CRITICAL'] } },
        _sum: { grandTotal: true },
      }),

      // Open Alerts
      prisma.fraudAlert.count({ where: { status: 'OPEN' } }),

      // Recent Suspicious Invoices with itemized ruleResults
      prisma.invoice.findMany({
        where: { riskLevel: { in: ['HIGH', 'CRITICAL', 'MEDIUM'] } },
        take: 8,
        orderBy: [{ fraudScore: 'desc' }, { invoiceDate: 'desc' }],
        include: {
          vendor: { select: { id: true, name: true, gstin: true, isVerified: true } },
          detection: {
            select: {
              summaryExplanation: true,
              overallScore: true,
              riskLevel: true,
              ruleResults: {
                where: { status: { in: ['FAIL', 'CRITICAL', 'WARNING'] } },
                select: { ruleCode: true, ruleName: true, status: true },
              },
            },
          },
        },
      }),

      // Invoices with Duplicate flags (DUP-01 or DUP-02)
      prisma.invoice.findMany({
        where: {
          detection: {
            ruleResults: {
              some: {
                ruleCode: { in: ['DUP-01', 'DUP-02'] },
                status: { in: ['FAIL', 'CRITICAL'] },
              },
            },
          },
        },
        select: { id: true, grandTotal: true },
      }),

      // Invoices with Tax discrepancies (TAX category)
      prisma.invoice.findMany({
        where: {
          detection: {
            ruleResults: {
              some: {
                ruleCategory: 'TAX',
                status: { in: ['FAIL', 'CRITICAL'] },
              },
            },
          },
        },
        select: { id: true, grandTotal: true },
      }),

      // Invoices with PO discrepancies (PO category)
      prisma.invoice.findMany({
        where: {
          detection: {
            ruleResults: {
              some: {
                ruleCategory: 'PO',
                status: { in: ['FAIL', 'CRITICAL'] },
              },
            },
          },
        },
        select: { id: true, grandTotal: true },
      }),
    ]);

    const totalBilled = totalAmountResult._sum.grandTotal || 0;
    const amountAtRisk = amountAtRiskResult._sum.grandTotal || 0;

    const lowRiskAmount = lowAmountResult._sum.grandTotal || 0;
    const mediumRiskAmount = mediumAmountResult._sum.grandTotal || 0;
    const highRiskAmount = highAmountResult._sum.grandTotal || 0;
    const criticalRiskAmount = criticalAmountResult._sum.grandTotal || 0;

    const riskyCount = criticalRiskInvoices + highRiskInvoices;
    const fraudRatePercent = totalInvoices > 0 ? Number(((riskyCount / totalInvoices) * 100).toFixed(2)) : 0;

    const duplicateInvoicesCount = duplicateInvoices.length;
    const duplicateInvoicesAmount = duplicateInvoices.reduce((acc, inv) => acc + inv.grandTotal, 0);

    const taxMismatchInvoicesCount = taxMismatchInvoices.length;
    const taxMismatchInvoicesAmount = taxMismatchInvoices.reduce((acc, inv) => acc + inv.grandTotal, 0);

    const poMismatchInvoicesCount = poMismatchInvoices.length;
    const poMismatchInvoicesAmount = poMismatchInvoices.reduce((acc, inv) => acc + inv.grandTotal, 0);

    return {
      totalInvoices,
      totalInvoiceValue: totalBilled,
      verifiedInvoices,
      suspiciousInvoices,
      fraudulentInvoices: flaggedFraudInvoices,
      rejectedInvoices,
      pendingReviews,
      highRiskInvoices,
      criticalRiskInvoices,
      duplicateInvoices: duplicateInvoicesCount,
      fraudRate: fraudRatePercent,
      totalAmountAtRisk: amountAtRisk,
      openAlerts: openAlertsCount,
      riskDistribution: {
        low: lowRiskInvoices,
        medium: mediumRiskInvoices,
        high: highRiskInvoices,
        critical: criticalRiskInvoices,
        lowAmount: lowRiskAmount,
        mediumAmount: mediumRiskAmount,
        highAmount: highRiskAmount,
        criticalAmount: criticalRiskAmount,
      },
      statusDistribution: {
        pending: pendingReviews,
        verified: verifiedInvoices,
        suspicious: suspiciousInvoices,
        flaggedFraud: flaggedFraudInvoices,
        rejected: rejectedInvoices,
      },
      amountAtRiskBreakdown: {
        highRiskAmount,
        criticalRiskAmount,
        duplicateAmount: duplicateInvoicesAmount,
        taxMismatchAmount: taxMismatchInvoicesAmount,
        poMismatchAmount: poMismatchInvoicesAmount,
      },
      categoryStats: {
        duplicateCount: duplicateInvoicesCount,
        duplicateAmount: duplicateInvoicesAmount,
        taxMismatchCount: taxMismatchInvoicesCount,
        taxMismatchAmount: taxMismatchInvoicesAmount,
        poMismatchCount: poMismatchInvoicesCount,
        poMismatchAmount: poMismatchInvoicesAmount,
      },
      recentSuspiciousInvoices,
    };
  }

  public static async getFraudTrends() {
    const invoices = await prisma.invoice.findMany({
      select: {
        invoiceDate: true,
        grandTotal: true,
        fraudScore: true,
        riskLevel: true,
        status: true,
      },
      orderBy: { invoiceDate: 'asc' },
    });

    const monthlyMap: Record<
      string,
      {
        month: string;
        totalInvoices: number;
        totalValue: number;
        cleanInvoices: number;
        suspiciousInvoices: number;
        fraudulentInvoices: number;
        amountAtRisk: number;
      }
    > = {};

    for (const inv of invoices) {
      const d = new Date(inv.invoiceDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleString('en-IN', { month: 'short', year: 'numeric' });

      if (!monthlyMap[key]) {
        monthlyMap[key] = {
          month: monthLabel,
          totalInvoices: 0,
          totalValue: 0,
          cleanInvoices: 0,
          suspiciousInvoices: 0,
          fraudulentInvoices: 0,
          amountAtRisk: 0,
        };
      }

      monthlyMap[key].totalInvoices++;
      monthlyMap[key].totalValue += inv.grandTotal;

      if (inv.riskLevel === 'LOW') {
        monthlyMap[key].cleanInvoices++;
      } else if (inv.riskLevel === 'MEDIUM') {
        monthlyMap[key].suspiciousInvoices++;
      } else {
        // HIGH or CRITICAL
        monthlyMap[key].fraudulentInvoices++;
        monthlyMap[key].amountAtRisk += inv.grandTotal;
      }
    }

    return Object.values(monthlyMap);
  }

  public static async getVendorRiskMatrix() {
    const vendors = await prisma.vendor.findMany({
      include: {
        _count: {
          select: { invoices: true },
        },
        invoices: {
          select: {
            fraudScore: true,
            riskLevel: true,
            grandTotal: true,
            status: true,
            invoiceDate: true,
          },
          orderBy: { invoiceDate: 'desc' },
        },
      },
      orderBy: [{ fraudFlagCount: 'desc' }, { riskScore: 'desc' }],
      take: 15,
    });

    return vendors.map((v) => {
      const highRiskCount = v.invoices.filter((i) => i.riskLevel === 'HIGH' || i.riskLevel === 'CRITICAL').length;
      const suspiciousCount = v.invoices.filter((i) => i.status === 'SUSPICIOUS' || i.status === 'FLAGGED_FRAUD').length;
      const avgScore =
        v.invoices.length > 0
          ? Number((v.invoices.reduce((acc, i) => acc + i.fraudScore, 0) / v.invoices.length).toFixed(1))
          : 0;
      const lastInvoice = v.invoices[0]?.invoiceDate || null;

      return {
        id: v.id,
        name: v.name,
        gstin: v.gstin,
        pan: v.pan,
        state: v.state,
        isVerified: v.isVerified,
        totalInvoices: v.totalInvoicesCount,
        totalBilled: v.totalAmountBilled,
        fraudFlagCount: v.fraudFlagCount,
        riskScore: v.riskScore,
        suspiciousInvoicesCount: suspiciousCount,
        highRiskInvoicesCount: highRiskCount,
        averageFraudScore: avgScore,
        lastInvoiceDate: lastInvoice,
      };
    });
  }
}
