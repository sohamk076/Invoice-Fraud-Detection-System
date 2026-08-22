import api from './api';
import { AuditLog, PaginatedResponse } from '../types';

export const auditService = {
  getAuditLogs: async (params?: {
    page?: number;
    limit?: number;
    action?: string;
    entityType?: string;
    userId?: string;
    invoiceId?: string;
  }) => {
    const res = await api.get<PaginatedResponse<AuditLog>>('/audit-logs', { params });
    return res.data;
  },
};
