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
  }
};
