import { useEffect, useState } from 'react';
import { franchiseService } from '../../services/franchiseService.js';
import LoadingState from '../../components/feedback/LoadingState.jsx';

export default function OwnerFranchiseComparisonPage() {
  const [stores, setStores] = useState([]);
  const [summary, setSummary] = useState({ combinedSales: 0, avgLaborCost: '0%', avgAuditScore: '0%' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadComparisonData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await franchiseService.getComparisonData();
      setStores(data.stores || []);
      setSummary(data.summary || { combinedSales: 0, avgLaborCost: '0%', avgAuditScore: '0%' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load franchise comparison data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComparisonData();
  }, []);

  if (loading) {
    return (
      <div className="container-fluid py-5">
        <LoadingState message="Loading franchise comparison metrics..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger shadow-sm" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
          <button className="btn btn-sm btn-outline-danger float-end" onClick={loadComparisonData}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold m-0 text-dark">
            📊 Multi-Unit Franchise Comparison Dashboard (OWN-022)
          </h2>
          <p className="text-secondary small m-0">
            Multi-store operator matrix: Compare revenue performance, labor cost ratios, food cost variance, and audit scores across franchise locations.
          </p>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-4 border-primary">
            <span className="text-secondary small fw-semibold">Combined Multi-Store Sales</span>
            <div className="fs-2 fw-extrabold text-primary mt-1">
              ${Number(summary.combinedSales).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-muted small">Current month gross sales</span>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-4 border-success">
            <span className="text-secondary small fw-semibold">Average Franchise Labor Cost</span>
            <div className="fs-2 fw-extrabold text-success mt-1">{summary.avgLaborCost}</div>
            <span className="text-muted small">Target threshold: &lt; 30%</span>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-4 border-warning">
            <span className="text-secondary small fw-semibold">Average Brand Audit Score</span>
            <div className="fs-2 fw-extrabold text-dark mt-1">{summary.avgAuditScore}</div>
            <span className="text-muted small">Compliance benchmark</span>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
        <h5 className="fw-bold mb-3 border-bottom pb-2 text-dark">
          🏪 Store-by-Store Sales & Cost Variance Matrix
        </h5>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Franchise Location</th>
                <th>Monthly Gross Revenue</th>
                <th>Labor Cost %</th>
                <th>Food COGS %</th>
                <th>HQ Audit Score</th>
                <th>Performance Status</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((store) => (
                <tr key={store.id}>
                  <td className="fw-bold text-dark">{store.name}</td>
                  <td className="fw-bold text-primary">${store.sales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="fw-semibold">{store.laborCost}</td>
                  <td className="fw-semibold">{store.foodCost}</td>
                  <td>
                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 fw-bold">
                      {store.auditScore}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${store.status === 'Top Performer' ? 'bg-success' : store.status === 'Optimal' ? 'bg-primary' : 'bg-warning text-dark'}`}>
                      {store.status}
                    </span>
                  </td>
                </tr>
              ))}
              {stores.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-4">No franchise locations found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
