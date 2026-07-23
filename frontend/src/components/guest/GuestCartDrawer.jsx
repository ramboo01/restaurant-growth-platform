import { Link } from 'react-router-dom';

function formatCurrency(value) {
  return `$${value.toFixed(2)}`;
}

function GuestCartDrawer({
  cartItems,
  deliveryFee,
  fulfillment,
  isOpen,
  onClose,
  onDecreaseQuantity,
  onIncreaseQuantity,
  onRemoveItem,
  subtotal,
  restaurantId
}) {
  const estimatedTotal = subtotal + deliveryFee;
  const checkoutState = {
    cartItems,
    deliveryFee,
    fulfillment,
    subtotal,
    restaurantId
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div
        aria-labelledby="guestCartDrawerLabel"
        className="offcanvas offcanvas-end show guest-cart-drawer"
        role="dialog"
        tabIndex="-1"
      >
        <div className="offcanvas-header">
          <div>
            <p className="text-secondary small mb-1">Your order</p>
            <h2 className="offcanvas-title h5 mb-0" id="guestCartDrawerLabel">
              Cart
            </h2>
          </div>
          <button aria-label="Close cart" className="btn-close" onClick={onClose} type="button" />
        </div>

        <div className="offcanvas-body d-flex flex-column gap-4">
          {cartItems.length ? (
            <>
              <div className="vstack gap-3">
                {cartItems.map((item) => (
                  <article className="card border-0 guest-cart-item" key={item.cartEntryId}>
                    <div className="card-body">
                      <div className="d-flex justify-content-between gap-3 mb-2">
                        <div>
                          <h3 className="h6 mb-1">{item.itemName}</h3>
                          <p className="text-secondary small mb-0">{formatCurrency(item.unitPrice)} each</p>
                        </div>
                        <button className="btn btn-link btn-sm p-0 text-danger text-decoration-none" onClick={() => onRemoveItem(item.cartEntryId)} type="button">
                          Remove Item
                        </button>
                      </div>

                      {item.selectedModifiers.some((group) => group.options.length) ? (
                        <div className="vstack gap-2 mb-3">
                          {item.selectedModifiers
                            .filter((group) => group.options.length)
                            .map((group) => (
                              <div key={group.groupId}>
                                <p className="text-secondary small mb-1">{group.groupName}</p>
                                <p className="small mb-0">{group.options.map((option) => option.name).join(', ')}</p>
                              </div>
                            ))}
                        </div>
                      ) : null}

                      <div className="d-flex align-items-center justify-content-between gap-3">
                        <div className="btn-group" aria-label={`Quantity for ${item.itemName}`}>
                          <button
                            className="btn btn-outline-secondary"
                            disabled={item.quantity === 1}
                            onClick={() => onDecreaseQuantity(item.cartEntryId)}
                            type="button"
                          >
                            <i className="bi bi-dash-lg" aria-hidden="true" />
                          </button>
                          <span className="btn btn-outline-secondary disabled guest-quantity-display">{item.quantity}</span>
                          <button
                            className="btn btn-outline-secondary"
                            onClick={() => onIncreaseQuantity(item.cartEntryId)}
                            type="button"
                          >
                            <i className="bi bi-plus-lg" aria-hidden="true" />
                          </button>
                        </div>
                        <p className="fw-semibold mb-0">{formatCurrency(item.total)}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="card border-0 guest-cart-summary mt-auto">
                <div className="card-body">
                  <div className="d-flex justify-content-between mb-2">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>{fulfillment === 'Delivery' ? 'Delivery Fee' : 'Pickup'}</span>
                    <span>{formatCurrency(deliveryFee)}</span>
                  </div>
                  <div className="d-flex justify-content-between fw-semibold">
                    <span>Estimated Total</span>
                    <span>{formatCurrency(estimatedTotal)}</span>
                  </div>
                  <Link className="btn btn-primary w-100 mt-4" state={checkoutState} to="/checkout" onClick={onClose}>
                    Continue to Checkout
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <div className="guest-cart-empty my-auto text-center">
              <div className="guest-cart-empty-icon mx-auto mb-3" aria-hidden="true">
                <i className="bi bi-bag" />
              </div>
              <h3 className="h6 mb-2">Your cart is empty.</h3>
              <p className="text-secondary mb-0">Add an item from the menu to start your order.</p>
            </div>
          )}
        </div>
      </div>

      <button aria-label="Close cart" className="offcanvas-backdrop fade show guest-cart-backdrop" onClick={onClose} type="button" />
    </>
  );
}

export default GuestCartDrawer;
