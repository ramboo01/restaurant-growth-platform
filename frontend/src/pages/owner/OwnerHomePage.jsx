import { useContext, useEffect, useRef, useState } from 'react';
import AttentionCard from '../../components/dashboard/AttentionCard.jsx';
import MetricCard from '../../components/dashboard/MetricCard.jsx';
import RecentActivity from '../../components/dashboard/RecentActivity.jsx';
import { AuthContext } from '../../context/AuthContext.jsx';
import { getDashboardAnalytics } from '../../services/dashboardService.js';

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function OwnerHomePage() {
  const { user } = useContext(AuthContext);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const inFlightRef = useRef(null);

  const loadDashboard = async () => {
    if (inFlightRef.current) {
      return inFlightRef.current;
    }

    setLoading(true);
    setError('');

    const request = (async () => {
      try {
        const response = await getDashboardAnalytics();
        setDashboard(response);
        return response;
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Failed to load dashboard analytics.');
        throw requestError;
      } finally {
        setLoading(false);
        inFlightRef.current = null;
      }
    })();

    inFlightRef.current = request;
    return request;
  };

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const response = await loadDashboard();
        if (active) {
          setDashboard(response);
        }
      } catch {
        if (active) {
          setDashboard(null);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [user?.id]);

  async function handleRefresh() {
    return loadDashboard();
  }

  const analytics = dashboard?.analytics || null;
  const totalCustomers = dashboard?.totalCustomers ?? 0;
  const hasAnalytics = Boolean(analytics);
  const restaurantLabel = user?.restaurantName || 'your restaurant';
  const greeting = `Good morning${user?.name ? `, ${user.name.split(' ')[0]}` : ''}`;

  const attentionItems = hasAnalytics
    ? [
        {
          id: 'pending-orders',
          title: 'Pending orders',
          description: `${analytics.pendingOrders ?? 0} orders need attention`,
          severity: 'warning',
          actionLabel: 'Review orders',
          to: '/owner/reports'
        },
        {
          id: 'preparing-orders',
          title: 'Preparing orders',
          description: `${analytics.preparingOrders ?? 0} orders are in prep`,
          severity: 'info',
          actionLabel: 'Open orders',
          to: '/owner/reports'
        },
        {
          id: 'inventory-risk',
          title: 'Inventory risk',
          description: `${analytics.lowStockItems ?? 0} items are running low`,
          severity: 'critical',
          actionLabel: 'View inventory',
          to: '/owner/inventory'
        },
        {
          id: 'driver-capacity',
          title: 'Driver capacity',
          description: `${analytics.totalDrivers ?? 0} drivers currently active`,
          severity: 'info',
          actionLabel: 'View drivers',
          to: '/driver/orders'
        }
      ]
    : [];

  const todayOperations = hasAnalytics
    ? [
        {
          id: 'orders-in-progress',
          label: 'Orders in progress',
          value: (Number(analytics.pendingOrders || 0) + Number(analytics.preparingOrders || 0) + Number(analytics.readyOrders || 0)),
          icon: 'bi-hourglass-split'
        },
        {
          id: 'awaiting-driver',
          label: 'Awaiting driver',
          value: Number(analytics.totalDrivers || 0),
          icon: 'bi-truck'
        },
        {
          id: 'eighty-six-items',
          label: "86'd items",
          value: Number(analytics.lowStockItems || 0),
          icon: 'bi-slash-circle'
        },
        {
          id: 'open-shifts',
          label: 'Open shifts',
          value: Number(analytics.totalStaff || 0) > 0 ? 0 : 0,
          icon: 'bi-person-plus'
        }
      ]
    : [];

  const recentActivity = [];

  const keyMetrics = hasAnalytics
    ? [
        {
          id: 'net-revenue',
          label: 'Total Revenue',
          value: formatCurrency(analytics.totalRevenue),
          trend: '+0.0%',
          comparison: 'live analytics',
          icon: 'bi-currency-dollar'
        },
        {
          id: 'orders',
          label: 'Total Orders',
          value: String(analytics.totalOrders ?? 0),
          trend: '+0.0%',
          comparison: 'live analytics',
          icon: 'bi-receipt'
        },
        {
          id: 'customers',
          label: 'Total Customers',
          value: String(totalCustomers),
          trend: '+0.0%',
          comparison: 'live analytics',
          icon: 'bi-people'
        },
        {
          id: 'staff',
          label: 'Total Staff',
          value: String(analytics.totalStaff ?? 0),
          trend: '+0.0%',
          comparison: 'live analytics',
          icon: 'bi-person-badge'
        },
        {
          id: 'drivers',
          label: 'Total Drivers',
          value: String(analytics.totalDrivers ?? 0),
          trend: '+0.0%',
          comparison: 'live analytics',
          icon: 'bi-truck'
        },
        {
          id: 'inventory-items',
          label: 'Total Inventory Items',
          value: String(analytics.totalInventoryItems ?? 0),
          trend: '+0.0%',
          comparison: 'live analytics',
          icon: 'bi-box-seam'
        },
        {
          id: 'loyalty-members',
          label: 'Loyalty Members',
          value: String(analytics.totalLoyaltyMembers ?? 0),
          trend: '+0.0%',
          comparison: 'live analytics',
          icon: 'bi-stars'
        }
      ]
    : [];

  return (
    <div className="owner-dashboard">
      <section className="mb-4">
        <p className="text-uppercase text-secondary small fw-semibold mb-1">Owner Dashboard</p>
        <h1 className="h3 mb-2">{greeting}</h1>
        <p className="text-secondary mb-0">Here is what needs your attention across {restaurantLabel}.</p>
      </section>

      {error ? (
        <section className="mb-4">
          <div className="alert alert-danger d-flex align-items-center justify-content-between gap-3 mb-0" role="alert">
            <span>{error}</span>
            <button className="btn btn-outline-danger btn-sm" onClick={handleRefresh} type="button" disabled={loading}>
              Retry
            </button>
          </div>
        </section>
      ) : null}

      {loading ? (
        <section className="mb-4">
          <div className="card border-0 owner-card">
            <div className="card-body">
              <div className="row g-3">
                {Array.from({ length: 7 }).map((_, index) => (
                  <div className="col-12 col-sm-6 col-xl-3" key={index}>
                    <div className="card border-0 owner-card h-100">
                      <div className="card-body placeholder-glow">
                        <div className="d-flex align-items-center justify-content-between mb-3">
                          <span className="placeholder col-5" />
                          <span className="placeholder rounded-circle" style={{ width: '2rem', height: '2rem' }} />
                        </div>
                        <div className="placeholder col-7 mb-2" />
                        <div className="placeholder col-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="mb-4" aria-labelledby="needs-attention-heading">
        <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
          <div>
            <h2 className="h5 mb-1" id="needs-attention-heading">
              Needs Attention
            </h2>
            <p className="text-secondary small mb-0">Action-required items are prioritized before analytics.</p>
          </div>
        </div>
        {hasAnalytics ? (
          <div className="row g-3">
            {attentionItems.map((item) => (
              <div className="col-12 col-md-6 col-xl-3" key={item.id}>
                <AttentionCard item={item} />
              </div>
            ))}
          </div>
        ) : !loading ? (
          <div className="card border-0 owner-card">
            <div className="card-body text-secondary">No live attention items available.</div>
          </div>
        ) : null}
      </section>

      <section className="mb-4" aria-labelledby="key-metrics-heading">
        <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
          <h2 className="h5 mb-0" id="key-metrics-heading">
            Key Metrics
          </h2>
          <button className="btn btn-outline-secondary btn-sm" onClick={handleRefresh} type="button" disabled={loading}>
            <i className={`bi ${loading ? 'bi-arrow-repeat' : 'bi-arrow-clockwise'} me-1`} aria-hidden="true" />
            Refresh
          </button>
        </div>
        {hasAnalytics && keyMetrics.length ? (
          <div className="row g-3">
            {keyMetrics.map((metric) => (
              <div className="col-12 col-sm-6 col-xl-3" key={metric.id}>
                <MetricCard metric={metric} />
              </div>
            ))}
          </div>
        ) : !loading && !error ? (
          <div className="card border-0 owner-card">
            <div className="card-body">
              <div className="text-secondary">No dashboard data available.</div>
            </div>
          </div>
        ) : null}
      </section>

      <div className="row g-4">
        <section className="col-12 col-xl-5" aria-labelledby="today-operations-heading">
            <div className="card border-0 owner-card h-100">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div>
                    <h2 className="h5 mb-1" id="today-operations-heading">
                      Today's Operations
                    </h2>
                    <p className="text-secondary small mb-0">Live service snapshot using analytics data.</p>
                  </div>
                  <span className="badge text-bg-light border">Today</span>
                </div>
                <div className="vstack gap-2">
                  {todayOperations.map((item) => (
                    <div className="owner-operation-row" key={item.id}>
                      <div className="d-flex align-items-center gap-2">
                        <span className="owner-operation-icon" aria-hidden="true">
                          <i className={`bi ${item.icon}`} />
                        </span>
                        <span className="fw-medium">{item.label}</span>
                      </div>
                      <span className="fw-semibold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

        <section className="col-12 col-xl-7" aria-labelledby="recent-activity-heading">
          <RecentActivity activities={recentActivity} />
        </section>
      </div>
    </div>
  );
}

export default OwnerHomePage;
