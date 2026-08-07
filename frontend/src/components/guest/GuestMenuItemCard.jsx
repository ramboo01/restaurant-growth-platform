import { getImageUrl } from '../../utils/imageUtils.js';

function GuestMenuItemCard({ categoryName, item, onViewItem }) {
  const isUnavailable = item.is86d || !item.isAvailable;
  const imgUrl = getImageUrl(item.imageUrl);

  return (
    <article
      className={`guest-menu-card ${isUnavailable ? 'is-unavailable' : ''}`}
      onClick={() => !isUnavailable && onViewItem?.(item)}
      role="button"
      tabIndex={isUnavailable ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !isUnavailable) onViewItem?.(item);
      }}
    >
      {/* Image / Placeholder Section */}
      <div className="guest-menu-card__image">
        {imgUrl ? (
          <img src={imgUrl} alt={item.name} loading="lazy" />
        ) : (
          <div className="guest-menu-card__placeholder">
            <span>{item.imagePlaceholder}</span>
          </div>
        )}
        {isUnavailable && (
          <div className="guest-menu-card__sold-out">
            <i className="bi bi-slash-circle me-1" />Sold Out
          </div>
        )}
        {!isUnavailable && (
          <div className="guest-menu-card__quick-add" aria-label="Quick add to cart">
            <i className="bi bi-plus-lg" />
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="guest-menu-card__body">
        <div className="guest-menu-card__category">{categoryName}</div>
        <h3 className="guest-menu-card__name">{item.name}</h3>
        {item.description && (
          <p className="guest-menu-card__desc">{item.description}</p>
        )}
        <div className="guest-menu-card__footer">
          <span className="guest-menu-card__price">${item.basePrice.toFixed(2)}</span>
          {!isUnavailable && (
            <span className="guest-menu-card__action">
              View <i className="bi bi-arrow-right" />
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export default GuestMenuItemCard;
