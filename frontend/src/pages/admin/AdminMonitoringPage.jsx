import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';

function AdminMonitoringPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pingingId, setPingingId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState('success');

  const showToast = (msg, type = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(''), 5000);
  };

  const loadHealthStatus = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/admin/system/health');
      if (res?.data?.data) {
        setServices(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load system health:', err);
      showToast('❌ Failed to load health diagnostics.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealthStatus();
  }, []);

  const handleRunPingTest = async (srv) => {
    try {
      setPingingId(srv.id);
      const res = await api.post('/api/admin/system/ping', { id: srv.id, name: srv.name });
      if (res?.data?.message) {
        const isWarning = res.data.data?.status === 'NOT_INTEGRATED';
        showToast(res.data.message, isWarning ? 'warning' : 'success');
        // Update latency in list if returned
        if (res.data.data?.latency) {
          setServices(prev => prev.map(s =>
            s.id === srv.id ? { ...s, latency: res.data.data.latency, status: res.data.data.status } : s
          ));
        }
      }
    } catch (err) {
      console.error(err);
      showToast('❌ Ping test failed — service may be unreachable.', 'danger');
    } finally {
      setPingingId(null);
    }
  };

  // ── Status Badge Config ──
  const getStatusBadge = (status) => {
    switch (status) {
      case 'HEALTHY':
        return <span className="badge bg-success px-3 py-1 rounded-pill">✅ HEALTHY</span>;
      case 'CONFIGURED':
        return <span className="badge bg-primary px-3 py-1 rounded-pill">🔑 CONFIGURED</span>;
      case 'DEGRADED':
        return <span className="badge bg-warning text-dark px-3 py-1 rounded-pill">⚠️ DEGRADED</span>;
      case 'WARNING':
        return <span className="badge bg-warning text-dark px-3 py-1 rounded-pill">⚠️ WARNING</span>;
      case 'NOT_INTEGRATED':
        return <span className="badge bg-secondary px-3 py-1 rounded-pill">⚪ NOT SET UP</span>;
      default:
        return <span className="badge bg-secondary px-3 py-1 rounded-pill">{status}</span>;
    }
  };

  const connectedCount = services.filter(s => s.status === 'HEALTHY' || s.status === 'CONFIGURED').length;
  const notIntegratedCount = services.filter(s => s.status === 'NOT_INTEGRATED').length;

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            <i className="bi bi-hdd-network text-info me-2"></i> System Health &amp; Background Service Monitor
          </h2>
          <p className="text-muted mb-0">Real-time API uptime monitoring, database pool health, and relay circuit breakers.</p>
        </div>
        <button className="btn btn-outline-secondary btn-sm fw-semibold" onClick={loadHealthStatus}>
          <i className="bi bi-arrow-clockwise me-1" /> Refresh Diagnostics
        </button>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div className={`alert alert-${toastType} shadow-sm mb-4 d-flex align-items-start gap-2`} role="alert">
          <i className={`bi bi-${toastType === 'success' ? 'check-circle-fill' : toastType === 'warning' ? 'exclamation-triangle-fill' : 'x-circle-fill'} fs-5 mt-1`}></i>
          <div>{toastMsg}</div>
        </div>
      )}

      {/* Summary Cards */}
      {!loading && services.length > 0 && (
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3">
            <div className="card border-0 shadow-sm rounded-3 text-center py-3">
              <div className="fw-bold fs-3 text-success">{connectedCount}</div>
              <div className="text-muted small">Active Services</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card border-0 shadow-sm rounded-3 text-center py-3">
              <div className="fw-bold fs-3 text-secondary">{notIntegratedCount}</div>
              <div className="text-muted small">Not Integrated</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card border-0 shadow-sm rounded-3 text-center py-3">
              <div className="fw-bold fs-3 text-info">
                {services.find(s => s.id === 'db')?.latency || '—'}
              </div>
              <div className="text-muted small">DB Response</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card border-0 shadow-sm rounded-3 text-center py-3">
              <div className="fw-bold fs-3 text-dark">
                {services.find(s => s.id === 'db')?.uptime || '—'}
              </div>
              <div className="text-muted small">DB Uptime</div>
            </div>
          </div>
        </div>
      )}

      {/* Not Integrated Alert */}
      {!loading && notIntegratedCount > 0 && (
        <div className="alert alert-secondary d-flex align-items-start gap-3 mb-4 rounded-3">
          <i className="bi bi-info-circle-fill fs-5 text-secondary mt-1"></i>
          <div>
            <strong>{notIntegratedCount} service{notIntegratedCount > 1 ? 's' : ''} not yet integrated.</strong>
            <div className="small text-muted mt-1">
              Stripe, UberEats, DoorDash, and SMS gateways are external services that require real API credentials.
              Configure them in <Link to="/admin/ecosystem" className="text-decoration-underline">Ecosystem &amp; Channels Hub</Link> to activate them.
            </div>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-info" role="status">
              <span className="visually-hidden">Running health diagnostics...</span>
            </div>
            <div className="text-muted small mt-2">Pinging all infrastructure services...</div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light text-uppercase small text-muted">
                <tr>
                  <th className="ps-4">Infrastructure Service</th>
                  <th>Status</th>
                  <th>Description</th>
                  <th>Response Latency</th>
                  <th>30-Day Uptime</th>
                  <th className="pe-4 text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {services.map((srv) => (
                  <tr key={srv.id || srv.name} className={srv.status === 'NOT_INTEGRATED' ? 'table-secondary' : ''}>
                    <td className="ps-4">
                      <div className="fw-bold text-dark">{srv.name}</div>
                    </td>
                    <td>{getStatusBadge(srv.status)}</td>
                    <td className="text-muted small" style={{ maxWidth: '280px' }}>
                      {srv.description || '—'}
                    </td>
                    <td className={`font-monospace ${srv.latency === '—' ? 'text-secondary' : 'text-dark fw-semibold'}`}>
                      {srv.latency}
                    </td>
                    <td className={`fw-semibold ${srv.uptime === 'N/A' ? 'text-secondary' : 'text-dark'}`}>
                      {srv.uptime}
                    </td>
                    <td className="pe-4 text-end">
                      {srv.status === 'NOT_INTEGRATED' ? (
                        <Link
                          to="/admin/ecosystem"
                          className="btn btn-sm btn-outline-primary fw-semibold d-inline-flex align-items-center gap-1"
                        >
                          <i className="bi bi-gear"></i> Setup in Ecosystem
                        </Link>
                      ) : (
                        <button
                          className="btn btn-sm btn-outline-secondary fw-semibold d-inline-flex align-items-center gap-1"
                          disabled={pingingId === srv.id}
                          onClick={() => handleRunPingTest(srv)}
                        >
                          {pingingId === srv.id && (
                            <span className="spinner-border spinner-border-sm" role="status" />
                          )}
                          <i className="bi bi-reception-4"></i> Run Ping Test
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

      {/* Info Footer */}
      <div className="mt-3 text-muted small d-flex align-items-center gap-2">
        <i className="bi bi-shield-check text-success"></i>
        <span>MySQL and Socket.io statuses are measured in real-time from this server. External service statuses reflect their configuration state in the Ecosystem Hub.</span>
      </div>
    </div>
  );
}

export default AdminMonitoringPage;
