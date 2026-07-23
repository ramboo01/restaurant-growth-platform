import { useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { guestStorefront } from '../../data/guestStorefrontData.js';
import { placePublicOrder } from '../../services/orderService.js';

function formatCurrency(value) {
  return `$${value.toFixed(2)}`;
}

function buildOrderNumber() {
  return `RR-${Math.floor(100000 + Math.random() * 900000)}`;
}

function GuestCheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const checkoutState = location.state;
  const [formValues, setFormValues] = useState({
    fullName: '',
    mobileNumber: '',
    email: '',
    addressLine: '',
    city: '',
    landmark: '',
    paymentMethod: 'Cash on Delivery'
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const estimatedTotal = useMemo(() => {
    if (!checkoutState) {
      return 0;
    }
    return checkoutState.subtotal + checkoutState.deliveryFee;
  }, [checkoutState]);

  if (!checkoutState?.cartItems?.length) {
    return <Navigate replace to="/" />;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormValues((current) => ({
      ...current,
      [name]: value
    }));
    setErrors((current) => ({
      ...current,
      [name]: ''
    }));
  }

  function validateForm() {
    const nextErrors = {};

    if (!formValues.fullName.trim()) {
      nextErrors.fullName = 'Full name is required.';
    }

    if (!formValues.mobileNumber.trim()) {
      nextErrors.mobileNumber = 'Mobile number is required.';
    }

    if (checkoutState.fulfillment === 'Delivery' && !formValues.addressLine.trim()) {
      nextErrors.addressLine = 'Address line is required.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handlePlaceOrder(event) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const orderPayload = {
        restaurantId: Number(checkoutState.restaurantId || 1),
        customerName: formValues.fullName.trim(),
        customerPhone: formValues.mobileNumber.trim(),
        orderNumber: buildOrderNumber(),
        totalAmount: Number(estimatedTotal),
        orderStatus: 'Pending',
        paymentStatus: 'Pending'
      };

      const createdOrder = await placePublicOrder(orderPayload);

      navigate('/order-success', {
        state: {
          order: createdOrder,
          estimatedTime:
            checkoutState.fulfillment === 'Delivery'
              ? guestStorefront.fulfillment.delivery.estimatedDelivery
              : guestStorefront.fulfillment.pickup.pickupTime
        }
      });
    } catch (err) {
      setSubmitError(err.response?.data?.message || err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container py-4 py-lg-5">
      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div>
          <p className="text-uppercase text-secondary small fw-semibold mb-2">Guest Checkout</p>
          <h1 className="h3 mb-1">Complete your order</h1>
          <p className="text-secondary mb-0">
            {checkoutState.fulfillment === 'Delivery' ? 'Delivery order' : 'Pickup order'} for{' '}
            {guestStorefront.restaurant.name}
          </p>
        </div>
        <Link className="btn btn-outline-secondary btn-sm" to="/">
          Back to Menu
        </Link>
      </div>

      {submitError && (
        <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
          {submitError}
          <button type="button" className="btn-close" onClick={() => setSubmitError(null)} aria-label="Close"></button>
        </div>
      )}

      <form onSubmit={handlePlaceOrder}>
        <div className="row g-4">
          <div className="col-12 col-xl-7">
            <div className="card border-0 guest-info-card mb-4">
              <div className="card-body p-4">
                <h2 className="h5 mb-3">Customer Information</h2>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label" htmlFor="fullName">
                      Full Name*
                    </label>
                    <input
                      className={`form-control ${errors.fullName ? 'is-invalid' : ''}`}
                      id="fullName"
                      name="fullName"
                      onChange={handleChange}
                      value={formValues.fullName}
                      disabled={isSubmitting}
                    />
                    {errors.fullName ? <div className="invalid-feedback">{errors.fullName}</div> : null}
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="mobileNumber">
                      Mobile Number*
                    </label>
                    <input
                      className={`form-control ${errors.mobileNumber ? 'is-invalid' : ''}`}
                      id="mobileNumber"
                      name="mobileNumber"
                      onChange={handleChange}
                      value={formValues.mobileNumber}
                      disabled={isSubmitting}
                    />
                    {errors.mobileNumber ? <div className="invalid-feedback">{errors.mobileNumber}</div> : null}
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="email">
                      Email
                    </label>
                    <input
                      className="form-control"
                      id="email"
                      name="email"
                      onChange={handleChange}
                      value={formValues.email}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
            </div>

            {checkoutState.fulfillment === 'Delivery' ? (
              <div className="card border-0 guest-info-card mb-4">
                <div className="card-body p-4">
                  <h2 className="h5 mb-3">Delivery Address</h2>
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label" htmlFor="addressLine">
                        Address Line*
                      </label>
                      <input
                        className={`form-control ${errors.addressLine ? 'is-invalid' : ''}`}
                        id="addressLine"
                        name="addressLine"
                        onChange={handleChange}
                        value={formValues.addressLine}
                        disabled={isSubmitting}
                      />
                      {errors.addressLine ? <div className="invalid-feedback">{errors.addressLine}</div> : null}
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="city">
                        City
                      </label>
                      <input className="form-control" id="city" name="city" onChange={handleChange} value={formValues.city} disabled={isSubmitting} />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="landmark">
                        Landmark
                      </label>
                      <input
                        className="form-control"
                        id="landmark"
                        name="landmark"
                        onChange={handleChange}
                        value={formValues.landmark}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card border-0 guest-info-card mb-4">
                <div className="card-body p-4">
                  <h2 className="h5 mb-3">Pickup</h2>
                  <div className="vstack gap-2">
                    <div className="d-flex justify-content-between gap-3">
                      <span className="text-secondary">Restaurant Name</span>
                      <span>{guestStorefront.restaurant.name}</span>
                    </div>
                    <div className="d-flex justify-content-between gap-3">
                      <span className="text-secondary">Pickup Time</span>
                      <span>{guestStorefront.fulfillment.pickup.pickupTime}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="card border-0 guest-info-card">
              <div className="card-body p-4">
                <h2 className="h5 mb-3">Payment Method</h2>
                <div className="vstack gap-2">
                  {['Cash on Delivery', 'Card', 'UPI'].map((method) => (
                    <label className="guest-modifier-option" htmlFor={method} key={method}>
                      <div className="d-flex align-items-center gap-2">
                        <input
                          checked={formValues.paymentMethod === method}
                          className="form-check-input mt-0"
                          id={method}
                          name="paymentMethod"
                          onChange={handleChange}
                          type="radio"
                          value={method}
                          disabled={isSubmitting}
                        />
                        <span>{method}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-xl-5">
            <div className="card border-0 guest-info-card">
              <div className="card-body p-4">
                <h2 className="h5 mb-3">Order Summary</h2>
                <div className="vstack gap-3 mb-4">
                  {checkoutState.cartItems.map((item) => (
                    <article className="card border-0 guest-cart-item" key={item.cartEntryId}>
                      <div className="card-body">
                        <div className="d-flex justify-content-between gap-3 mb-2">
                          <div>
                            <h3 className="h6 mb-1">{item.itemName}</h3>
                            <p className="text-secondary small mb-0">
                              Qty {item.quantity} · {formatCurrency(item.unitPrice)} each
                            </p>
                          </div>
                          <p className="fw-semibold mb-0">{formatCurrency(item.total)}</p>
                        </div>
                        {item.selectedModifiers
                          ?.filter((group) => group.options.length)
                          .map((group) => (
                            <div className="mb-2" key={group.groupId}>
                              <p className="text-secondary small mb-1">{group.groupName}</p>
                              <p className="small mb-0">{group.options.map((option) => option.name).join(', ')}</p>
                            </div>
                          ))}
                      </div>
                    </article>
                  ))}
                </div>

                <div className="card border-0 guest-cart-summary">
                  <div className="card-body">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Subtotal</span>
                      <span>{formatCurrency(checkoutState.subtotal)}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>Delivery Fee</span>
                      <span>{formatCurrency(checkoutState.deliveryFee)}</span>
                    </div>
                    <div className="d-flex justify-content-between fw-semibold">
                      <span>Estimated Total</span>
                      <span>{formatCurrency(estimatedTotal)}</span>
                    </div>
                  </div>
                </div>

                <button className="btn btn-primary w-100 mt-4 py-2" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Placing Order...
                    </>
                  ) : (
                    'Place Order'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default GuestCheckoutPage;
