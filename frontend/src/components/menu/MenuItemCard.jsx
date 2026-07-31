import { Link } from 'react-router-dom';
import { menuChannels } from '../../data/menuData.js';
import { formatSyncStatus } from './SyncHealthSummary.jsx';
import { getImageUrl } from '../../utils/imageUtils.js';

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

function MenuItemCard({ item, categoryName, onEdit, onDelete }) {
  const sync = getSyncSummary(item.channels);
  const imgUrl = getImageUrl(item.imageUrl);

  return (
    <article className="card border-0 owner-card menu-item-card">
      <div className="card-body">
        <div className="d-flex flex-column flex-lg-row gap-3">
          <div className="menu-item-visual overflow-hidden p-0" aria-hidden="true">
            {imgUrl ? (
              <img src={imgUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              item.imagePlaceholder
            )}
          </div>
          <div className="flex-grow-1">
            <div className="d-flex flex-column flex-xl-row justify-content-between gap-2">
              <div>
                <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                  <h3 className="h6 mb-0">{item.name}</h3>
                  <span className={`badge ${item.is86d ? 'text-bg-danger' : 'text-bg-success'}`}>
                    {item.is86d ? "86'd" : 'Available'}
                  </span>
                </div>
                <p className="text-secondary small mb-2">{item.description}</p>
              </div>
              <div className="text-xl-end">
                <div className="fw-semibold">${(item.basePrice || item.price || 0).toFixed(2)}</div>
                <div className="text-secondary small">{categoryName}</div>
              </div>
            </div>

            <div className="d-flex flex-column flex-sm-row justify-content-between gap-3 align-items-sm-center">
              <div className="d-flex flex-wrap gap-2">
                {item.allergenTags.length ? (
                  item.allergenTags.map((tag) => (
                    <span className="badge text-bg-light border" key={tag}>
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="badge text-bg-light border">No listed allergens</span>
                )}
              </div>

              <div className="d-flex flex-wrap align-items-center gap-2">
                <span className={`menu-status-pill menu-status-${sync.state}`}>
                  <span className="menu-status-dot" aria-hidden="true" />
                  {sync.label}
                </span>
                {sync.state !== 'synced' ? (
                  <span className="text-secondary small">{formatSyncStatus(sync.state)} sync state</span>
                ) : null}
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => (onEdit ? onEdit(item) : null)}
                  type="button"
                >
                  Edit item
                </button>
                <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(item)} type="button">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default MenuItemCard;
