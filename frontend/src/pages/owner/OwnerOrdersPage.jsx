import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import LoadingState from '../../components/feedback/LoadingState.jsx';
import EmptyState from '../../components/feedback/EmptyState.jsx';
import { createOrder, deleteOrder, fetchOrders, updateOrder, updateOrderStatus } from '../../services/orderService.js';
import { useSocket } from '../../context/SocketContext.jsx';

const statusFilters = ['All', 'Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'];

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
    restaurantId: order.restaurantId ?? order.restaurant_id ?? null,
    fulfillmentDetails: typeof order.fulfillmentDetails === 'string'
      ? JSON.parse(order.fulfillmentDetails)
      : order.fulfillmentDetails || {}
  };
}

function OwnerOrdersPage() {
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [pageMeta, setPageMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(() => {
    const param = searchParams.get('status');
    return statusFilters.includes(param) ? param : 'All';
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [updatingId, setUpdatingId] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const requestRef = useRef(0);
  const toastTimerRef = useRef(null);

  const queryStatus = status === 'All' ? '' : status;

  const { socket } = useSocket();

  const loadOrders = async () => {
    const requestId = ++requestRef.current;
    setLoading(true);
    setError('');

    try {
      const response = await fetchOrders({
        page,
        limit,
        search: search.trim(),
        sort: 'created_at',
        order: 'desc',
        status: queryStatus
      });

      if (requestRef.current === requestId) {
        const list = response.data ?? response.orders ?? [];
        setOrders(list.map(normalizeOrder));
        setPageMeta({
          page: response.page ?? page,
          limit: response.limit ?? limit,
          total: response.total ?? list.length,
          totalPages: response.totalPages ?? 1
        });
      }
    } catch (requestError) {
      if (requestRef.current === requestId) {
        setError(requestError.response?.data?.message || 'Failed to load orders.');
      }
    } finally {
      if (requestRef.current === requestId) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadOrders();
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, [page, search, status]);

  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (orderData) => {
      console.log('New order received via socket:', orderData);
      const normalized = normalizeOrder(orderData);
      setOrders(current => {
        // Avoid duplicates if same order comes twice
        if (current.some(o => o.id === normalized.id)) return current;
        return [normalized, ...current];
      });
      showToast(`New order received: ${normalized.orderNumber}`);
      
      // Attempt to play a subtle notification sound (requires user interaction first generally, so we use a silent fallback)
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(e => console.log('Audio autoplay blocked by browser', e));
      } catch(e) {
        // ignore
      }
    };

    const handleOrderUpdated = (orderData) => {
      console.log('Order updated via socket:', orderData);
      const normalized = normalizeOrder(orderData);
      setOrders(current => current.map(o => o.id === normalized.id ? normalized : o));
    };

    const handleOrderDeleted = (data) => {
      console.log('Order deleted via socket:', data);
      setOrders(current => current.filter(o => String(o.id) !== String(data.id)));
      showToast(`Order deleted.`);
    };

    socket.on('newOrder', handleNewOrder);
    socket.on('NEW_ORDER', handleNewOrder);
    socket.on('orderUpdated', handleOrderUpdated);
    socket.on('ORDER_STATUS_CHANGED', handleOrderUpdated);
    socket.on('orderDeleted', handleOrderDeleted);

    return () => {
      socket.off('newOrder', handleNewOrder);
      socket.off('NEW_ORDER', handleNewOrder);
      socket.off('orderUpdated', handleOrderUpdated);
      socket.off('ORDER_STATUS_CHANGED', handleOrderUpdated);
      socket.off('orderDeleted', handleOrderDeleted);
    };
  }, [socket]);

  const summaryCounts = useMemo(() => {
    return ['Pending', 'Preparing', 'Ready', 'Completed'].reduce((counts, itemStatus) => {
      counts[itemStatus] = orders.filter((order) => order.orderStatus === itemStatus).length;
      return counts;
    }, {});
  }, [orders]);

  const filteredOrders = useMemo(() => orders, [orders]);

  function showToast(message) {
    setToast(message);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => setToast(''), 2500);
  }

  async function handleStatusAdvance(order) {
    const isDelivery = (order.fulfillmentDetails?.type || 'Delivery').toLowerCase() === 'delivery';

    let nextStatus = '';
    if (order.orderStatus === 'Pending') nextStatus = 'Preparing';
    else if (order.orderStatus === 'Preparing') nextStatus = 'Ready';
    else if (order.orderStatus === 'Ready') {
      if (isDelivery) {
        showToast(`Delivery order ${order.orderNumber} is ready. Waiting for driver pickup.`);
        return;
      }
      nextStatus = 'Completed';
    }

    if (!nextStatus) {
      return;
    }

    setUpdatingId(order.id);
    const previousOrders = orders;
    setOrders((current) =>
      current.map((entry) => (entry.id === order.id ? { ...entry, orderStatus: nextStatus } : entry))
    );

    try {
      await updateOrderStatus(order.id, nextStatus);
      showToast('Order status updated successfully.');
      await loadOrders();
    } catch (requestError) {
      setOrders(previousOrders);
      setError(requestError.response?.data?.message || 'Failed to update order.');
    } finally {
      setUpdatingId('');
    }
  }

  async function handleDelete(order) {
    if (!window.confirm(`Delete order ${order.orderNumber}?`)) {
      return;
    }

    setDeletingId(order.id);
    const previousOrders = orders;
    setOrders((current) => current.filter((entry) => entry.id !== order.id));

    try {
      await deleteOrder(order.id);
      showToast('Order deleted successfully.');
      await loadOrders();
    } catch (requestError) {
      setOrders(previousOrders);
      setError(requestError.response?.data?.message || 'Failed to delete order.');
    } finally {
      setDeletingId('');
    }
  }

  async function handleRefresh() {
    await loadOrders();
  }

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
      {toast ? <div className="alert alert-success py-2">{toast}</div> : null}

      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div>
          <p className="text-uppercase text-secondary small fw-semibold mb-2">Owner Orders</p>
          <h1 className="h3 mb-1">Order Management</h1>
          <p className="text-secondary mb-0">Track and manage store order statuses.</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={handleRefresh} disabled={loading} type="button">
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="alert alert-danger d-flex justify-content-between align-items-center mb-4">
          <span>{error}</span>
          <button className="btn btn-outline-danger btn-sm" onClick={handleRefresh} type="button">
            Retry
          </button>
        </div>
      ) : null}

      <div className="row g-3 mb-4">
        {statusFilters.map((statusItem) => (
          <div className="col-12 col-sm-6 col-xl-2" key={statusItem}>
            <div className="card border-0 h-100 guest-info-card">
              <div className="card-body">
                <p className="text-secondary small mb-1">{statusItem}</p>
                <h2 className="h4 mb-0">{summaryCounts[statusItem] ?? 0}</h2>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-6">
          <label className="form-label" htmlFor="ownerOrderSearch">
            Search Orders
          </label>
          <input
            className="form-control"
            id="ownerOrderSearch"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by order number..."
            value={search}
          />
        </div>
        <div className="col-12 col-lg-6">
          <label className="form-label" htmlFor="ownerStatusFilter">
            Filter Status
          </label>
          <select
            className="form-select"
            id="ownerStatusFilter"
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            value={status}
          >
            {statusFilters.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading order management..." />
      ) : filteredOrders.length ? (
        <div className="row g-3">
          {filteredOrders.map((order) => {
            const isDelivery = (order.fulfillmentDetails?.type || 'Delivery').toLowerCase() === 'delivery';
            const isAdvanceDisabled = ['Completed', 'Delivered', 'Cancelled', 'Out for Delivery'].includes(order.orderStatus) || 
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
                        <span>{order.fulfillmentDetails?.type || 'Delivery'}</span>
                      </div>
                      <div className="d-flex justify-content-between gap-3">
                        <span className="text-secondary">Total Amount</span>
                        <span>{formatCurrency(order.totalAmount)}</span>
                      </div>
                      <div className="d-flex justify-content-between gap-3">
                        <span className="text-secondary">Created Time</span>
                        <span>{order.createdAt ? new Date(order.createdAt).toLocaleString() : '-'}</span>
                      </div>
                    </div>

                    <div className="d-flex flex-column flex-sm-row gap-2 mt-auto">
                      <button
                        className={`btn ${order.orderStatus === 'Ready' && isDelivery ? 'btn-outline-secondary' : 'btn-primary'}`}
                        disabled={isAdvanceDisabled}
                        onClick={() => handleStatusAdvance(order)}
                        type="button"
                      >
                        {updatingId === order.id ? 'Updating...' : getActionLabel(order)}
                      </button>
                      <button
                        className="btn btn-outline-danger"
                        disabled={deletingId === order.id}
                        onClick={() => handleDelete(order)}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No orders found." message="Try adjusting your search or status filter." />
      )}

      <div className="d-flex justify-content-between align-items-center mt-4">
        <div className="text-secondary small">
          Page {pageMeta.page} of {pageMeta.totalPages || 1}
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} type="button">
            Previous
          </button>
          <button
            className="btn btn-outline-secondary btn-sm"
            disabled={page >= (pageMeta.totalPages || 1)}
            onClick={() => setPage((current) => current + 1)}
            type="button"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default OwnerOrdersPage;
