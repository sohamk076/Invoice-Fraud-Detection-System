import prisma from '../utils/prisma';
import { fraudEngine } from '../engine/detector';
import { EvaluationContext, InvoiceData, InvoiceItemData } from '../engine/types';
import { AuditService } from './audit.service';
import { ocrService } from './ocr.service';

export interface CreateInvoiceItemInput {
  itemDescription: string;
  hsnSac: string;
  quantity: number;
  unitPrice: number;
  taxableValue: number;
  gstRate: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  totalAmount?: number;
}

export interface CreateInvoiceInput {
  invoiceNumber: string;
  vendorId: string;
  purchaseOrderId?: string | null;
  invoiceDate: Date | string;
  dueDate?: Date | string | null;
  vendorGstin: string;
  customerGstin?: string;
  placeOfSupply: string;
  placeOfSupplyStateCode: string;
  billingAddress: string;
  shippingAddress?: string | null;
  taxableAmount: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  grandTotal?: number;
  roundOff?: number;
  isInterState?: boolean;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  items: CreateInvoiceItemInput[];
}

export class InvoiceService {
  public static async getInvoices(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    riskLevel?: string;
    vendorId?: string;
    minAmount?: number;
    maxAmount?: number;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.status) where.status = query.status;
    if (query.riskLevel) where.riskLevel = query.riskLevel;
    if (query.vendorId) where.vendorId = query.vendorId;

    if (query.minAmount !== undefined || query.maxAmount !== undefined) {
      where.grandTotal = {};
      if (query.minAmount !== undefined) where.grandTotal.gte = Number(query.minAmount);
      if (query.maxAmount !== undefined) where.grandTotal.lte = Number(query.maxAmount);
    }

    if (query.startDate || query.endDate) {
      where.invoiceDate = {};
      if (query.startDate) where.invoiceDate.gte = new Date(query.startDate);
      if (query.endDate) where.invoiceDate.lte = new Date(query.endDate);
    }

    if (query.search) {
      where.OR = [
        { invoiceNumber: { contains: query.search } },
        { vendorGstin: { contains: query.search } },
        { vendor: { name: { contains: query.search } } },
      ];
    }

    const orderByField = query.sortBy || 'invoiceDate';
    const orderDirection = query.sortOrder || 'desc';

