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
  },

  clockIn: async (staffId) => {
    const response = await api.post('/api/staff/attendance/clock-in', { staffId });
    return response.data;
  },

  clockOut: async (staffId) => {
    const response = await api.post('/api/staff/attendance/clock-out', { staffId });
    return response.data;
  },

  getAttendanceHistory: async () => {
    const response = await api.get('/api/staff/attendance/history');
    return response.data?.data?.history || [];
  }
};
