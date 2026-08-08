import { useEffect, useMemo, useState, useRef } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import L from 'leaflet';
import { trackOrder } from '../../services/orderService.js';

const statusTimeline = [
  'Pending',
  'Accepted',
  'Preparing',
  'Ready',
  'Out for Delivery',
  'Delivered'
];

const statusLabels = {
  'Pending': 'Order Received',
  'Accepted': 'Accepted',
  'Preparing': 'Preparing',
  'Ready': 'Ready',
  'Out for Delivery': 'Out for Delivery',
  'Delivered': 'Delivered',
  'Completed': 'Delivered'
};

function formatCurrency(value) {
  return `$${Number(value).toFixed(2)}`;
}

function LiveDriverMap({ driverLocation, defaultCoords }) {
  const mapRef = useRef(null);
  const instanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const lat = Number(driverLocation?.lat || defaultCoords?.lat || 28.6139);
    const lng = Number(driverLocation?.lng || defaultCoords?.lng || 77.2090);

    if (!instanceRef.current) {
      try {
        const map = L.map(mapRef.current, { zoomControl: false }).setView([lat, lng], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19
        }).addTo(map);

        const icon = L.divIcon({
          className: 'custom-leaflet-driver',
          html: '<div style="background:#0d6efd; color:#fff; width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 0 12px rgba(13,110,253,0.8); border:3px solid #fff; font-size:18px;"><i class="bi bi-bicycle"></i></div>',
          iconSize: [38, 38],
          iconAnchor: [19, 19]
        });

        const marker = L.marker([lat, lng], { icon }).addTo(map);
        marker.bindPopup('<b style="color:#0d6efd">Driver Live GPS</b><br>On the way to your address!').openPopup();

        instanceRef.current = map;
        markerRef.current = marker;
      } catch (err) {
        console.error('Leaflet initialization error:', err);
      }
    } else {
      instanceRef.current.panTo([lat, lng]);
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      }
    }
  }, [driverLocation, defaultCoords]);

  return (
    <div 
      ref={mapRef} 
      style={{ width: '100%', height: '260px', borderRadius: '0', zIndex: 1 }} 
    />
  );
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
          const newStatus = data.orderStatus || data.order_status;
          if (prev.orderStatus !== newStatus) {
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

  // Real-time Driver GPS & Order Socket updates
  const [driverLocation, setDriverLocation] = useState(null);
  const [deviceCoords, setDeviceCoords] = useState(null);

  // Get real physical device location if available
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setDeviceCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (err) => {
          console.warn('Geolocation access failed or denied:', err.message);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  useEffect(() => {
    if (!orderId) return undefined;

    const socketUrl = import.meta.env.VITE_API_BASE_URL || 'https://restaurant-growth-platform.onrender.com';
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('[Tracking Socket] Connected to server:', socket.id);
      if (order?.id) {
        socket.emit('joinOrderRoom', order.id);
      }
      if (order?.restaurantId) {
        socket.emit('joinRestaurantRoom', order.restaurantId);
      }
    });

    const handleUpdate = (updatedOrder) => {
      console.log('[Tracking Socket] Order updated event:', updatedOrder);
      const updatedNum = updatedOrder.orderNumber || updatedOrder.order_number;
      const updatedId = updatedOrder.id;
      if (String(updatedNum) === String(orderId) || String(updatedId) === String(order?.id)) {
        setOrder(prev => {
          if (!prev) return updatedOrder;
          const newStatus = updatedOrder.orderStatus || updatedOrder.order_status;
          return { ...prev, ...updatedOrder, orderStatus: newStatus || prev.orderStatus };
        });
      }
    };

    const handleDriverLocation = (locationData) => {
      console.log('[Tracking Socket] Driver GPS update:', locationData);
      setDriverLocation(locationData);
    };

    socket.on('orderUpdated', handleUpdate);
    socket.on('order_status_updated', handleUpdate);
    socket.on('driver_location_changed', handleDriverLocation);

    return () => {
      socket.off('orderUpdated', handleUpdate);
      socket.off('order_status_updated', handleUpdate);
      socket.off('driver_location_changed', handleDriverLocation);
      if (order?.id) socket.emit('leaveOrderRoom', order.id);
      if (order?.restaurantId) socket.emit('leaveRestaurantRoom', order.restaurantId);
      socket.disconnect();
    };
  }, [orderId, order?.restaurantId, order?.id]);

  const currentStatusIndex = useMemo(() => {
    if (!order) return 0;
    let status = order.orderStatus;
    if (status === 'Completed') status = 'Delivered';
    const idx = statusTimeline.indexOf(status);
    return idx >= 0 ? idx : 0;
  }, [order]);

  const isDelivered = useMemo(() => {
    if (!order) return false;
    return order.orderStatus === 'Delivered' || order.orderStatus === 'Completed';
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
                <span className={`badge ${isDelivered ? 'text-bg-success' : order.orderStatus === 'Cancelled' ? 'text-bg-danger' : 'text-bg-primary'}`}>
                  {isDelivered ? 'Delivered' : order.orderStatus === 'Cancelled' ? 'Cancelled' : 'In Progress'}
                </span>
              </div>

              {/* Delivery Security PIN / Completion Banner */}
              {isDelivered ? (
                <div className="bg-success bg-opacity-10 border border-success border-opacity-25 rounded-3 p-3 mb-4 d-flex align-items-center gap-3 text-success">
                  <div className="bg-success text-white p-2 rounded-circle">
                    <i className="bi bi-check-circle-fill fs-5"></i>
                  </div>
                  <div>
                    <div className="fw-bold small">Order Delivered Successfully!</div>
                    <div className="extra-small text-success text-opacity-75">Thank you for ordering with us. Enjoy your meal!</div>
                  </div>
                </div>
              ) : (
                <div className="bg-primary bg-opacity-10 border border-primary border-opacity-25 rounded-3 p-3 mb-4 d-flex align-items-center justify-content-between">
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
              )}

              {/* Live Driver GPS Tracking Radar & Map */}
              {(order.orderStatus === 'Out for Delivery' || driverLocation) && !isDelivered && (
                <div className="card bg-dark text-white border-0 shadow-sm rounded-4 overflow-hidden mb-4 position-relative">
                  <div className="p-3 bg-gradient d-flex justify-content-between align-items-center border-bottom border-secondary border-opacity-50">
                    <div className="d-flex align-items-center gap-2">
                      <span className="spinner-grow spinner-grow-sm text-success" role="status"></span>
                      <span className="fw-bold small text-light">LIVE DRIVER GPS TRACKER (OpenStreetMap)</span>
                    </div>
                    <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 extra-small">
                      <i className="bi bi-broadcast me-1"></i> Real-time WebSocket Active
                    </span>
                  </div>

                  <div className="p-0 text-center position-relative" style={{ minHeight: '260px', backgroundColor: '#1a1d21' }}>
                    <LiveDriverMap driverLocation={driverLocation} defaultCoords={deviceCoords} />
                  </div>

                  <div className="p-3 bg-secondary bg-opacity-25 d-flex justify-content-between align-items-center extra-small text-white-50">
                    <span>Driver: <strong>{order.driverName || 'Owned Fleet Partner'}</strong></span>
                    <span>
                      {driverLocation ? (
                        <span className="text-info me-2">Speed: {driverLocation.speed || '24'} km/h</span>
                      ) : null}
                      ETA: <strong className="text-white">{estimatedTime}</strong>
                    </span>
                  </div>
                </div>
              )}

              <div className="progress mb-4" role="progressbar" aria-label="Order progress" aria-valuenow={progressValue} aria-valuemin="0" aria-valuemax="100" style={{ height: '8px' }}>
                <div className={`progress-bar ${isDelivered ? 'bg-success' : 'bg-primary'}`} style={{ width: `${progressValue}%` }} />
              </div>

              <div className="vstack gap-3">
                {statusTimeline.map((status, index) => (
                  <div className="d-flex align-items-start gap-3" key={status}>
                    <span className={`badge rounded-pill ${index <= currentStatusIndex ? 'text-bg-success' : 'text-bg-light border text-muted'}`}>
                      {index <= currentStatusIndex ? <i className="bi bi-check-lg" /> : index + 1}
                    </span>
                    <div>
                      <p className="fw-semibold mb-1">{statusLabels[status] || status}</p>
                      <p className="text-secondary small mb-0">
                        {index < currentStatusIndex
                          ? 'Completed'
                          : index === currentStatusIndex
                            ? isDelivered ? 'Completed' : 'Current step'
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
