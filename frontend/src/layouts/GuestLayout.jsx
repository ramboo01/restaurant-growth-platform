import { Outlet, useNavigate } from 'react-router-dom';
import { useCallback, useMemo, useState } from 'react';
import GuestHeader from '../components/navigation/GuestHeader.jsx';
import GuestCartDrawer from '../components/guest/GuestCartDrawer.jsx';
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
  }), [
    cartItems, cartQuantity, subtotal,
    addCartItem, removeCartItem, updateCartItemQuantity,
    increaseCartItemQuantity, decreaseCartItemQuantity, clearCart,
    fulfillment, deliveryFee, restaurantId, setGuestHeaderConfig
  ]);

  return (
    <div className="guest-shell app-min-vh d-flex flex-column">
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

      {/* Floating sticky cart bar — visible on ALL pages when cart has items */}
      {cartItems.length > 0 && !isCartOpen && (
        <div
          style={{
            position: 'fixed', bottom: '24px', left: '50%',
            transform: 'translateX(-50%)', zIndex: 1050,
            minWidth: '300px', maxWidth: '90vw'
          }}
        >
          <button
            type="button"
            className="btn btn-dark btn-lg w-100 fw-bold rounded-pill shadow-lg d-flex align-items-center justify-content-between px-4 py-3"
            onClick={() => setIsCartOpen(true)}
          >
            <span className="badge bg-primary rounded-pill px-2 py-1">{cartQuantity}</span>
            <span>View Your Order</span>
            <span className="fw-bold text-primary">${subtotal.toFixed(2)}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default GuestLayout;
