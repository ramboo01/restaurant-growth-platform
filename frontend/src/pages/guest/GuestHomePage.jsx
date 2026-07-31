import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import EmptyState from '../../components/feedback/EmptyState.jsx';
import GuestItemDetailModal from '../../components/guest/GuestItemDetailModal.jsx';
import GuestMenuItemCard from '../../components/guest/GuestMenuItemCard.jsx';
import { guestStorefront } from '../../data/guestStorefrontData.js';
import { storefrontService } from '../../services/storefrontService.js';
import { io } from 'socket.io-client';
import useSeoInjector from '../../hooks/useSeoInjector.js';

import api from '../../services/api';

function formatCurrencyStringToNumber(value) {
  if (typeof value === 'number') return value;
  return Number.parseFloat(String(value).replace('$', ''));
}

function GuestHomePage() {
  useSeoInjector();
  const {
    cartItems, cartQuantity, subtotal, addCartItem: contextAddCartItem,
    increaseCartItemQuantity, decreaseCartItemQuantity, removeCartItem,
    openCart, setFulfillment: setLayoutFulfillment, fulfillment: layoutFulfillment,
    setDeliveryFee, restaurantId: layoutRestaurantId, setRestaurantId: setLayoutRestaurantId,
    setGuestHeaderConfig
  } = useOutletContext();

  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [menuCategories, setMenuCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [fulfillment, setFulfillment] = useState(guestStorefront.defaultFulfillment);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [addedToastItem, setAddedToastItem] = useState(null);
  const [siteAppConfig, setSiteAppConfig] = useState(null);

  useEffect(() => {
    async function fetchPublicSiteSettings() {
      try {
        const res = await api.get('/api/site-settings/public');
        if (res.data?.data) {
          const d = res.data.data;
          setSiteAppConfig({
            heroTitle: d.hero_title,
            heroSubtitle: d.hero_subtitle,
            promoText: d.banner_enabled ? d.banner_text : '',
            primaryColor: d.primary_color,
            secondaryColor: d.secondary_color,
            announcementTicker: d.announcement_ticker,
            storeHours: d.store_hours
          });
        }
      } catch (e) {
        console.error('Failed to load public site settings:', e);
      }
    }
    fetchPublicSiteSettings();

    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
    socket.on('siteSettingsUpdated', (d) => {
      if (d) {
        setSiteAppConfig({
          heroTitle: d.hero_title,
          heroSubtitle: d.hero_subtitle,
          promoText: d.banner_enabled ? d.banner_text : '',
          primaryColor: d.primary_color,
          secondaryColor: d.secondary_color,
          announcementTicker: d.announcement_ticker,
          storeHours: d.store_hours
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Load public restaurant catalog data on mount
  useEffect(() => {
    async function loadStorefrontData() {
      try {
        setIsLoading(true);
        setError(null);
        const list = await storefrontService.getRestaurants();
        setRestaurants(list);
        
        if (list.length > 0) {
          const defaultRestaurant = list[0];
          setSelectedRestaurant(defaultRestaurant);
          localStorage.setItem('selectedRestaurantId', defaultRestaurant.id);
          
          const [items, cats] = await Promise.all([
            storefrontService.getMenu(defaultRestaurant.id),
            storefrontService.getCategories(defaultRestaurant.id)
          ]);
          
          // Map backend items
          const mappedItems = items.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description || '',
            categoryId: item.category || 'all',
            category: item.category || 'Menu',
            basePrice: Number(item.price || 0),
            imageUrl: item.imageUrl || item.image_url || '',
            imagePlaceholder: (item.name || 'MI').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
            isAvailable: item.isAvailable !== 0,
            is86d: item.isAvailable === 0,
            allergenTags: [],
            modifierGroups: []
          }));
          
          setMenuItems(mappedItems);
          setMenuCategories(cats.map(cat => ({
            id: cat.name,
            name: cat.name,
            icon: 'bi-egg-fried'
          })));
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load storefront data.');
      } finally {
        setIsLoading(false);
      }
    }
    loadStorefrontData();
  }, []);
 
  // Handle switching restaurants
  async function handleRestaurantChange(event) {
    const restaurantId = event.target.value;
    const restaurant = restaurants.find(r => String(r.id) === String(restaurantId));
    if (!restaurant) return;
    
    try {
      setIsLoading(true);
      setError(null);
      setSelectedRestaurant(restaurant);
      localStorage.setItem('selectedRestaurantId', restaurant.id);
      
      const [items, cats] = await Promise.all([
        storefrontService.getMenu(restaurant.id),
        storefrontService.getCategories(restaurant.id)
      ]);
      
      const mappedItems = items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        categoryId: item.category || 'all',
        category: item.category || 'Menu',
        basePrice: Number(item.price || 0),
        imagePlaceholder: (item.name || 'MI').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
        isAvailable: item.isAvailable !== 0,
        is86d: item.isAvailable === 0,
        allergenTags: [],
        modifierGroups: []
      }));
      
      setMenuItems(mappedItems);
      setMenuCategories(cats.map(cat => ({
        id: cat.name,
        name: cat.name,
        icon: 'bi-egg-fried'
      })));
      setSelectedCategory('all');
      setCartItems([]); // Reset cart when changing restaurant
    } catch (err) {
      setError(err.message || 'Failed to load restaurant menu.');
    } finally {
      setIsLoading(false);
    }
  }

  // Real-time 86 board socket updates for guest storefront
  useEffect(() => {
    if (!selectedRestaurant?.id) return undefined;

    const socketUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('[Storefront Socket] Connected for 86 board updates:', socket.id);
      socket.emit('joinRestaurantRoom', selectedRestaurant.id);
    });

    const handleMenuItemUpdated = (updatedItem) => {
      console.log('[Storefront Socket] Menu item availability update:', updatedItem);
      setMenuItems((prevItems) =>
        prevItems.map((item) => {
          if (String(item.id) === String(updatedItem.id)) {
            const avail = updatedItem.isAvailable !== 0 && updatedItem.is_available !== 0;
            return {
              ...item,
              isAvailable: avail,
              is86d: !avail
            };
          }
          return item;
        })
      );
    };

    socket.on('MENU_ITEM_UPDATED', handleMenuItemUpdated);
    socket.on('MENU_ITEM_AVAILABILITY_CHANGED', handleMenuItemUpdated);

    return () => {
      socket.off('MENU_ITEM_UPDATED', handleMenuItemUpdated);
      socket.off('MENU_ITEM_AVAILABILITY_CHANGED', handleMenuItemUpdated);
      socket.emit('leaveRestaurantRoom', selectedRestaurant.id);
      socket.disconnect();
    };
  }, [selectedRestaurant?.id]);

  // Real-time updates for guest storefront (e.g., 86 board sync)
  useEffect(() => {
    if (!selectedRestaurant) return;

    const socketUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('[Guest Socket] Connected to server:', socket.id);
      socket.emit('joinRestaurantRoom', selectedRestaurant.id);
    });

    socket.on('menuItemUpdated', (updatedItem) => {
      console.log('[Guest Socket] Menu item updated:', updatedItem);
      setMenuItems((currentItems) =>
        currentItems.map((item) => {
          if (item.id === updatedItem.id) {
            return {
              ...item,
              isAvailable: updatedItem.isAvailable !== 0,
              is86d: updatedItem.isAvailable === 0,
              name: updatedItem.name,
              description: updatedItem.description || '',
              basePrice: Number(updatedItem.price || 0)
            };
          }
          return item;
        })
      );
    });

    return () => {
      socket.emit('leaveRestaurantRoom', selectedRestaurant.id);
      socket.disconnect();
    };
  }, [selectedRestaurant]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return menuItems.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.description.toLowerCase().includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [menuItems, searchTerm, selectedCategory]);

  const fulfillmentDetails =
    fulfillment === 'Delivery'
      ? [
          guestStorefront.fulfillment.delivery.estimatedDelivery,
          `${guestStorefront.fulfillment.delivery.deliveryFee} delivery fee`,
          `${guestStorefront.fulfillment.delivery.minimumOrder} minimum`
        ]
      : [guestStorefront.fulfillment.pickup.pickupTime, `Pickup from ${selectedRestaurant?.name || guestStorefront.location.name}`];


  const deliveryFee =
    fulfillment === 'Delivery' ? formatCurrencyStringToNumber(guestStorefront.fulfillment.delivery.deliveryFee) : 0;

  // No need to sync header config (cart lives in GuestLayout now)
  // Sync fulfillment and restaurantId to layout
  useEffect(() => {
    if (selectedRestaurant) {
      setLayoutRestaurantId(selectedRestaurant.id);
      localStorage.setItem('selectedRestaurantId', selectedRestaurant.id);
    }
  }, [selectedRestaurant, setLayoutRestaurantId]);

  useEffect(() => {
    setLayoutFulfillment(fulfillment);
  }, [fulfillment, setLayoutFulfillment]);

  useEffect(() => {
    const fee = fulfillment === 'Delivery'
      ? formatCurrencyStringToNumber(guestStorefront.fulfillment.delivery.deliveryFee)
      : 0;
    setDeliveryFee(fee);
  }, [fulfillment, setDeliveryFee]);

  function clearFilters() {
    setSelectedCategory('all');
    setSearchTerm('');
  }

  function openItemDetail(item) {
    if (item.is86d || !item.isAvailable) {
      return;
    }
    setSelectedItem(item);
  }

  function addCartItem(configuredItem) {
    contextAddCartItem(configuredItem);
    // Show quick toast — do NOT auto-open drawer so user can keep shopping
    setAddedToastItem(configuredItem.itemName || 'Item');
    setSelectedItem(null);
    setTimeout(() => setAddedToastItem(null), 2500);
  }


  const activeTheme = siteAppConfig?.theme || 'dark';

  return (
    <div className="guest-storefront">
      {siteAppConfig?.announcementTicker && (
        <div className="bg-dark text-white text-center py-2 px-3 small fw-bold shadow-sm">
          {siteAppConfig.announcementTicker}
        </div>
      )}
      {/* Dynamic Hero Banner powered by Site & App Editor */}
      <section
        className={`guest-hero-banner py-4 py-md-5 px-3 text-center transition-all overflow-hidden ${
          activeTheme === 'dark'
            ? 'bg-dark text-white'
            : activeTheme === 'light'
            ? 'bg-white text-dark border-bottom'
            : 'bg-dark text-white'
        }`}
        style={{
          background: activeTheme === 'glass' ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : undefined,
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <div className="container py-2 py-md-3" style={{ maxWidth: '800px' }}>
          {siteAppConfig?.promoText ? (
            <div
              className="badge promo-badge bg-primary bg-opacity-25 text-primary border border-primary border-opacity-50 py-2 px-3 rounded-pill mb-3 fw-semibold d-inline-block mw-100"
              style={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: '1.4' }}
            >
              <i className="bi bi-megaphone me-2" />
              {siteAppConfig.promoText}
            </div>
          ) : null}

          <h1 className="fs-2 fs-md-1 fw-bold mb-3 text-break" style={{ lineHeight: '1.2' }}>
            {siteAppConfig?.heroTitle || selectedRestaurant?.name || guestStorefront.restaurant.name}
          </h1>

          <p className="lead opacity-75 mb-4 mx-auto text-wrap" style={{ maxWidth: '650px', fontSize: '1rem' }}>
            {siteAppConfig?.heroSubtitle || selectedRestaurant?.description || guestStorefront.restaurant.description}
          </p>

          <div className="d-flex justify-content-center gap-3 flex-wrap">
            <a
              className="btn btn-primary btn-lg px-4 py-3 fw-bold rounded-pill shadow-sm text-wrap mw-100"
              href="#guest-menu-heading"
              style={{ maxWidth: '100%', whiteSpace: 'normal' }}
            >
              <i className="bi bi-bag-check me-2" />
              {siteAppConfig?.ctaText || 'Order Direct & Save'}
            </a>
          </div>
        </div>
      </section>

      <section className="guest-restaurant-panel">
        <div className="container py-4">
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : error ? (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          ) : (
            <div className="row g-4 align-items-center">
              <div className="col-12 col-lg-7">
                <div className="mb-3 col-12 col-md-6">
                  <label className="form-label text-secondary small fw-semibold text-uppercase mb-1" htmlFor="restaurant-select">
                    Select Restaurant
                  </label>
                  <select 
                    className="form-select bg-light border-0" 
                    id="restaurant-select" 
                    onChange={handleRestaurantChange}
                    value={selectedRestaurant?.id || ''}
                  >
                    {restaurants.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <h2 className="h4 fw-bold mb-1">{selectedRestaurant?.name || guestStorefront.restaurant.name}</h2>
                <p className="text-secondary small mb-2">{selectedRestaurant?.address || guestStorefront.location.name}</p>
                <div className="d-flex flex-wrap gap-2">
                  <span className="badge text-bg-light border">
                    <i className="bi bi-star-fill text-warning me-1" aria-hidden="true" />
                    {guestStorefront.rating} rating
                  </span>
                  <span className="badge text-bg-light border">{guestStorefront.reviewCount} reviews</span>
                  <span className="badge text-bg-success">{guestStorefront.storeStatus}</span>
                  <span className="badge text-bg-light border">
                    {guestStorefront.fulfillment.delivery.estimatedDelivery} delivery
                  </span>
                </div>
              </div>
              <div className="col-12 col-lg-5">
                <div className="card border-0 guest-info-card shadow-sm">
                  <div className="card-body">
                    <h2 className="h6 mb-3 fw-bold">Fulfillment</h2>
                    <div className="btn-group w-100 mb-3" role="group" aria-label="Fulfillment option">
                      {guestStorefront.fulfillmentOptions.map((option) => (
                        <button
                          className={`btn btn-sm ${fulfillment === option ? 'btn-primary' : 'btn-outline-primary'}`}
                          key={option}
                          onClick={() => setFulfillment(option)}
                          type="button"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                    <div className="vstack gap-2">
                      {fulfillmentDetails.map((detail) => (
                        <div className="guest-fulfillment-row" key={detail}>
                          <i className="bi bi-check-circle text-success" aria-hidden="true" />
                          <span>{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {!isLoading && !error && (
        <div className="container py-4">
          <section className="guest-promo-banner mb-4">
            <i className="bi bi-ticket-perforated" aria-hidden="true" />
            <div>
              <h2 className="h6 mb-1">
                {siteAppConfig?.promoText || guestStorefront.promotion.title}
              </h2>
              <p className="mb-0 small">
                {siteAppConfig?.heroSubtitle || guestStorefront.promotion.description}
              </p>
            </div>
          </section>

          <section className="mb-4" aria-label="Menu categories">
            <div className="guest-category-scroll">
              <button
                className={`btn btn-sm ${selectedCategory === 'all' ? 'btn-dark' : 'btn-outline-secondary'}`}
                onClick={() => setSelectedCategory('all')}
                type="button"
              >
                All
              </button>
              {menuCategories.map((category) => (
                <button
                  className={`btn btn-sm ${selectedCategory === category.id ? 'btn-dark' : 'btn-outline-secondary'}`}
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  type="button"
                >
                  {category.name}
                </button>
              ))}
            </div>
          </section>

          <section aria-labelledby="guest-menu-heading">
            <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-3">
              <div>
                <h2 className="h4 mb-1" id="guest-menu-heading">
                  Our Menu
                </h2>
                <p className="text-secondary mb-0">{filteredItems.length} menu items</p>
              </div>
              <div className="guest-search">
                <label className="visually-hidden" htmlFor="guestMenuSearch">
                  Search the menu
                </label>
                <input
                  className="form-control"
                  id="guestMenuSearch"
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search the menu..."
                  value={searchTerm}
                />
              </div>
            </div>

            {filteredItems.length ? (
              <div className="row g-3">
                {filteredItems.map((item) => (
                  <div className="col-12 col-md-6 col-xl-4" key={item.id}>
                    <GuestMenuItemCard categoryName={item.category} item={item} onViewItem={openItemDetail} />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <EmptyState
                  icon="bi-search"
                  title="No menu items found."
                  message="Try another search or category."
                />
                <div className="text-center mt-3">
                  <button className="btn btn-outline-primary" onClick={clearFilters} type="button">
                    Clear filters
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}

      <GuestItemDetailModal
        item={selectedItem}
        onAddToCart={addCartItem}
        onClose={() => setSelectedItem(null)}
      />

      {/* ✅ Added to Cart Toast — pops briefly so user keeps browsing */}
      {addedToastItem && (
        <div
          style={{
            position: 'fixed', top: '80px', left: '50%',
            transform: 'translateX(-50%)', zIndex: 9999,
            minWidth: '300px', maxWidth: '92vw'
          }}
        >
          <div className="alert alert-success shadow-lg d-flex align-items-center gap-3 py-3 px-4 rounded-4 border-0 mb-0">
            <i className="bi bi-bag-check-fill fs-4 text-success" />
            <div className="flex-grow-1">
              <div className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>Added to cart!</div>
              <div className="text-muted small">{addedToastItem}</div>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-success fw-bold rounded-pill px-3"
              onClick={() => { setAddedToastItem(null); openCart(); }}
            >
              View Cart ({cartQuantity})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GuestHomePage;
