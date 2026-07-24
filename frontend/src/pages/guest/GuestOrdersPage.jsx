import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import LoadingState from '../../components/feedback/LoadingState.jsx';
import EmptyState from '../../components/feedback/EmptyState.jsx';
import { trackOrder } from '../../services/orderService.js';

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value) || 0);
}

function GuestOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecentOrders() {
      try {
        setLoading(true);
        // Get list of order numbers from localStorage
        const orderNumbers = JSON.parse(localStorage.getItem('recentOrders') || '[]');
        
        if (orderNumbers.length === 0) {
          setOrders([]);
          setLoading(false);
          return;
        }

        // Fetch details for all order numbers in parallel
        const fetchedOrders = [];
        await Promise.all(
          orderNumbers.map(async (num) => {
            try {
              const orderData = await trackOrder(num);
              if (orderData) {
                fetchedOrders.push(orderData);
              }
            } catch (err) {
              console.error(`Failed to fetch order ${num}:`, err);
            }
          })
        );

        // Sort by date descending
        fetchedOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(fetchedOrders);
      } catch (err) {
        console.error('Failed to load recent orders:', err);
      } finally {
        setLoading(false);
      }
    }

    loadRecentOrders();
  }, []);

  return (
    <div className="container py-5">
      <PageHeader
        eyebrow="My Account"
        title="Your Orders"
        description="Track your active orders and view your order history."
      />

      {loading ? (
        <LoadingState message="Loading your orders..." />
      ) : orders.length > 0 ? (
        <div className="row g-3 mt-2">
          {orders.map((order) => (
            <div className="col-12 col-md-6 col-lg-4" key={order.id}>
              <div className="card border-0 guest-cart-item h-100">
                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <p className="text-secondary small mb-1">Order Number</p>
                      <h2 className="h6 mb-0 fw-semibold">{order.orderNumber}</h2>
                    </div>
                    <span className={`badge ${order.orderStatus === 'Completed' ? 'text-bg-success' : 'text-bg-warning'}`}>
                      {order.orderStatus}
                    </span>
                  </div>

                  <div className="vstack gap-2 mb-4 small">
                    <div className="d-flex justify-content-between">
                      <span className="text-secondary">Fulfillment</span>
                      <span className="fw-medium">{order.fulfillmentDetails?.type || 'Pickup'}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-secondary">Order Date</span>
                      <span>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-secondary">Amount Paid</span>
                      <span className="fw-semibold">{formatCurrency(order.totalAmount)}</span>
                    </div>
                  </div>

                  <div className="mt-auto pt-2">
                    <Link className="btn btn-primary btn-sm w-100" to={`/orders/${order.orderNumber}`}>
                      <i className="bi bi-geo-alt me-2" aria-hidden="true" />
                      Track Status
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4">
          <EmptyState
            title="No orders found"
            message="You haven't placed any orders yet. Head to the menu to place your first order!"
          />
          <div className="text-center mt-4">
            <Link className="btn btn-primary" to="/">
              Browse Menu
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default GuestOrdersPage;
