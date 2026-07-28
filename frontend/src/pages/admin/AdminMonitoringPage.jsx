import { useState } from 'react';

function AdminMonitoringPage() {
  const [services] = useState([
    { name: 'MySQL Database Pool', status: 'HEALTHY', latency: '4ms', uptime: '99.99%' },
    { name: 'Socket.io WebSocket Server', status: 'HEALTHY', latency: '12ms', uptime: '99.95%' },
    { name: 'Stripe Payment Gateway', status: 'HEALTHY', latency: '120ms', uptime: '99.98%' },
    { name: 'UberEats / DoorDash API Relay', status: 'HEALTHY', latency: '145ms', uptime: '99.90%' },
    { name: 'SMS Delivery Gateway (Twilio)', status: 'WARNING', latency: '350ms', uptime: '98.50%' },
  ]);

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            <i className="bi bi-hdd-network text-info me-2"></i> System Health & Background Service Monitor
          </h2>
          <p className="text-muted mb-0">Real-time API uptime monitoring, database pool health, and relay circuit breakers.</p>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-uppercase small text-muted">
              <tr>
                <th className="ps-4">Infrastructure Service</th>
                <th>Status</th>
                <th>Response Latency</th>
                <th>30-Day Uptime</th>
                <th className="pe-4 text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {services.map((srv, idx) => (
                <tr key={idx}>
                  <td className="ps-4 fw-bold text-dark">{srv.name}</td>
                  <td>
                    <span className={`badge ${srv.status === 'HEALTHY' ? 'bg-success' : 'bg-warning text-dark'} px-3 py-1 rounded-pill`}>
                      {srv.status}
                    </span>
                  </td>
                  <td className="font-monospace text-muted">{srv.latency}</td>
                  <td className="fw-semibold text-dark">{srv.uptime}</td>
                  <td className="pe-4 text-end">
                    <button className="btn btn-sm btn-outline-secondary fw-semibold" onClick={() => alert(`Ping test initiated for ${srv.name}`)}>
                      Run Ping Test
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

export default AdminMonitoringPage;
