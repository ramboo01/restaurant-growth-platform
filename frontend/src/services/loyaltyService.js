import api from './api';

export const loyaltyService = {
  getSummary: async () => {
    const response = await api.get('/api/loyalty/summary');
    return response.data.data;
  },

  getRewards: async () => {
    const response = await api.get('/api/loyalty/rewards');
    return response.data.data;
  },

  createReward: async (rewardData) => {
    const response = await api.post('/api/loyalty/rewards', rewardData);
    return response.data.data;
  },

  updateReward: async (rewardId, rewardData) => {
    const response = await api.put(`/api/loyalty/rewards/${rewardId}`, rewardData);
    return response.data.data;
  },

  deleteReward: async (rewardId) => {
    const response = await api.delete(`/api/loyalty/rewards/${rewardId}`);
    return response.data.data;
  },

  checkGuestPoints: async (phone, restaurantId, customerName) => {
    const response = await api.get('/api/public/loyalty/check', {
      params: { phone, restaurantId, customerName: customerName || undefined }
    });
    return response.data?.data;
  },

  getPublicRewards: async (restaurantId) => {
    const response = await api.get('/api/public/loyalty/rewards', {
      params: { restaurantId }
    });
    return response.data?.data?.rewards || [];
  },

  redeemPoints: async (phone, restaurantId, points) => {
    const response = await api.post('/api/public/loyalty/redeem', {
      phone,
      restaurantId,
      points
    });
    return response.data?.data;
  }
};
