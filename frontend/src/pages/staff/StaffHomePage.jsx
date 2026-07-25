import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchOrders } from '../../services/orderService.js';
import { useSocket } from '../../context/SocketContext.jsx';

function StaffHomePage() {
  const [stats, setStats] = useState({ pending: 0, preparing: 0, ready: 0, completed: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { socket } = useSocket();

  const loadStats = async () => {
    try {
      const data = await fetchOrders({ limit: 50 });
      const orders = Array.isArray(data) ? data : data?.orders || [];
      const normalized = orders.map(o => ({
        id: o.id,
        customerName: o.customerName || o.customer_name || 'Guest',
        orderNumber: o.orderNumber || o.order_number || '',
        status: o.orderStatus || o.order_status || 'Pending',
        totalAmount: Number(o.totalAmount || o.total_amount || 0),
        createdAt: o.createdAt || o.created_at || ''
      }));

      setStats({
        pending: normalized.filter(o => o.status === 'Pending').length,
        preparing: normalized.filter(o => o.status === 'Preparing').length,
        ready: normalized.filter(o => o.status === 'Ready' || o.status === 'Ready_For_Pickup').length,
        completed: normalized.filter(o => o.status === 'Completed' || o.status === 'Delivered').length,
      });
      setRecentOrders(normalized.slice(0, 5));
    } catch (err) {
      console.error('Staff dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    const ticker = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(ticker);
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handler = () => loadStats();
    socket.on('NEW_ORDER_RECEIVED', handler);
    socket.on('ORDER_STATUS_CHANGED', handler);
    return () => {
      socket.off('NEW_ORDER_RECEIVED', handler);
      socket.off('ORDER_STATUS_CHANGED', handler);
    };
  }, [socket]);

  const statusColor = {
    Pending: 'warning',
    Preparing: 'primary',
    Ready: 'success',
    Ready_For_Pickup: 'success',
    Completed: 'secondary',
    Delivered: 'secondary'
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold mb-1">
            <i className="bi bi-speedometer2 text-primary me-2"></i> Staff Dashboard
          </h2>
          <p className="text-muted mb-0">Live shift overview — orders, kitchen status, and real-time operations.</p>
        </div>
        <div className="text-end">
          <div className="fs-4 fw-bold text-dark">
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div className="text-muted small">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Pending', count: stats.pending, color: 'warning', icon: 'bi-hourglass-split' },
          { label: 'Preparing', count: stats.preparing, color: 'primary', icon: 'bi-fire' },
          { label: 'Ready', count: stats.ready, color: 'success', icon: 'bi-check-circle' },
          { label: 'Completed Today', count: stats.completed, color: 'secondary', icon: 'bi-box-seam' },
        ].map(stat => (
          <div className="col-6 col-lg-3" key={stat.label}>
            <div className={`card border-0 shadow-sm rounded-3 border-start border-3 border-${stat.color}`}>
              <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="text-muted small text-uppercase fw-semibold">{stat.label}</div>
                    <div className={`fs-2 fw-bold text-${stat.color}`}>{loading ? '–' : stat.count}</div>
                  </div>
                  <i className={`bi ${stat.icon} fs-2 text-${stat.color} opacity-25`}></i>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6">
          <Link to="/staff/orders" className="card border-0 shadow-sm rounded-3 text-decoration-none h-100 p-4 d-flex flex-row align-items-center gap-3 hover-shadow">
            <div className="bg-primary bg-opacity-10 rounded-3 p-3">
              <i className="bi bi-receipt fs-3 text-primary"></i>
            </div>
            <div>
              <div className="fw-bold text-dark fs-5">Order Queue</div>
              <span className="text-muted small">View and manage all incoming restaurant orders.</span>
            </div>
            <i className="bi bi-chevron-right ms-auto text-muted"></i>
          </Link>
        </div>
        <div className="col-12 col-md-6">
          <Link to="/staff/kitchen" className="card border-0 shadow-sm rounded-3 text-decoration-none h-100 p-4 d-flex flex-row align-items-center gap-3">
            <div className="bg-danger bg-opacity-10 rounded-3 p-3">
              <i className="bi bi-fire fs-3 text-danger"></i>
            </div>
            <div>
              <div className="fw-bold text-dark fs-5">Kitchen Display System</div>
              <span className="text-muted small">Full-screen KDS for active cooking and prep stations.</span>
            </div>
            <i className="bi bi-chevron-right ms-auto text-muted"></i>
          </Link>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card border-0 shadow-sm rounded-3">
        <div className="card-header bg-white border-0 py-3 d-flex justify-content-between">
          <h5 className="fw-bold mb-0">Recent Orders</h5>
          <Link to="/staff/orders" className="btn btn-sm btn-outline-primary">View All</Link>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5 text-muted">
              <div className="spinner-border spinner-border-sm me-2" role="status"></div>
              Loading shift data...
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-inbox fs-2 d-block mb-2"></i>
              No orders yet — ready for service!
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(order => (
                    <tr key={order.id}>
                      <td className="fw-bold">#{order.orderNumber || order.id}</td>
                      <td>{order.customerName}</td>
                      <td>${order.totalAmount.toFixed(2)}</td>
                      <td>
                        <span className={`badge bg-${statusColor[order.status] || 'secondary'} bg-opacity-10 text-${statusColor[order.status] || 'secondary'} border border-${statusColor[order.status] || 'secondary'} border-opacity-25 px-2 py-1`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="text-muted small">
                        {order.createdAt ? new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '–'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StaffHomePage;
