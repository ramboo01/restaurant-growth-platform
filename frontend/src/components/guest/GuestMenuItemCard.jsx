import { getImageUrl } from '../../utils/imageUtils.js';

function GuestMenuItemCard({ categoryName, item, onViewItem }) {
  const isUnavailable = item.is86d || !item.isAvailable;
  const imgUrl = getImageUrl(item.imageUrl);

  return (
    <article className={`card border-0 guest-menu-card h-100 ${isUnavailable ? 'is-unavailable' : ''}`}>
      <div className="card-body d-flex flex-column">
        <div className="d-flex gap-3 mb-3">
          <div className="guest-item-visual overflow-hidden p-0" aria-hidden="true">
            {imgUrl ? (
              <img src={imgUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              item.imagePlaceholder
            )}
          </div>
          <div className="flex-grow-1">
            <div className="d-flex justify-content-between gap-2">
              <h3 className="h6 mb-1">{item.name}</h3>
              <span className="fw-semibold">${item.basePrice.toFixed(2)}</span>
            </div>
            <p className="text-secondary small mb-0">{categoryName}</p>
          </div>
        </div>
        <p className="text-secondary small mb-3">{item.description}</p>

        <div className="d-flex flex-wrap gap-2 mb-3">
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

        <div className="mt-auto d-flex flex-column gap-2">
          {isUnavailable ? (
            <span className="badge text-bg-secondary align-self-start">Currently unavailable</span>
          ) : (
            <span className="badge text-bg-success align-self-start">Available</span>
          )}
          <button
            className="btn btn-primary w-100"
            disabled={isUnavailable}
            onClick={() => onViewItem?.(item)}
            type="button"
          >
            View item
          </button>
        </div>
      </div>
    </article>
  );
}

export default GuestMenuItemCard;
