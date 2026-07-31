import { useState, useEffect } from 'react';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('All');

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/audit-logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.data) {
        setLogs(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch platform audit logs:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredLogs = logs.filter((log) => filterRole === 'All' || log.user_role === filterRole);

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold m-0 text-dark">
            📜 Platform Action Audit Logs Console (ADM-007)
          </h2>
          <p className="text-secondary small m-0">
            Immutable system event ledger: Track administrative actions, PII erasures, payout releases, and security events.
          </p>
        </div>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={fetchLogs}>
          <i className="bi bi-arrow-clockwise me-1" /> Refresh Audit Trail
        </button>
      </div>

      <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
        <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
          <h5 className="fw-bold m-0 text-dark">
            🔒 Audit Trail History ({filteredLogs.length} Events)
          </h5>
          <div className="d-flex align-items-center gap-2">
            <span className="small text-muted fw-semibold">Filter Role:</span>
            <select
              className="form-select form-select-sm w-auto"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="All">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Owner">Owner</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-4 text-muted small">Loading audit logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-4 text-muted small">No audit log records found.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Timestamp</th>
                  <th>User Role</th>
                  <th>Action Type</th>
                  <th>Event Description</th>
                  <th>Origin IP</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="small text-muted font-monospace">
                      {new Date(log.created_at || log.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <span className={`badge ${log.user_role === 'Admin' ? 'bg-danger' : 'bg-primary'}`}>
                        {log.user_role}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border font-monospace">
                        {log.action_type}
                      </span>
                    </td>
                    <td className="fw-semibold text-dark">{log.description}</td>
                    <td className="small text-muted font-monospace">{log.ip_address || '127.0.0.1'}</td>
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
