import { useState, useEffect } from 'react';
import api from '../../services/api.js';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/admin/audit-logs');
      if (res?.data?.data) {
        setLogs(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch platform audit logs:', err);
      setError('Failed to load audit logs from server.');
    } finally {
      setLoading(false);
    }
  }

  const filteredLogs = logs.filter((log) => {
    const matchesRole = filterRole === 'All' || log.user_role === filterRole;
    const matchesSearch =
      !searchTerm ||
      (log.action_type && log.action_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.description && log.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.user_role && log.user_role.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  const adminCount = logs.filter(l => l.user_role === 'Admin').length;
  const ownerCount = logs.filter(l => l.user_role === 'Owner').length;

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold m-0 text-dark d-flex align-items-center gap-2">
            <i className="bi bi-journal-text text-primary"></i> Platform Action Audit Logs Console (ADM-007)
          </h2>
          <p className="text-secondary small m-0">
            Immutable system event ledger: Track administrative actions, PII erasures, role changes, and security events.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm fw-semibold d-inline-flex align-items-center gap-1 shadow-sm"
          onClick={fetchLogs}
        >
          <i className="bi bi-arrow-clockwise" /> Refresh Audit Trail
        </button>
      </div>

      {error && (
        <div className="alert alert-danger shadow-sm py-2 px-3 mb-4">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>{error}
        </div>
      )}

      {/* Summary KPI Badges */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white d-flex flex-row align-items-center gap-3">
            <div className="bg-primary bg-opacity-10 text-primary p-3 rounded-circle">
              <i className="bi bi-shield-check fs-3"></i>
            </div>
            <div>
              <div className="fw-bold fs-4 text-dark">{logs.length}</div>
              <div className="text-muted small">Total Recorded Audit Events</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white d-flex flex-row align-items-center gap-3">
            <div className="bg-danger bg-opacity-10 text-danger p-3 rounded-circle">
              <i className="bi bi-person-badge fs-3"></i>
            </div>
            <div>
              <div className="fw-bold fs-4 text-dark">{adminCount}</div>
              <div className="text-muted small">Admin Platform Actions</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white d-flex flex-row align-items-center gap-3">
            <div className="bg-info bg-opacity-10 text-info p-3 rounded-circle">
              <i className="bi bi-shop fs-3"></i>
            </div>
            <div>
              <div className="fw-bold fs-4 text-dark">{ownerCount}</div>
              <div className="text-muted small">Restaurant Owner Actions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Audit Log Card */}
      <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3 border-bottom pb-3">
          <h5 className="fw-bold m-0 text-dark d-flex align-items-center gap-2">
            <i className="bi bi-lock-fill text-danger"></i> Audit Trail History ({filteredLogs.length} Events)
          </h5>

          {/* Filters & Search */}
          <div className="d-flex flex-wrap align-items-center gap-2">
            <div className="input-group input-group-sm" style={{ maxWidth: '240px' }}>
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-select-sm form-control border-start-0 ps-0"
                placeholder="Search action or text..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="d-flex align-items-center gap-1.5">
              <span className="small text-muted fw-semibold">Role:</span>
              <select
                className="form-select form-select-sm w-auto fw-semibold"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="All">All Roles</option>
                <option value="Admin">Admin Only</option>
                <option value="Owner">Owner Only</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5 text-muted small">
            <div className="spinner-border spinner-border-sm text-primary mb-2"></div>
            <div>Loading audit log records from database...</div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-journal-x display-4 text-secondary mb-2 d-block"></i>
            <h6 className="fw-bold text-dark">No Audit Events Found</h6>
            <p className="small m-0">No records match the selected role or search filter.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light text-uppercase small text-muted">
                <tr>
                  <th className="ps-3">Timestamp</th>
                  <th>User Role</th>
                  <th>Action Type</th>
                  <th>Event Description</th>
                  <th className="pe-3 text-end">Origin IP</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="ps-3 small text-muted font-monospace">
                      {new Date(log.created_at || log.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <span className={`badge ${log.user_role === 'Admin' ? 'bg-danger' : log.user_role === 'Owner' ? 'bg-primary' : 'bg-secondary'} px-2.5 py-1`}>
                        {log.user_role}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border font-monospace px-2.5 py-1">
                        {log.action_type}
                      </span>
                    </td>
                    <td className="fw-semibold text-dark">{log.description}</td>
                    <td className="pe-3 text-end small text-muted font-monospace">
                      {log.ip_address || '127.0.0.1'}
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
