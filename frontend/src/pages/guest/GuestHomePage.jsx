import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import EmptyState from '../../components/feedback/EmptyState.jsx';
import GuestCartDrawer from '../../components/guest/GuestCartDrawer.jsx';
import GuestItemDetailModal from '../../components/guest/GuestItemDetailModal.jsx';
import GuestMenuItemCard from '../../components/guest/GuestMenuItemCard.jsx';
import { guestStorefront } from '../../data/guestStorefrontData.js';
import { storefrontService } from '../../services/storefrontService.js';
import { io } from 'socket.io-client';

function formatCurrencyStringToNumber(value) {
  if (typeof value === 'number') return value;
  return Number.parseFloat(String(value).replace('$', ''));
}

function GuestHomePage() {
  const { setGuestHeaderConfig } = useOutletContext();
  
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
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

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

  const cartQuantity = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.total, 0);
  }, [cartItems]);

  const deliveryFee =
    fulfillment === 'Delivery' ? formatCurrencyStringToNumber(guestStorefront.fulfillment.delivery.deliveryFee) : 0;

  useEffect(() => {
    setGuestHeaderConfig({
      cartQuantity,
      onCartClick: () => setIsCartOpen(true)
    });
  }, [cartQuantity, setGuestHeaderConfig]);

  useEffect(() => {
    if (!cartItems.length) {
      setIsCartOpen(false);
    }
  }, [cartItems]);

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
    const cartEntry = {
      ...configuredItem,
      cartEntryId: crypto.randomUUID()
    };
    setCartItems((current) => [...current, cartEntry]);
    setIsCartOpen(true);
  }

  function updateCartItemQuantity(cartEntryId, nextQuantity) {
    setCartItems((current) =>
      current.map((item) =>
        item.cartEntryId === cartEntryId
          ? {
              ...item,
              quantity: nextQuantity,
              total: item.unitPrice * nextQuantity
            }
          : item
      )
    );
  }

  function decreaseCartItemQuantity(cartEntryId) {
    const cartItem = cartItems.find((item) => item.cartEntryId === cartEntryId);
    if (!cartItem || cartItem.quantity === 1) {
      return;
    }
    updateCartItemQuantity(cartEntryId, cartItem.quantity - 1);
  }

  function increaseCartItemQuantity(cartEntryId) {
    const cartItem = cartItems.find((item) => item.cartEntryId === cartEntryId);
    if (!cartItem) {
      return;
    }
    updateCartItemQuantity(cartEntryId, cartItem.quantity + 1);
  }

  function removeCartItem(cartEntryId) {
    setCartItems((current) => current.filter((item) => item.cartEntryId !== cartEntryId));
  }

  return (
    <div className="guest-storefront">
      <section className="guest-restaurant-panel">
        <div className="container py-4 py-lg-5">
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
                <h1 className="display-6 fw-bold mb-2">{selectedRestaurant?.name || guestStorefront.restaurant.name}</h1>
                <p className="h6 text-secondary mb-3">{selectedRestaurant?.address || guestStorefront.location.name}</p>
                <p className="lead mb-3">{selectedRestaurant?.cuisine ? `${selectedRestaurant.cuisine} Cuisine` : guestStorefront.restaurant.description}</p>
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
                <div className="card border-0 guest-info-card">
                  <div className="card-body">
                    <h2 className="h5 mb-3">Fulfillment</h2>
                    <div className="btn-group w-100 mb-3" role="group" aria-label="Fulfillment option">
                      {guestStorefront.fulfillmentOptions.map((option) => (
                        <button
                          className={`btn ${fulfillment === option ? 'btn-primary' : 'btn-outline-primary'}`}
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
              <h2 className="h6 mb-1">{guestStorefront.promotion.title}</h2>
              <p className="mb-0 small">{guestStorefront.promotion.description}</p>
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
      <GuestCartDrawer
        cartItems={cartItems}
        deliveryFee={deliveryFee}
        fulfillment={fulfillment}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onDecreaseQuantity={decreaseCartItemQuantity}
        onIncreaseQuantity={increaseCartItemQuantity}
        onRemoveItem={removeCartItem}
        subtotal={subtotal}
        restaurantId={selectedRestaurant?.id}
      />
    </div>
  );
}

export default GuestHomePage;
