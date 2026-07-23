import { Link, Navigate, useLocation } from 'react-router-dom';

function GuestOrderSuccessPage() {
  const location = useLocation();
  const order = location.state?.order;
  const estimatedTime = location.state?.estimatedTime;

  if (!order) {
    return <Navigate replace to="/" />;
  }

  return (
    <div className="container py-5">
      <div className="card border-0 guest-info-card mx-auto" style={{ maxWidth: '720px' }}>
        <div className="card-body p-4 p-lg-5 text-center">
          <p className="text-uppercase text-secondary small fw-semibold mb-2">Order Received</p>
          <h1 className="h3 mb-3">Thanks, your order is confirmed.</h1>
          <p className="text-secondary mb-4">
            Order Number <span className="fw-semibold text-dark">{order.orderNumber}</span>
          </p>

          <div className="row g-3 text-start mb-4">
            <div className="col-12 col-md-6">
              <div className="card border-0 guest-cart-item h-100">
                <div className="card-body">
                  <p className="text-secondary small mb-1">Status</p>
                  <p className="fw-semibold mb-0">Order Received</p>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-6">
              <div className="card border-0 guest-cart-item h-100">
                <div className="card-body">
                  <p className="text-secondary small mb-1">Estimated Time</p>
                  <p className="fw-semibold mb-0">{estimatedTime}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="d-flex flex-column flex-sm-row justify-content-center gap-2">
            <Link className="btn btn-primary" state={{ estimatedTime, order }} to={`/orders/${order.orderNumber}`}>
              Track Order
            </Link>
            <Link className="btn btn-outline-secondary" to="/">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GuestOrderSuccessPage;
