import api from './api';

const mapBackendToFrontend = (item) => {
  if (!item) return null;
  return {
    id: item.id || item._id,
    name: item.itemName || '',
    category: item.category || '',
    currentStock: item.quantity !== undefined ? item.quantity : 0,
    unit: item.unit || '',
    minimumStock: item.minimumQuantity !== undefined ? item.minimumQuantity : 0,
    supplier: item.supplier || 'General Supplier',
    status: item.status || 'In Stock',
    costPerUnit: item.costPerUnit !== undefined ? Number(item.costPerUnit) : 0
  };
};

const mapFrontendToBackend = (itemData) => {
  const currentStock = Number(itemData.currentStock);
  const minimumStock = Number(itemData.minimumStock);
  
  // calculate status if not present
  let status = itemData.status;
  if (!status) {
    if (currentStock <= 0) {
      status = 'Out of Stock';
    } else if (currentStock <= minimumStock) {
      status = 'Low Stock';
    } else {
      status = 'In Stock';
    }
  }

  return {
    itemName: itemData.name,
    category: itemData.category,
    unit: itemData.unit,
    quantity: currentStock,
    minimumQuantity: minimumStock,
    supplier: itemData.supplier || 'General Supplier',
    status
  };
};

export const inventoryService = {
  getInventory: async () => {
    const response = await api.get('/api/inventory');
    const result = response.data?.data;
    
    let items = [];
    if (Array.isArray(result)) {
      items = result;
    } else if (Array.isArray(result?.data)) {
      items = result.data;
    } else if (Array.isArray(result?.items)) {
      items = result.items;
    } else if (Array.isArray(response.data)) {
      items = response.data;
    }
    
    return items.map(mapBackendToFrontend);
  },

  createInventoryItem: async (itemData) => {
    const backendData = mapFrontendToBackend(itemData);
    const response = await api.post('/api/inventory', backendData);
    return response.data;
  },

  updateInventoryItem: async (id, itemData) => {
    const backendData = mapFrontendToBackend(itemData);
    const response = await api.put(`/api/inventory/${id}`, backendData);
    return response.data;
  },

  deleteInventoryItem: async (id) => {
    const response = await api.delete(`/api/inventory/${id}`);
    return response.data;
  },

  // ─── Transaction APIs ───────────────────────────────────

  stockIn: async (itemId, payload) => {
    const response = await api.post(`/api/inventory/${itemId}/stock-in`, payload);
    return response.data;
  },

  recordUsage: async (itemId, payload) => {
    const response = await api.post(`/api/inventory/${itemId}/usage`, payload);
    return response.data;
  },

  recordWastage: async (itemId, payload) => {
    const response = await api.post(`/api/inventory/${itemId}/wastage`, payload);
    return response.data;
  },

  adjustStock: async (itemId, payload) => {
    const response = await api.post(`/api/inventory/${itemId}/adjustment`, payload);
    return response.data;
  },

  getTransactions: async (query = {}) => {
    const params = new URLSearchParams(query).toString();
    const response = await api.get(`/api/inventory/transactions${params ? '?' + params : ''}`);
    return response.data?.data?.transactions || [];
  },

  getTransactionSummary: async () => {
    const response = await api.get('/api/inventory/transactions/summary');
    return response.data?.data || {};
  }
};
