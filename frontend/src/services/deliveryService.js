import api from './api';

export async function getDeliveryConfig() {
  const response = await api.get('/api/delivery');
  return response.data;
}

export async function getPublicDeliveryConfig(restaurantId = 1) {
  const response = await api.get(`/api/delivery/public/${restaurantId}`);
  return response.data;
}

export async function updateDeliveryConfig(payload) {
  const response = await api.put('/api/delivery', payload);
  return response.data;
}
