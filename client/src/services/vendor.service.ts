import api from './api';
import { PaginatedResponse, Vendor } from '../types';

export const vendorService = {
  getVendors: async (params?: { page?: number; limit?: number; search?: string; state?: string; isVerified?: string }) => {
    const res = await api.get<PaginatedResponse<Vendor>>('/vendors', { params });
    return res.data;
  },

  getVendorById: async (id: string) => {
    const res = await api.get<{ success: boolean; data: Vendor & { invoices?: any[]; purchaseOrders?: any[] } }>(`/vendors/${id}`);
    return res.data.data;
  },

  createVendor: async (data: any) => {
    const res = await api.post<{ success: boolean; data: Vendor }>('/vendors', data);
    return res.data;
  },

  updateVendor: async (id: string, data: any) => {
    const res = await api.patch<{ success: boolean; data: Vendor }>(`/vendors/${id}`, data);
    return res.data;
  },
};
