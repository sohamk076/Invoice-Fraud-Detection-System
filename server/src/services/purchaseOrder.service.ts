import prisma from '../utils/prisma';
import { AuditService } from './audit.service';

export interface CreatePOItemInput {
  description: string;
  hsnSac: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  totalAmount: number;
}

export interface CreatePOInput {
  poNumber: string;
  vendorId: string;
  issueDate: Date | string;
  deliveryDate?: Date | string | null;
  totalAmount: number;
  notes?: string;
  items: CreatePOItemInput[];
}

export class PurchaseOrderService {
  public static async getPurchaseOrders(query: {
    page?: number;
    limit?: number;
    vendorId?: string;
    status?: string;
    search?: string;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.vendorId) where.vendorId = query.vendorId;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { poNumber: { contains: query.search } },
        { vendor: { name: { contains: query.search } } },
      ];
    }

    const [total, orders] = await Promise.all([
      prisma.purchaseOrder.count({ where }),
      prisma.purchaseOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { issueDate: 'desc' },
        include: {
          vendor: {
            select: { id: true, name: true, gstin: true, state: true },
          },
          items: true,
          _count: { select: { invoices: true } },
        },
      }),
    ]);

    return {
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public static async getPOById(id: string) {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        vendor: true,
        items: true,
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            invoiceDate: true,
            grandTotal: true,
            status: true,
            fraudScore: true,
            riskLevel: true,
          },
        },
      },
    });

    if (!po) {
      throw new Error('Purchase Order not found.');
    }

    return po;
  }

  public static async createPO(input: CreatePOInput, actorId?: string) {
    const existing = await prisma.purchaseOrder.findUnique({
      where: { poNumber: input.poNumber.trim() },
    });

    if (existing) {
      throw new Error(`Purchase Order #${input.poNumber} already exists.`);
    }

    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber: input.poNumber.trim(),
        vendorId: input.vendorId,
        issueDate: new Date(input.issueDate),
        deliveryDate: input.deliveryDate ? new Date(input.deliveryDate) : null,
        totalAmount: input.totalAmount,
        notes: input.notes || null,
        status: 'OPEN',
        items: {
          create: input.items.map((it) => ({
            description: it.description,
            hsnSac: it.hsnSac,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            taxRate: it.taxRate,
            totalAmount: it.totalAmount,
          })),
        },
      },
      include: {
        items: true,
        vendor: true,
      },
    });

    await AuditService.log({
      userId: actorId,
      action: 'PO_CREATED',
      entityType: 'PURCHASE_ORDER',
      entityId: po.id,
      newState: po,
      details: `Purchase Order #${po.poNumber} created for ${po.vendor.name} (Amount: ₹${po.totalAmount}).`,
    });

    return po;
  }
}
