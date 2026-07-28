import { useState } from 'react';

function AdminSecurityPage() {
  const [enforce2FA, setEnforce2FA] = useState(true);
  const [sessions] = useState([
    { id: 'sess_1', user: 'Carlos Mendez (Owner)', ip: '192.168.1.45', device: 'Chrome / Windows', location: 'Chicago, USA', lastActive: '2 mins ago' },
    { id: 'sess_2', user: 'Alex Johnson (Driver)', ip: '172.56.12.89', device: 'Safari / iPhone', location: 'Chicago, USA', lastActive: 'Just now' },
  ]);

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            <i className="bi bi-shield-lock-fill text-danger me-2"></i> Security & Session Governance
          </h2>
          <p className="text-muted mb-0">Platform authentication security, 2FA enforcement, and active session management.</p>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body p-4 d-flex justify-content-between align-items-center">
          <div>
            <h5 className="fw-bold mb-1">Mandatory Two-Factor Authentication (2FA)</h5>
            <p className="text-muted small mb-0">Enforce SMS / Authenticator app OTP for all Restaurant Owners & Platform Admins upon login.</p>
          </div>
          <div className="form-check form-switch m-0">
            <input
              className="form-check-input"
              type="checkbox"
              style={{ width: '3em', height: '1.5em' }}
              checked={enforce2FA}
              onChange={(e) => setEnforce2FA(e.target.checked)}
            />
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="card-header bg-white border-0 py-3">
          <h5 className="fw-bold mb-0">Active Platform User Sessions</h5>
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-uppercase small text-muted">
              <tr>
                <th className="ps-4">User</th>
                <th>IP Address</th>
                <th>Device / OS</th>
                <th>Location</th>
                <th>Last Active</th>
                <th className="pe-4 text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => (
                <tr key={s.id}>
                  <td className="ps-4 fw-bold text-dark">{s.user}</td>
                  <td className="font-monospace text-muted">{s.ip}</td>
                  <td>{s.device}</td>
                  <td>{s.location}</td>
                  <td className="text-muted small">{s.lastActive}</td>
                  <td className="pe-4 text-end">
                    <button className="btn btn-outline-danger btn-sm fw-semibold" onClick={() => alert(`Revoked session for ${s.user}`)}>
                      Revoke Session
                    </button>
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

export default AdminSecurityPage;
