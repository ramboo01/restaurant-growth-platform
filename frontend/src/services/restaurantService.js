import api from './api';

export const restaurantService = {
  getRestaurant: async (id) => {
    const response = await api.get(`/api/restaurants/${id}`);
    return response.data?.data?.restaurant || response.data?.data;
  },

  updateRestaurant: async (id, data) => {
    const response = await api.put(`/api/restaurants/${id}`, data);
    return response.data?.data?.restaurant || response.data?.data;
  }
};
