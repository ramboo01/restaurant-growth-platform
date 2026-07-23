import { menuChannels } from '../../data/menuData.js';

function getSyncSummary(channels) {
  const states = menuChannels.map((channel) => channels[channel]?.status ?? 'pending');
  const syncedCount = states.filter((status) => status === 'synced').length;
  const hasFailed = states.includes('failed');
  const hasPending = states.includes('pending');

  return {
    label: `${syncedCount}/${menuChannels.length} synced`,
    state: hasFailed ? 'failed' : hasPending ? 'pending' : 'synced'
  };
}

function AvailabilityItemCard({ categoryName, item, onToggle, syncState }) {
  const isUnavailable = item.is86d;
  const sync = getSyncSummary(item.channels);
  const isSyncing = syncState?.status === 'syncing';
  const syncComplete = syncState?.status === 'synced';

  return (
    <article className={`card border-0 owner-card availability-card ${isUnavailable ? 'is-86d' : ''}`}>
      <div className="card-body">
        <div className="d-flex flex-column gap-3 h-100">
          <div className="d-flex justify-content-between align-items-start gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <h2 className="h6 mb-0">{item.name}</h2>
                <span className={`badge ${isUnavailable ? 'text-bg-danger' : 'text-bg-success'}`}>
                  {isUnavailable ? "86'd" : 'Available'}
                </span>
              </div>
              <p className="text-secondary small mb-0">{categoryName}</p>
            </div>
            <div className="fw-semibold">${item.basePrice.toFixed(2)}</div>
          </div>

          <div className="d-flex flex-wrap gap-2">
            <span className={`menu-status-pill menu-status-${sync.state}`}>
              <span className="menu-status-dot" aria-hidden="true" />
              {sync.label}
            </span>
            {sync.state === 'failed' ? <span className="badge text-bg-danger">Sync warning</span> : null}
          </div>

          <div className="mt-auto">
            {isSyncing ? (
              <div className="alert alert-warning py-2 mb-3" role="status">
                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                Syncing availability...
              </div>
            ) : null}
            {syncComplete ? (
              <div className="alert alert-success py-2 mb-3" role="status">
                Availability synced to 5 channels.
              </div>
            ) : null}

            <button
              className={`btn btn-lg w-100 ${isUnavailable ? 'btn-success' : 'btn-danger'}`}
              disabled={isSyncing}
              onClick={() => onToggle(item)}
              type="button"
            >
              <i className={`bi ${isUnavailable ? 'bi-arrow-clockwise' : 'bi-slash-circle'} me-2`} aria-hidden="true" />
              {isUnavailable ? 'Restore item' : "Mark 86'd"}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default AvailabilityItemCard;
