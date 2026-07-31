import { useState } from 'react';

export default function OwnerFranchiseComparisonPage() {
  const [stores] = useState([
    { id: 1, name: 'Downtown Flagship', sales: 48500, laborCost: '26.2%', foodCost: '29.8%', auditScore: '98%', status: 'Top Performer' },
    { id: 2, name: 'Uptown Bistro', sales: 34200, laborCost: '28.5%', foodCost: '31.2%', auditScore: '94%', status: 'Optimal' },
    { id: 3, name: 'Westside Express', sales: 29800, laborCost: '32.1%', foodCost: '34.5%', auditScore: '89%', status: 'Cost Warning' }
  ]);

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
            <div className="fs-2 fw-extrabold text-primary mt-1">$112,500.00</div>
            <span className="text-muted small">Current month gross sales</span>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-4 border-success">
            <span className="text-secondary small fw-semibold">Average Franchise Labor Cost</span>
            <div className="fs-2 fw-extrabold text-success mt-1">28.9%</div>
            <span className="text-muted small">Target threshold: &lt; 30%</span>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-4 border-warning">
            <span className="text-secondary small fw-semibold">Average Brand Audit Score</span>
            <div className="fs-2 fw-extrabold text-dark mt-1">93.7%</div>
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
                  <td className="fw-bold text-primary">${store.sales.toLocaleString()}</td>
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
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
