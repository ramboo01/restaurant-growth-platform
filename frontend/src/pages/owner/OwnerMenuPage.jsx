import { useEffect, useMemo, useRef, useState } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import EmptyState from '../../components/feedback/EmptyState.jsx';
import AddItemModal from '../../components/menu/AddItemModal.jsx';
import CategoryCard from '../../components/menu/CategoryCard.jsx';
import MenuItemCard from '../../components/menu/MenuItemCard.jsx';
import SyncHealthSummary from '../../components/menu/SyncHealthSummary.jsx';
import { createMenuItem, fetchMenuItems, removeMenuItem, updateMenuItem, uploadMenuImage } from '../../services/menuService.js';
import '../../styles/menu.css';

function buildCategories(items) {
  return Array.from(new Set(items.map((item) => item.category).filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function normalizeMenuItem(item) {
  const category = item.category ?? item.categoryName ?? 'Unassigned';
  const price = Number(item.price ?? item.basePrice ?? 0);

  return {
    ...item,
    category,
    categoryId: category,
    basePrice: price,
    price,
    imageUrl: item.imageUrl ?? item.image_url ?? '',
    imagePlaceholder: item.imagePlaceholder ?? item.name?.slice(0, 2)?.toUpperCase() ?? 'IT',
    isAvailable: item.isAvailable !== false,
    is86d: item.is86d ?? item.isAvailable === false,
    allergenTags: Array.isArray(item.allergenTags) ? item.allergenTags : [],
    channels: item.channels ?? {}
  };
}

function getCategoryCounts(categories, items) {
  return categories.reduce((counts, category) => {
    const categoryItems = items.filter((item) => item.category === category);
    counts[category] = {
      total: categoryItems.length,
      available: categoryItems.filter((item) => item.isAvailable !== false).length
    };
    return counts;
  }, {});
}

function getSyncSummary(items) {
  const total = items.length;
  const available = items.filter((item) => item.isAvailable !== false).length;
  const unavailable = total - available;

  return {
    title: 'Overall sync health',
    summary: `${available} available items`,
    attention: `${unavailable} unavailable items`,
    channels: [
      { name: 'Backend', status: unavailable > 0 ? 'failed' : 'synced' },
      { name: 'Menu', status: 'synced' }
    ]
  };
}

function OwnerMenuPage() {
  const [items, setItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const loadIdRef = useRef(0);
  const [toastTimeout, setToastTimeout] = useState(null);

  const categories = useMemo(() => buildCategories(items), [items]);
  const categoryCounts = useMemo(() => getCategoryCounts(categories, items), [categories, items]);
  const syncHealthSummary = useMemo(() => getSyncSummary(items), [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.trim().toLowerCase());
      const isAvailable = item.isAvailable !== false;
      const matchesAvailability =
        availabilityFilter === 'all' ||
        (availabilityFilter === 'available' && isAvailable) ||
        (availabilityFilter === 'unavailable' && !isAvailable);

      return matchesCategory && matchesSearch && matchesAvailability;
    });
  }, [availabilityFilter, items, searchTerm, selectedCategory]);

  useEffect(() => {
    let active = true;
    const requestId = loadIdRef.current + 1;
    loadIdRef.current = requestId;

    (async () => {
      try {
        setLoading(true);
        setError('');
        const data = await fetchMenuItems();
        if (active && loadIdRef.current === requestId) {
          setItems((Array.isArray(data) ? data : []).map(normalizeMenuItem));
          setSelectedCategory('all');
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.response?.data?.message || 'Failed to load menu items.');
        }
      } finally {
        if (active && loadIdRef.current === requestId) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  function clearFilters() {
    setSelectedCategory('all');
    setSearchTerm('');
    setAvailabilityFilter('all');
  }

  async function refreshItems() {
    setLoading(true);
    setError('');
    const data = await fetchMenuItems();
    setItems((Array.isArray(data) ? data : []).map(normalizeMenuItem));
    setLoading(false);
  }

  async function handleSubmitItem(payload) {
    setSaving(true);
    try {
      const uploadPath = payload.file ? await uploadMenuImage(payload.file) : payload.imageUrl;
      const requestBody = {
        name: payload.name,
        category: payload.category,
        description: payload.description,
        price: payload.price,
        imageUrl: uploadPath,
        isAvailable: payload.isAvailable
      };

      if (payload.id) {
        const updated = await updateMenuItem(payload.id, requestBody);
        setItems((current) => current.map((entry) => (entry.id === payload.id ? normalizeMenuItem({ ...entry, ...updated }) : entry)));
        setFeedback('Menu item updated successfully.');
      } else {
        const created = await createMenuItem(requestBody);
        setItems((current) => [normalizeMenuItem(created), ...current]);
        setSelectedCategory(created?.category || 'all');
        setFeedback('Menu item created successfully.');
      }

      setShowItemModal(false);
      setEditingItem(null);
      await refreshItems();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    const confirmed = window.confirm(`Delete ${item.name}?`);
    if (!confirmed) {
      return;
    }

    setDeletingId(item.id);
    try {
      await removeMenuItem(item.id);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      setFeedback('Menu item deleted successfully.');
      await refreshItems();
    } finally {
      setDeletingId('');
    }
  }

  function handleEdit(item) {
    setEditingItem(item);
    setShowItemModal(true);
  }

  return (
    <div className="owner-menu-page">
      <PageHeader
        eyebrow="Master Menu"
        title="Master Menu"
        description="Manage the canonical menu used across every connected ordering channel."
        actions={
          <button className="btn btn-primary" onClick={() => setShowItemModal(true)} type="button">
            <i className="bi bi-plus-lg me-2" aria-hidden="true" />
            Add item
          </button>
        }
      />

      {feedback ? <div className="alert alert-success py-2">{feedback}</div> : null}
      {error ? (
        <div className="alert alert-danger d-flex justify-content-between align-items-center gap-3">
          <span>{error}</span>
          <button className="btn btn-outline-danger btn-sm" onClick={refreshItems} type="button">
            Retry
          </button>
        </div>
      ) : null}

      <SyncHealthSummary summary={syncHealthSummary} />

      <section className="mb-4" aria-labelledby="category-filter-heading">
        <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
          <div>
            <h2 className="h5 mb-1" id="category-filter-heading">
              Categories
            </h2>
            <p className="text-secondary small mb-0">Choose a category to filter the canonical item list.</p>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-12 col-md-6 col-xl-4 col-xxl-3">
            <button
              className={`menu-category-card card border-0 owner-card text-start w-100 ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
              type="button"
            >
              <span className="menu-category-icon" aria-hidden="true">
                <i className="bi bi-grid" />
              </span>
              <span className="d-block fw-semibold mb-1">All Items</span>
              <span className="d-block text-secondary small mb-3">View the full canonical menu.</span>
              <span className="small">{items.length} items</span>
            </button>
          </div>
          {categories.map((category) => (
            <div className="col-12 col-md-6 col-xl-4 col-xxl-3" key={category}>
              <CategoryCard
                availableCount={categoryCounts[category]?.available ?? 0}
                category={{
                  id: category,
                  name: category,
                  description: category,
                  itemCount: categoryCounts[category]?.total ?? 0,
                  icon: 'bi-tag'
                }}
                isSelected={selectedCategory === category}
                onSelect={setSelectedCategory}
              />
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="menu-items-heading">
        <div className="card border-0 owner-card">
          <div className="card-body">
            <div className="d-flex flex-column flex-xl-row justify-content-between gap-3 mb-3">
              <div>
                <h2 className="h5 mb-1" id="menu-items-heading">
                  Menu Items
                </h2>
                <p className="text-secondary small mb-0">{filteredItems.length} current results</p>
              </div>
              <div className="d-flex flex-column flex-md-row gap-2 menu-filter-controls">
                <div>
                  <label className="visually-hidden" htmlFor="menuSearch">
                    Search menu items
                  </label>
                  <input
                    className="form-control"
                    id="menuSearch"
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search menu items"
                    value={searchTerm}
                  />
                </div>
                <div>
                  <label className="visually-hidden" htmlFor="availabilityFilter">
                    Availability filter
                  </label>
                  <select
                    className="form-select"
                    id="availabilityFilter"
                    onChange={(event) => setAvailabilityFilter(event.target.value)}
                    value={availabilityFilter}
                  >
                    <option value="all">All</option>
                    <option value="available">Available</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="vstack gap-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div className="card border-0 owner-card" key={index}>
                    <div className="card-body placeholder-glow">
                      <div className="placeholder col-4 mb-3" />
                      <div className="placeholder col-8 mb-2" />
                      <div className="placeholder col-6" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredItems.length ? (
              <div className="vstack gap-3">
                {filteredItems.map((item) => (
                  <MenuItemCard
                    categoryName={item.category}
                    item={item}
                    key={item.id}
                    onEdit={() => handleEdit(item)}
                    onDelete={() => handleDelete(item)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon="bi-filter-circle"
                title="No menu items match these filters."
                message="Clear the filters or adjust your search to see menu items."
              />
            )}

            {!loading && !filteredItems.length ? (
              <div className="text-center mt-3">
                <button className="btn btn-outline-primary" onClick={clearFilters} type="button">
                  Clear filters
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <AddItemModal
        categories={categories}
        item={editingItem}
        show={showItemModal}
        onClose={() => {
          setShowItemModal(false);
          setEditingItem(null);
        }}
        onSubmit={handleSubmitItem}
        submitting={saving}
      />
    </div>
  );
}

export default OwnerMenuPage;
