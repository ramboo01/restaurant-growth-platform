import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ErrorState from '../../components/feedback/ErrorState.jsx';
import ItemDetailsTab from '../../components/menu/ItemDetailsTab.jsx';
import ItemModifiersTab from '../../components/menu/ItemModifiersTab.jsx';
import ItemPricingChannelsTab from '../../components/menu/ItemPricingChannelsTab.jsx';
import { formatSyncStatus } from '../../components/menu/SyncHealthSummary.jsx';
import { fetchMenuItem, fetchMenuItems, updateMenuItem } from '../../services/menuService.js';
import '../../styles/menu.css';

function getChannelCounts(item) {
  return ['Website', 'Branded App', 'Kiosk', 'Marketplace', 'POS'].reduce(
    (counts, channel) => {
      const status = item.channels?.[channel]?.status ?? 'pending';
      counts[status] += 1;
      return counts;
    },
    { synced: 0, pending: 0, failed: 0 }
  );
}

function OwnerMenuItemEditorPage() {
  const { itemId } = useParams();
  const [activeTab, setActiveTab] = useState('details');
  const [item, setItem] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const [itemResponse, itemsResponse] = await Promise.all([fetchMenuItem(itemId), fetchMenuItems()]);
        if (active) {
          setItem(itemResponse);
          setCategories(Array.from(new Set(itemsResponse.map((entry) => entry.category).filter(Boolean))).sort());
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.response?.data?.message || 'Menu item not found.');
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [itemId]);

  const categoryLabel = useMemo(() => item?.category || 'Unassigned', [item]);

  if (!item) {
    return (
      <ErrorState
        title={error || 'Loading menu item...'}
        message="This item does not exist in the current menu dataset."
        action={
          <Link className="btn btn-outline-danger btn-sm" to="/owner/menu">
            Back to Master Menu
          </Link>
        }
      />
    );
  }

  const channelCounts = getChannelCounts(item);

  return (
    <div className="owner-menu-editor">
      <div className="mb-3">
        <Link className="btn btn-link px-0" to="/owner/menu">
          <i className="bi bi-arrow-left me-2" aria-hidden="true" />
          Back to Master Menu
        </Link>
      </div>

      <section className="mb-4">
        <p className="text-uppercase text-secondary small fw-semibold mb-1">Item Editor</p>
        <div className="d-flex flex-column flex-xl-row justify-content-between gap-3">
          <div>
            <h1 className="h3 mb-2">{item.name}</h1>
            <p className="text-secondary mb-0">
              {categoryLabel} - {item.is86d ? "86'd" : 'Available'}
            </p>
          </div>
          <div className="menu-editor-sync">
            <span className="menu-status-pill menu-status-synced">
              <span className="menu-status-dot" aria-hidden="true" />
              {channelCounts.synced} synced
            </span>
            <span className="menu-status-pill menu-status-pending">
              <span className="menu-status-dot" aria-hidden="true" />
              {channelCounts.pending} pending
            </span>
            <span className="menu-status-pill menu-status-failed">
              <span className="menu-status-dot" aria-hidden="true" />
              {channelCounts.failed} failed
            </span>
          </div>
        </div>
      </section>

      <ul className="nav nav-tabs menu-editor-tabs mb-3" role="tablist">
        {[
          { id: 'details', label: 'Details' },
          { id: 'pricing', label: 'Pricing & Channels' },
          { id: 'modifiers', label: 'Modifiers' }
        ].map((tab) => (
          <li className="nav-item" key={tab.id} role="presentation">
            <button
              aria-controls={`${tab.id}-panel`}
              aria-selected={activeTab === tab.id}
              className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
              id={`${tab.id}-tab`}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              type="button"
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>

      <div id={`${activeTab}-panel`} role="tabpanel">
        {activeTab === 'details' ? (
          <ItemDetailsTab
            categories={categories}
            item={item}
            onSave={async (form) => {
              const updated = await updateMenuItem(item.id, {
                name: form.name,
                category: form.category,
                description: form.description,
                price: item.price,
                imageUrl: item.imageUrl,
                isAvailable: !form.is86d
              });
              setItem((current) => ({ ...current, ...updated }));
            }}
          />
        ) : null}
        {activeTab === 'pricing' ? <ItemPricingChannelsTab item={item} /> : null}
        {activeTab === 'modifiers' ? <ItemModifiersTab item={item} /> : null}
      </div>
    </div>
  );
}

export default OwnerMenuItemEditorPage;
