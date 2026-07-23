import api from './api';

export const storefrontService = {
  getRestaurants: async () => {
    const response = await api.get('/api/public/restaurants');
    return response.data?.data?.restaurants || [];
  },

  getRestaurantDetails: async (restaurantId) => {
    const response = await api.get(`/api/public/restaurants/${restaurantId}`);
    return response.data?.data?.restaurant || response.data?.data;
  },

  getMenu: async (restaurantId) => {
    const response = await api.get(`/api/public/restaurants/${restaurantId}/menu`);
    const result = response.data?.data;
    if (Array.isArray(result)) {
      return result;
    }
    if (Array.isArray(result?.data)) {
      return result.data;
    }
    if (Array.isArray(result?.items)) {
      return result.items;
    }
    return [];
  },

  getCategories: async (restaurantId) => {
    const response = await api.get(`/api/public/restaurants/${restaurantId}/categories`);
    return response.data?.data?.categories || [];
  }
};
