import api from './api';

export async function getDashboardAnalytics() {
  const response = await api.get('/api/analytics/dashboard');
  const analytics = response.data?.data || null;

  return {
    analytics,
    totalCustomers: analytics?.totalCustomers ?? 0,
    recentActivity: analytics?.recentActivity ?? []
  };
}
