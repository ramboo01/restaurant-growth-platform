import { useEffect, useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import LoadingState from '../../components/feedback/LoadingState.jsx';
import EmptyState from '../../components/feedback/EmptyState.jsx';
import { driverService } from '../../services/driverService.js';
import { useSocket } from '../../context/SocketContext.jsx';

const driverStatuses = ['Ready', 'Out for Delivery', 'Delivered'];

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value) || 0);
}

function normalizeOrder(order) {
  const fulfillment = typeof order.fulfillmentDetails === 'string'
    ? JSON.parse(order.fulfillmentDetails)
    : order.fulfillmentDetails || {};

  const addrStr = fulfillment.address
    ? `${fulfillment.address}${fulfillment.city ? `, ${fulfillment.city}` : ''}`
    : 'Store Pickup';

  return {
    id: order.id,
    customerName: order.customerName ?? order.customer_name ?? 'Unknown',
    orderNumber: order.orderNumber ?? order.order_number ?? '',
    orderStatus: order.orderStatus ?? order.order_status ?? 'Pending',
    totalAmount: Number(order.totalAmount ?? order.total_amount ?? 0),
    createdAt: order.createdAt ?? order.created_at ?? '',
    address: addrStr,
    fulfillmentType: fulfillment.type || 'Pickup',
    deliveryTime: fulfillment.deliveryTime || fulfillment.estimatedDelivery || 'ASAP'
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
      const normalized = list.map(normalizeOrder).filter(o => o.fulfillmentType === 'Delivery');
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
      if (normalized.fulfillmentType === 'Delivery') {
        setOrders(current => {
          if (current.some(o => o.id === normalized.id)) return current;
          return [normalized, ...current];
        });
        showToast(`New delivery order ready: ${normalized.orderNumber}`);
      }
    };

    const handleOrderUpdated = (orderData) => {
      const normalized = normalizeOrder(orderData);
      setOrders(current => {
        if (normalized.fulfillmentType !== 'Delivery') {
          return current.filter(o => o.id !== normalized.id);
        }
        return current.map(o => o.id === normalized.id ? normalized : o);
      });
    };

    socket.on('newOrder', handleNewOrder);
    socket.on('orderUpdated', handleOrderUpdated);

    return () => {
      socket.off('newOrder', handleNewOrder);
      socket.off('orderUpdated', handleOrderUpdated);
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
      showToast(`Order marked as Delivered! Security PIN verified.`);
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
    if (status === 'Ready') return 'Accept Delivery';
    if (status === 'Out for Delivery') return 'Mark Delivered';
    return 'Delivered';
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
                    <span className={`badge ${order.orderStatus === 'Out for Delivery' ? 'text-bg-warning' : 'text-bg-success'}`}>
                      {order.orderStatus}
                    </span>
                  </div>

                  <div className="vstack gap-2 mb-4">
                    <div className="d-flex justify-content-between gap-3">
                      <span className="text-secondary">Customer</span>
                      <span>{order.customerName}</span>
                    </div>
                    <div className="d-flex justify-content-between gap-3">
                      <span className="text-secondary">Address</span>
                      <span className="text-end">{order.address}</span>
                    </div>
                    <div className="d-flex justify-content-between gap-3">
                      <span className="text-secondary">Delivery Time</span>
                      <span>{order.deliveryTime}</span>
                    </div>
                    <div className="d-flex justify-content-between gap-3">
                      <span className="text-secondary">Total</span>
                      <span>{formatCurrency(order.totalAmount)}</span>
                    </div>
                  </div>

                  <button
                    className="btn btn-primary mt-auto w-100"
                    disabled={order.orderStatus === 'Delivered' || updatingId === order.id}
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

