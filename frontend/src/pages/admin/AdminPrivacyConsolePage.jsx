import { useState, useEffect } from 'react';
import api from '../../services/api.js';

export default function AdminPrivacyConsolePage() {
  const [erasureRequests, setErasureRequests] = useState([]);
  const [mergeQueue, setMergeQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('erasure');
  const [message, setMessage] = useState('');
  const [actioningId, setActioningId] = useState(null);

  useEffect(() => {
    fetchPrivacyData();
  }, []);

  async function fetchPrivacyData() {
    try {
      setLoading(true);
      const res = await api.get('/api/admin/privacy/requests');
      if (res?.data?.data) {
        setErasureRequests(res.data.data.erasureRequests || []);
        setMergeQueue(res.data.data.mergeQueue || []);
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
      setActioningId(id);
      const res = await api.post('/api/admin/privacy/process-erasure', { id });
      if (res?.data?.message) {
        setMessage(res.data.message);
        await fetchPrivacyData();
      }
    } catch (err) {
      console.error(err);
      setMessage(`❌ ${err.response?.data?.message || 'Failed to process erasure request.'}`);
    } finally {
      setActioningId(null);
    }
  };

  const handleMergeProfiles = async (id) => {
    try {
      setMessage('');
      setActioningId(id);
      const res = await api.post('/api/admin/privacy/merge-profiles', { id });
      if (res?.data?.message) {
        setMessage(res.data.message);
        await fetchPrivacyData();
      }
    } catch (err) {
      console.error(err);
      setMessage(`❌ ${err.response?.data?.message || 'Failed to merge profiles.'}`);
    } finally {
      setActioningId(null);
    }
  };

  const handleSeparateProfiles = async (id) => {
    try {
      setMessage('');
      setActioningId(id);
      const res = await api.post('/api/admin/privacy/separate-profiles', { id });
      if (res?.data?.message) {
        setMessage(res.data.message);
        await fetchPrivacyData();
      }
    } catch (err) {
      console.error(err);
      setMessage(`❌ ${err.response?.data?.message || 'Failed to keep profiles separate.'}`);
    } finally {
      setActioningId(null);
    }
  };

  const pendingErasureCount = erasureRequests.filter(r => r.status === 'Pending').length;
  const pendingMergeCount = mergeQueue.filter(m => m.status === 'Pending').length;

  return (
    <div className="container-fluid py-4">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold m-0 text-dark">
            <i className="bi bi-shield-lock-fill text-danger me-2"></i> GDPR Privacy Console &amp; Profile Merge Queue (ADM-001, ADM-002)
          </h2>
          <p className="text-secondary small m-0">
            Platform governance: Right-to-be-forgotten PII erasure requests and duplicate guest record consolidation.
          </p>
        </div>
        <button type="button" className="btn btn-outline-secondary btn-sm fw-semibold" onClick={fetchPrivacyData}>
          <i className="bi bi-arrow-clockwise me-1" /> Refresh Queue
        </button>
      </div>

      {message && (
        <div className={`alert ${message.startsWith('🎉') ? 'alert-success' : 'alert-danger'} shadow-sm py-2.5 px-3 mb-4 d-flex align-items-center gap-2`} role="alert">
          <i className={`bi bi-${message.startsWith('🎉') ? 'check-circle-fill text-success' : 'exclamation-circle-fill text-danger'} fs-5`}></i>
          <div>{message}</div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white d-flex flex-row align-items-center gap-3">
            <div className="bg-danger bg-opacity-10 text-danger p-3 rounded-circle">
              <i className="bi bi-shield-x fs-3"></i>
            </div>
            <div>
              <div className="fw-bold fs-4 text-dark">{pendingErasureCount}</div>
              <div className="text-muted small">Pending GDPR Erasure Requests (Right to be Forgotten)</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white d-flex flex-row align-items-center gap-3">
            <div className="bg-primary bg-opacity-10 text-primary p-3 rounded-circle">
              <i className="bi bi-person-bounding-box fs-3"></i>
            </div>
            <div>
              <div className="fw-bold fs-4 text-dark">{pendingMergeCount}</div>
              <div className="text-muted small">Pending Duplicate Profile Consolidations</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <ul className="nav nav-tabs border-bottom mb-4">
        <li className="nav-item">
          <button
            className={`nav-link border-0 fw-bold ${activeTab === 'erasure' ? 'active text-danger border-bottom border-danger border-3' : 'text-secondary'}`}
            onClick={() => setActiveTab('erasure')}
          >
            <i className="bi bi-shield-x me-2" /> GDPR Erasure Requests ({erasureRequests.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link border-0 fw-bold ${activeTab === 'merge' ? 'active text-primary border-bottom border-primary border-3' : 'text-secondary'}`}
            onClick={() => setActiveTab('merge')}
          >
            <i className="bi bi-person-bounding-box me-2" /> Profile Merge Queue ({mergeQueue.length})
          </button>
        </li>
      </ul>

      {/* Tab 1: GDPR Erasure Requests */}
      {activeTab === 'erasure' ? (
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
          <h5 className="fw-bold mb-3 border-bottom pb-2 text-dark d-flex align-items-center justify-content-between">
            <span>📋 Pending GDPR Right-To-Be-Forgotten Erasure Requests</span>
            <span className="badge bg-light text-dark border fw-normal extra-small">Article 17 GDPR Compliance</span>
          </h5>
          {loading ? (
            <div className="text-center py-5 text-muted small">
              <div className="spinner-border spinner-border-sm text-danger mb-2"></div>
              <div>Loading erasure requests...</div>
            </div>
          ) : erasureRequests.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-shield-check display-4 text-success mb-2 d-block" />
              <h6 className="fw-bold text-dark">No Pending Erasure Requests</h6>
              <p className="small m-0">All customer data privacy compliance requests have been processed.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light text-uppercase small text-muted">
                  <tr>
                    <th className="ps-3">Customer Name</th>
                    <th>Email / Contact</th>
                    <th>Reason for Erasure</th>
                    <th>Requested At</th>
                    <th>Status</th>
                    <th className="pe-3 text-end">Admin Action</th>
                  </tr>
                </thead>
                <tbody>
                  {erasureRequests.map((req) => (
                    <tr key={req.id}>
                      <td className="ps-3 fw-bold text-dark">{req.guest_name || req.name || 'Guest User'}</td>
                      <td className="font-monospace text-muted small">{req.email || req.contact || 'N/A'}</td>
                      <td className="small text-secondary">{req.reason || 'User requested account closure'}</td>
                      <td className="small text-muted">{new Date(req.requested_at || req.createdAt).toLocaleString()}</td>
                      <td>
                        <span className={`badge ${req.status === 'Completed' ? 'bg-success' : 'bg-warning text-dark'} px-2.5 py-1`}>
                          {req.status || 'Pending'}
                        </span>
                      </td>
                      <td className="pe-3 text-end">
                        {req.status !== 'Completed' ? (
                          <button
                            type="button"
                            className="btn btn-danger btn-sm fw-semibold shadow-sm d-inline-flex align-items-center gap-1"
                            disabled={actioningId === req.id}
                            onClick={() => handleProcessErasure(req.id)}
                          >
                            {actioningId === req.id ? (
                              <span className="spinner-border spinner-border-sm" role="status" />
                            ) : (
                              <i className="bi bi-trash-fill" />
                            )}
                            Anonymize &amp; Erase PII
                          </button>
                        ) : (
                          <span className="text-muted small">
                            <i className="bi bi-check-all text-success me-1"></i> Erased &amp; Audited
                          </span>
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
        /* Tab 2: Profile Merge Queue */
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
          <h5 className="fw-bold mb-3 border-bottom pb-2 text-dark d-flex align-items-center justify-content-between">
            <span>👥 Duplicate Guest Profile Consolidation Queue</span>
            <span className="badge bg-light text-dark border fw-normal extra-small">De-duplication Engine</span>
          </h5>
          {loading ? (
            <div className="text-center py-5 text-muted small">
              <div className="spinner-border spinner-border-sm text-primary mb-2"></div>
              <div>Loading merge queue...</div>
            </div>
          ) : mergeQueue.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-person-check-fill display-4 text-primary mb-2 d-block" />
              <h6 className="fw-bold text-dark">No Duplicate Profile Matches Pending</h6>
              <p className="small m-0">All guest record duplicates have been consolidated or marked separate.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light text-uppercase small text-muted">
                  <tr>
                    <th className="ps-3">Primary Target Profile</th>
                    <th>Duplicate Match Found</th>
                    <th>Match Criteria</th>
                    <th>Status</th>
                    <th className="pe-3 text-end">Consolidation Action</th>
                  </tr>
                </thead>
                <tbody>
                  {mergeQueue.map((item) => (
                    <tr key={item.id}>
                      <td className="ps-3 fw-bold text-primary">{item.primary_name}</td>
                      <td className="fw-bold text-dark">{item.duplicate_name}</td>
                      <td><span className="badge bg-light text-dark border">{item.match_reason}</span></td>
                      <td>
                        <span className={`badge ${item.status === 'Merged' ? 'bg-success' : item.status === 'Separated' ? 'bg-secondary' : 'bg-warning text-dark'} px-2.5 py-1`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="pe-3 text-end">
                        {item.status === 'Pending' ? (
                          <div className="d-flex justify-content-end gap-2">
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm fw-semibold"
                              disabled={actioningId === item.id}
                              onClick={() => handleSeparateProfiles(item.id)}
                            >
                              Keep Separate
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm fw-semibold shadow-sm d-inline-flex align-items-center gap-1"
                              disabled={actioningId === item.id}
                              onClick={() => handleMergeProfiles(item.id)}
                            >
                              {actioningId === item.id ? (
                                <span className="spinner-border spinner-border-sm" role="status" />
                              ) : (
                                <i className="bi bi-person-check-fill" />
                              )}
                              Merge Profiles
                            </button>
                          </div>
                        ) : item.status === 'Merged' ? (
                          <span className="text-success small fw-semibold">
                            <i className="bi bi-check-circle-fill me-1"></i> Merged
                          </span>
                        ) : (
                          <span className="text-muted small fw-semibold">
                            <i className="bi bi-slash-circle me-1"></i> Kept Separate
                          </span>
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
