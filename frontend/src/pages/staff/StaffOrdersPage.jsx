import { useEffect, useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import LoadingState from '../../components/feedback/LoadingState.jsx';
import EmptyState from '../../components/feedback/EmptyState.jsx';
import { fetchOrders, updateOrderStatus } from '../../services/orderService.js';
import { useSocket } from '../../context/SocketContext.jsx';

const statusOrder = ['Pending', 'Preparing', 'Ready', 'Completed'];

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

function StaffOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [toast, setToast] = useState('');
  const [updatingId, setUpdatingId] = useState('');

  const toastTimerRef = useRef(null);
  const { socket } = useSocket();

  const loadStaffOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetchOrders({
        limit: 50,
        sort: 'created_at',
        order: 'desc'
      });

      const list = response.data ?? response.orders ?? [];
      setOrders(list.map(normalizeOrder));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load staff orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaffOrders();
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (orderData) => {
      const normalized = normalizeOrder(orderData);
      setOrders(current => {
        if (current.some(o => o.id === normalized.id)) return current;
        return [normalized, ...current];
      });
      showToast(`New order: ${normalized.orderNumber}`);
    };

    const handleOrderUpdated = (orderData) => {
      const normalized = normalizeOrder(orderData);
      setOrders(current => current.map(o => o.id === normalized.id ? normalized : o));
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

  async function handleAdvanceStatus(order) {
    const isDelivery = (order.fulfillmentDetails?.type || 'Delivery').toLowerCase() === 'delivery';

    let nextStatus = '';
    if (order.orderStatus === 'Pending') nextStatus = 'Preparing';
    else if (order.orderStatus === 'Preparing') nextStatus = 'Ready';
    else if (order.orderStatus === 'Ready') {
      if (isDelivery) {
        showToast(`Delivery order ${order.orderNumber} is ready. Awaiting driver dispatch.`);
        return;
      }
      nextStatus = 'Completed';
    }

    if (!nextStatus) return;

    setUpdatingId(order.id);
    try {
      await updateOrderStatus(order.id, nextStatus);
      showToast(`Order status updated successfully.`);
      await loadStaffOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order status.');
    } finally {
      setUpdatingId('');
    }
  }

  const summaryCounts = useMemo(() => {
    return statusOrder.reduce((counts, status) => {
      counts[status] = orders.filter((order) => order.orderStatus === status).length;
      return counts;
    }, {});
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(normalizedSearch) ||
        order.customerName.toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === 'All' || order.orderStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  function getActionLabel(order) {
    const status = order.orderStatus;
    const isDelivery = (order.fulfillmentDetails?.type || 'Delivery').toLowerCase() === 'delivery';

    if (status === 'Pending') return 'Accept';
    if (status === 'Preparing') return 'Mark Ready';
    if (status === 'Ready') {
      return isDelivery ? 'Awaiting Driver Pickup' : 'Complete';
    }
    if (status === 'Out for Delivery') return 'Out for Delivery';
    return 'Completed';
  }

  return (
    <div className="container-fluid px-0">
      {toast && <div className="alert alert-success py-2">{toast}</div>}

      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div>
          <p className="text-uppercase text-secondary small fw-semibold mb-2">Staff Orders</p>
          <h1 className="h3 mb-1">Order Queue</h1>
          <p className="text-secondary mb-0">Live order queue for staff operations.</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={loadStaffOrders} disabled={loading}>
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
          <button className="btn btn-outline-danger btn-sm" onClick={loadStaffOrders}>Retry</button>
        </div>
      )}

      <div className="row g-3 mb-4">
        {statusOrder.map((status) => (
          <div className="col-12 col-sm-6 col-xl-3" key={status}>
            <div className="card border-0 h-100 guest-info-card">
              <div className="card-body">
                <p className="text-secondary small mb-1">{status} Orders</p>
                <h2 className="h4 mb-0">{summaryCounts[status] ?? 0}</h2>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-6">
          <label className="form-label" htmlFor="staffOrderSearch">
            Search by Order ID or Customer Name
          </label>
          <input
            className="form-control"
            id="staffOrderSearch"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search orders..."
            value={searchTerm}
          />
        </div>
        <div className="col-12 col-lg-6">
          <label className="form-label" htmlFor="staffOrderFilter">
            Filter by Status
          </label>
          <select
            className="form-select"
            id="staffOrderFilter"
            onChange={(event) => setStatusFilter(event.target.value)}
            value={statusFilter}
          >
            <option value="All">All</option>
            {statusOrder.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading staff order queue..." />
      ) : filteredOrders.length ? (
        <div className="row g-3">
          {filteredOrders.map((order) => {
            const isDelivery = (order.fulfillmentDetails?.type || 'Delivery').toLowerCase() === 'delivery';
            const isDisabled = ['Completed', 'Delivered', 'Cancelled', 'Out for Delivery'].includes(order.orderStatus) || 
                              (order.orderStatus === 'Ready' && isDelivery) || 
                              updatingId === order.id;

            return (
              <div className="col-12 col-md-6 col-xxl-4" key={order.id}>
                <article className="card border-0 guest-cart-item h-100">
                  <div className="card-body d-flex flex-column">
                    <div className="d-flex justify-content-between gap-3 mb-3">
                      <div>
                        <p className="text-secondary small mb-1">Order Number</p>
                        <h2 className="h6 mb-0">{order.orderNumber}</h2>
                      </div>
                      <span className="badge text-bg-light border">{order.orderStatus}</span>
                    </div>

                    <div className="vstack gap-2 mb-4">
                      <div className="d-flex justify-content-between gap-3">
                        <span className="text-secondary">Customer</span>
                        <span>{order.customerName}</span>
                      </div>
                      <div className="d-flex justify-content-between gap-3">
                        <span className="text-secondary">Type</span>
                        <span>{order.fulfillmentDetails?.type || 'Pickup'}</span>
                      </div>
                      <div className="d-flex justify-content-between gap-3">
                        <span className="text-secondary">Time</span>
                        <span>{order.createdAt ? new Date(order.createdAt).toLocaleTimeString() : '-'}</span>
                      </div>
                      <div className="d-flex justify-content-between gap-3">
                        <span className="text-secondary">Total</span>
                        <span>{formatCurrency(order.totalAmount)}</span>
                      </div>
                    </div>

                    <button
                      className={`btn mt-auto ${order.orderStatus === 'Ready' && isDelivery ? 'btn-outline-secondary' : 'btn-primary'}`}
                      disabled={isDisabled}
                      onClick={() => handleAdvanceStatus(order)}
                      type="button"
                    >
                      {updatingId === order.id ? 'Updating...' : getActionLabel(order)}
                    </button>
                  </div>
                </article>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No orders found." message="Try adjusting your search or status filter." />
      )}
    </div>
  );
}

export default StaffOrdersPage;
