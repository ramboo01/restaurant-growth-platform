import { useState, useEffect } from 'react';
import api from '../../services/api.js';

export default function AdminFinancialCompliancePage() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchStoreFinancials();
  }, []);

  async function fetchStoreFinancials() {
    try {
      setLoading(true);
      const res = await api.get('/api/admin/financial/payouts');
      if (res?.data?.data) {
        setStores(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch store financials:', err);
      setMessage('❌ Failed to load store financial ledger from database.');
    } finally {
      setLoading(false);
    }
  }

  const totalGross = stores.reduce((sum, s) => sum + Number(s.gross_sales || 0), 0);
  const totalFees = stores.reduce((sum, s) => sum + Number(s.platform_fee || 0), 0);
  const totalNet = stores.reduce((sum, s) => sum + Number(s.net_payout || 0), 0);
  const totalOrdersCount = stores.reduce((sum, s) => sum + Number(s.total_orders || 0), 0);

  return (
    <div className="container-fluid py-4">
      {/* Top Title & Refresh */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold m-0 text-dark d-flex align-items-center gap-2">
            <i className="bi bi-bank2 text-primary"></i> Real Store Revenue &amp; Financial Ledger (ADM-005)
          </h2>
          <p className="text-secondary small m-0">
            Real-time financial performance and commission ledger across all registered platform stores.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm fw-semibold d-inline-flex align-items-center gap-1 shadow-sm"
          onClick={fetchStoreFinancials}
        >
          <i className="bi bi-arrow-clockwise" /> Refresh Financial Ledger
        </button>
      </div>

      {message && (
        <div className={`alert ${message.startsWith('🎉') ? 'alert-success' : 'alert-danger'} shadow-sm py-2.5 px-3 mb-4 d-flex align-items-center gap-2`} role="alert">
          <i className={`bi bi-${message.startsWith('🎉') ? 'check-circle-fill text-success' : 'exclamation-circle-fill text-danger'} fs-5`}></i>
          <div>{message}</div>
        </div>
      )}

      {/* Financial Overview Metrics */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-3.5 bg-white border-start border-4 border-primary">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-secondary small fw-bold text-uppercase">Total Real Store Sales</span>
              <span className="badge bg-primary bg-opacity-10 text-primary">{totalOrdersCount} Total Orders</span>
            </div>
            <div className="fs-2 fw-extrabold text-primary">${totalGross.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <span className="text-muted extra-small">Live aggregated revenue from all platform restaurants</span>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-3.5 bg-white border-start border-4 border-success">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-secondary small fw-bold text-uppercase">Platform Commission (5%)</span>
              <span className="badge bg-success bg-opacity-10 text-success">Platform Revenue</span>
            </div>
            <div className="fs-2 fw-extrabold text-success">${totalFees.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <span className="text-muted extra-small">Platform earnings based on 5% platform commission</span>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-3.5 bg-white border-start border-4 border-dark">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-secondary small fw-bold text-uppercase">Total Net Store Earnings</span>
              <span className="badge bg-dark bg-opacity-10 text-dark">95% Store Share</span>
            </div>
            <div className="fs-2 fw-extrabold text-dark">${totalNet.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <span className="text-muted extra-small">Aggregated net earnings payable to restaurant owners</span>
          </div>
        </div>
      </div>

      {/* Real Store Sales Table */}
      <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
        <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
          <h5 className="fw-bold text-dark m-0">
            🏬 Registered Platform Stores &amp; Sales Summary ({stores.length})
          </h5>
          <span className="badge bg-light text-dark border extra-small">Live Database Records</span>
        </div>

        {loading ? (
          <div className="text-center py-5 text-muted small">
            <div className="spinner-border spinner-border-sm text-primary mb-2"></div>
            <div>Loading real store financial data from database...</div>
          </div>
        ) : stores.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-shop display-4 text-secondary mb-2 d-block"></i>
            <h6 className="fw-bold text-dark">No Restaurants Found in Database</h6>
            <p className="small m-0">No active restaurants found in the database.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light text-uppercase small text-muted">
                <tr>
                  <th className="ps-3">Restaurant Name</th>
                  <th>Contact Email / Location</th>
                  <th className="text-center">Total Orders</th>
                  <th>Real Gross Sales</th>
                  <th>Platform Fee (5%)</th>
                  <th>Net Store Share (95%)</th>
                  <th className="pe-3 text-end">Store Status</th>
                </tr>
              </thead>
              <tbody>
                {stores.map((store) => (
                  <tr key={store.id}>
                    <td className="ps-3 fw-bold text-dark">
                      <i className="bi bi-shop me-2 text-primary"></i>
                      {store.store_name}
                      <div className="text-muted extra-small font-monospace">ID #{store.id}</div>
                    </td>
                    <td className="small text-secondary">
                      <div>{store.store_email}</div>
                      <div className="text-muted extra-small">{store.store_address}</div>
                    </td>
                    <td className="text-center fw-semibold fs-6">
                      <span className="badge bg-light text-dark border px-2.5 py-1">
                        {store.total_orders} orders
                      </span>
                    </td>
                    <td className="fw-bold text-dark fs-6">
                      ${Number(store.gross_sales).toFixed(2)}
                    </td>
                    <td className="text-danger fw-semibold">
                      -${Number(store.platform_fee).toFixed(2)}
                    </td>
                    <td className="fw-bold text-success fs-6">
                      ${Number(store.net_payout).toFixed(2)}
                    </td>
                    <td className="pe-3 text-end">
                      <span className={`badge ${store.status === 'Active' ? 'bg-success' : 'bg-secondary'} px-2.5 py-1`}>
                        {store.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
