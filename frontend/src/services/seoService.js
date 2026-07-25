import api from './api';

export const fetchSeoSettings = async () => {
  const response = await api.get('/api/seo');
  return response.data;
};

export const updateSeoSettings = async (data) => {
  const response = await api.put('/api/seo', data);
  return response.data;
};

export const generateAiSeoMeta = async (businessDetails) => {
  const response = await api.post('/api/seo/ai-meta', businessDetails);
  return response.data;
};
