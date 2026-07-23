import api from './api';

export async function getDashboardAnalytics() {
  const [analyticsResponse, customersResponse] = await Promise.all([
    api.get('/api/analytics/dashboard'),
    api.get('/api/customers?page=1&limit=1')
  ]);

  const analytics = analyticsResponse.data?.data || null;
  const customerTotal = customersResponse.data?.data?.total ?? 0;

  return {
    analytics,
    totalCustomers: customerTotal
  };
}
