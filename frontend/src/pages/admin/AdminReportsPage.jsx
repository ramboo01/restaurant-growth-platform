import { useState, useEffect } from 'react';
import api from '../../services/api.js';

function formatCurrency(val) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(val) || 0);
}

function AdminReportsPage() {
  const [metrics, setMetrics] = useState({
    totalPlatformGMV: 0,
    platformCommission: 0,
    totalOrders: 0,
    activeTenants: 0,
    recentOrders: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      try {
        setLoading(true);
        const res = await api.get('/api/admin/reports/summary');
        if (res?.data?.data) {
          setMetrics(res.data.data);
        }
      } catch (err) {
        console.error('Failed to calculate platform metrics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, []);

  const handleExportCSV = () => {
    const headers = ['Order Number,Customer Name,Total Amount,Platform Fee (5%),Status,Created At'];
    const rows = (metrics.recentOrders || []).map(o => 
      `"${o.orderNumber}","${o.customerName}",$${Number(o.totalAmount).toFixed(2)},$${(Number(o.totalAmount) * 0.05).toFixed(2)},"${o.status}","${new Date(o.createdAt).toLocaleString()}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Platform_Financial_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            <i className="bi bi-graph-up-arrow text-success me-2"></i> Platform Aggregate Analytics & Financial Reports
          </h2>
          <p className="text-muted mb-0">System-wide GMV performance, platform fee earnings, and exportable financial logs.</p>
        </div>
        <button className="btn btn-outline-primary btn-sm fw-semibold" onClick={handleExportCSV}>
          <i className="bi bi-download me-1"></i> Export Platform CSV
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading reports...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-3">
              <div className="card border-0 shadow-sm rounded-4 bg-white border-start border-4 border-dark">
                <div className="card-body p-3">
                  <div className="text-muted small uppercase fw-bold">Platform Total GMV</div>
                  <div className="fs-3 fw-bold text-dark">{formatCurrency(metrics.totalPlatformGMV)}</div>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-3">
              <div className="card border-0 shadow-sm rounded-4 bg-white border-start border-4 border-success">
                <div className="card-body p-3">
                  <div className="text-muted small uppercase fw-bold">Platform Fee Earnings (5%)</div>
                  <div className="fs-3 fw-bold text-success">{formatCurrency(metrics.platformCommission)}</div>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-3">
              <div className="card border-0 shadow-sm rounded-4 bg-white border-start border-4 border-primary">
                <div className="card-body p-3">
                  <div className="text-muted small uppercase fw-bold">Total Platform Orders</div>
                  <div className="fs-3 fw-bold text-primary">{metrics.totalOrders.toLocaleString()}</div>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-3">
              <div className="card border-0 shadow-sm rounded-4 bg-white border-start border-4 border-warning">
                <div className="card-body p-3">
                  <div className="text-muted small uppercase fw-bold">Active Tenant Stores</div>
                  <div className="fs-3 fw-bold text-warning">{metrics.activeTenants}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Financial Transactions Table */}
          <div className="card border-0 shadow-sm rounded-4 bg-white mb-4">
            <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0">
                <i className="bi bi-receipt me-2 text-primary"></i> Live Financial Breakdown & Audit Trail
              </h5>
              <span className="badge bg-light text-dark border">Real-Time DB Ledger</span>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-3">Order Number</th>
                      <th>Customer Name</th>
                      <th>Gross Amount (GMV)</th>
                      <th>Platform Fee (5%)</th>
                      <th>Status</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!metrics.recentOrders || metrics.recentOrders.length === 0) ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4 text-muted">
                          No order transactions recorded in database yet.
                        </td>
                      </tr>
                    ) : (
                      metrics.recentOrders.map(order => (
                        <tr key={order.id}>
                          <td className="ps-3 fw-semibold text-primary">#{order.orderNumber}</td>
                          <td className="fw-medium">{order.customerName}</td>
                          <td className="fw-bold">{formatCurrency(order.totalAmount)}</td>
                          <td className="text-success fw-semibold">{formatCurrency(Number(order.totalAmount) * 0.05)}</td>
                          <td>
                            <span className={`badge bg-${order.status === 'Completed' || order.status === 'Delivered' ? 'success' : order.status === 'Pending' ? 'warning' : 'info'} bg-opacity-10 text-${order.status === 'Completed' || order.status === 'Delivered' ? 'success' : order.status === 'Pending' ? 'warning' : 'info'} border border-${order.status === 'Completed' || order.status === 'Delivered' ? 'success' : order.status === 'Pending' ? 'warning' : 'info'} border-opacity-25 px-2 py-1`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="text-muted small">
                            {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminReportsPage;
