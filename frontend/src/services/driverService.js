import api from './api';

export const driverService = {
  getDriverOrders: async () => {
    const response = await api.get('/api/orders');
    // Extract list array
    const list = response.data?.data ?? response.data ?? [];
    return list;
  },

  getDriverOrderById: async (id) => {
    const response = await api.get(`/api/orders/${id}`);
    return response.data?.data ?? response.data;
  },

  updateDriverOrder: async (id, orderData) => {
    // Standard status update
    const response = await api.patch(`/api/orders/${id}/status`, { status: orderData.orderStatus });
    return response.data?.data ?? response.data;
  },

  deleteDriverOrder: async (id) => {
    const response = await api.delete(`/api/orders/${id}`);
    return response.data?.data ?? response.data;
  }
};
