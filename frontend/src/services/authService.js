import api from './api';

export async function login(payload) {
  const response = await api.post('/api/auth/login', payload);
  return response.data;
}

export async function register(payload) {
  const response = await api.post('/api/auth/register', payload);
  return response.data;
}

export function logout() {
  localStorage.removeItem('jwt');
  localStorage.removeItem('user');
}

export async function getProfile() {
  const response = await api.get('/api/auth/profile');
  return response.data;
}
