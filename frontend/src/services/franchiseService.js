import api from './api';

export const franchiseService = {
  getMyRestaurants: async () => {
    const response = await api.get('/api/franchise/my-restaurants');
    return response.data?.data?.restaurants || [];
  },

  getComparisonData: async () => {
    const response = await api.get('/api/franchise/comparison-data');
    return response.data?.data || { stores: [], summary: { combinedSales: 0, avgLaborCost: '0%', avgAuditScore: '0%' } };
  },

  updateRestaurantStatus: async (restaurantId, status) => {
    const response = await api.patch(`/api/franchise/${restaurantId}/status`, { status });
    return response.data?.data;
  },

  getSettings: async () => {
    const response = await api.get('/api/franchise/settings');
    return response.data?.data || { pricingSync: true, requireApproval: false, auditLogs: true };
  },

  saveSettings: async (settings) => {
    const response = await api.put('/api/franchise/settings', settings);
    return response.data?.data;
  },

  syncMenu: async (sourceRestaurantId) => {
    const response = await api.post('/api/franchise/sync-menu', { sourceRestaurantId });
    return response.data?.data;
  },

  switchRestaurant: async (restaurantId) => {
    const response = await api.post('/api/franchise/switch', { restaurantId });
    return response.data?.data;
  },

  getFinancialSettings: async () => {
    const response = await api.get('/api/franchise/financial-settings');
    return response.data?.data;
  },

  saveFinancialSettings: async (settings) => {
    const response = await api.put('/api/franchise/financial-settings', settings);
    return response.data?.data;
  },

  getCateringInstallments: async () => {
    const response = await api.get('/api/franchise/catering-installments');
    return response.data?.data || [];
  }
};
