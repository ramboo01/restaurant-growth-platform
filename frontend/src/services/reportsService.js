import api from './api';

export const reportsService = {
  getReportsSummary: async (period = 'week') => {
    const response = await api.get(`/api/reports/summary?period=${period}`);
    return response.data?.data ?? response.data;
  },

  getRevenueTrend: async (period = 'week') => {
    const response = await api.get(`/api/reports/revenue?period=${period}`);
    return response.data?.data ?? response.data;
  },

  getOrdersTrend: async (period = 'week') => {
    const response = await api.get(`/api/reports/orders?period=${period}`);
    return response.data?.data ?? response.data;
  },

  getTopItems: async (period = 'week') => {
    const response = await api.get(`/api/reports/top-items?period=${period}`);
    return response.data?.data ?? response.data;
  },

  getRevenueRecovery: async (period = 'week') => {
    const response = await api.get(`/api/reports/revenue-recovery?period=${period}`);
    return response.data?.data ?? response.data;
  }
};

