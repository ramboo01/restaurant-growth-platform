import { useEffect, useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import LoadingState from '../../components/feedback/LoadingState.jsx';
import EmptyState from '../../components/feedback/EmptyState.jsx';
import { driverService } from '../../services/driverService.js';
import { useSocket } from '../../context/SocketContext.jsx';

const driverStatuses = ['Pending', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered'];

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value) || 0);
}

function normalizeOrder(order) {
  const fulfillment = typeof order.fulfillmentDetails === 'string'
    ? JSON.parse(order.fulfillmentDetails)
    : order.fulfillmentDetails || {};

  const addrStr = fulfillment.addressLine || fulfillment.address
    ? `${fulfillment.addressLine || fulfillment.address}${fulfillment.city ? `, ${fulfillment.city}` : ''}`
    : 'Store Pickup';

  return {
    id: order.id,
    customerName: order.customerName ?? order.customer_name ?? 'Unknown',
    orderNumber: order.orderNumber ?? order.order_number ?? '',
    orderStatus: order.orderStatus ?? order.order_status ?? 'Pending',
    totalAmount: Number(order.totalAmount ?? order.total_amount ?? 0),
    createdAt: order.createdAt ?? order.created_at ?? '',
    address: addrStr,
    fulfillmentType: fulfillment.type || 'Delivery', // Default to Delivery for driver orders if type is present or fallback
    deliveryTime: fulfillment.deliveryTime || fulfillment.estimatedDelivery || fulfillment.estimatedTime || 'ASAP'
  };
}

function DriverOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState('');
  const [updatingId, setUpdatingId] = useState('');

  const toastTimerRef = useRef(null);
  const { socket } = useSocket();

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await driverService.getDriverOrders();
      const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      
      // Filter only delivery orders
      const normalized = list.map(normalizeOrder).filter(o => o.fulfillmentType === 'Delivery' || !o.fulfillmentType);
      setOrders(normalized);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch driver orders.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (orderData) => {
      const normalized = normalizeOrder(orderData);
      if (normalized.fulfillmentType === 'Delivery' || !normalized.fulfillmentType) {
        setOrders(current => {
          if (current.some(o => o.id === normalized.id)) return current;
          return [normalized, ...current];
        });
        showToast(`New delivery order received: ${normalized.orderNumber}`);
      }
    };

    const handleOrderUpdated = (orderData) => {
      const normalized = normalizeOrder(orderData);
      setOrders(current => {
        if (normalized.fulfillmentType !== 'Delivery' && normalized.fulfillmentType) {
          return current.filter(o => o.id !== normalized.id);
        }
        return current.map(o => o.id === normalized.id ? normalized : o);
      });
    };

    socket.on('newOrder', handleNewOrder);
    socket.on('NEW_ORDER', handleNewOrder);
    socket.on('orderUpdated', handleOrderUpdated);
    socket.on('ORDER_STATUS_CHANGED', handleOrderUpdated);

    return () => {
      socket.off('newOrder', handleNewOrder);
      socket.off('NEW_ORDER', handleNewOrder);
      socket.off('orderUpdated', handleOrderUpdated);
      socket.off('ORDER_STATUS_CHANGED', handleOrderUpdated);
    };
  }, [socket]);

  function showToast(message) {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(''), 2500);
  }

  const [otpModalOrder, setOtpModalOrder] = useState(null);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');

  const advanceStatus = async (orderId, enteredOtp = '') => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    
    if (order.orderStatus === 'Out for Delivery' && !enteredOtp) {
      setOtpModalOrder(order);
      setOtpInput('');
      setOtpError('');
      return;
    }

    let newStatus = '';
    if (order.orderStatus === 'Ready') newStatus = 'Out for Delivery';
    else if (order.orderStatus === 'Out for Delivery') newStatus = 'Delivered';
    else return;

    setUpdatingId(orderId);
    try {
      await driverService.updateDriverOrder(orderId, { orderStatus: newStatus, otp: enteredOtp });
      showToast(`Order marked as ${newStatus}!`);
      setOtpModalOrder(null);
      await fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdatingId('');
    }
  };

  const driverOrders = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus = driverStatuses.includes(order.orderStatus);
      const matchesSearch = order.orderNumber.toLowerCase().includes(normalizedSearch);
      const matchesFilter = statusFilter === 'All' || order.orderStatus === statusFilter;

      return matchesStatus && matchesSearch && matchesFilter;
    });
  }, [orders, searchTerm, statusFilter]);

  function getActionLabel(status) {
    if (status === 'Pending') return 'Order Placed (Waiting for Kitchen)';
    if (status === 'Preparing') return 'Kitchen Preparing Food...';
    if (status === 'Ready') return 'Accept Delivery & Start Drive';
    if (status === 'Out for Delivery') return 'Verify PIN & Mark Delivered';
    return 'Delivered';
  }

  function getBadgeClass(status) {
    if (status === 'Pending') return 'text-bg-secondary';
    if (status === 'Preparing') return 'text-bg-warning';
    if (status === 'Ready') return 'text-bg-primary';
    if (status === 'Out for Delivery') return 'text-bg-info';
    return 'text-bg-success';
  }

  return (
    <div className="container-fluid px-0">
      {toast && <div className="alert alert-success py-2">{toast}</div>}

      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div>
          <p className="text-uppercase text-secondary small fw-semibold mb-2">Driver Orders</p>
          <h1 className="h3 mb-1">Delivery Module</h1>
          <p className="text-secondary mb-0">Ready and active deliveries only.</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={fetchOrders} disabled={isLoading}>
            Refresh
          </button>
          <Link className="btn btn-outline-secondary btn-sm" to="/driver">
            Back to Driver Home
          </Link>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-6">
          <label className="form-label" htmlFor="driverOrderSearch">
            Search by Order Number
          </label>
          <input
            className="form-control"
            id="driverOrderSearch"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search order number..."
            value={searchTerm}
          />
        </div>
        <div className="col-12 col-lg-6">
          <label className="form-label" htmlFor="driverOrderFilter">
            Filter by Status
          </label>
          <select
            className="form-select"
            id="driverOrderFilter"
            onChange={(event) => setStatusFilter(event.target.value)}
            value={statusFilter}
          >
            <option value="All">All</option>
            {driverStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Loading delivery orders..." />
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : driverOrders.length ? (
        <div className="row g-3">
          {driverOrders.map((order) => (
            <div className="col-12 col-md-6 col-xxl-4" key={order.id}>
              <article className="card border-0 guest-cart-item h-100">
                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between gap-3 mb-3">
                    <div>
                      <p className="text-secondary small mb-1">Order Number</p>
                      <h2 className="h6 mb-0">{order.orderNumber}</h2>
                    </div>
                    <span className={`badge ${getBadgeClass(order.orderStatus)}`}>
                      {order.orderStatus === 'Pending' ? 'Order Placed' : order.orderStatus === 'Preparing' ? 'Kitchen Preparing' : order.orderStatus}
                    </span>
                  </div>

                  <div className="vstack gap-2 mb-4">
                    <div className="d-flex justify-content-between gap-3">
                      <span className="text-secondary">Customer</span>
                      <span className="fw-medium">{order.customerName}</span>
                    </div>
                    <div className="d-flex justify-content-between gap-3">
                      <span className="text-secondary">Address</span>
                      <span className="text-end fw-medium">{order.address}</span>
                    </div>
                    <div className="d-flex justify-content-between gap-3">
                      <span className="text-secondary">Delivery Time</span>
                      <span>{order.deliveryTime}</span>
                    </div>
                    <div className="d-flex justify-content-between gap-3">
                      <span className="text-secondary">Total</span>
                      <span className="fw-semibold text-success">{formatCurrency(order.totalAmount)}</span>
                    </div>
                  </div>

                  {order.orderStatus === 'Out for Delivery' && (
                    <div className="bg-primary bg-opacity-10 border border-primary border-opacity-25 rounded-3 p-3 mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="small fw-bold text-primary">
                          <i className="bi bi-geo-alt-fill me-1"></i> Driver Live GPS Signal
                        </span>
                        <span className="badge bg-success">Broadcasting</span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary w-100"
                        onClick={() => {
                          if (socket) {
                            if (typeof window !== 'undefined' && navigator.geolocation) {
                              navigator.geolocation.getCurrentPosition(
                                (pos) => {
                                  socket.emit('driverLocationUpdate', {
                                    orderId: order.id,
                                    lat: pos.coords.latitude,
                                    lng: pos.coords.longitude,
                                    speed: Math.round(pos.coords.speed || 32),
                                    heading: Math.round(pos.coords.heading || 90)
                                  });
                                  showToast(`Live GPS signal broadcasted (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
                                },
                                (err) => {
                                  socket.emit('driverLocationUpdate', {
                                    orderId: order.id,
                                    lat: 28.6139 + (Math.random() - 0.5) * 0.01,
                                    lng: 77.2090 + (Math.random() - 0.5) * 0.01,
                                    speed: 32,
                                    heading: 90
                                  });
                                  showToast(`GPS ping sent for order #${order.orderNumber}`);
                                },
                                { enableHighAccuracy: true, timeout: 5000 }
                              );
                            } else {
                              socket.emit('driverLocationUpdate', {
                                orderId: order.id,
                                lat: 28.6139 + (Math.random() - 0.5) * 0.01,
                                lng: 77.2090 + (Math.random() - 0.5) * 0.01,
                                speed: 32,
                                heading: 90
                              });
                              showToast(`GPS ping sent for order #${order.orderNumber}`);
                            }
                          }
                        }}
                      >
                        <i className="bi bi-broadcast me-1"></i> Send Live GPS Ping
                      </button>
                    </div>
                  )}

                  <button
                    className={`btn mt-auto w-100 ${
                      order.orderStatus === 'Ready' 
                        ? 'btn-primary shadow-sm fw-bold' 
                        : order.orderStatus === 'Out for Delivery' 
                        ? 'btn-warning fw-bold' 
                        : order.orderStatus === 'Delivered' 
                        ? 'btn-outline-success' 
                        : 'btn-secondary bg-opacity-75'
                    }`}
                    disabled={['Pending', 'Preparing', 'Delivered'].includes(order.orderStatus) || updatingId === order.id}
                    onClick={() => advanceStatus(order.id)}
                    type="button"
                  >
                    {updatingId === order.id ? 'Updating...' : getActionLabel(order.orderStatus)}
                  </button>
                </div>
              </article>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No deliveries found" message="No active delivery orders matching your filter." />
      )}
      {/* OTP Handshake Modal */}
      {otpModalOrder && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header bg-primary text-white border-0 py-3">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-shield-check me-2"></i> Verify Customer Delivery PIN
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setOtpModalOrder(null)}></button>
              </div>
              <div className="modal-body p-4 text-center">
                <p className="text-muted small mb-3">
                  Ask customer <strong>{otpModalOrder.customerName}</strong> for their 4-digit Delivery Security PIN to complete dropoff.
                </p>
                <div className="mb-3">
                  <input
                    type="text"
                    maxLength="4"
                    className="form-control form-control-lg text-center fs-2 fw-bold font-monospace letter-spacing-2"
                    placeholder="e.g. 1234"
                    value={otpInput}
                    onChange={(e) => {
                      setOtpInput(e.target.value);
                      setOtpError('');
                    }}
                    autoFocus
                  />
                  {otpError && <div className="text-danger small mt-2">{otpError}</div>}
                </div>
              </div>
              <div className="modal-footer border-0 p-3 bg-light">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setOtpModalOrder(null)}>Cancel</button>
                <button
                  type="button"
                  className="btn btn-primary fw-bold px-4"
                  onClick={() => {
                    if (!otpInput || otpInput.trim().length !== 4) {
                      setOtpError('Please enter valid 4-digit PIN');
                      return;
                    }
                    advanceStatus(otpModalOrder.id, otpInput.trim());
                  }}
                >
                  Verify PIN & Mark Delivered
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DriverOrdersPage;

