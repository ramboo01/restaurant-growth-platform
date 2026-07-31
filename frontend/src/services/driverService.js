import api from './api';

function unwrapList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.data)) return data.data.data;
  return [];
}

export const driverService = {
  getDriverOrders: async () => {
    const response = await api.get('/api/orders');
    return unwrapList(response.data?.data ?? response.data);
  },

  getAssignedOrders: async () => {
    const response = await api.get('/api/orders');
    return unwrapList(response.data?.data ?? response.data);
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
