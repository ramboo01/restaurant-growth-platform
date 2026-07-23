import api from './api';

export const notificationService = {
  getNotifications: async () => {
    const response = await api.get('/api/notifications');
    return response.data;
  },

  markAsRead: async (id) => {
    const response = await api.put(`/api/notifications/${id}/read`);
    return response.data;
  },
  
  markAllAsRead: async () => {
    const response = await api.put('/api/notifications/read-all');
    return response.data;
  }
};
