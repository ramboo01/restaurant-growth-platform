import { Outlet, useNavigate } from 'react-router-dom';
import { useCallback, useMemo, useState, useEffect } from 'react';
import GuestHeader from '../components/navigation/GuestHeader.jsx';
import GuestCartDrawer from '../components/guest/GuestCartDrawer.jsx';
import api from '../services/api.js';
import { io } from 'socket.io-client';
import '../styles/guest.css';

// ─── Cart helpers ────────────────────────────────────────────────────────────
function loadCartFromStorage() {
  try {
    const saved = localStorage.getItem('rgp_cart');
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

function saveCartToStorage(items) {
  try { localStorage.setItem('rgp_cart', JSON.stringify(items)); } catch {/* ignore */}
}

function GuestLayout() {
  const navigate = useNavigate();

  // ─── Site Theme & Config State ───────────────────────────────────────────
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
            heroImageUrl: d.hero_image_url,
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
          heroImageUrl: d.hero_image_url,
          announcementTicker: d.announcement_ticker,
          storeHours: d.store_hours
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // ─── Global Cart State (shared across all guest pages) ───────────────────
  const [cartItems, setCartItems] = useState(loadCartFromStorage);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [fulfillment, setFulfillment] = useState('Delivery');
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [restaurantId, setRestaurantId] = useState(
    Number(localStorage.getItem('selectedRestaurantId') || 1)
  );

  const cartQuantity = useMemo(
    () => cartItems.reduce((sum, i) => sum + (i.quantity || 1), 0),
    [cartItems]
  );
  const subtotal = useMemo(
    () => cartItems.reduce((sum, i) => sum + (i.total || 0), 0),
    [cartItems]
  );

  // Persist to localStorage whenever cart changes
  const updateCart = useCallback((updater) => {
    setCartItems((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveCartToStorage(next);
      return next;
    });
  }, []);

  const addCartItem = useCallback((configuredItem) => {
    updateCart((prev) => [...prev, { ...configuredItem, cartEntryId: crypto.randomUUID() }]);
  }, [updateCart]);

  const removeCartItem = useCallback((cartEntryId) => {
    updateCart((prev) => {
      const next = prev.filter((i) => i.cartEntryId !== cartEntryId);
      if (next.length === 0) setIsCartOpen(false);
      return next;
    });
  }, [updateCart]);

  const updateCartItemQuantity = useCallback((cartEntryId, nextQty) => {
    updateCart((prev) =>
      prev.map((i) =>
        i.cartEntryId === cartEntryId
          ? { ...i, quantity: nextQty, total: i.unitPrice * nextQty }
          : i
      )
    );
  }, [updateCart]);

  const increaseCartItemQuantity = useCallback((cartEntryId) => {
    setCartItems((prev) => {
      const item = prev.find((i) => i.cartEntryId === cartEntryId);
      if (!item) return prev;
      const next = prev.map((i) =>
        i.cartEntryId === cartEntryId
          ? { ...i, quantity: i.quantity + 1, total: i.unitPrice * (i.quantity + 1) }
          : i
      );
      saveCartToStorage(next);
      return next;
    });
  }, []);

  const decreaseCartItemQuantity = useCallback((cartEntryId) => {
    setCartItems((prev) => {
      const item = prev.find((i) => i.cartEntryId === cartEntryId);
      if (!item || item.quantity <= 1) return prev;
      const next = prev.map((i) =>
        i.cartEntryId === cartEntryId
          ? { ...i, quantity: i.quantity - 1, total: i.unitPrice * (i.quantity - 1) }
          : i
      );
      saveCartToStorage(next);
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    updateCart([]);
    localStorage.removeItem('rgp_cart');
  }, [updateCart]);

  // ─── Legacy header config from child pages (for backward compat) ─────────
  const setGuestHeaderConfig = useCallback(() => {/* no-op: cart now in layout */}, []);

  // ─── Checkout navigation ──────────────────────────────────────────────────
  const goToCheckout = useCallback(() => {
    setIsCartOpen(false);
    navigate('/checkout', {
      state: { cartItems, subtotal, deliveryFee, fulfillment, restaurantId }
    });
  }, [cartItems, subtotal, deliveryFee, fulfillment, restaurantId, navigate]);

  // ─── Outlet context (all guest pages get this) ───────────────────────────
  const outletContext = useMemo(() => ({
    // cart API
    cartItems,
    cartQuantity,
    subtotal,
    addCartItem,
    removeCartItem,
    updateCartItemQuantity,
    increaseCartItemQuantity,
    decreaseCartItemQuantity,
    clearCart,
    openCart: () => setIsCartOpen(true),
    setFulfillment,
    fulfillment,
    setDeliveryFee,
    deliveryFee,
    restaurantId,
    setRestaurantId,
    // legacy
    setGuestHeaderConfig,
    // Site custom config
    siteAppConfig
  }), [
    cartItems, cartQuantity, subtotal,
    addCartItem, removeCartItem, updateCartItemQuantity,
    increaseCartItemQuantity, decreaseCartItemQuantity, clearCart,
    fulfillment, deliveryFee, restaurantId, setGuestHeaderConfig,
    siteAppConfig
  ]);

  return (
    <div className="guest-shell app-min-vh d-flex flex-column">
      {siteAppConfig && (
        <style>{`
          :root {
            --primary-color: ${siteAppConfig.primaryColor || '#e91e8c'};
            --secondary-color: ${siteAppConfig.secondaryColor || '#667eea'};
          }
          
          /* Hero Section Theme overrides */
          .guest-hero-banner {
            color: #ffffff !important;
          }
          
          /* Megaphone Promo badge inside Hero */
          .promo-badge {
            background-color: rgba(255, 255, 255, 0.25) !important;
            color: #ffffff !important;
            border-color: rgba(255, 255, 255, 0.45) !important;
          }
          
          /* Brand logo badge / icon mark */
          .guest-brand-mark {
            background-color: var(--primary-color) !important;
          }
          
          /* Primary buttons theme mapping */
          .btn-primary,
          .btn-primary:hover,
          .btn-primary:active,
          .btn-primary:focus,
          .btn-primary:disabled {
            background-color: var(--primary-color) !important;
            border-color: var(--primary-color) !important;
            color: #ffffff !important;
          }
          
          /* Outline Primary buttons (Fulfillment toggles) */
          .btn-outline-primary {
            color: var(--primary-color) !important;
            border-color: var(--primary-color) !important;
          }
          
          .btn-outline-primary:hover,
          .btn-outline-primary:active,
          .btn-outline-primary:focus {
            background-color: var(--primary-color) !important;
            border-color: var(--primary-color) !important;
            color: #ffffff !important;
          }
          
          /* Utility colors */
          .text-primary {
            color: var(--primary-color) !important;
          }
          
          .bg-primary {
            background-color: var(--primary-color) !important;
          }
          
          .border-primary {
            border-color: var(--primary-color) !important;
          }
          
          /* Cart badges / counters */
          .badge.bg-primary {
            background-color: var(--primary-color) !important;
            color: #ffffff !important;
          }
          
          .badge.text-bg-success {
            background-color: var(--primary-color) !important;
            color: #ffffff !important;
          }
          
          /* Selected modifier option borders */
          .guest-modifier-option:has(input:checked) {
            border-color: var(--primary-color) !important;
          }
        `}</style>
      )}
      <GuestHeader
        cartQuantity={cartQuantity}
        onCartClick={() => setIsCartOpen(true)}
      />
      <main className="flex-grow-1">
        <Outlet context={outletContext} />
      </main>

      {/* Global Cart Drawer — works on ALL guest pages */}
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
        restaurantId={restaurantId}
        onCheckout={goToCheckout}
      />

      {/* Floating sticky cart bar — compact pill, doesn't block content */}
      {cartItems.length > 0 && !isCartOpen && (
        <div
          style={{
            position: 'fixed', bottom: '16px', right: '16px',
            zIndex: 1050
          }}
        >
          <button
            type="button"
            className="btn btn-dark fw-bold rounded-pill shadow-lg d-flex align-items-center gap-2 px-3 py-2"
            onClick={() => setIsCartOpen(true)}
            style={{ fontSize: '0.88rem' }}
          >
            <span className="badge bg-primary rounded-pill">{cartQuantity}</span>
            <span>Cart</span>
            <span className="text-primary fw-bold">${subtotal.toFixed(2)}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default GuestLayout;
