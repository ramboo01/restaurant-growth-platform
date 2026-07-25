import { useState } from 'react';

const AUDIT_LOG = [
  { id: 1, actor: 'admin@platform.com', role: 'Admin', action: 'GUEST_MERGE', details: 'Merged guest #440 into #441 (85% confidence)', time: '2 min ago', severity: 'info' },
  { id: 2, actor: 'admin@platform.com', role: 'Admin', action: 'PROFILE_CORRECTION', details: "Fixed email format for guest #322 (malformed '@')", time: '18 min ago', severity: 'info' },
  { id: 3, actor: 'support@platform.com', role: 'Admin', action: 'GBP_RECLAIM_ASSIST', details: 'Guided ownership transfer for RestruRent West Loop Google Business Profile', time: '1 hr ago', severity: 'warning' },
  { id: 4, actor: 'admin@platform.com', role: 'Admin', action: 'CIRCUIT_BREAKER_RESET', details: 'Manual reset of Yelp sync adapter after 5 consecutive failures', time: '3 hrs ago', severity: 'warning' },
  { id: 5, actor: 'system', role: 'System', action: 'NIGHTLY_MERGE_SCAN', details: '1,240 profiles scanned. 3 auto-merged (>85%), 7 queued for manual review.', time: '6 hrs ago', severity: 'success' },
];

const MERGE_QUEUE = [
  { id: 1, guest1: { name: 'Sarah J.', email: 'sarah.j@email.com', orders: 12 }, guest2: { name: 'S. Jenkins', email: 'sjenkins@gmail.com', orders: 4 }, confidence: 78, reason: 'Same card hash + similar name' },
  { id: 2, guest1: { name: 'Mike Chang', email: 'mike.c@work.com', orders: 8 }, guest2: { name: 'Michael Chang', email: 'mchang@gmail.com', orders: 21 }, confidence: 82, reason: 'Same phone (E.164 match) + name variant' },
];

const CHANNEL_STATUS = [
  { channel: 'DoorDash Menu Sync', location: 'Downtown Flagship', status: 'Synced', lastSync: '4 min ago', color: 'success' },
  { channel: 'Uber Eats Menu Sync', location: 'Downtown Flagship', status: 'Synced', lastSync: '4 min ago', color: 'success' },
  { channel: 'Yelp Listing', location: 'West Loop Branch', status: 'Failed', lastSync: '3 hrs ago', color: 'danger' },
  { channel: 'Google Business Profile', location: 'Downtown Flagship', status: 'Synced', lastSync: '10 min ago', color: 'success' },
];

