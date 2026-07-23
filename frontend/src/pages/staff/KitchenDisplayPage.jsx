import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { mockOrders } from '../../data/staffOrdersData.js';

const kitchenStatuses = ['Preparing', 'Ready'];

function KitchenDisplayPage() {
  const [orders, setOrders] = useState(mockOrders);
  const [searchTerm, setSearchTerm] = useState('');

  const kitchenOrders = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = kitchenStatuses.includes(order.orderStatus);
      const matchesSearch = order.orderId.toLowerCase().includes(normalizedSearch);
      return matchesStatus && matchesSearch;
    });
  }, [orders, searchTerm]);

  function updateOrderStatus(orderId) {
    setOrders((current) =>
      current.map((order) => {
        if (order.orderId !== orderId) {
          return order;
        }

        if (order.orderStatus === 'Preparing') {
          return { ...order, orderStatus: 'Ready' };
        }

        if (order.orderStatus === 'Ready') {
          return { ...order, orderStatus: 'Completed' };
        }

        return order;
      })
    );
  }

  function getActionLabel(status) {
    if (status === 'Preparing') return 'Ready';
    if (status === 'Ready') return 'Completed';
    return 'Completed';
  }

  return (
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div>
          <p className="text-uppercase text-secondary small fw-semibold mb-2">Kitchen Display</p>
          <h1 className="h3 mb-1">KDS</h1>
          <p className="text-secondary mb-0">Preparing and ready orders only.</p>
        </div>
        <Link className="btn btn-outline-secondary btn-sm" to="/staff">
          Back to Staff Home
        </Link>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-6">
          <label className="form-label" htmlFor="kdsSearch">
            Search by Order ID
          </label>
          <input
            className="form-control"
            id="kdsSearch"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search order ID..."
            value={searchTerm}
          />
        </div>
      </div>

      {kitchenOrders.length ? (
        <div className="row g-3">
          {kitchenOrders.map((order) => (
            <div className="col-12 col-md-6 col-xxl-4" key={order.orderId}>
              <article className="card border-0 guest-cart-item h-100">
                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between gap-3 mb-3">
                    <div>
                      <p className="text-secondary small mb-1">Order ID</p>
                      <h2 className="h6 mb-0">{order.orderId}</h2>
                    </div>
                    <span className={`badge ${order.priority === 'High' ? 'text-bg-danger' : 'text-bg-secondary'}`}>
                      {order.priority}
                    </span>
                  </div>

                  <div className="vstack gap-2 mb-4">
                    <div className="d-flex justify-content-between gap-3">
                      <span className="text-secondary">Items</span>
                      <span>
                        {order.items.map((item) => `${item.name} x${item.quantity}`).join(', ')}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between gap-3">
                      <span className="text-secondary">Quantity</span>
                      <span>{order.itemCount}</span>
                    </div>
                    <div className="d-flex justify-content-between gap-3">
                      <span className="text-secondary">Time</span>
                      <span>{order.orderTime}</span>
                    </div>
                    <div className="d-flex justify-content-between gap-3">
                      <span className="text-secondary">Current Status</span>
                      <span>{order.orderStatus}</span>
                    </div>
                  </div>

                  <button
                    className="btn btn-primary mt-auto"
                    disabled={order.orderStatus === 'Completed'}
                    onClick={() => updateOrderStatus(order.orderId)}
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

export default KitchenDisplayPage;
