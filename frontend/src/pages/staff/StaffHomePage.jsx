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

  const [clockState, setClockState] = useState({
    isClockedIn: false,
    clockInTime: null,
    shiftSeconds: 0,
  });

  useEffect(() => {
    let timer;
    if (clockState.isClockedIn) {
      timer = setInterval(() => {
        setClockState(prev => ({ ...prev, shiftSeconds: prev.shiftSeconds + 1 }));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [clockState.isClockedIn]);

  const handleClockIn = async () => {
    setClockState({
      isClockedIn: true,
      clockInTime: new Date(),
      shiftSeconds: 0
    });
  };

  const handleClockOut = async () => {
    setClockState(prev => ({
      ...prev,
      isClockedIn: false
    }));
  };

  const formatShiftTime = (secs) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container-fluid py-4">
      {/* Header & Time-Clock Banner */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold mb-1">
            <i className="bi bi-speedometer2 text-primary me-2"></i> Staff Dashboard
          </h2>
          <p className="text-muted mb-0">Live shift overview — orders, kitchen status, and real-time operations.</p>
        </div>

        {/* Time-Clock Attendance Card */}
        <div className="bg-white p-3 rounded-4 shadow-sm border d-flex align-items-center gap-3">
          <div>
            <div className="text-muted extra-small uppercase fw-bold">SHIFT ATTENDANCE</div>
            <div className="fw-bold text-dark fs-5 font-monospace">
              {clockState.isClockedIn ? formatShiftTime(clockState.shiftSeconds) : '00:00:00'}
            </div>
            <div className="extra-small text-muted">
              {clockState.isClockedIn ? `Clocked in at ${clockState.clockInTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Shift Not Started'}
            </div>
          </div>
          {clockState.isClockedIn ? (
            <button className="btn btn-danger btn-sm fw-bold px-3 py-2" onClick={handleClockOut}>
              <i className="bi bi-box-arrow-right me-1"></i> Clock Out
            </button>
          ) : (
            <button className="btn btn-success btn-sm fw-bold px-3 py-2" onClick={handleClockIn}>
              <i className="bi bi-alarm-fill me-1"></i> Start Shift (Clock In)
            </button>
          )}
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
        <div className="col-12 col-md-6 col-lg-3">
          <Link to="/staff/orders" className="card border-0 shadow-sm rounded-3 text-decoration-none h-100 p-3 d-flex flex-row align-items-center gap-3 hover-shadow">
            <div className="bg-primary bg-opacity-10 rounded-3 p-3">
              <i className="bi bi-receipt fs-3 text-primary"></i>
            </div>
            <div>
              <div className="fw-bold text-dark">Order Queue</div>
              <span className="text-muted small">Manage incoming orders.</span>
            </div>
          </Link>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <Link to="/staff/kitchen" className="card border-0 shadow-sm rounded-3 text-decoration-none h-100 p-3 d-flex flex-row align-items-center gap-3">
            <div className="bg-danger bg-opacity-10 rounded-3 p-3">
              <i className="bi bi-fire fs-3 text-danger"></i>
            </div>
            <div>
              <div className="fw-bold text-dark">Kitchen Display</div>
              <span className="text-muted small">KDS cooking stations.</span>
            </div>
          </Link>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <Link to="/staff/pos-loyalty" className="card border-0 shadow-sm rounded-3 text-decoration-none h-100 p-3 d-flex flex-row align-items-center gap-3">
            <div className="bg-warning bg-opacity-25 rounded-3 p-3">
              <i className="bi bi-credit-card-2-front fs-3 text-dark"></i>
            </div>
            <div>
              <div className="fw-bold text-dark">POS Loyalty</div>
              <span className="text-muted small">Redeem guest rewards.</span>
            </div>
          </Link>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <Link to="/staff/availability" className="card border-0 shadow-sm rounded-3 text-decoration-none h-100 p-3 d-flex flex-row align-items-center gap-3">
            <div className="bg-success bg-opacity-10 rounded-3 p-3">
              <i className="bi bi-calendar-check fs-3 text-success"></i>
            </div>
            <div>
              <div className="fw-bold text-dark">Shift Claiming</div>
              <span className="text-muted small">Claim open team shifts.</span>
            </div>
          </Link>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <Link to="/staff/performance-payout" className="card border-0 shadow-sm rounded-3 text-decoration-none h-100 p-3 d-flex flex-row align-items-center gap-3">
            <div className="bg-info bg-opacity-10 rounded-3 p-3">
              <i className="bi bi-cash-stack fs-3 text-info"></i>
            </div>
            <div>
              <div className="fw-bold text-dark">My Payout</div>
              <span className="text-muted small">View scorecard & cash out.</span>
            </div>
          </Link>
        </div>
        <div className="col-12 col-md-6 col-lg-3">
          <Link to="/staff/guest-lookup" className="card border-0 shadow-sm rounded-3 text-decoration-none h-100 p-3 d-flex flex-row align-items-center gap-3">
            <div className="bg-purple bg-opacity-10 rounded-3 p-3" style={{ background: 'rgba(111,66,193,0.1)' }}>
              <i className="bi bi-person-search fs-3" style={{ color: '#6f42c1' }}></i>
            </div>
            <div>
              <div className="fw-bold text-dark">Guest Lookup</div>
              <span className="text-muted small">Check allergy & VIP profile.</span>
            </div>
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
