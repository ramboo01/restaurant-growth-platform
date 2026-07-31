import { useState, useEffect } from 'react';

export default function AdminFinancialCompliancePage() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPayouts();
  }, []);

  async function fetchPayouts() {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/financial/payouts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.data) {
        setPayouts(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch store payouts:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleReleasePayout = async (id) => {
    try {
      setMessage('');
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/financial/release-payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id })
      });
      const json = await res.json();
      if (res.ok) {
        setMessage('🎉 Settlement payout released to store bank account! Audit log generated.');
        fetchPayouts();
      } else {
        setMessage(`❌ ${json.message || 'Payout release failed.'}`);
      }
    } catch (err) {
      setMessage('❌ Failed to release payout.');
    }
  };

  const totalGross = payouts.reduce((sum, p) => sum + Number(p.gross_sales || 0), 0);
  const totalFees = payouts.reduce((sum, p) => sum + Number(p.platform_fee || 0), 0);
  const totalNet = payouts.reduce((sum, p) => sum + Number(p.net_payout || 0), 0);

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold m-0 text-dark">
            💳 Financial Compliance & Store Settlement Monitor (ADM-005)
          </h2>
          <p className="text-secondary small m-0">
            Platform revenue ledger: Weekly store settlement calculations, tax withholding audit, and payout release console.
          </p>
        </div>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={fetchPayouts}>
          <i className="bi bi-arrow-clockwise me-1" /> Refresh Financial Ledger
        </button>
      </div>

      {message && (
        <div className={`alert ${message.startsWith('🎉') ? 'alert-success' : 'alert-danger'} shadow-sm py-2 px-3 mb-4`}>
          {message}
        </div>
      )}

      {/* Financial Overview Metrics */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-4 border-primary">
            <span className="text-secondary small fw-semibold">Total Gross Store Sales</span>
            <div className="fs-2 fw-extrabold text-primary mt-1">${totalGross.toFixed(2)}</div>
            <span className="text-muted small">Aggregated store revenue</span>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-4 border-success">
            <span className="text-secondary small fw-semibold">Platform Commission Fee (5%)</span>
            <div className="fs-2 fw-extrabold text-success mt-1">${totalFees.toFixed(2)}</div>
            <span className="text-muted small">Platform gross earnings</span>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-4 border-dark">
            <span className="text-secondary small fw-semibold">Net Store Disbursed</span>
            <div className="fs-2 fw-extrabold text-dark mt-1">${totalNet.toFixed(2)}</div>
            <span className="text-muted small">Net payout after taxes & fees</span>
          </div>
        </div>
      </div>

      {/* Store Payout Settlement Table */}
      <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
        <h5 className="fw-bold mb-3 border-bottom pb-2 text-dark">
          🏦 Store Weekly Settlement Payout Queue
        </h5>

        {loading ? (
          <div className="text-center py-4 text-muted small">Loading financial ledger...</div>
        ) : payouts.length === 0 ? (
          <div className="text-center py-4 text-muted small">No store payouts found.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Store Name</th>
                  <th>Settlement Period</th>
                  <th>Gross Sales</th>
                  <th>Platform Fee (5%)</th>
                  <th>Tax Withheld</th>
                  <th>Net Store Payout</th>
                  <th>Payout Status</th>
                  <th>Disbursement Action</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((payout) => (
                  <tr key={payout.id}>
                    <td className="fw-bold text-dark">{payout.store_name}</td>
                    <td className="small text-secondary">{payout.payout_period}</td>
                    <td className="fw-semibold">${Number(payout.gross_sales).toFixed(2)}</td>
                    <td className="text-danger">-${Number(payout.platform_fee).toFixed(2)}</td>
                    <td className="text-muted">-${Number(payout.tax_withheld).toFixed(2)}</td>
                    <td className="fw-bold text-success fs-6">${Number(payout.net_payout).toFixed(2)}</td>
                    <td>
                      <span className={`badge ${payout.status === 'Released' ? 'bg-success' : 'bg-warning text-dark'}`}>
                        {payout.status}
                      </span>
                    </td>
                    <td>
                      {payout.status !== 'Released' ? (
                        <button
                          type="button"
                          className="btn btn-success btn-sm fw-bold shadow-sm"
                          onClick={() => handleReleasePayout(payout.id)}
                        >
                          <i className="bi bi-bank me-1" /> Release Payout
                        </button>
                      ) : (
                        <span className="text-muted small">Disbursed</span>
                      )}
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
