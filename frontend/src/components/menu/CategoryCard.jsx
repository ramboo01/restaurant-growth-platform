function CategoryCard({ category, isSelected, onSelect, availableCount = 0 }) {
  return (
    <button
      className={`menu-category-card card border-0 owner-card text-start w-100 ${isSelected ? 'active' : ''}`}
      onClick={() => onSelect(category.id)}
      type="button"
    >
      <span className="menu-category-icon" aria-hidden="true">
        <i className={`bi ${category.icon}`} />
      </span>
      <span className="d-block fw-semibold mb-1">{category.name}</span>
      <span className="d-block text-secondary small mb-3">{category.description}</span>
      <span className="d-flex justify-content-between align-items-center small">
        <span>{category.itemCount} items</span>
        <span className="text-secondary">{availableCount} available</span>
      </span>
    </button>
  );
}

export default CategoryCard;
