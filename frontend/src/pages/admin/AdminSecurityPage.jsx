import { useState, useEffect } from 'react';
import api from '../../services/api.js';

function AdminSecurityPage() {
  const [enforce2FA, setEnforce2FA] = useState(true);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, blocked: 0 });
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');
  const [actioningId, setActioningId] = useState(null);

  // Modal State for Blocking
  const [selectedUserForBlock, setSelectedUserForBlock] = useState(null);
  const [blockReason, setBlockReason] = useState('');

  const showToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(''), 4500);
  };

  const loadSecuritySettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/admin/security/settings');
      if (res?.data?.data) {
        setEnforce2FA(Boolean(res.data.data.enforce2FA));
        setUsers(res.data.data.users || []);
        if (res.data.data.stats) {
          setStats(res.data.data.stats);
        }
      }
    } catch (err) {
      console.error('Failed to load security settings:', err);
      showToast('❌ Failed to load user security data.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSecuritySettings();
  }, []);

  const handleToggle2FA = async (newValue) => {
    setEnforce2FA(newValue);
    try {
      const res = await api.post('/api/admin/security/2fa-toggle', { enforce2FA: newValue });
      if (res?.data?.message) {
        showToast(res.data.message, 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('❌ Failed to update 2FA policy.', 'danger');
    }
  };

  const handleOpenBlockModal = (user) => {
    setSelectedUserForBlock(user);
    setBlockReason('Violation of platform security terms');
  };

  const handleConfirmBlock = async () => {
    if (!selectedUserForBlock) return;
    try {
      setActioningId(selectedUserForBlock.id);
      const res = await api.post('/api/admin/security/block-user', {
        userId: selectedUserForBlock.id,
        reason: blockReason
      });

      if (res?.data?.message) {
        showToast(res.data.message, 'warning');
        setSelectedUserForBlock(null);
        setBlockReason('');
        await loadSecuritySettings();
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || '❌ Failed to block user.', 'danger');
    } finally {
      setActioningId(null);
    }
  };

  const handleUnblockUser = async (user) => {
    try {
      setActioningId(user.id);
      const res = await api.post('/api/admin/security/unblock-user', { userId: user.id });
      if (res?.data?.message) {
        showToast(res.data.message, 'success');
        await loadSecuritySettings();
      }
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || '❌ Failed to unblock user.', 'danger');
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            <i className="bi bi-shield-lock-fill text-danger me-2"></i> Security &amp; Access Governance
          </h2>
          <p className="text-muted mb-0">Manage live database user accounts, block/unblock access, and configure 2FA enforcement.</p>
        </div>
        <button className="btn btn-outline-secondary btn-sm fw-semibold" onClick={loadSecuritySettings}>
          <i className="bi bi-arrow-clockwise me-1" /> Refresh Accounts
        </button>
      </div>

      {/* Toast Alert */}
      {toastMsg && (
        <div className={`alert alert-${toastType} shadow-sm mb-4 d-flex align-items-start gap-2`} role="alert">
          <i className={`bi bi-${toastType === 'success' ? 'check-circle-fill' : toastType === 'warning' ? 'exclamation-triangle-fill' : 'x-circle-fill'} fs-5 mt-1`}></i>
          <div>{toastMsg}</div>
        </div>
      )}

      {/* Summary Cards */}
      {!loading && (
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-4">
            <div className="card border-0 shadow-sm rounded-3 text-center py-3 bg-white">
              <div className="fw-bold fs-3 text-dark">{stats.total}</div>
              <div className="text-muted small">Total Platform Accounts</div>
            </div>
          </div>
          <div className="col-6 col-md-4">
            <div className="card border-0 shadow-sm rounded-3 text-center py-3 bg-white">
              <div className="fw-bold fs-3 text-success">{stats.active}</div>
              <div className="text-muted small">Active Accounts</div>
            </div>
          </div>
          <div className="col-6 col-md-4">
            <div className="card border-0 shadow-sm rounded-3 text-center py-3 bg-white">
              <div className="fw-bold fs-3 text-danger">{stats.blocked}</div>
              <div className="text-muted small">Blocked Accounts</div>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Card */}
      <div className="card border-0 shadow-sm rounded-4 mb-4 bg-white">
        <div className="card-body p-4 d-flex justify-content-between align-items-center">
          <div>
            <h5 className="fw-bold mb-1">Mandatory Two-Factor Authentication (2FA)</h5>
            <p className="text-muted small mb-0">Enforce SMS / Authenticator app OTP for all Restaurant Owners &amp; Platform Admins upon login.</p>
          </div>
          <div className="form-check form-switch m-0">
            <input
              className="form-check-input"
              type="checkbox"
              style={{ width: '3em', height: '1.5em', cursor: 'pointer' }}
              checked={enforce2FA}
              onChange={(e) => handleToggle2FA(e.target.checked)}
            />
          </div>
        </div>
      </div>

      {/* User Governance Table */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
        <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
          <h5 className="fw-bold mb-0">Platform User Account Governance</h5>
          <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1">
            Live MySQL User Database
          </span>
        </div>
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-danger" role="status">
              <span className="visually-hidden">Loading accounts...</span>
            </div>
            <div className="text-muted small mt-2">Fetching live user records from database...</div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-person-x fs-2 d-block mb-2 text-secondary"></i>
            No user accounts found in database.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light text-uppercase small text-muted">
                <tr>
                  <th className="ps-4">User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Access Status</th>
                  <th>Member Since</th>
                  <th className="pe-4 text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className={u.isBlocked ? 'table-danger bg-opacity-10' : ''}>
                    <td className="ps-4">
                      <div className="fw-bold text-dark">{u.name || 'Unnamed User'}</div>
                      <div className="text-muted small">ID: #{u.id}</div>
                    </td>
                    <td className="font-monospace text-muted">{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'Admin' ? 'bg-danger' : u.role === 'Owner' ? 'bg-primary' : 'bg-secondary'} px-2 py-1`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      {u.isBlocked ? (
                        <div>
                          <span className="badge bg-danger px-3 py-1 rounded-pill">🔴 BLOCKED</span>
                          {u.blockedReason && (
                            <div className="text-danger small mt-1" style={{ fontSize: '0.75rem' }}>
                              Reason: {u.blockedReason}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="badge bg-success px-3 py-1 rounded-pill">🟢 ACTIVE</span>
                      )}
                    </td>
                    <td className="text-muted small">{u.memberSince}</td>
                    <td className="pe-4 text-end">
                      {u.isBlocked ? (
                        <button
                          className="btn btn-outline-success btn-sm fw-semibold d-inline-flex align-items-center gap-1"
                          disabled={actioningId === u.id}
                          onClick={() => handleUnblockUser(u)}
                        >
                          {actioningId === u.id ? (
                            <span className="spinner-border spinner-border-sm" role="status" />
                          ) : (
                            <i className="bi bi-unlock-fill"></i>
                          )}
                          Unblock User
                        </button>
                      ) : (
                        <button
                          className="btn btn-outline-danger btn-sm fw-semibold d-inline-flex align-items-center gap-1"
                          disabled={actioningId === u.id}
                          onClick={() => handleOpenBlockModal(u)}
                        >
                          {actioningId === u.id ? (
                            <span className="spinner-border spinner-border-sm" role="status" />
                          ) : (
                            <i className="bi bi-slash-circle"></i>
                          )}
                          Block Access
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Block Confirmation Modal */}
      {selectedUserForBlock && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-danger">
                  <i className="bi bi-slash-circle me-2"></i> Block User Account
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedUserForBlock(null)}
                ></button>
              </div>
              <div className="modal-body py-3">
                <p className="mb-2">
                  Are you sure you want to block <strong>{selectedUserForBlock.name}</strong> ({selectedUserForBlock.email})?
                </p>
                <div className="alert alert-warning py-2 small mb-3">
                  <i className="bi bi-exclamation-triangle me-1"></i>
                  Blocking will prevent this user from logging into the platform until unblocked by an admin.
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold small">Reason for Blocking</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Enter reason for blocking (e.g. Terms violation, Suspicious activity)..."
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button
                  type="button"
                  className="btn btn-light fw-semibold"
                  onClick={() => setSelectedUserForBlock(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger fw-semibold d-flex align-items-center gap-1"
                  disabled={actioningId === selectedUserForBlock.id}
                  onClick={handleConfirmBlock}
                >
                  {actioningId === selectedUserForBlock.id && (
                    <span className="spinner-border spinner-border-sm" role="status" />
                  )}
                  Confirm Block
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSecurityPage;
