import api from './api';

export const supplierService = {
  getSuppliers: async () => {
    const response = await api.get('/api/suppliers');
    return response.data.data;
  },

  createSupplier: async (supplierData) => {
    const response = await api.post('/api/suppliers', supplierData);
    return response.data.data;
  },

  updateSupplier: async (supplierId, supplierData) => {
    const response = await api.put(`/api/suppliers/${supplierId}`, supplierData);
    return response.data.data;
  },

  deleteSupplier: async (supplierId) => {
    const response = await api.delete(`/api/suppliers/${supplierId}`);
    return response.data.data;
  }
};
