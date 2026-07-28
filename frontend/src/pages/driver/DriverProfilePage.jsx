import { useState } from 'react';
import { Link } from 'react-router-dom';

function formatCurrency(val) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(val) || 0);
}

function DriverProfilePage() {
  const [driver] = useState({
    name: 'Alex Johnson',
    phone: '(555) 987-6543',
    email: 'alex.driver@restaurantgrowth.com',
    rating: 4.92,
    totalDeliveries: 348,
    vehicle: '2022 Honda Civic (Blue) - Lic #7XYZ92',
    payoutAccount: 'Chase Checking ending in ****4910',
  });

  const [weeklyEarnings] = useState([
    { day: 'Mon', date: 'Jul 21', deliveries: 8, base: 72.00, tips: 28.50, total: 100.50 },
    { day: 'Tue', date: 'Jul 22', deliveries: 11, base: 98.00, tips: 39.00, total: 137.00 },
    { day: 'Wed', date: 'Jul 23', deliveries: 9, base: 81.00, tips: 34.00, total: 115.00 },
    { day: 'Thu', date: 'Jul 24', deliveries: 14, base: 126.00, tips: 48.50, total: 174.50 },
    { day: 'Fri', date: 'Jul 25', deliveries: 16, base: 144.00, tips: 62.00, total: 206.00 },
  ]);

  return (
    <div className="container-fluid py-4 px-md-4" style={{ maxWidth: '1000px' }}>
      {/* Profile Header */}
      <div className="card border-0 shadow-sm rounded-4 mb-4 bg-white">
        <div className="card-body p-4">
          <div className="d-flex flex-column flex-md-row align-items-md-center gap-4">
            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold fs-1 shadow-sm" style={{ width: '80px', height: '80px' }}>
              AJ
            </div>
            <div className="flex-grow-1">
              <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                <h3 className="fw-bold mb-0 text-dark">{driver.name}</h3>
                <span className="badge bg-warning bg-opacity-20 text-dark border border-warning border-opacity-50 px-2 py-1">
                  <i className="bi bi-star-fill text-warning me-1"></i> {driver.rating} Rating
                </span>
                <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1">
                  <i className="bi bi-patch-check-fill me-1"></i> Verified Partner
                </span>
              </div>
              <p className="text-muted small mb-2">{driver.email} • {driver.phone}</p>
              <div className="text-dark small"><i className="bi bi-car-front-fill me-2 text-primary"></i>{driver.vehicle}</div>
            </div>
            <div className="text-md-end border-start-md ps-md-4 pt-3 pt-md-0">
              <div className="text-muted small uppercase fw-semibold">Total Career Deliveries</div>
              <div className="fs-2 fw-bold text-dark">{driver.totalDeliveries}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Weekly Earnings History Ledger */}
        <div className="col-12 col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0">
                <i className="bi bi-cash-stack text-success me-2"></i> Weekly Earnings Ledger
              </h5>
              <span className="badge bg-success bg-opacity-10 text-success px-3 py-2">
                This Week: {formatCurrency(weeklyEarnings.reduce((acc, row) => acc + row.total, 0))}
              </span>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light small text-muted text-uppercase">
                    <tr>
                      <th className="ps-4">Day</th>
                      <th>Deliveries</th>
                      <th>Base Pay</th>
                      <th>Tips</th>
                      <th className="pe-4 text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weeklyEarnings.map((item, idx) => (
                      <tr key={idx}>
                        <td className="ps-4 fw-semibold text-dark">
                          {item.day} <span className="text-muted small ms-1">({item.date})</span>
                        </td>
                        <td><span className="badge bg-secondary bg-opacity-10 text-dark px-2">{item.deliveries} trips</span></td>
                        <td>{formatCurrency(item.base)}</td>
                        <td className="text-success">{formatCurrency(item.tips)}</td>
                        <td className="pe-4 text-end fw-bold text-dark">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Payout & Settings Sidebar */}
        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-header bg-white border-0 py-3">
              <h6 className="fw-bold mb-0">Payout Destination</h6>
            </div>
            <div className="card-body">
              <div className="p-3 bg-light rounded-3 mb-3">
                <div className="d-flex align-items-center gap-3">
                  <i className="bi bi-bank fs-3 text-primary"></i>
                  <div>
                    <div className="fw-bold text-dark small">Direct Deposit</div>
                    <div className="text-muted extra-small">{driver.payoutAccount}</div>
                  </div>
                </div>
              </div>
              <button type="button" className="btn btn-outline-primary btn-sm w-100 fw-semibold">
                Manage Payout Account
              </button>
            </div>
          </div>

          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-header bg-white border-0 py-3">
              <h6 className="fw-bold mb-0">Navigation Shortcuts</h6>
            </div>
            <div className="card-body d-flex flex-column gap-2">
              <Link to="/driver" className="btn btn-light text-start text-dark fw-semibold p-3 rounded-3">
                <i className="bi bi-speedometer2 me-2 text-primary"></i> Driver Dashboard
              </Link>
              <Link to="/driver/orders" className="btn btn-light text-start text-dark fw-semibold p-3 rounded-3">
                <i className="bi bi-box-seam me-2 text-success"></i> Active Delivery Queue
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DriverProfilePage;
