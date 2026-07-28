import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { trackOrder } from '../../services/orderService.js';

const statusTimeline = [
  'Pending',
  'Accepted',
  'Preparing',
  'Ready',
  'Out for Delivery',
  'Completed'
];

const statusLabels = {
  'Pending': 'Order Received',
  'Accepted': 'Accepted',
  'Preparing': 'Preparing',
  'Ready': 'Ready',
  'Out for Delivery': 'Out for Delivery',
  'Completed': 'Delivered'
};

function formatCurrency(value) {
  return `$${Number(value).toFixed(2)}`;
}

function GuestOrderTrackingPage() {
  const location = useLocation();
  const { orderId } = useParams();
  
  const [order, setOrder] = useState(location.state?.order || null);
  const [isLoading, setIsLoading] = useState(!order);
  const [error, setError] = useState(null);

  const estimatedTime = location.state?.estimatedTime || '30-40 min';

  // Load order tracking details initially
  useEffect(() => {
    if (order && order.orderNumber === orderId) {
      setIsLoading(false);
      return;
    }

    async function loadOrder() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await trackOrder(orderId);
        setOrder(data);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Order not found.');
      } finally {
        setIsLoading(false);
      }
    }

    loadOrder();
  }, [orderId]);

  // Poll order status every 5 seconds (as a backup)
  useEffect(() => {
    if (!orderId) return;

    const timer = setInterval(async () => {
      try {
        const data = await trackOrder(orderId);
        setOrder(prev => {
          if (!prev) return data;
          if (prev.orderStatus !== data.orderStatus) {
            return data;
          }
          return prev;
        });
      } catch (err) {
        console.error('Failed to poll order status:', err);
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [orderId]);

  // WebSocket real-time updates
  useEffect(() => {
    if (!orderId || !order?.restaurantId) return undefined;

    const socketUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('[Tracking Socket] Connected to server:', socket.id);
      socket.emit('joinRestaurantRoom', order.restaurantId);
    });

    const handleUpdate = (updatedOrder) => {
      console.log('[Tracking Socket] Order updated event:', updatedOrder);
      const updatedNum = updatedOrder.orderNumber || updatedOrder.order_number;
      const updatedId = updatedOrder.id;
      if (String(updatedNum) === String(orderId) || String(updatedId) === String(order?.id)) {
        setOrder(prev => {
          if (!prev) return updatedOrder;
          const newStatus = updatedOrder.orderStatus || updatedOrder.order_status;
          if (prev.orderStatus !== newStatus) {
            return { ...prev, orderStatus: newStatus };
          }
          return prev;
        });
      }
    };

    socket.on('orderUpdated', handleUpdate);
    socket.on('ORDER_STATUS_CHANGED', handleUpdate);

    return () => {
      socket.off('orderUpdated', handleUpdate);
      socket.off('ORDER_STATUS_CHANGED', handleUpdate);
      socket.emit('leaveRestaurantRoom', order.restaurantId);
      socket.disconnect();
    };
  }, [orderId, order?.restaurantId, order?.id]);

  const currentStatusIndex = useMemo(() => {
    if (!order) return 0;
    const idx = statusTimeline.indexOf(order.orderStatus);
    return idx >= 0 ? idx : 0;
  }, [order]);

  const progressValue = useMemo(() => {
    return ((currentStatusIndex + 1) / statusTimeline.length) * 100;
  }, [currentStatusIndex]);

  if (isLoading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading your order...</span>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger mb-4" role="alert">
          {error || 'Failed to find order. Please verify the link or order number.'}
        </div>
        <Link className="btn btn-primary" to="/">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-4 py-lg-5">
      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div>
          <p className="text-uppercase text-secondary small fw-semibold mb-2">Order Tracking</p>
          <h1 className="h3 mb-1">Track your order</h1>
          <p className="text-secondary mb-0">Order Number {order.orderNumber}</p>
        </div>
        <Link className="btn btn-outline-secondary btn-sm" to="/">
          Back to Home
        </Link>
      </div>

      <div className="row g-4">
        <div className="col-12 col-xl-7">
          <div className="card border-0 guest-info-card mb-4">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
                <div>
                  <p className="text-secondary small mb-1">Current Status</p>
                  <h2 className="h5 mb-0">{statusLabels[order.orderStatus] || order.orderStatus}</h2>
                </div>
                <span className="badge text-bg-success">
                  {order.orderStatus === 'Completed' ? 'Delivered' : 'In Progress'}
                </span>
              </div>

              {/* Delivery OTP Handshake Badge */}
              <div className="bg-primary bg-opacity-10 border border-primary border-opacity-25 rounded-3 p-3 mb-3 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-primary text-white p-2 rounded-circle">
                    <i className="bi bi-shield-lock-fill fs-5"></i>
                  </div>
                  <div>
                    <div className="fw-bold text-dark small">Your Delivery Security PIN</div>
                    <div className="text-muted extra-small">Give this 4-digit PIN to your delivery driver upon handoff.</div>
                  </div>
                </div>
                <div className="badge bg-primary fs-5 px-3 py-2 text-white font-monospace">
                  {order.deliveryOtp || order.delivery_otp || '1234'}
                </div>
              </div>

              <div className="progress mb-4" role="progressbar" aria-label="Order progress" aria-valuenow={progressValue} aria-valuemin="0" aria-valuemax="100">
                <div className="progress-bar" style={{ width: `${progressValue}%` }} />
              </div>

              <div className="vstack gap-3">
                {statusTimeline.map((status, index) => (
                  <div className="d-flex align-items-start gap-3" key={status}>
                    <span className={`badge rounded-pill ${index <= currentStatusIndex ? 'text-bg-dark' : 'text-bg-light border'}`}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="fw-semibold mb-1">{statusLabels[status] || status}</p>
                      <p className="text-secondary small mb-0">
                        {index < currentStatusIndex
                          ? 'Completed'
                          : index === currentStatusIndex
                            ? 'Current step'
                            : 'Upcoming'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-5">
          <div className="card border-0 guest-info-card">
            <div className="card-body p-4">
              <h2 className="h5 mb-3">Order Details</h2>
              <div className="d-flex justify-content-between gap-3 mb-2">
                <span className="text-secondary">Estimated Time</span>
                <span>{estimatedTime}</span>
              </div>
              <div className="d-flex justify-content-between gap-3 mb-2">
                <span className="text-secondary">Customer Name</span>
                <span>{order.customerName}</span>
              </div>
              <div className="d-flex justify-content-between gap-3 mb-2">
                <span className="text-secondary">Customer Phone</span>
                <span>{order.customerPhone}</span>
              </div>
              <div className="d-flex justify-content-between gap-3 mb-4">
                <span className="text-secondary">Payment Status</span>
                <span>{order.paymentStatus}</span>
              </div>

              <div className="card border-0 guest-cart-summary">
                <div className="card-body">
                  <div className="d-flex justify-content-between fw-semibold">
                    <span>Total Amount</span>
                    <span>{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
              </div>

              <Link className="btn btn-primary w-100 mt-4" to="/">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GuestOrderTrackingPage;
