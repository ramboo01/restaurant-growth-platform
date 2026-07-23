import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { mockOrders } from '../../data/staffOrdersData.js';

const statusOrder = ['New', 'Preparing', 'Ready', 'Completed'];

function formatCurrency(value) {
  return `$${value.toFixed(2)}`;
}

function StaffOrdersPage() {
  const [orders, setOrders] = useState(mockOrders);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

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
        order.orderId.toLowerCase().includes(normalizedSearch) ||
        order.customerName.toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === 'All' || order.orderStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  function advanceStatus(orderId) {
    setOrders((current) =>
      current.map((order) => {
        if (order.orderId !== orderId) {
          return order;
        }

        const currentIndex = statusOrder.indexOf(order.orderStatus);
        const nextStatus = statusOrder[Math.min(currentIndex + 1, statusOrder.length - 1)];

        return {
          ...order,
          orderStatus: nextStatus
        };
      })
    );
  }

  function getActionLabel(status) {
    if (status === 'New') return 'Accept';
    if (status === 'Preparing') return 'Mark Ready';
    if (status === 'Ready') return 'Complete';
    return 'Completed';
  }

  return (
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div>
          <p className="text-uppercase text-secondary small fw-semibold mb-2">Staff Orders</p>
          <h1 className="h3 mb-1">Order Queue</h1>
          <p className="text-secondary mb-0">Live local queue for staff operations.</p>
        </div>
        <Link className="btn btn-outline-secondary btn-sm" to="/staff">
          Back to Staff Home
        </Link>
      </div>

      <div className="row g-3 mb-4">
        {statusOrder.map((status) => (
          <div className="col-12 col-sm-6 col-xl-3" key={status}>
            <div className="card border-0 h-100 guest-info-card">
              <div className="card-body">
                <p className="text-secondary small mb-1">{status} Orders</p>
                <h2 className="h4 mb-0">{summaryCounts[status]}</h2>
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
            <option>All</option>
            {statusOrder.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredOrders.length ? (
        <div className="row g-3">
          {filteredOrders.map((order) => (
            <div className="col-12 col-md-6 col-xxl-4" key={order.orderId}>
              <article className="card border-0 guest-cart-item h-100">
                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between gap-3 mb-3">
                    <div>
                      <p className="text-secondary small mb-1">Order ID</p>
                      <h2 className="h6 mb-0">{order.orderId}</h2>
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
                      <span>{order.orderType}</span>
                    </div>
                    <div className="d-flex justify-content-between gap-3">
                      <span className="text-secondary">Time</span>
                      <span>{order.orderTime}</span>
                    </div>
                    <div className="d-flex justify-content-between gap-3">
                      <span className="text-secondary">Items</span>
                      <span>{order.itemCount}</span>
                    </div>
                    <div className="d-flex justify-content-between gap-3">
                      <span className="text-secondary">Total</span>
                      <span>{formatCurrency(order.total)}</span>
                    </div>
                  </div>

                  <button
                    className="btn btn-primary mt-auto"
                    disabled={order.orderStatus === 'Completed'}
                    onClick={() => advanceStatus(order.orderId)}
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

export default StaffOrdersPage;
