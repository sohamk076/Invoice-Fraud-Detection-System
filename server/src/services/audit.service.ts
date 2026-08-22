import prisma from '../utils/prisma';

export interface CreateAuditLogParams {
  userId?: string | null;
  invoiceId?: string | null;
  action: string; // e.g. USER_LOGIN, INVOICE_CREATED, INVOICE_UPLOADED, STATUS_CHANGED, ALERT_UPDATED
  entityType: string; // INVOICE, USER, VENDOR, ALERT, SYSTEM
  entityId?: string | null;
  previousState?: any;
  newState?: any;
  details: string;
  ipAddress?: string | null;
}

export class AuditService {
  public static async log(params: CreateAuditLogParams): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: params.userId || null,
          invoiceId: params.invoiceId || null,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId || null,
          previousState: params.previousState ? JSON.stringify(params.previousState) : null,
          newState: params.newState ? JSON.stringify(params.newState) : null,
          details: params.details,
          ipAddress: params.ipAddress || null,
        },
      });
    } catch (error) {
      console.error('⚠️ Failed to create audit log entry:', error);
    }
  }

  public static async getLogs(query: {
    page?: number;
    limit?: number;
    action?: string;
    entityType?: string;
    userId?: string;
    invoiceId?: string;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.action) where.action = query.action;
    if (query.entityType) where.entityType = query.entityType;
    if (query.userId) where.userId = query.userId;
    if (query.invoiceId) where.invoiceId = query.invoiceId;

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
          invoice: {
            select: { id: true, invoiceNumber: true, grandTotal: true, riskLevel: true },
          },
        },
      }),
    ]);

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
