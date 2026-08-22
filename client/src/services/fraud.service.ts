import api from './api';
import { FraudAlert, PaginatedResponse } from '../types';

export const fraudService = {
  getAlerts: async (params?: { page?: number; limit?: number; status?: string; severity?: string; assignedToId?: string }) => {
    const res = await api.get<PaginatedResponse<FraudAlert>>('/fraud/alerts', { params });
    return res.data;
  },

  updateAlert: async (id: string, data: { status?: string; assignedToId?: string | null; resolutionNotes?: string }) => {
    const res = await api.patch<{ success: boolean; data: FraudAlert }>(`/fraud/alerts/${id}`, data);
    return res.data;
  },

  getRules: async () => {
    const res = await api.get<{ success: boolean; data: { code: string; category: string; name: string; description: string }[] }>('/fraud/rules');
    return res.data.data;
  },
};
