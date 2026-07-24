import { useEffect, useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import LoadingState from '../../components/feedback/LoadingState.jsx';
import EmptyState from '../../components/feedback/EmptyState.jsx';
import { fetchOrders, updateOrderStatus } from '../../services/orderService.js';
import { useSocket } from '../../context/SocketContext.jsx';

const kitchenStatuses = ['Pending', 'Preparing', 'Ready'];

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value) || 0);
}

function normalizeOrder(order) {
  return {
    id: order.id,
    customerName: order.customerName ?? order.customer_name ?? 'Unknown',
    orderNumber: order.orderNumber ?? order.order_number ?? '',
    orderStatus: order.orderStatus ?? order.order_status ?? 'Pending',
    totalAmount: Number(order.totalAmount ?? order.total_amount ?? 0),
    createdAt: order.createdAt ?? order.created_at ?? '',
    items: Array.isArray(order.items) 
      ? order.items 
      : typeof order.items === 'string' 
        ? JSON.parse(order.items) 
        : [],
    fulfillmentDetails: typeof order.fulfillmentDetails === 'string'
      ? JSON.parse(order.fulfillmentDetails)
      : order.fulfillmentDetails || {}
  };
}

function KitchenDisplayPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState('');
  const [updatingId, setUpdatingId] = useState('');
  
  const toastTimerRef = useRef(null);
  const { socket } = useSocket();

  const loadKdsOrders = async () => {
    try {
      setLoading(true);
      setError('');
      // Fetch active orders (we can query without status filter and filter client-side, or pass status)
      const response = await fetchOrders({
        limit: 50,
        sort: 'created_at',
        order: 'asc' // Oldest orders first in KDS
      });

      const list = response.data ?? response.orders ?? [];
      const normalized = list.map(normalizeOrder);
      // Filter only kitchen statuses
      setOrders(normalized.filter(o => kitchenStatuses.includes(o.orderStatus)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load kitchen orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKdsOrders();
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (orderData) => {
      const normalized = normalizeOrder(orderData);
      if (kitchenStatuses.includes(normalized.orderStatus)) {
        setOrders(current => {
          if (current.some(o => o.id === normalized.id)) return current;
          return [...current, normalized]; // append at end (oldest first)
        });
        showToast(`New kitchen order received: ${normalized.orderNumber}`);
        playChime();
      }
    };

    const handleOrderUpdated = (orderData) => {
      const normalized = normalizeOrder(orderData);
      setOrders(current => {
        if (!kitchenStatuses.includes(normalized.orderStatus)) {
          // Remove if transitioned out of kitchen
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

  function playChime() {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(e => console.log('Chime blocked by browser autoplay rules', e));
    } catch (e) {
      // ignore
    }
  }

  function showToast(message) {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(''), 3000);
  }

  async function handleAdvanceStatus(order) {
    const nextStatusMap = {
      Pending: 'Preparing',
      Preparing: 'Ready',
      Ready: 'Completed'
    };
    const nextStatus = nextStatusMap[order.orderStatus];
    if (!nextStatus) return;

    setUpdatingId(order.id);
    try {
      await updateOrderStatus(order.id, nextStatus);
      showToast(`Order status updated to ${nextStatus}.`);
      await loadKdsOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order status.');
    } finally {
      setUpdatingId('');
    }
  }

  const filteredOrders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return orders.filter(o => 
      o.orderNumber.toLowerCase().includes(term) || 
      o.customerName.toLowerCase().includes(term)
    );
  }, [orders, searchTerm]);

  function getActionLabel(status) {
    if (status === 'Pending') return 'Start Preparing';
    if (status === 'Preparing') return 'Mark Ready';
    if (status === 'Ready') return 'Complete Order';
    return 'Completed';
  }

  return (
    <div className="container-fluid px-0">
      {toast && <div className="alert alert-success py-2">{toast}</div>}

      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div>
          <p className="text-uppercase text-secondary small fw-semibold mb-2">Kitchen Display System</p>
          <h1 className="h3 mb-1">Kitchen Display (KDS)</h1>
          <p className="text-secondary mb-0">Live kitchen preparation queue.</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={loadKdsOrders} disabled={loading}>
            Refresh
          </button>
          <Link className="btn btn-outline-secondary btn-sm" to="/staff">
            Back to Staff Home
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
          <span>{error}</span>
          <button className="btn btn-outline-danger btn-sm" onClick={loadKdsOrders}>Retry</button>
        </div>
      )}

      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-6">
          <label className="form-label" htmlFor="kdsSearch">
            Search by Order ID or Name
          </label>
          <input
            className="form-control"
            id="kdsSearch"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search orders..."
            value={searchTerm}
          />
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading live kitchen queue..." />
      ) : filteredOrders.length ? (
        <div className="row g-3">
          {filteredOrders.map((order) => (
            <div className="col-12 col-md-6 col-xxl-4" key={order.id}>
              <article className="card border-0 guest-cart-item h-100">
                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between gap-3 mb-3">
                    <div>
                      <p className="text-secondary small mb-1">Order Number</p>
                      <h2 className="h6 mb-0">{order.orderNumber}</h2>
                    </div>
                    <span className={`badge ${order.orderStatus === 'Preparing' ? 'text-bg-warning' : order.orderStatus === 'Ready' ? 'text-bg-success' : 'text-bg-secondary'}`}>
                      {order.orderStatus}
                    </span>
                  </div>

                  <div className="mb-3">
                    <p className="text-secondary small mb-1">Customer</p>
                    <p className="fw-semibold mb-0">{order.customerName}</p>
                  </div>

                  <div className="border-top border-bottom py-3 mb-3">
                    <p className="text-secondary small mb-2">Items</p>
                    <ul className="list-unstyled mb-0 vstack gap-2">
                      {order.items.map((item, idx) => (
                        <li key={idx} className="d-flex justify-content-between small">
                          <span>{item.itemName || item.name} <span className="text-secondary">x{item.quantity}</span></span>
                          {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                            <span className="text-muted text-end small font-monospace">
                              ({item.selectedModifiers.map(m => m.name).join(', ')})
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="vstack gap-2 mb-4 small">
                    <div className="d-flex justify-content-between">
                      <span className="text-secondary">Type</span>
                      <span>{order.fulfillmentDetails?.type || 'Pickup'}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-secondary">Time Placed</span>
                      <span>{order.createdAt ? new Date(order.createdAt).toLocaleTimeString() : '-'}</span>
                    </div>
                  </div>

                  <button
                    className="btn btn-primary mt-auto w-100"
                    disabled={updatingId === order.id}
                    onClick={() => handleAdvanceStatus(order)}
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
        <EmptyState title="Kitchen queue is empty" message="No active kitchen orders at the moment." />
      )}
    </div>
  );
}

export default KitchenDisplayPage;
