import { useState, useEffect } from 'react';
import api from '../../services/api.js';

export default function AdminPrivacyConsolePage() {
  const [erasureRequests, setErasureRequests] = useState([]);
  const [mergeQueue, setMergeQueue] = useState([]);
  const [graphCandidates, setGraphCandidates] = useState([]);
  const [mergeHistory, setMergeHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('graph');
  const [message, setMessage] = useState('');
  const [actioningId, setActioningId] = useState(null);

  useEffect(() => {
    fetchPrivacyData();
  }, []);

  async function fetchPrivacyData() {
    try {
      setLoading(true);
      const [res, candidatesRes, historyRes] = await Promise.all([
        api.get('/api/admin/privacy/requests').catch(() => null),
        api.get('/api/admin/guest-graph/candidates').catch(() => null),
        api.get('/api/admin/guest-graph/history').catch(() => null)
      ]);

      if (res?.data?.data) {
        setErasureRequests(res.data.data.erasureRequests || []);
        setMergeQueue(res.data.data.mergeQueue || []);
      }
      if (candidatesRes?.data?.data) {
        setGraphCandidates(candidatesRes.data.data);
      }
      if (historyRes?.data?.data) {
        setMergeHistory(historyRes.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch privacy console data:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleReviewCandidate = async (candidateId, action) => {
    try {
      setMessage('');
      setActioningId(candidateId);
      const res = await api.post('/api/admin/guest-graph/review-candidate', {
        candidateId,
        action,
        reviewNote: `Admin ${action.toLowerCase()}d merge candidate`
      });
      if (res?.data?.message) {
        setMessage(`🎉 ${res.data.message}`);
        await fetchPrivacyData();
      }
    } catch (err) {
      console.error(err);
      setMessage(`❌ ${err.response?.data?.message || 'Failed to review candidate.'}`);
    } finally {
      setActioningId(null);
    }
  };

  const handleRevertMerge = async (historyId) => {
    try {
      setMessage('');
      setActioningId(historyId);
      const res = await api.post('/api/admin/guest-graph/revert-merge', {
        historyId,
        revertReason: 'Admin manually requested revert within 30-day window'
      });
      if (res?.data?.message) {
        setMessage(`🎉 ${res.data.message}`);
        await fetchPrivacyData();
      }
    } catch (err) {
      console.error(err);
      setMessage(`❌ ${err.response?.data?.message || 'Failed to revert merge.'}`);
    } finally {
      setActioningId(null);
    }
  };

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

  const pendingErasureCount = erasureRequests.filter(r => r.status === 'Pending').length;
  const pendingCandidatesCount = graphCandidates.length;

  return (
    <div className="container-fluid py-4">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold m-0 text-dark">
            <i className="bi bi-shield-lock-fill text-danger me-2"></i> Guest Graph Intelligence &amp; Privacy Console
          </h2>
          <p className="text-secondary small m-0">
            Probabilistic identity resolution (85% auto-merge gate), admin review queue, 30-day reversible merges, and GDPR Right-to-be-forgotten.
          </p>
        </div>
        <button type="button" className="btn btn-outline-secondary btn-sm fw-semibold" onClick={fetchPrivacyData}>
          <i className="bi bi-arrow-clockwise me-1" /> Refresh Graph Queue
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
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white d-flex flex-row align-items-center gap-3">
            <div className="bg-primary bg-opacity-10 text-primary p-3 rounded-circle">
              <i className="bi bi-diagram-3-fill fs-3"></i>
            </div>
            <div>
              <div className="fw-bold fs-4 text-dark">{pendingCandidatesCount}</div>
              <div className="text-muted small">Pending Identity Review Candidates (50-84%)</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white d-flex flex-row align-items-center gap-3">
            <div className="bg-success bg-opacity-10 text-success p-3 rounded-circle">
              <i className="bi bi-check-all fs-3"></i>
            </div>
            <div>
              <div className="fw-bold fs-4 text-dark">{mergeHistory.length}</div>
              <div className="text-muted small">Completed Merges (Reversible 30 Days)</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white d-flex flex-row align-items-center gap-3">
            <div className="bg-danger bg-opacity-10 text-danger p-3 rounded-circle">
              <i className="bi bi-shield-x fs-3"></i>
            </div>
            <div>
              <div className="fw-bold fs-4 text-dark">{pendingErasureCount}</div>
              <div className="text-muted small">Pending GDPR PII Erasure Requests</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <ul className="nav nav-tabs border-bottom mb-4">
        <li className="nav-item">
          <button
            className={`nav-link border-0 fw-bold ${activeTab === 'graph' ? 'active text-primary border-bottom border-primary border-3' : 'text-secondary'}`}
            onClick={() => setActiveTab('graph')}
          >
            <i className="bi bi-diagram-3 me-2" /> Probabilistic Review Queue ({graphCandidates.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link border-0 fw-bold ${activeTab === 'history' ? 'active text-success border-bottom border-success border-3' : 'text-secondary'}`}
            onClick={() => setActiveTab('history')}
          >
            <i className="bi bi-clock-history me-2" /> 30-Day Reversible Merge History ({mergeHistory.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link border-0 fw-bold ${activeTab === 'erasure' ? 'active text-danger border-bottom border-danger border-3' : 'text-secondary'}`}
            onClick={() => setActiveTab('erasure')}
          >
            <i className="bi bi-shield-x me-2" /> GDPR Erasure ({erasureRequests.length})
          </button>
        </li>
      </ul>

      {/* Tab 1: Probabilistic Review Queue */}
      {activeTab === 'graph' && (
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
          <h5 className="fw-bold mb-3 border-bottom pb-2 text-dark d-flex align-items-center justify-content-between">
            <span>🧠 Probabilistic Match Review Queue (50% – 84% Confidence)</span>
            <span className="badge bg-primary bg-opacity-10 text-primary border border-primary fw-normal extra-small">Levenshtein + Card Hash + Device Matching</span>
          </h5>
          {loading ? (
            <div className="text-center py-5 text-muted small">
              <div className="spinner-border spinner-border-sm text-primary mb-2"></div>
              <div>Analyzing guest match graph...</div>
            </div>
          ) : graphCandidates.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-check-circle display-4 text-success mb-2 d-block" />
              <h6 className="fw-bold text-dark">No Low-Confidence Merge Candidates Pending Review</h6>
              <p className="small m-0">All high-confidence matches (&ge;85%) were auto-merged instantly by the background engine.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light text-uppercase small text-muted">
                  <tr>
                    <th className="ps-3">Candidate Profile</th>
                    <th>Existing Match Profile</th>
                    <th>Confidence Score</th>
                    <th>Match Indicators</th>
                    <th className="pe-3 text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {graphCandidates.map((c) => (
                    <tr key={c.id}>
                      <td className="ps-3">
                        <div className="fw-bold text-dark">{c.candidateName}</div>
                        <div className="text-muted small">{c.candidatePhone || c.candidateEmail}</div>
                        <div className="extra-small text-secondary">{c.candidateOrders} orders • ${Number(c.candidateSpend || 0).toFixed(2)}</div>
                      </td>
                      <td>
                        <div className="fw-bold text-primary">{c.existingName}</div>
                        <div className="text-muted small">{c.existingPhone || c.existingEmail}</div>
                        <div className="extra-small text-secondary">{c.existingOrders} orders • ${Number(c.existingSpend || 0).toFixed(2)}</div>
                      </td>
                      <td>
                        <span className={`badge bg-${Number(c.confidenceScore) >= 0.7 ? 'warning text-dark' : 'secondary'} px-2.5 py-1 fs-6 fw-bold`}>
                          {(Number(c.confidenceScore) * 100).toFixed(0)}% Match
                        </span>
                      </td>
                      <td>
                        <div className="small text-secondary">{c.matchReasons || 'Name & Activity similarity'}</div>
                      </td>
                      <td className="pe-3 text-end">
                        <div className="d-flex justify-content-end gap-2">
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm fw-semibold"
                            disabled={actioningId === c.id}
                            onClick={() => handleReviewCandidate(c.id, 'REJECT')}
                          >
                            Keep Separate
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm fw-semibold shadow-sm d-inline-flex align-items-center gap-1"
                            disabled={actioningId === c.id}
                            onClick={() => handleReviewCandidate(c.id, 'APPROVE')}
                          >
                            {actioningId === c.id ? (
                              <span className="spinner-border spinner-border-sm" role="status" />
                            ) : (
                              <i className="bi bi-person-check-fill" />
                            )}
                            Approve Merge
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: 30-Day Reversible Merge History */}
      {activeTab === 'history' && (
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
          <h5 className="fw-bold mb-3 border-bottom pb-2 text-dark d-flex align-items-center justify-content-between">
            <span>↺ 30-Day Reversible Merge History Audit Log</span>
            <span className="badge bg-success bg-opacity-10 text-success border border-success fw-normal extra-small">Atomic Profile Rollback</span>
          </h5>
          {mergeHistory.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-clock-history display-4 text-secondary mb-2 d-block" />
              <h6 className="fw-bold text-dark">No Recent Profile Merges Recorded</h6>
              <p className="small m-0">When profiles are merged automatically or manually, they appear here for 30-day revertability.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light text-uppercase small text-muted">
                  <tr>
                    <th className="ps-3">History ID</th>
                    <th>Primary Customer ID</th>
                    <th>Secondary Customer ID</th>
                    <th>Merged By</th>
                    <th>Status</th>
                    <th>Merged At</th>
                    <th className="pe-3 text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {mergeHistory.map((h) => (
                    <tr key={h.id}>
                      <td className="ps-3 font-monospace fw-bold">#{h.id}</td>
                      <td className="fw-bold text-primary">Customer #{h.primaryCustomerId}</td>
                      <td className="fw-bold text-secondary">Customer #{h.secondaryCustomerId}</td>
                      <td>
                        <span className="badge bg-light text-dark border small">{h.mergedBy}</span>
                      </td>
                      <td>
                        <span className={`badge bg-${h.status === 'ACTIVE' ? 'success' : 'secondary'} px-2 py-1`}>
                          {h.status}
                        </span>
                      </td>
                      <td className="text-muted small">{new Date(h.mergedAt).toLocaleString()}</td>
                      <td className="pe-3 text-end">
                        {h.status === 'ACTIVE' ? (
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm py-1 fw-semibold"
                            disabled={actioningId === h.id}
                            onClick={() => handleRevertMerge(h.id)}
                          >
                            {actioningId === h.id ? (
                              <span className="spinner-border spinner-border-sm" role="status" />
                            ) : (
                              <i className="bi bi-arrow-counterclockwise me-1" />
                            )}
                            Revert Merge
                          </button>
                        ) : (
                          <span className="text-muted small">Reverted</span>
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

      {/* Tab 3: GDPR Erasure Requests */}
      {activeTab === 'erasure' && (
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
      )}
    </div>
  );
}
