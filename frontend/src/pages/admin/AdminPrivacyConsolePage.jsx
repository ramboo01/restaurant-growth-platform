import { useState, useEffect } from 'react';

export default function AdminPrivacyConsolePage() {
  const [erasureRequests, setErasureRequests] = useState([]);
  const [mergeQueue, setMergeQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('erasure');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPrivacyData();
  }, []);

  async function fetchPrivacyData() {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/privacy/requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.data) {
        setErasureRequests(json.data.erasureRequests || []);
        setMergeQueue(json.data.mergeQueue || []);
      }
    } catch (err) {
      console.error('Failed to fetch privacy console data:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleProcessErasure = async (id) => {
    try {
      setMessage('');
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/privacy/process-erasure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id })
      });
      const json = await res.json();
      if (res.ok) {
        setMessage('🎉 GDPR PII Erasure request processed! Guest data anonymized and audit log recorded.');
        fetchPrivacyData();
      } else {
        setMessage(`❌ ${json.message || 'Processing failed.'}`);
      }
    } catch (err) {
      setMessage('❌ Failed to process erasure request.');
    }
  };

  const handleMergeProfiles = async (id) => {
    try {
      setMessage('');
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/privacy/merge-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id })
      });
      const json = await res.json();
      if (res.ok) {
        setMessage('🎉 Guest profiles merged successfully! Audit log recorded.');
        fetchPrivacyData();
      } else {
        setMessage(`❌ ${json.message || 'Merge failed.'}`);
      }
    } catch (err) {
      setMessage('❌ Failed to merge profiles.');
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold m-0 text-dark">
            🛡️ GDPR Erasure Console & Profile Merge Queue (ADM-001, ADM-002)
          </h2>
          <p className="text-secondary small m-0">
            Platform governance: Right-to-be-forgotten PII erasure requests and duplicate guest record consolidation.
          </p>
        </div>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={fetchPrivacyData}>
          <i className="bi bi-arrow-clockwise me-1" /> Refresh Queue
        </button>
      </div>

      {message && (
        <div className={`alert ${message.startsWith('🎉') ? 'alert-success' : 'alert-danger'} shadow-sm py-2 px-3 mb-4`}>
          {message}
        </div>
      )}

      {/* Navigation Tabs */}
      <ul className="nav nav-tabs border-bottom mb-4">
        <li className="nav-item">
          <button
            className={`nav-link border-0 fw-semibold ${activeTab === 'erasure' ? 'active text-primary border-bottom border-primary border-2' : 'text-secondary'}`}
            onClick={() => setActiveTab('erasure')}
          >
            <i className="bi bi-shield-x me-2" /> GDPR Erasure Requests ({erasureRequests.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link border-0 fw-semibold ${activeTab === 'merge' ? 'active text-primary border-bottom border-primary border-2' : 'text-secondary'}`}
            onClick={() => setActiveTab('merge')}
          >
            <i className="bi bi-person-bounding-box me-2" /> Profile Merge Queue ({mergeQueue.length})
          </button>
        </li>
      </ul>

      {activeTab === 'erasure' ? (
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
          <h5 className="fw-bold mb-3 border-bottom pb-2 text-dark">
            📋 Pending GDPR Right-To-Be-Forgotten Erasure Requests
          </h5>
          {loading ? (
            <div className="text-center py-4 text-muted small">Loading erasure requests...</div>
          ) : erasureRequests.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-shield-check display-4 text-success mb-2 d-block" />
              <h6 className="fw-bold text-dark">No Pending Erasure Requests</h6>
              <p className="small m-0">All customer data privacy compliance requests have been processed.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Customer Name</th>
                    <th>Email / Contact</th>
                    <th>Reason</th>
                    <th>Requested At</th>
                    <th>Status</th>
                    <th>Admin Action</th>
                  </tr>
                </thead>
                <tbody>
                  {erasureRequests.map((req) => (
                    <tr key={req.id}>
                      <td className="fw-bold">{req.guest_name || req.name || 'Guest User'}</td>
                      <td>{req.email || req.contact || 'N/A'}</td>
                      <td className="small text-secondary">{req.reason || 'User opted out'}</td>
                      <td className="small text-muted">{new Date(req.requested_at || req.createdAt).toLocaleString()}</td>
                      <td>
                        <span className={`badge ${req.status === 'Completed' ? 'bg-success' : 'bg-warning text-dark'}`}>
                          {req.status || 'Pending'}
                        </span>
                      </td>
                      <td>
                        {req.status !== 'Completed' ? (
                          <button
                            type="button"
                            className="btn btn-danger btn-sm fw-bold shadow-sm"
                            onClick={() => handleProcessErasure(req.id)}
                          >
                            <i className="bi bi-trash-fill me-1" /> Anonymize & Erase PII
                          </button>
                        ) : (
                          <span className="text-muted small">Erased & Logged</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
          <h5 className="fw-bold mb-3 border-bottom pb-2 text-dark">
            👥 Duplicate Guest Profile Consolidation Queue
          </h5>
          {loading ? (
            <div className="text-center py-4 text-muted small">Loading merge queue...</div>
          ) : mergeQueue.length === 0 ? (
            <div className="text-center py-4 text-muted small">No duplicate profile matches found.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Primary Profile</th>
                    <th>Duplicate Match Found</th>
                    <th>Match Criteria</th>
                    <th>Status</th>
                    <th>Consolidation Action</th>
                  </tr>
                </thead>
                <tbody>
                  {mergeQueue.map((item) => (
                    <tr key={item.id}>
                      <td className="fw-bold text-primary">{item.primary_name}</td>
                      <td className="fw-bold text-dark">{item.duplicate_name}</td>
                      <td><span className="badge bg-light text-dark border">{item.match_reason}</span></td>
                      <td>
                        <span className={`badge ${item.status === 'Merged' ? 'bg-success' : 'bg-warning text-dark'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>
                        {item.status !== 'Merged' ? (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm fw-bold shadow-sm"
                            onClick={() => handleMergeProfiles(item.id)}
                          >
                            <i className="bi bi-person-check-fill me-1" /> Merge Profiles
                          </button>
                        ) : (
                          <span className="text-muted small">Merged</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
