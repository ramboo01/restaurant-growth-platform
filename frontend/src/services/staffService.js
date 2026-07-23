import api from './api';

export const staffService = {
  getStaff: async () => {
    const response = await api.get('/api/staff');
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
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  },

  createStaff: async (staffData) => {
    const response = await api.post('/api/staff', staffData);
    return response.data;
  },

  updateStaff: async (id, staffData) => {
    const response = await api.put(`/api/staff/${id}`, staffData);
    return response.data;
  },

  deleteStaff: async (id) => {
    const response = await api.delete(`/api/staff/${id}`);
    return response.data;
  }
};
