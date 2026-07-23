import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import EmptyState from '../../components/feedback/EmptyState.jsx';
import AvailabilityItemCard from '../../components/menu/AvailabilityItemCard.jsx';
import { menuCategories, menuItems } from '../../data/menuData.js';
import '../../styles/menu.css';

function cloneMenuItemsForAvailability() {
  return menuItems.map((item) => ({
    ...item,
    is86d: Boolean(item.is86d),
    isAvailable: !item.is86d && Boolean(item.isAvailable)
  }));
}

function getFailedChannels(item) {
  return Object.entries(item.channels)
    .filter(([, channel]) => channel.status === 'failed')
    .map(([channelName]) => channelName);
}

function Owner86BoardPage() {
  const [items, setItems] = useState(cloneMenuItemsForAvailability);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [feedback, setFeedback] = useState('');
  const [syncStates, setSyncStates] = useState({});
  const syncTimers = useRef({});

  useEffect(() => {
    return () => {
      Object.values(syncTimers.current).forEach((timerId) => window.clearTimeout(timerId));
    };
  }, []);

  const stats = useMemo(() => {
    const available = items.filter((item) => item.isAvailable && !item.is86d).length;
    const unavailable = items.filter((item) => item.is86d).length;
    const syncAttention = items.filter((item) => getFailedChannels(item).length > 0).length;

    return { available, unavailable, syncAttention };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.trim().toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
      const matchesAvailability =
        availabilityFilter === 'all' ||
        (availabilityFilter === 'available' && item.isAvailable && !item.is86d) ||
        (availabilityFilter === '86d' && item.is86d);

      return matchesSearch && matchesCategory && matchesAvailability;
    });
  }, [availabilityFilter, items, searchTerm, selectedCategory]);

  const syncAttentionItems = useMemo(() => {
    return items
      .map((item) => ({ ...item, failedChannels: getFailedChannels(item) }))
      .filter((item) => item.failedChannels.length > 0);
  }, [items]);

  function clearFilters() {
    setSearchTerm('');
    setSelectedCategory('all');
    setAvailabilityFilter('all');
  }

  function toggleAvailability(item) {
    if (syncStates[item.id]?.status === 'syncing') {
      return;
    }

    const willRestore = item.is86d;
    setItems((currentItems) =>
      currentItems.map((currentItem) => {
        if (currentItem.id !== item.id) {
          return currentItem;
        }

        return {
          ...currentItem,
          is86d: !willRestore,
          isAvailable: willRestore
        };
      })
    );

    setFeedback(willRestore ? `${item.name} restored and available.` : `${item.name} marked 86'd.`);
    setSyncStates((current) => ({ ...current, [item.id]: { status: 'syncing' } }));

    syncTimers.current[item.id] = window.setTimeout(() => {
      setSyncStates((current) => ({ ...current, [item.id]: { status: 'synced' } }));
      delete syncTimers.current[item.id];
    }, 900);
  }

  return (
    <div className="owner-86-board">
      <PageHeader
        eyebrow="Master Menu"
        title="86 Board"
        description="Quickly control item availability across connected ordering channels."
      />

      <section className="availability-summary mb-4" aria-label="Availability status summary">
        <div className="availability-summary-item">
          <span className="text-secondary small">Available items</span>
          <strong>{stats.available}</strong>
        </div>
        <div className="availability-summary-item">
          <span className="text-secondary small">86'd items</span>
          <strong>{stats.unavailable}</strong>
        </div>
        <div className="availability-summary-item">
          <span className="text-secondary small">Sync attention</span>
          <strong>{stats.syncAttention}</strong>
        </div>
      </section>

      {feedback ? (
        <div className="alert alert-info py-2" role="status">
          {feedback}
        </div>
      ) : null}

      <section className="card border-0 owner-card mb-4" aria-labelledby="availability-board-heading">
        <div className="card-body">
          <div className="d-flex flex-column flex-xl-row justify-content-between gap-3 mb-3">
            <div>
              <h2 className="h5 mb-1" id="availability-board-heading">
                Availability Board
              </h2>
              <p className="text-secondary small mb-0">
                Local state mirrors the shared Master Menu availability field for this frontend phase.
              </p>
            </div>
            <div className="d-flex flex-column flex-lg-row gap-2 availability-filter-controls">
              <div>
                <label className="visually-hidden" htmlFor="availabilitySearch">
                  Search menu items
                </label>
                <input
                  className="form-control"
                  id="availabilitySearch"
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search menu items..."
                  value={searchTerm}
                />
              </div>
              <div>
                <label className="visually-hidden" htmlFor="availabilityStatusFilter">
                  Availability filter
                </label>
                <select
                  className="form-select"
                  id="availabilityStatusFilter"
                  onChange={(event) => setAvailabilityFilter(event.target.value)}
                  value={availabilityFilter}
                >
                  <option value="all">All</option>
                  <option value="available">Available</option>
                  <option value="86d">86'd</option>
                </select>
              </div>
            </div>
          </div>

          <div className="availability-category-scroll mb-4" aria-label="Category filter">
            <button
              className={`btn btn-sm ${selectedCategory === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setSelectedCategory('all')}
              type="button"
            >
              All Items
            </button>
            {menuCategories.map((category) => (
              <button
                className={`btn btn-sm ${selectedCategory === category.id ? 'btn-primary' : 'btn-outline-secondary'}`}
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                type="button"
              >
                <i className={`bi ${category.icon} me-1`} aria-hidden="true" />
                {category.name}
              </button>
            ))}
          </div>

          {filteredItems.length ? (
            <div className="row g-3">
              {filteredItems.map((item) => {
                const category = menuCategories.find((entry) => entry.id === item.categoryId);
                return (
                  <div className="col-12 col-md-6 col-xxl-4" key={item.id}>
                    <AvailabilityItemCard
                      categoryName={category?.name ?? 'Unassigned'}
                      item={item}
                      onToggle={toggleAvailability}
                      syncState={syncStates[item.id]}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <>
              <EmptyState
                icon="bi-filter-circle"
                title="No menu items match these filters."
                message="Clear filters or adjust the search to find an item."
              />
              <div className="text-center mt-3">
                <button className="btn btn-outline-primary" onClick={clearFilters} type="button">
                  Clear filters
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {syncAttentionItems.length ? (
        <section className="card border-0 owner-card" aria-labelledby="sync-attention-heading">
          <div className="card-body">
            <div className="d-flex flex-column flex-lg-row justify-content-between gap-2 mb-3">
              <div>
                <h2 className="h5 mb-1" id="sync-attention-heading">
                  Sync attention
                </h2>
                <p className="text-secondary small mb-0">
                  Items with failed channel sync states from the Master Menu mock data.
                </p>
              </div>
              <span className="badge text-bg-danger align-self-start">{syncAttentionItems.length} items</span>
            </div>
            <div className="vstack gap-2">
              {syncAttentionItems.map((item) => (
                <div className="sync-attention-row" key={item.id}>
                  <div>
                    <div className="fw-semibold">{item.name}</div>
                    <div className="text-secondary small">
                      {item.failedChannels.length} failed channel{item.failedChannels.length === 1 ? '' : 's'}:{' '}
                      {item.failedChannels.join(', ')}
                    </div>
                  </div>
                  <Link className="btn btn-sm btn-outline-primary" to={`/owner/menu/items/${item.id}`}>
                    View item
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default Owner86BoardPage;