    const [total, invoices] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderByField]: orderDirection },
        include: {
          vendor: {
            select: { id: true, name: true, gstin: true, state: true, riskScore: true },
          },
          purchaseOrder: {
            select: { id: true, poNumber: true, totalAmount: true },
          },
          detection: {
            select: {
              overallScore: true,
              riskLevel: true,
              passedRulesCount: true,
              warningRulesCount: true,
              failedRulesCount: true,
              criticalRulesCount: true,
              summaryExplanation: true,
            },
          },
          _count: { select: { items: true, alerts: true } },
        },
      }),
    ]);

    return {
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public static async getInvoiceById(id: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        vendor: true,
        purchaseOrder: {
          include: { items: true },
        },
        items: true,
        detection: {
          include: {
            ruleResults: {
              orderBy: [{ status: 'desc' }, { scoreContribution: 'desc' }],
            },
          },
        },
        alerts: {
          include: { assignedTo: { select: { id: true, name: true, email: true } } },
        },
        reviewedBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        auditLogs: {
          orderBy: { timestamp: 'desc' },
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found.');
    }

    return invoice;
  }

  public static async createInvoice(input: CreateInvoiceInput, actorId?: string) {
    // 1. Fetch Vendor
    const vendor = await prisma.vendor.findUnique({
      where: { id: input.vendorId },
    });
    if (!vendor) {
      throw new Error(`Vendor with ID "${input.vendorId}" not found.`);
    }

    // 2. Fetch PO if provided
    let purchaseOrder: any = null;
    if (input.purchaseOrderId) {
      purchaseOrder = await prisma.purchaseOrder.findUnique({
        where: { id: input.purchaseOrderId },
        include: { items: true },
      });
    }

    // 3. Fetch Vendor Historical Invoices for Anomaly & Duplicate Evaluation
    const historicalInvoices = await prisma.invoice.findMany({
      where: { vendorId: input.vendorId },
      select: {
        id: true,
        invoiceNumber: true,
        grandTotal: true,
        taxableAmount: true,
        invoiceDate: true,
        status: true,
        fraudScore: true,
      },
    });

    // 4. Calculate Tax Totals
    const isInterState = input.isInterState ?? (vendor.stateCode !== input.placeOfSupplyStateCode);
    let totalCgst = input.cgstAmount || 0;
    let totalSgst = input.sgstAmount || 0;
    let totalIgst = input.igstAmount || 0;

    const processedItems: InvoiceItemData[] = input.items.map((it) => {
      const taxRate = it.gstRate;
      const totalItemTax = (it.taxableValue * taxRate) / 100;
      const itemCgst = it.cgstAmount !== undefined ? it.cgstAmount : (isInterState ? 0 : totalItemTax / 2);
      const itemSgst = it.sgstAmount !== undefined ? it.sgstAmount : (isInterState ? 0 : totalItemTax / 2);
      const itemIgst = it.igstAmount !== undefined ? it.igstAmount : (isInterState ? totalItemTax : 0);
      const totalAmount = it.totalAmount !== undefined ? it.totalAmount : (it.taxableValue + itemCgst + itemSgst + itemIgst);

      return {
        itemDescription: it.itemDescription,
        hsnSac: it.hsnSac,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        taxableValue: it.taxableValue,
        gstRate: it.gstRate,
        cgstAmount: itemCgst,
        sgstAmount: itemSgst,
        igstAmount: itemIgst,
        totalAmount,
      };
    });

    if (input.cgstAmount === undefined && input.sgstAmount === undefined && input.igstAmount === undefined) {
      totalCgst = processedItems.reduce((acc, it) => acc + it.cgstAmount, 0);
      totalSgst = processedItems.reduce((acc, it) => acc + it.sgstAmount, 0);
      totalIgst = processedItems.reduce((acc, it) => acc + it.igstAmount, 0);
    }

    const totalTaxAmount = totalCgst + totalSgst + totalIgst;
    const grandTotal = input.grandTotal !== undefined ? input.grandTotal : (input.taxableAmount + totalTaxAmount);

    const invoiceData: InvoiceData = {
      invoiceNumber: input.invoiceNumber.trim(),
      vendorId: input.vendorId,
      purchaseOrderId: input.purchaseOrderId || null,
      invoiceDate: new Date(input.invoiceDate),
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      vendorGstin: input.vendorGstin.trim().toUpperCase(),
      customerGstin: input.customerGstin?.trim().toUpperCase() || '27AAACG1234F1Z5',
      placeOfSupply: input.placeOfSupply.trim(),
      placeOfSupplyStateCode: input.placeOfSupplyStateCode.trim(),
      billingAddress: input.billingAddress.trim(),
      shippingAddress: input.shippingAddress?.trim() || null,
      taxableAmount: input.taxableAmount,
      cgstAmount: totalCgst,
      sgstAmount: totalSgst,
      igstAmount: totalIgst,
      totalTaxAmount,
      grandTotal,
      roundOff: input.roundOff || 0.0,
      isInterState,
    };

    // 5. Run Transparent Fraud Detection Engine
    const evalContext: EvaluationContext = {
      invoice: invoiceData,
      items: processedItems,
      vendor,
      purchaseOrder,
      historicalInvoices,
    };

    const evaluationResult = await fraudEngine.evaluate(evalContext);

    // Initial Status mapping based on risk level
    let initialStatus: string = 'PENDING';
    if (evaluationResult.riskLevel === 'LOW') {
      initialStatus = 'VERIFIED';
    } else if (evaluationResult.riskLevel === 'MEDIUM') {
      initialStatus = 'SUSPICIOUS';
    } else if (evaluationResult.riskLevel === 'HIGH') {
      initialStatus = 'SUSPICIOUS';
    } else if (evaluationResult.riskLevel === 'CRITICAL') {
      initialStatus = 'FLAGGED_FRAUD';
    }

    // 6. Save in SQLite via Prisma
    const createdInvoice = await prisma.invoice.create({
      data: {
        invoiceNumber: invoiceData.invoiceNumber,
        vendorId: invoiceData.vendorId,
        purchaseOrderId: invoiceData.purchaseOrderId,
        invoiceDate: invoiceData.invoiceDate,
        dueDate: invoiceData.dueDate,
        vendorGstin: invoiceData.vendorGstin,
        customerGstin: invoiceData.customerGstin,
        placeOfSupply: invoiceData.placeOfSupply,
        placeOfSupplyStateCode: invoiceData.placeOfSupplyStateCode,
        billingAddress: invoiceData.billingAddress,
        shippingAddress: invoiceData.shippingAddress,
        taxableAmount: invoiceData.taxableAmount,
        cgstAmount: invoiceData.cgstAmount,
        sgstAmount: invoiceData.sgstAmount,
        igstAmount: invoiceData.igstAmount,
        totalTaxAmount: invoiceData.totalTaxAmount,
        grandTotal: invoiceData.grandTotal,
        roundOff: invoiceData.roundOff || 0.0,
        isInterState: invoiceData.isInterState,
        status: initialStatus,
        fraudScore: evaluationResult.overallScore,
        riskLevel: evaluationResult.riskLevel,
        fileName: input.fileName || null,
        fileUrl: input.fileUrl || null,
        fileType: input.fileType || null,
        items: {
          create: processedItems.map((it) => ({
            itemDescription: it.itemDescription,
            hsnSac: it.hsnSac,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            taxableValue: it.taxableValue,
            gstRate: it.gstRate,
            cgstAmount: it.cgstAmount,
            sgstAmount: it.sgstAmount,
            igstAmount: it.igstAmount,
            totalAmount: it.totalAmount,
          })),
        },
        detection: {
          create: {
            overallScore: evaluationResult.overallScore,
            riskLevel: evaluationResult.riskLevel,
            passedRulesCount: evaluationResult.passedRulesCount,
            warningRulesCount: evaluationResult.warningRulesCount,
            failedRulesCount: evaluationResult.failedRulesCount,
            criticalRulesCount: evaluationResult.criticalRulesCount,
            summaryExplanation: evaluationResult.summaryExplanation,
            ruleResults: {
              create: evaluationResult.ruleResults.map((r) => ({
                ruleCode: r.ruleCode,
                ruleCategory: r.ruleCategory,
                ruleName: r.ruleName,
                status: r.status,
                scoreContribution: r.scoreContribution,
                details: r.details,
                detectedValue: r.detectedValue || null,
                expectedValue: r.expectedValue || null,
              })),
            },
          },
        },
      },
      include: {
        vendor: true,
        items: true,
        detection: {
          include: { ruleResults: true },
        },
      },
    });

    // 7. Auto-create Alert for High/Critical Risk
    if (evaluationResult.shouldGenerateAlert && evaluationResult.suggestedAlert) {
      await prisma.fraudAlert.create({
        data: {
          invoiceId: createdInvoice.id,
          alertType: evaluationResult.suggestedAlert.type,
          severity: evaluationResult.suggestedAlert.severity,
          title: evaluationResult.suggestedAlert.title,
          description: evaluationResult.suggestedAlert.description,
          status: 'OPEN',
        },
      });
    }

    // 8. Update Vendor Aggregates
    const updatedTotalInvoices = vendor.totalInvoicesCount + 1;
    const updatedTotalBilled = vendor.totalAmountBilled + createdInvoice.grandTotal;
    const updatedFraudCount =
      evaluationResult.riskLevel === 'CRITICAL' ? vendor.fraudFlagCount + 1 : vendor.fraudFlagCount;

    await prisma.vendor.update({
      where: { id: vendor.id },
      data: {
        totalInvoicesCount: updatedTotalInvoices,
        totalAmountBilled: updatedTotalBilled,
        fraudFlagCount: updatedFraudCount,
      },
    });

    // 9. Log Audit Entry
    await AuditService.log({
      userId: actorId,
      invoiceId: createdInvoice.id,
      action: 'INVOICE_CREATED',
      entityType: 'INVOICE',
      entityId: createdInvoice.id,
      newState: {
        invoiceNumber: createdInvoice.invoiceNumber,
        grandTotal: createdInvoice.grandTotal,
        fraudScore: createdInvoice.fraudScore,
        riskLevel: createdInvoice.riskLevel,
      },
      details: `Invoice #${createdInvoice.invoiceNumber} created. Evaluated Risk: ${createdInvoice.riskLevel} (${createdInvoice.fraudScore}/100).`,
    });

    return createdInvoice;
  }

  public static async updateInvoiceStatus(
    id: string,
    newStatus: string,
    reviewNotes?: string,
    actorId?: string
  ) {
    const existing = await prisma.invoice.findUnique({
      where: { id },
      include: { vendor: true },
    });

    if (!existing) {
      throw new Error('Invoice not found.');
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        status: newStatus,
        reviewedById: actorId || null,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes || existing.reviewNotes,
      },
      include: {
        vendor: true,
        reviewedBy: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    // If marked as FLAGGED_FRAUD and wasn't before, increment vendor fraud flag
    if (newStatus === 'FLAGGED_FRAUD' && existing.status !== 'FLAGGED_FRAUD') {
      await prisma.vendor.update({
        where: { id: existing.vendorId },
        data: { fraudFlagCount: { increment: 1 } },
      });
    }

    await AuditService.log({
      userId: actorId,
      invoiceId: id,
      action: 'STATUS_CHANGED',
      entityType: 'INVOICE',
      entityId: id,
      previousState: { status: existing.status },
      newState: { status: newStatus, reviewNotes },
      details: `Invoice #${existing.invoiceNumber} status changed from "${existing.status}" to "${newStatus}". Notes: ${reviewNotes || 'None'}`,
    });

    return updated;
  }

  public static async reEvaluateInvoice(id: string, actorId?: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
        vendor: true,
        purchaseOrder: { include: { items: true } },
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found.');
    }

    const historicalInvoices = await prisma.invoice.findMany({
      where: { vendorId: invoice.vendorId },
      select: {
        id: true,
        invoiceNumber: true,
        grandTotal: true,
        taxableAmount: true,
        invoiceDate: true,
        status: true,
        fraudScore: true,
      },
    });

    const evalContext: EvaluationContext = {
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        vendorId: invoice.vendorId,
        purchaseOrderId: invoice.purchaseOrderId,
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        vendorGstin: invoice.vendorGstin,
        customerGstin: invoice.customerGstin,
        placeOfSupply: invoice.placeOfSupply,
        placeOfSupplyStateCode: invoice.placeOfSupplyStateCode,
        billingAddress: invoice.billingAddress,
        shippingAddress: invoice.shippingAddress,
        taxableAmount: invoice.taxableAmount,
        cgstAmount: invoice.cgstAmount,
        sgstAmount: invoice.sgstAmount,
        igstAmount: invoice.igstAmount,
        totalTaxAmount: invoice.totalTaxAmount,
        grandTotal: invoice.grandTotal,
        roundOff: invoice.roundOff,
        isInterState: invoice.isInterState,
      },
      items: invoice.items,
      vendor: invoice.vendor,
      purchaseOrder: invoice.purchaseOrder,
      historicalInvoices,
    };

    const evaluationResult = await fraudEngine.evaluate(evalContext);

    // Delete existing detection & rule results
    const existingDetection = await prisma.fraudDetection.findUnique({
      where: { invoiceId: id },
    });

    if (existingDetection) {
      await prisma.fraudRuleResult.deleteMany({
        where: { fraudDetectionId: existingDetection.id },
      });
      await prisma.fraudDetection.delete({
        where: { id: existingDetection.id },
      });
    }

    // Update invoice and insert new detection
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        fraudScore: evaluationResult.overallScore,
        riskLevel: evaluationResult.riskLevel,
        detection: {
          create: {
            overallScore: evaluationResult.overallScore,
            riskLevel: evaluationResult.riskLevel,
            passedRulesCount: evaluationResult.passedRulesCount,
            warningRulesCount: evaluationResult.warningRulesCount,
            failedRulesCount: evaluationResult.failedRulesCount,
            criticalRulesCount: evaluationResult.criticalRulesCount,
            summaryExplanation: evaluationResult.summaryExplanation,
            ruleResults: {
              create: evaluationResult.ruleResults.map((r) => ({
                ruleCode: r.ruleCode,
                ruleCategory: r.ruleCategory,
                ruleName: r.ruleName,
                status: r.status,
                scoreContribution: r.scoreContribution,
                details: r.details,
                detectedValue: r.detectedValue || null,
                expectedValue: r.expectedValue || null,
              })),
            },
          },
        },
      },
      include: {
        vendor: true,
        items: true,
        detection: {
          include: { ruleResults: true },
        },
      },
    });

    await AuditService.log({
      userId: actorId,
      invoiceId: id,
      action: 'FRAUD_EVALUATED',
      entityType: 'INVOICE',
      entityId: id,
      newState: {
        fraudScore: evaluationResult.overallScore,
        riskLevel: evaluationResult.riskLevel,
      },
      details: `Invoice #${invoice.invoiceNumber} re-evaluated. New Score: ${evaluationResult.overallScore}/100 (${evaluationResult.riskLevel}).`,
    });

    return updatedInvoice;
  }

  public static async extractInvoiceDocument(file: Express.Multer.File, vendorId?: string) {
    const ocrParsed = await ocrService.parseInvoice(file.path, file.originalname);
    let matchedVendor = null;
    if (vendorId) {
      matchedVendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
    } else if (ocrParsed.vendorGstin) {
      matchedVendor = await prisma.vendor.findUnique({ where: { gstin: ocrParsed.vendorGstin } });
    }
    if (!matchedVendor) {
      matchedVendor = await prisma.vendor.findFirst();
    }

    return {
      extracted: ocrParsed,
      matchedVendor,
      fileName: file.originalname,
      fileUrl: `/uploads/${file.filename}`,
      fileType: file.mimetype,
      fileSize: file.size,
    };
  }

  public static async processUploadedFile(
    file: Express.Multer.File,
    vendorId?: string,
    actorId?: string
  ) {
    // 1. Run OCR abstraction
    const ocrParsed = await ocrService.parseInvoice(file.path, file.originalname);

    // 2. Determine Vendor
    let targetVendorId = vendorId;
    if (!targetVendorId && ocrParsed.vendorGstin) {
      const matchedVendor = await prisma.vendor.findUnique({
        where: { gstin: ocrParsed.vendorGstin },
      });
      if (matchedVendor) targetVendorId = matchedVendor.id;
    }

    if (!targetVendorId) {
      // Pick first vendor as fallback
      const defaultVendor = await prisma.vendor.findFirst();
      if (!defaultVendor) {
        throw new Error('No vendor available in database to associate uploaded invoice.');
      }
      targetVendorId = defaultVendor.id;
    }

    // 3. Create Invoice via standard pipeline
    const createdInvoice = await this.createInvoice(
      {
        invoiceNumber: ocrParsed.invoiceNumber,
        vendorId: targetVendorId,
        invoiceDate: ocrParsed.invoiceDate,
        dueDate: ocrParsed.dueDate,
        vendorGstin: ocrParsed.vendorGstin || '27AAACT2727Q1ZW',
        customerGstin: ocrParsed.customerGstin || '27AAACG1234F1Z5',
        placeOfSupply: ocrParsed.placeOfSupply || 'Maharashtra',
        placeOfSupplyStateCode: ocrParsed.placeOfSupplyStateCode || '27',
        billingAddress: 'Corporate Headquarters, Level 7, Nariman Point, Mumbai - 400021',
        taxableAmount: ocrParsed.taxableAmount,
        cgstAmount: ocrParsed.cgstAmount,
        sgstAmount: ocrParsed.sgstAmount,
        igstAmount: ocrParsed.igstAmount,
        grandTotal: ocrParsed.grandTotal,
        isInterState: ocrParsed.isInterState,
        fileName: file.originalname,
        fileUrl: `/uploads/${file.filename}`,
        fileType: file.mimetype,
        items: ocrParsed.items,
      },
      actorId
    );

    await AuditService.log({
      userId: actorId,
      invoiceId: createdInvoice.id,
      action: 'INVOICE_UPLOADED',
      entityType: 'INVOICE',
      entityId: createdInvoice.id,
      details: `Invoice file "${file.originalname}" uploaded and processed via OCR engine.`,
    });

    return {
      invoice: createdInvoice,
      ocrResult: ocrParsed,
    };
  }
}
