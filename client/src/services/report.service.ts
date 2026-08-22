import api from './api';

export const reportService = {
  downloadInvoicesCSV: async (filters?: any) => {
    const res = await api.get('/reports/invoices/export-csv', {
      params: filters,
      responseType: 'blob',
    });
    triggerBrowserDownload(res.data, `gst_invoices_ledger_${formatDateSlug()}.csv`);
  },

  downloadFraudRiskCSV: async (filters?: any) => {
    const res = await api.get('/reports/fraud/export-csv', {
      params: filters,
      responseType: 'blob',
    });
    triggerBrowserDownload(res.data, `fraud_risk_exceptions_${formatDateSlug()}.csv`);
  },

  downloadVendorRiskCSV: async () => {
    const res = await api.get('/reports/vendors/export-csv', {
      responseType: 'blob',
    });
    triggerBrowserDownload(res.data, `vendor_risk_matrix_${formatDateSlug()}.csv`);
  },

  downloadAuditCSV: async (filters?: any) => {
    const res = await api.get('/reports/audit/export-csv', {
      params: filters,
      responseType: 'blob',
    });
    triggerBrowserDownload(res.data, `system_audit_trail_${formatDateSlug()}.csv`);
  },

  getReportPreview: async (type: string, filters?: any) => {
    const res = await api.get<{ success: boolean; data: any }>('/reports/preview', {
      params: { type, ...filters },
    });
    return res.data.data;
  },

  getFraudSummary: async () => {
    const res = await api.get<{ success: boolean; data: any }>('/reports/fraud-summary');
    return res.data.data;
  },
};

function triggerBrowserDownload(data: any, fileName: string) {
  const url = window.URL.createObjectURL(new Blob([data], { type: 'text/csv' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function formatDateSlug() {
  return new Date().toISOString().split('T')[0];
}
