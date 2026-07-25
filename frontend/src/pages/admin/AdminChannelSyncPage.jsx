import { useState } from 'react';

function AdminChannelSyncPage() {
  const [channels, setChannels] = useState([
    { id: 1, name: 'DoorDash Menu Sync', type: 'Delivery', status: 'Synced', lastSync: '3 min ago', latency: '42ms', failures: 0 },
    { id: 2, name: 'Uber Eats Price Sync', type: 'Delivery', status: 'Synced', lastSync: '12 min ago', latency: '68ms', failures: 0 },
    { id: 3, name: 'Google Business Listings', type: 'SEO / Profile', status: 'Synced', lastSync: '1 hr ago', latency: '120ms', failures: 0 },
    { id: 4, name: 'Yelp Rating Aggregator', type: 'SEO / Review', status: 'Failed', lastSync: '3 hrs ago', latency: 'timeout', failures: 5 },
  ]);

  const [toast, setToast] = useState('');

  const triggerRetry = (id) => {
    setChannels(prev => prev.map(ch => {
      if (ch.id === id) {
        return { ...ch, status: 'Synced', failures: 0, lastSync: 'Just now' };
      }
      return ch;
    }));
    setToast('Sync adapter reset successfully. Syncing catalog payloads...');
    setTimeout(() => setToast(''), 3000);
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            <i className="bi bi-diagram-3-fill text-primary me-2"></i> Channel Sync Health
          </h2>
          <p className="text-muted mb-0">Manage platform-wide API connections, delivery listings syncs, and system circuit-breakers.</p>
        </div>
      </div>

      {toast && (
        <div className="alert alert-success shadow-sm mb-4" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i> {toast}
        </div>
      )}

      {/* Sync Table */}
      <div className="card border-0 shadow-sm rounded-3">
        <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
          <h5 className="fw-bold mb-0">Active Integration Adapters</h5>
          <button className="btn btn-sm btn-primary" onClick={() => triggerRetry(4)}>
            <i className="bi bi-arrow-repeat me-1"></i> Sync All Channels
          </button>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Adapter Name</th>
                  <th>Category</th>
                  <th>Last Executed</th>
                  <th>Sync Latency</th>
                  <th>Consecutive Failures</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {channels.map(ch => (
                  <tr key={ch.id}>
                    <td>
                      <div className="fw-bold text-dark">{ch.name}</div>
                    </td>
                    <td>
                      <span className="badge bg-secondary bg-opacity-10 text-dark small">{ch.type}</span>
                    </td>
                    <td className="text-muted small">{ch.lastSync}</td>
                    <td className="text-muted small">{ch.latency}</td>
                    <td className="text-muted small">
                      {ch.failures > 0 ? (
                        <span className="text-danger fw-bold">{ch.failures} (Alert sent)</span>
                      ) : (
                        <span className="text-success">0</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge bg-${ch.status === 'Synced' ? 'success' : 'danger'} bg-opacity-10 text-${ch.status === 'Synced' ? 'success' : 'danger'} border border-${ch.status === 'Synced' ? 'success' : 'danger'} border-opacity-25 px-2`}>
                        {ch.status}
                      </span>
                    </td>
                    <td>
                      {ch.status === 'Failed' ? (
                        <button className="btn btn-outline-danger btn-sm py-1" onClick={() => triggerRetry(ch.id)}>
                          <i className="bi bi-arrow-repeat me-1"></i> Retry Sync
                        </button>
                      ) : (
                        <button className="btn btn-outline-secondary btn-sm py-1" disabled>
                          <i className="bi bi-check-lg me-1"></i> Healthy
                        </button>
                      )}
                    </td>
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

export default AdminChannelSyncPage;
