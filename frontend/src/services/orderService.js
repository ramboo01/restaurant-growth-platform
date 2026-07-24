import api from './api';

function unwrapOrderList(data) {
  const payload = data?.data ?? data;
  if (Array.isArray(payload)) {
    return { data: payload, page: 1, limit: payload.length, total: payload.length, totalPages: 1 };
  }

  if (Array.isArray(payload?.data)) {
    return payload;
  }

  return {
    data: [],
    page: 1,
    limit: 0,
    total: 0,
    totalPages: 0
  };
}

function unwrapOrder(data) {
  return data?.order ?? data?.data?.order ?? data?.data ?? data ?? null;
}

export async function fetchOrders(params = {}) {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', params.page);
  if (params.limit) searchParams.set('limit', params.limit);
  if (params.search) searchParams.set('search', params.search);
  if (params.sort) searchParams.set('sort', params.sort);
  if (params.order) searchParams.set('order', params.order);
  if (params.status) searchParams.set('status', params.status);

  const response = await api.get(`/api/orders${searchParams.toString() ? `?${searchParams.toString()}` : ''}`);
  return unwrapOrderList(response.data);
}

export async function createOrder(payload) {
  const response = await api.post('/api/orders', payload);
  return unwrapOrder(response.data);
}

export async function updateOrder(orderId, payload) {
  const response = await api.put(`/api/orders/${orderId}`, payload);
  return unwrapOrder(response.data);
}

export async function updateOrderStatus(orderId, status) {
  const response = await api.patch(`/api/orders/${orderId}/status`, { status });
  return unwrapOrder(response.data);
}

export async function deleteOrder(orderId) {
  const response = await api.delete(`/api/orders/${orderId}`);
  return unwrapOrder(response.data);
}

export async function placePublicOrder(payload) {
  const response = await api.post('/api/public/orders', payload);
  return unwrapOrder(response.data);
}

export async function trackOrder(orderNumber) {
  const response = await api.get(`/api/public/orders/number/${orderNumber}`);
  return unwrapOrder(response.data);
}
