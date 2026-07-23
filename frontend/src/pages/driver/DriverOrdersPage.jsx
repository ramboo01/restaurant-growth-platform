import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { driverService } from '../../services/driverService.js';

const driverStatuses = ['Ready', 'Out for Delivery', 'Delivered'];

function formatCurrency(value) {
  return `$${value.toFixed(2)}`;
}

function DriverOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await driverService.getDriverOrders();
      setOrders(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch driver orders.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const driverOrders = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus = driverStatuses.includes(order.orderStatus);
      const matchesSearch = (order.orderId || order._id || '').toLowerCase().includes(normalizedSearch);
      const matchesFilter = statusFilter === 'All' || order.orderStatus === statusFilter;

      return matchesStatus && matchesSearch && matchesFilter;
    });
  }, [orders, searchTerm, statusFilter]);

  const advanceStatus = async (orderId) => {
    const order = orders.find((o) => (o.orderId || o._id) === orderId);
    if (!order) return;
    
    let newStatus = '';
    if (order.orderStatus === 'Ready') newStatus = 'Out for Delivery';
    else if (order.orderStatus === 'Out for Delivery') newStatus = 'Delivered';
    else return;

    try {
      await driverService.updateDriverOrder(order._id || order.orderId || orderId, { orderStatus: newStatus });
      await fetchOrders();
    } catch (err) {
      alert('Failed to update order status');
    }
  };

  function getActionLabel(status) {
    if (status === 'Ready') return 'Accept Delivery';
    if (status === 'Out for Delivery') return 'Picked Up';
    return 'Delivered';
  }

  return (
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div>
          <p className="text-uppercase text-secondary small fw-semibold mb-2">Driver Orders</p>
          <h1 className="h3 mb-1">Delivery Module</h1>
          <p className="text-secondary mb-0">Ready and active deliveries only.</p>
        </div>
        <Link className="btn btn-outline-secondary btn-sm" to="/driver">
          Back to Driver Home
        </Link>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-6">
          <label className="form-label" htmlFor="driverOrderSearch">
            Search by Order ID
          </label>
          <input
            className="form-control"
            id="driverOrderSearch"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search order ID..."
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
            <option>All</option>
            {driverStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : driverOrders.length ? (
        <div className="row g-3">
          {driverOrders.map((order) => (
            <div className="col-12 col-md-6 col-xxl-4" key={order._id || order.orderId}>
              <article className="card border-0 guest-cart-item h-100">
                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between gap-3 mb-3">
                    <div>
                      <p className="text-secondary small mb-1">Order ID</p>
                      <h2 className="h6 mb-0">{order.orderId || order._id}</h2>
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
                      <span>{formatCurrency(order.total)}</span>
                    </div>
                    <div className="d-flex justify-content-between gap-3">
                      <span className="text-secondary">Status</span>
                      <span>{order.orderStatus}</span>
                    </div>
                  </div>

                  <button
                    className="btn btn-primary mt-auto"
                    disabled={order.orderStatus === 'Delivered'}
                    onClick={() => advanceStatus(order.orderId || order._id)}
                    type="button"
                  >
                    {getActionLabel(order.orderStatus)}
                  </button>
                </div>
              </article>
            </div>
          ))}
        </div>
      ) : (
        <div className="alert alert-light border mb-0">No orders found.</div>
      )}
    </div>
  );
}

export default DriverOrdersPage;
