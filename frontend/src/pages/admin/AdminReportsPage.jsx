import { useState } from 'react';

function formatCurrency(val) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(val) || 0);
}

function AdminReportsPage() {
  const [metrics] = useState({
    totalPlatformGMV: 1248900.00,
    platformCommission: 62445.00,
    totalOrders: 38420,
    activeTenants: 42,
  });

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            <i className="bi bi-graph-up-arrow text-success me-2"></i> Platform Aggregate Analytics & Financial Reports
          </h2>
          <p className="text-muted mb-0">System-wide GMV performance, platform fee earnings, and exportable financial logs.</p>
        </div>
        <button className="btn btn-outline-primary btn-sm fw-semibold" onClick={() => alert('Exporting platform CSV financial report...')}>
          <i className="bi bi-download me-1"></i> Export Platform CSV
        </button>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 bg-white">
            <div className="card-body p-3">
              <div className="text-muted small uppercase fw-bold">Platform Total GMV</div>
              <div className="fs-3 fw-bold text-dark">{formatCurrency(metrics.totalPlatformGMV)}</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 bg-white">
            <div className="card-body p-3">
              <div className="text-muted small uppercase fw-bold">Platform Fee Earnings (5%)</div>
              <div className="fs-3 fw-bold text-success">{formatCurrency(metrics.platformCommission)}</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 bg-white">
            <div className="card-body p-3">
              <div className="text-muted small uppercase fw-bold">Total Platform Orders</div>
              <div className="fs-3 fw-bold text-primary">{metrics.totalOrders.toLocaleString()}</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 bg-white">
            <div className="card-body p-3">
              <div className="text-muted small uppercase fw-bold">Active Tenant Stores</div>
              <div className="fs-3 fw-bold text-warning">{metrics.activeTenants}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminReportsPage;
