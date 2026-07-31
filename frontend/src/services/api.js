import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt');

  if (token) {
    if (config.headers && typeof config.headers.set === 'function') {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }

  // Send active restaurant context for multi-restaurant switching
  const activeRestaurantId = localStorage.getItem('activeRestaurantId');
  if (activeRestaurantId) {
    if (config.headers && typeof config.headers.set === 'function') {
      config.headers.set('X-Restaurant-Id', activeRestaurantId);
    } else {
      config.headers = config.headers || {};
      config.headers['X-Restaurant-Id'] = activeRestaurantId;
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('jwt');
      localStorage.removeItem('user');
    }

    return Promise.reject(error);
  }
);

export default api;
