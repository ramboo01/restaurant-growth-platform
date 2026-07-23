import api from './api';

function unwrapMenuList(data) {
  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data)) {
    return data;
  }

  return [];
}

function unwrapMenuItem(data) {
  return data?.menuItem ?? data?.data?.menuItem ?? data?.data ?? data ?? null;
}

export async function fetchMenuItems() {
  const response = await api.get('/api/menu');
  return unwrapMenuList(response.data?.data ?? response.data);
}

export async function fetchMenuItem(itemId) {
  const response = await api.get(`/api/menu/${itemId}`);
  return unwrapMenuItem(response.data);
}

export async function createMenuItem(payload) {
  const response = await api.post('/api/menu', payload);
  return unwrapMenuItem(response.data);
}

export async function updateMenuItem(itemId, payload) {
  const response = await api.put(`/api/menu/${itemId}`, payload);
  return unwrapMenuItem(response.data);
}

export async function removeMenuItem(itemId) {
  const response = await api.delete(`/api/menu/${itemId}`);
  return unwrapMenuItem(response.data);
}

export async function uploadMenuImage(file) {
  const formData = new FormData();
  formData.append('image', file);

  const response = await api.post('/api/upload/menu-image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.data?.data?.path ?? '';
}
