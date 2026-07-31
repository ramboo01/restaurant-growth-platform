import { useState, useEffect } from 'react';

export default function FranchiseCompliancePage() {
  const [scorecard, setScorecard] = useState(null);
  const [overrideRequests, setOverrideRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    fetchComplianceData();
  }, []);

  async function fetchComplianceData() {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/franchise/compliance-data', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.data) {
        setScorecard(json.data.scorecard);
        setOverrideRequests(json.data.overrideRequests || []);
      }
    } catch (err) {
      console.error('Failed to fetch franchise compliance data:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleOverrideAction = async (id, action) => {
    try {
      setActionMessage('');
      const token = localStorage.getItem('token');
      const res = await fetch('/api/franchise/price-override/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, action })
      });
      const json = await res.json();
      if (res.ok) {
        setActionMessage(`🎉 Request ${action.toLowerCase()} successfully!`);
        fetchComplianceData();
      } else {
        setActionMessage(`❌ ${json.message || 'Action failed.'}`);
      }
    } catch (err) {
      setActionMessage('❌ Failed to update price override.');
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold m-0 text-dark">
            🏬 Franchise Compliance Center & HQ Audit Scorecard (OWN-024)
          </h2>
          <p className="text-secondary small m-0">
            Multi-location audit scores, brand standard enforcement, and regional menu price override request approval queue.
          </p>
        </div>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={fetchComplianceData}>
          <i className="bi bi-arrow-clockwise me-1" /> Refresh Compliance
        </button>
      </div>

      {actionMessage && (
        <div className={`alert ${actionMessage.startsWith('🎉') ? 'alert-success' : 'alert-danger'} shadow-sm py-2 px-3 mb-4`}>
          {actionMessage}
        </div>
      )}

      {/* Audit Scorecards Grid */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-4 border-success">
            <span className="text-secondary small fw-semibold">Food Safety Score</span>
            <div className="fs-2 fw-extrabold text-success mt-1">{scorecard?.food_safety_score || 98}%</div>
            <span className="badge bg-success bg-opacity-10 text-success w-auto align-self-start mt-1">Grade A (Passed)</span>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-4 border-primary">
            <span className="text-secondary small fw-semibold">Brand Standard Score</span>
            <div className="fs-2 fw-extrabold text-primary mt-1">{scorecard?.brand_standard_score || 95}%</div>
            <span className="badge bg-primary bg-opacity-10 text-primary w-auto align-self-start mt-1">HQ Verified</span>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-4 border-info">
            <span className="text-secondary small fw-semibold">Speed of Service Score</span>
            <div className="fs-2 fw-extrabold text-info mt-1">{scorecard?.speed_score || 92}%</div>
            <span className="badge bg-info bg-opacity-10 text-info w-auto align-self-start mt-1">Avg 4.2 min ticket</span>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white border-start border-4 border-warning">
            <span className="text-secondary small fw-semibold">Guest Review Average</span>
            <div className="fs-2 fw-extrabold text-dark mt-1">⭐ {scorecard?.review_score || 4.85}</div>
            <span className="badge bg-warning bg-opacity-25 text-dark w-auto align-self-start mt-1">Top 5% Franchises</span>
          </div>
        </div>
      </div>

      {/* Price Override Requests Queue */}
      <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
        <h5 className="fw-bold mb-3 border-bottom pb-2 text-dark">
          📋 Regional Price Override Approval Queue
        </h5>

        {loading ? (
          <div className="text-center py-4 text-muted small">Loading price override requests...</div>
        ) : overrideRequests.length === 0 ? (
          <div className="text-center py-4 text-muted small">No pending price override requests.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Store / Location</th>
                  <th>Menu Item</th>
                  <th>Current Price</th>
                  <th>Requested Price</th>
                  <th>Reason for Override</th>
                  <th>Status</th>
                  <th>HQ Action</th>
                </tr>
              </thead>
              <tbody>
                {overrideRequests.map((req) => (
                  <tr key={req.id}>
                    <td className="fw-bold">{req.store_name}</td>
                    <td className="fw-semibold text-primary">{req.menu_item_name}</td>
                    <td>${Number(req.current_price).toFixed(2)}</td>
                    <td className="fw-bold text-success">${Number(req.requested_price).toFixed(2)}</td>
                    <td className="small text-secondary">{req.reason}</td>
                    <td>
                      <span className={`badge ${
                        req.status === 'Approved' ? 'bg-success' : req.status === 'Rejected' ? 'bg-danger' : 'bg-warning text-dark'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td>
                      {req.status === 'Pending' ? (
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className="btn btn-success fw-semibold"
                            onClick={() => handleOverrideAction(req.id, 'Approved')}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger fw-semibold"
                            onClick={() => handleOverrideAction(req.id, 'Rejected')}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted small">Processed</span>
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
