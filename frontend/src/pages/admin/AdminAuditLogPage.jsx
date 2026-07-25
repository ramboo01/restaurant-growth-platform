import { useState } from 'react';

function AdminAuditLogPage() {
  const [logs, setLogs] = useState([
    { id: 1, action: 'MERGE_PROFILES', user: 'admin@platform.com', details: 'Merged Guest ID #104 into #309 (Card Hash conflict resolved)', time: '5 min ago' },
    { id: 2, action: 'SUSPEND_LOCATION', user: 'system_monitor', details: 'Suspended West Loop Yelp Sync (5 consecutive timeout failures)', time: '2 hrs ago' },
    { id: 3, action: 'RESET_PASSWORD', user: 'support@platform.com', details: 'Triggered password reset link for merchant admin (taco_express)', time: '4 hrs ago' },
    { id: 4, action: 'EXPORT_GUESTS', user: 'owner@test.com', details: 'Exported Downtown Flagship guest list (400 profiles)', time: '1 day ago' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold mb-1">
            <i className="bi bi-journal-text text-dark me-2"></i> Platform Audit Trail
          </h2>
          <p className="text-muted mb-0">Immutable, chronological logs tracking all platform actions, security overrides, and compliance activities.</p>
        </div>
        <input 
          type="text" 
          className="form-control w-auto" 
          placeholder="Filter audit logs..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Logs Card */}
      <div className="card border-0 shadow-sm rounded-3">
        <div className="card-header bg-white border-0 py-3">
          <h5 className="fw-bold mb-0">Immutable Security Log</h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Timestamp</th>
                  <th>Action Category</th>
                  <th>Actor Email</th>
                  <th>Detailed Log Payload</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.id}>
                    <td className="text-muted small">{log.time}</td>
                    <td>
                      <span className="badge bg-secondary bg-opacity-10 text-dark small">{log.action}</span>
                    </td>
                    <td className="fw-semibold small">{log.user}</td>
                    <td className="text-muted small">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminAuditLogPage;
