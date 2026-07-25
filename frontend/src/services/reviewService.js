import api from './api';

export const fetchReviews = async () => {
  const response = await api.get('/api/reviews');
  return response.data;
};

export const updateReview = async (id, data) => {
  const response = await api.put(`/api/reviews/${id}`, data);
  return response.data;
};

export const generateAiReply = async (id) => {
  const response = await api.post(`/api/reviews/${id}/ai-reply`);
  return response.data;
};
