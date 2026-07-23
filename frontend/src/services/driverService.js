import api from './api';

export const driverService = {
  getDriverOrders: async () => {
    const response = await api.get('/api/driver/orders');
    return response.data;
  },

  getDriverOrderById: async (id) => {
    const response = await api.get(`/api/driver/orders/${id}`);
    return response.data;
  },

  updateDriverOrder: async (id, orderData) => {
    const response = await api.put(`/api/driver/orders/${id}`, orderData);
    return response.data;
  },

  deleteDriverOrder: async (id) => {
    const response = await api.delete(`/api/driver/orders/${id}`);
    return response.data;
  }
};
