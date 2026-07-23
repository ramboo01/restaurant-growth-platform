const statusClassMap = {
  synced: 'menu-status-synced',
  pending: 'menu-status-pending',
  failed: 'menu-status-failed'
};

export function formatSyncStatus(status) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function SyncHealthSummary({ summary }) {
  return (
    <section className="card border-0 owner-card menu-sync-summary mb-4" aria-labelledby="sync-health-heading">
      <div className="card-body">
        <div className="d-flex flex-column flex-xl-row justify-content-between gap-3">
          <div>
            <p className="text-uppercase text-secondary small fw-semibold mb-1">Channel Sync</p>
            <h2 className="h5 mb-2" id="sync-health-heading">
              {summary.title}
            </h2>
            <div className="d-flex flex-wrap gap-2">
              <span className="badge text-bg-success">{summary.summary}</span>
              <span className="badge text-bg-danger">{summary.attention}</span>
            </div>
          </div>
          <div className="menu-sync-channel-list">
            {summary.channels.map((channel) => (
              <span className={`menu-status-pill ${statusClassMap[channel.status]}`} key={channel.name}>
                <span className="menu-status-dot" aria-hidden="true" />
                {channel.name} - {formatSyncStatus(channel.status)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default SyncHealthSummary;
