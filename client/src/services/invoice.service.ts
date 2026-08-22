import api from './api';
import { Invoice, PaginatedResponse } from '../types';

export interface InvoiceFilterParams {
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
}

export const invoiceService = {
  getInvoices: async (params?: InvoiceFilterParams) => {
    const res = await api.get<PaginatedResponse<Invoice>>('/invoices', { params });
    return res.data;
  },

  getInvoiceById: async (id: string) => {
    const res = await api.get<{ success: boolean; data: Invoice }>(`/invoices/${id}`);
    return res.data.data;
  },

  createInvoice: async (data: any) => {
    const res = await api.post<{ success: boolean; data: Invoice }>('/invoices', data);
    return res.data;
  },

  uploadInvoice: async (formData: FormData) => {
    const res = await api.post<{ success: boolean; data: { invoice: Invoice; ocrResult: any } }>(
      '/invoices/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return res.data;
  },

  extractInvoice: async (formData: FormData) => {
    const res = await api.post<{
      success: boolean;
      data: {
        extracted: any;
        matchedVendor: any;
        fileName: string;
        fileUrl: string;
        fileType: string;
        fileSize: number;
      };
    }>('/invoices/extract', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  updateStatus: async (id: string, status: string, reviewNotes?: string) => {
    const res = await api.patch<{ success: boolean; data: Invoice }>(`/invoices/${id}/status`, {
      status,
      reviewNotes,
    });
    return res.data;
  },

  reEvaluate: async (id: string) => {
    const res = await api.post<{ success: boolean; data: Invoice }>(`/invoices/${id}/re-evaluate`);
    return res.data;
  },
};
