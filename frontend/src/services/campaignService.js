import api from './api.js';

export async function fetchCampaigns() {
  const response = await api.get('/campaigns');
  return response.data;
}

export async function createCampaign(campaignData) {
  const response = await api.post('/campaigns', campaignData);
  return response.data;
}

export async function sendCampaign(campaignId) {
  const response = await api.post(`/campaigns/${campaignId}/send`);
  return response.data;
}

export async function deleteCampaign(campaignId) {
  const response = await api.delete(`/campaigns/${campaignId}`);
  return response.data;
}

export default {
  fetchCampaigns,
  createCampaign,
  sendCampaign,
  deleteCampaign
};
