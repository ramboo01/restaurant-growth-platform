import api from './api';

export const restaurantService = {
  getRestaurants: async () => {
    const response = await api.get('/api/restaurants');
    return response.data?.data?.restaurants || response.data?.data || [];
  },

  getRestaurant: async (id) => {
    const response = await api.get(`/api/restaurants/${id}`);
    return response.data?.data?.restaurant || response.data?.data;
  },

  createRestaurant: async (data) => {
    const response = await api.post('/api/restaurants', data);
    return response.data?.data?.restaurant || response.data?.data;
  },

  updateRestaurant: async (id, data) => {
    const response = await api.put(`/api/restaurants/${id}`, data);
    return response.data?.data?.restaurant || response.data?.data;
  },

  updateRestaurantStatus: async (id, status) => {
    const response = await api.patch(`/api/restaurants/${id}/status`, { status });
    return response.data?.data?.restaurant || response.data?.data;
  }
};