function AdminHomePage() {
  const [mergeQueue, setMergeQueue] = useState(MERGE_QUEUE);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleMergeAction = (id, action) => {
    setMergeQueue(prev => prev.filter(m => m.id !== id));
    showToast(action === 'merge' 
      ? 'Profiles merged successfully. Action is reversible for 30 days.' 
      : 'Profiles kept separate. Decision is logged.'
    );
  };

  const severityColors = {
    info: 'primary',
    warning: 'warning',
    success: 'success',
    danger: 'danger'
  };

  return (
    <div className="container-fluid py-4">
      <div className="mb-4">
        <h2 className="fw-bold mb-1">
          <i className="bi bi-speedometer2 text-danger me-2"></i> Platform Admin Dashboard
        </h2>
        <p className="text-muted mb-0">Full technical access for support and data-quality operations. All actions are audit-logged.</p>
      </div>

      {toast && (
        <div className="alert alert-success shadow-sm mb-4" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i> {toast}
        </div>
      )}

      {/* KPI Strip */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Pending Merges', value: mergeQueue.length, icon: 'bi-people-fill', color: 'warning' },
          { label: 'Active Channels', value: CHANNEL_STATUS.filter(c => c.status === 'Synced').length, icon: 'bi-plug-fill', color: 'success' },
          { label: 'Failed Syncs', value: CHANNEL_STATUS.filter(c => c.status === 'Failed').length, icon: 'bi-exclamation-triangle-fill', color: 'danger' },
          { label: 'Audit Events Today', value: AUDIT_LOG.length, icon: 'bi-journal-text', color: 'primary' },
        ].map(stat => (
          <div className="col-6 col-lg-3" key={stat.label}>
            <div className={`card border-0 shadow-sm rounded-3 border-start border-3 border-${stat.color}`}>
              <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="text-muted small text-uppercase fw-semibold">{stat.label}</div>
                    <div className={`fs-2 fw-bold text-${stat.color}`}>{stat.value}</div>
                  </div>
                  <i className={`bi ${stat.icon} fs-2 text-${stat.color} opacity-25`}></i>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4">
        {/* Merge Review Queue */}
        <div className="col-12 col-xl-7">
          <div className="card border-0 shadow-sm rounded-3 mb-4">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="fw-bold mb-0">
                <i className="bi bi-people text-warning me-2"></i> Guest Merge Review Queue
              </h5>
              <div className="text-muted small">Profiles below 85% confidence — requires manual review before merging.</div>
            </div>
            <div className="card-body">
              {mergeQueue.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <i className="bi bi-check-circle fs-2 d-block text-success mb-2"></i>
                  No pending merges — all profiles resolved!
                </div>
              ) : mergeQueue.map(item => (
                <div key={item.id} className="border rounded-3 p-3 mb-3">
                  <div className="d-flex justify-content-between mb-2 align-items-center">
                    <span className="badge bg-warning bg-opacity-15 text-warning border border-warning border-opacity-25 px-2">
                      {item.confidence}% Match Confidence
                    </span>
                    <span className="text-muted small">{item.reason}</span>
                  </div>
                  <div className="row g-2 align-items-center mb-3">
                    <div className="col-5 p-2 bg-light rounded-3 text-center">
                      <div className="fw-bold small">{item.guest1.name}</div>
                      <div className="text-muted small">{item.guest1.email}</div>
                      <div className="text-muted small">{item.guest1.orders} orders</div>
                    </div>
                    <div className="col-2 text-center text-muted">
                      <i className="bi bi-arrow-left-right fs-4"></i>
                    </div>
                    <div className="col-5 p-2 bg-light rounded-3 text-center">
                      <div className="fw-bold small">{item.guest2.name}</div>
                      <div className="text-muted small">{item.guest2.email}</div>
                      <div className="text-muted small">{item.guest2.orders} orders</div>
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <button 
                      className="btn btn-primary btn-sm flex-fill fw-semibold"
                      onClick={() => handleMergeAction(item.id, 'merge')}
                    >
                      <i className="bi bi-link me-1"></i> Merge Profiles
                    </button>
                    <button 
                      className="btn btn-outline-secondary btn-sm flex-fill"
                      onClick={() => handleMergeAction(item.id, 'separate')}
                    >
                      <i className="bi bi-x-lg me-1"></i> Keep Separate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Channel Sync Health */}
          <div className="card border-0 shadow-sm rounded-3">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="fw-bold mb-0">
                <i className="bi bi-diagram-3 text-primary me-2"></i> Channel Sync Health
              </h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Channel</th>
                      <th>Location</th>
                      <th>Last Sync</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {CHANNEL_STATUS.map((ch, idx) => (
                      <tr key={idx}>
                        <td className="fw-semibold small">{ch.channel}</td>
                        <td className="text-muted small">{ch.location}</td>
                        <td className="text-muted small">{ch.lastSync}</td>
                        <td>
                          <span className={`badge bg-${ch.color} bg-opacity-10 text-${ch.color} border border-${ch.color} border-opacity-25 small`}>
                            <i className="bi bi-circle-fill me-1" style={{ fontSize: '0.5rem' }}></i> {ch.status}
                          </span>
                        </td>
                        <td>
                          {ch.status === 'Failed' && (
                            <button className="btn btn-outline-danger btn-sm">
                              <i className="bi bi-arrow-repeat me-1"></i>Retry
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

        {/* Audit Log */}
        <div className="col-12 col-xl-5">
          <div className="card border-0 shadow-sm rounded-3 h-100">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="fw-bold mb-0">
                <i className="bi bi-journal-text text-dark me-2"></i> Audit Log
              </h5>
              <div className="text-muted small">Every admin action is logged with actor, timestamp, and reason.</div>
            </div>
            <div className="card-body p-3">
              <div className="d-flex flex-column gap-3">
                {AUDIT_LOG.map(log => (
                  <div key={log.id} className="d-flex gap-3 align-items-start p-3 bg-light rounded-3">
                    <div className={`bg-${severityColors[log.severity]} bg-opacity-10 p-2 rounded-3 text-${severityColors[log.severity]}`}>
                      <i className="bi bi-journal-check fs-6"></i>
                    </div>
                    <div className="flex-grow-1 min-width-0">
                      <div className="d-flex justify-content-between">
                        <span className="fw-bold small text-dark">{log.action}</span>
                        <span className="text-muted small">{log.time}</span>
                      </div>
                      <div className="text-muted small text-truncate">{log.details}</div>
                      <div className="text-muted small">
                        <i className="bi bi-person me-1"></i>{log.actor} 
                        <span className="badge bg-secondary bg-opacity-15 text-secondary ms-1 small">{log.role}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminHomePage;
