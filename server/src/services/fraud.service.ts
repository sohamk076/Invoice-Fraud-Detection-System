import prisma from '../utils/prisma';
import { fraudEngine } from '../engine/detector';
import { AuditService } from './audit.service';

export class FraudService {
  public static async getAlerts(query: {
    page?: number;
    limit?: number;
    status?: string;
    severity?: string;
    assignedToId?: string;
  }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.severity) where.severity = query.severity;
    if (query.assignedToId) where.assignedToId = query.assignedToId;

    const [total, alerts] = await Promise.all([
      prisma.fraudAlert.count({ where }),
      prisma.fraudAlert.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              grandTotal: true,
              fraudScore: true,
              riskLevel: true,
              status: true,
              vendor: { select: { id: true, name: true, gstin: true } },
            },
          },
          assignedTo: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      }),
    ]);

    return {
      data: alerts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public static async updateAlert(
    id: string,
    data: {
      status?: string; // OPEN, IN_REVIEW, RESOLVED, DISMISSED
      assignedToId?: string | null;
      resolutionNotes?: string;
    },
    actorId?: string
  ) {
    const existing = await prisma.fraudAlert.findUnique({
      where: { id },
      include: { invoice: true },
    });

    if (!existing) {
      throw new Error('Alert not found.');
    }

    const updated = await prisma.fraudAlert.update({
      where: { id },
      data: {
        status: data.status || existing.status,
        assignedToId: data.assignedToId !== undefined ? data.assignedToId : existing.assignedToId,
        resolutionNotes: data.resolutionNotes !== undefined ? data.resolutionNotes : existing.resolutionNotes,
        resolvedAt: data.status === 'RESOLVED' || data.status === 'DISMISSED' ? new Date() : existing.resolvedAt,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        invoice: true,
      },
    });

    await AuditService.log({
      userId: actorId,
      invoiceId: existing.invoiceId,
      action: 'ALERT_UPDATED',
      entityType: 'ALERT',
      entityId: id,
      previousState: { status: existing.status, assignedToId: existing.assignedToId },
      newState: { status: updated.status, assignedToId: updated.assignedToId, resolutionNotes: data.resolutionNotes },
      details: `Alert "${existing.title}" status changed to "${updated.status}". Resolution notes: ${data.resolutionNotes || 'None'}.`,
    });

    return updated;
  }

  public static getRules() {
    return fraudEngine.getAllRules();
  }
}
