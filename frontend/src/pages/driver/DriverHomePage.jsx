import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { driverService } from '../../services/driverService.js';
import { useSocket } from '../../context/SocketContext.jsx';

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value) || 0);
}

function DriverHomePage() {
  const [isOnline, setIsOnline] = useState(true);
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [recentDeliveries, setRecentDeliveries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    todayCompleted: 12,
    todayEarnings: 168.50,
    basePay: 124.00,
    tips: 44.50,
    onlineHours: 5.5
  });

  const { socket } = useSocket();

  const loadDriverData = async () => {
    try {
      setIsLoading(true);
      const orders = await driverService.getAssignedOrders();
      const orderList = Array.isArray(orders) ? orders : orders?.items || orders?.orders || [];
      
      const active = orderList.find(o => (o.orderStatus || o.order_status) === 'Out for Delivery' || (o.orderStatus || o.order_status) === 'Ready') || orderList[0];
      if (active) {
        const fulfillment = typeof active.fulfillmentDetails === 'string'
          ? JSON.parse(active.fulfillmentDetails)
          : active.fulfillmentDetails || {};

        setActiveDelivery({
          id: active.id,
          orderNumber: active.orderNumber || active.order_number,
          customerName: active.customerName || active.customer_name || 'Guest Customer',
          customerPhone: active.customerPhone || active.customer_phone || '(555) 234-5678',
          status: active.orderStatus || active.order_status,
          totalAmount: active.totalAmount || active.total_amount,
          pickupAddress: 'RestruRent Kitchen - Main Outlet',
          deliveryAddress: (fulfillment.addressLine || fulfillment.address)
            ? `${fulfillment.addressLine || fulfillment.address}${fulfillment.city ? `, ${fulfillment.city}` : ''}`
            : 'Store Pickup',
          deliveryPin: active.deliveryOtp || active.delivery_otp || '1234',
          itemsCount: Array.isArray(active.items) ? active.items.length : 1,
          eta: '15 mins'
        });
      }

      setRecentDeliveries(orderList.slice(0, 5));
    } catch (err) {
      console.error('Failed to load driver home data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDriverData();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => loadDriverData();
    socket.on('ORDER_STATUS_CHANGED', handleUpdate);
    socket.on('NEW_ORDER_RECEIVED', handleUpdate);
    socket.on('newOrder', handleUpdate);
    socket.on('NEW_ORDER', handleUpdate);
    socket.on('orderUpdated', handleUpdate);
    return () => {
      socket.off('ORDER_STATUS_CHANGED', handleUpdate);
      socket.off('NEW_ORDER_RECEIVED', handleUpdate);
      socket.off('newOrder', handleUpdate);
      socket.off('NEW_ORDER', handleUpdate);
      socket.off('orderUpdated', handleUpdate);
    };
  }, [socket]);

  return (
    <div className="container-fluid py-3 px-md-4" style={{ maxWidth: '1000px' }}>
      {/* Header & Status Toggle */}
      <div className="card border-0 shadow-sm rounded-4 mb-4 bg-gradient-dark text-white overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}>
        <div className="card-body p-4">
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
            <div>
              <span className="badge bg-primary bg-opacity-20 text-primary border border-primary border-opacity-25 mb-2 px-3 py-1 rounded-pill">
                <i className="bi bi-shield-check me-1"></i> Delivery Partner Terminal
              </span>
              <h3 className="fw-bold text-white mb-1">Driver Dashboard</h3>
              <p className="text-white-50 small mb-0">Active shift status, assigned dispatches, and daily earnings ledger.</p>
            </div>

            <div className="d-flex align-items-center gap-3 bg-white bg-opacity-10 p-2 px-3 rounded-pill border border-white border-opacity-10">
              <span className={`fw-semibold small ${isOnline ? 'text-success' : 'text-muted'}`}>
                <i className={`bi bi-circle-fill me-1 ${isOnline ? 'text-success' : 'text-secondary'}`} style={{ fontSize: '0.6rem' }}></i>
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
              <div className="form-check form-switch m-0">
                <input 
                  className="form-check-input" 
                  type="checkbox" 
                  role="switch" 
                  id="onlineSwitch"
                  checked={isOnline} 
                  onChange={(e) => setIsOnline(e.target.checked)}
                  style={{ width: '2.8em', height: '1.4em', cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Online Status Banner */}
      {!isOnline && (
        <div className="alert alert-warning border-0 shadow-sm rounded-3 d-flex align-items-center gap-3 mb-4">
          <i className="bi bi-exclamation-triangle-fill fs-4 text-warning"></i>
          <div>
            <div className="fw-bold">You are currently OFFLINE</div>
            <div className="small text-muted">Switch your status to ONLINE above to receive new automated delivery dispatches.</div>
          </div>
        </div>
      )}

      {/* Earnings Summary Grid */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-3 h-100 bg-white">
            <div className="card-body p-3">
              <div className="text-muted small fw-semibold text-uppercase mb-1">Today's Earnings</div>
              <div className="fs-3 fw-bold text-success">{formatCurrency(stats.todayEarnings)}</div>
              <div className="text-muted small mt-1">
                <span className="text-dark fw-medium">{formatCurrency(stats.basePay)}</span> base + <span className="text-success fw-medium">{formatCurrency(stats.tips)}</span> tips
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-3 h-100 bg-white">
            <div className="card-body p-3">
              <div className="text-muted small fw-semibold text-uppercase mb-1">Completed Deliveries</div>
              <div className="fs-3 fw-bold text-dark">{stats.todayCompleted}</div>
              <div className="text-muted small mt-1"><i className="bi bi-check2-circle text-success me-1"></i>100% On-Time rate</div>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-3 h-100 bg-white">
            <div className="card-body p-3">
              <div className="text-muted small fw-semibold text-uppercase mb-1">Active Shift Hours</div>
              <div className="fs-3 fw-bold text-primary">{stats.onlineHours} hrs</div>
              <div className="text-muted small mt-1"><i className="bi bi-clock me-1"></i>Started at 11:30 AM</div>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-3 h-100 bg-white">
            <div className="card-body p-3">
              <div className="text-muted small fw-semibold text-uppercase mb-1">Surge Bonus</div>
              <div className="fs-3 fw-bold text-warning">+$2.50</div>
              <div className="text-muted small mt-1"><i className="bi bi-lightning-charge-fill me-1 text-warning"></i>Active in Downtown</div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Assigned Delivery Section */}
      <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden border-start border-4 border-primary">
        <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
          <h5 className="fw-bold mb-0 text-dark">
            <i className="bi bi-box-seam-fill text-primary me-2"></i> Current Assigned Dispatch
          </h5>
          {activeDelivery && (
            <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill fw-semibold">
              Status: {activeDelivery.status}
            </span>
          )}
        </div>

        <div className="card-body p-4 pt-0">
          {activeDelivery ? (
            <div>
              <div className="bg-light p-3 rounded-3 mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div>
                    <span className="fw-bold fs-5 text-dark">Order #{activeDelivery.orderNumber}</span>
                    <span className="text-muted small ms-2">({activeDelivery.itemsCount} items)</span>
                  </div>
                  <span className="fw-bold text-success fs-5">{formatCurrency(activeDelivery.totalAmount)}</span>
                </div>

                <div className="row g-3 mt-1">
                  <div className="col-12 col-md-6">
                    <div className="d-flex align-items-start gap-2">
                      <div className="bg-warning bg-opacity-20 p-2 rounded-circle text-warning mt-1">
                        <i className="bi bi-shop"></i>
                      </div>
                      <div>
                        <div className="text-muted extra-small uppercase fw-bold">PICKUP FROM</div>
                        <div className="fw-semibold text-dark">{activeDelivery.pickupAddress}</div>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="d-flex align-items-start gap-2">
                      <div className="bg-success bg-opacity-20 p-2 rounded-circle text-success mt-1">
                        <i className="bi bi-geo-alt-fill"></i>
                      </div>
                      <div>
                        <div className="text-muted extra-small uppercase fw-bold">DELIVER TO</div>
                        <div className="fw-semibold text-dark">{activeDelivery.deliveryAddress}</div>
                        <div className="text-muted small">Customer: {activeDelivery.customerName} ({activeDelivery.customerPhone})</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="d-flex flex-wrap gap-2">
                <Link to="/driver/orders" className="btn btn-primary fw-semibold flex-grow-1">
                  <i className="bi bi-arrow-right-circle me-2"></i> Manage Active Delivery & Status
                </Link>
                <a href={`tel:${activeDelivery.customerPhone}`} className="btn btn-outline-secondary fw-semibold">
                  <i className="bi bi-telephone-fill me-1"></i> Call Customer
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted">
              <i className="bi bi-inbox fs-2 text-muted d-block mb-2"></i>
              No active delivery assigned right now. Keep your status Online to receive offers!
            </div>
          )}
        </div>
      </div>

      {/* Quick Navigation Links */}
      <div className="row g-3">
        <div className="col-12 col-md-6">
          <div className="card border-0 shadow-sm rounded-3 h-100">
            <div className="card-header bg-white border-0 py-3">
              <h6 className="fw-bold mb-0">Quick Actions</h6>
            </div>
            <div className="card-body d-flex flex-column gap-2">
              <Link to="/driver/orders" className="d-flex align-items-center gap-3 p-3 bg-light rounded-3 text-decoration-none hover-shadow">
                <div className="bg-primary bg-opacity-10 p-2 rounded-3 text-primary">
                  <i className="bi bi-list-task fs-4"></i>
                </div>
                <div>
                  <div className="fw-bold text-dark">All Deliveries Queue</div>
                  <span className="text-muted small">View all pending, active, and completed orders.</span>
                </div>
              </Link>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="card border-0 shadow-sm rounded-3 h-100">
            <div className="card-header bg-white border-0 py-3">
              <h6 className="fw-bold mb-0">System Broadcast Alerts</h6>
            </div>
            <div className="card-body">
              <div className="list-group list-group-flush">
                <div className="list-group-item p-2 border-0 border-bottom">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="badge bg-warning text-dark">Surge Alert</span>
                    <span className="text-muted extra-small">10 mins ago</span>
                  </div>
                  <div className="small fw-semibold text-dark mt-1">High order volume in River North area (+ $2.50 bonus per order).</div>
                </div>
                <div className="list-group-item p-2 border-0">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="badge bg-info text-dark">System</span>
                    <span className="text-muted extra-small">1 hr ago</span>
                  </div>
                  <div className="small fw-semibold text-dark mt-1">Delivery OTP PIN handshake feature is active. Please verify customer PIN at dropoff.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DriverHomePage;
