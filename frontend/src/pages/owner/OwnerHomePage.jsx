import { useContext, useEffect, useRef, useState } from 'react';
import AttentionCard from '../../components/dashboard/AttentionCard.jsx';
import MetricCard from '../../components/dashboard/MetricCard.jsx';
import RecentActivity from '../../components/dashboard/RecentActivity.jsx';
import { AuthContext } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { getDashboardAnalytics } from '../../services/dashboardService.js';
import api from '../../services/api.js';

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value) || 0);
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Good night';
}

function OwnerHomePage() {
  const { user } = useContext(AuthContext);
  const { socket } = useSocket();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const inFlightRef = useRef(null);

  // Fetch restaurant name for subtitle
  useEffect(() => {
    if (!user?.restaurantId) return;
    api.get(`/api/restaurants/${user.restaurantId}`)
      .then((res) => {
        const name = res.data?.data?.restaurant?.name || res.data?.data?.name || null;
        if (name) setRestaurantName(name);
      })
      .catch(() => { /* fallback silently */ });
  }, [user?.restaurantId]);

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
        setError('');
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
          setError('');
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

  // Live real-time socket sync for dashboard cards
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      loadDashboard();
    };

    socket.on('newOrder', handleUpdate);
    socket.on('NEW_ORDER', handleUpdate);
    socket.on('orderUpdated', handleUpdate);
    socket.on('ORDER_STATUS_CHANGED', handleUpdate);
    socket.on('orderDeleted', handleUpdate);
    socket.on('newCustomer', handleUpdate);
    socket.on('userRegistered', handleUpdate);
    socket.on('customerCreated', handleUpdate);

    return () => {
      socket.off('newOrder', handleUpdate);
      socket.off('NEW_ORDER', handleUpdate);
      socket.off('orderUpdated', handleUpdate);
      socket.off('ORDER_STATUS_CHANGED', handleUpdate);
      socket.off('orderDeleted', handleUpdate);
      socket.off('newCustomer', handleUpdate);
      socket.off('userRegistered', handleUpdate);
      socket.off('customerCreated', handleUpdate);
    };
  }, [socket]);

  async function handleRefresh() {
    return loadDashboard();
  }

  const analytics = dashboard?.analytics || null;
  const totalCustomers = dashboard?.totalCustomers ?? 0;
  const recentActivity = dashboard?.recentActivity ?? [];
  const hasAnalytics = Boolean(analytics);
  const restaurantLabel = restaurantName || 'your restaurant';
  const greeting = `${getGreeting()}${user?.name ? `, ${user.name.split(' ')[0]}` : ''}`;

  // === NEEDS ATTENTION SECTION — all live from analytics ===
  const attentionItems = hasAnalytics
    ? [
        {
          id: 'pending-orders',
          title: 'Pending orders',
          description: `${analytics.pendingOrders ?? 0} orders need attention`,
          severity: (analytics.pendingOrders ?? 0) > 0 ? 'warning' : 'info',
          actionLabel: 'Review orders',
          to: '/owner/orders?status=Pending'
        },
        {
          id: 'preparing-orders',
          title: 'Preparing orders',
          description: `${analytics.preparingOrders ?? 0} orders are in prep`,
          severity: 'info',
          actionLabel: 'Open orders',
          to: '/owner/orders?status=Preparing'
        },
        {
          id: 'inventory-risk',
          title: 'Inventory risk',
          description: `${analytics.lowStockItems ?? 0} items are running low`,
          severity: (analytics.lowStockItems ?? 0) > 0 ? 'critical' : 'info',
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

  // === TODAY'S OPERATIONS — all live from today's analytics ===
  const todayOperations = hasAnalytics
    ? [
        {
          id: 'orders-in-progress',
          label: 'Orders in progress',
          value: (Number(analytics.todayPendingOrders || 0) + Number(analytics.todayPreparingOrders || 0) + Number(analytics.todayReadyOrders || 0)),
          icon: 'bi-hourglass-split'
        },
        {
          id: 'awaiting-driver',
          label: 'Awaiting pickup',
          value: Number(analytics.todayReadyOrders || 0),
          icon: 'bi-truck'
        },
        {
          id: 'eighty-six-items',
          label: "86'd items",
          value: Number(analytics.lowStockItems || 0),
          icon: 'bi-slash-circle'
        },
        {
          id: 'today-completed',
          label: 'Completed today',
          value: Number(analytics.todayCompletedOrders || 0),
          icon: 'bi-check-circle'
        },
        {
          id: 'today-revenue',
          label: "Today's revenue",
          value: formatCurrency(analytics.todayRevenue || 0),
          icon: 'bi-currency-dollar'
        }
      ]
    : [];

  // === KEY METRICS — all live from analytics ===
  const keyMetrics = hasAnalytics
    ? [
        {
          id: 'net-revenue',
          label: 'Total Revenue',
          value: formatCurrency(analytics.totalRevenue),
          icon: 'bi-currency-dollar'
        },
        {
          id: 'orders',
          label: 'Total Orders',
          value: String(analytics.totalOrders ?? 0),
          icon: 'bi-receipt'
        },
        {
          id: 'customers',
          label: 'Total Customers',
          value: String(totalCustomers),
          icon: 'bi-people'
        },
        {
          id: 'staff',
          label: 'Total Staff',
          value: String(analytics.totalStaff ?? 0),
          icon: 'bi-person-badge'
        },
        {
          id: 'drivers',
          label: 'Total Drivers',
          value: String(analytics.totalDrivers ?? 0),
          icon: 'bi-truck'
        },
        {
          id: 'inventory-items',
          label: 'Total Inventory Items',
          value: String(analytics.totalInventoryItems ?? 0),
          icon: 'bi-box-seam'
        },
        {
          id: 'loyalty-members',
          label: 'Loyalty Members',
          value: String(analytics.totalLoyaltyMembers ?? 0),
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

      {error && !dashboard ? (
        <section className="mb-4">
          <div className="alert alert-danger d-flex flex-wrap align-items-center justify-content-between gap-3 mb-0" role="alert">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-shield-exclamation fs-4 text-danger flex-shrink-0" />
              <div>
                <strong className="d-block">Access Restricted ({error})</strong>
                <span className="small text-danger text-opacity-75">
                  The account currently signed in does not have Owner permissions to access dashboard analytics. Please log in with an Owner account.
                </span>
              </div>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-danger btn-sm text-nowrap"
                onClick={() => {
                  localStorage.removeItem('jwt');
                  localStorage.removeItem('user');
                  window.location.href = '/login';
                }}
                type="button"
              >
                <i className="bi bi-box-arrow-in-right me-1" />
                Log in as Owner
              </button>
              <button className="btn btn-outline-danger btn-sm" onClick={handleRefresh} type="button" disabled={loading}>
                Retry
              </button>
            </div>
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
                    <p className="text-secondary small mb-0">Live service snapshot for today.</p>
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
