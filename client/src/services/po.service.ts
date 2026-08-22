import api from './api';
import { PaginatedResponse, PurchaseOrder } from '../types';

export const poService = {
  getPurchaseOrders: async (params?: { page?: number; limit?: number; vendorId?: string; status?: string; search?: string }) => {
    const res = await api.get<PaginatedResponse<PurchaseOrder>>('/purchase-orders', { params });
    return res.data;
  },

  getPOById: async (id: string) => {
    const res = await api.get<{ success: boolean; data: PurchaseOrder }>(`/purchase-orders/${id}`);
    return res.data.data;
  },

  createPO: async (data: any) => {
    const res = await api.post<{ success: boolean; data: PurchaseOrder }>('/purchase-orders', data);
    return res.data;
  },
};
