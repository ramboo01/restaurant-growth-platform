import api from './api';

export const aiService = {
  queryCopilot: async (queryText) => {
    const response = await api.post('/api/ai/query', { query: queryText });
    return response.data?.data || response.data;
  }
};
