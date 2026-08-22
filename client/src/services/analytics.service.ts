import api from './api';
import { DashboardStats, MonthlyTrend, VendorRiskRanking } from '../types';

export const analyticsService = {
  getDashboardStats: async () => {
    const res = await api.get<{ success: boolean; data: DashboardStats }>('/analytics/dashboard-stats');
    return res.data.data;
  },

  getFraudTrends: async () => {
    const res = await api.get<{ success: boolean; data: MonthlyTrend[] }>('/analytics/fraud-trends');
    return res.data.data;
  },

  getVendorRiskMatrix: async () => {
    const res = await api.get<{ success: boolean; data: VendorRiskRanking[] }>('/analytics/vendor-risk-matrix');
    return res.data.data;
  },
};
