import { useMemo, useState, useEffect } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { guestStorefront } from '../../data/guestStorefrontData.js';
import { placePublicOrder } from '../../services/orderService.js';
import { loyaltyService } from '../../services/loyaltyService.js';

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value) || 0);
}

function buildOrderNumber() {
  return `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
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

  // Loyalty states
  const [loyaltyMember, setLoyaltyMember] = useState(null);
  const [checkingLoyalty, setCheckingLoyalty] = useState(false);
  const [availableRewards, setAvailableRewards] = useState([]);
  const [selectedReward, setSelectedReward] = useState(null);

  const restaurantId = Number(checkoutState?.restaurantId || 1);

  // Load available rewards for this restaurant
  useEffect(() => {
    if (!restaurantId) return;
    const loadRewards = async () => {
      try {
        const rewardsList = await loyaltyService.getPublicRewards(restaurantId);
        setAvailableRewards(rewardsList);
      } catch (err) {
        console.error('Failed to load public rewards catalog:', err);
      }
    };
    loadRewards();
  }, [restaurantId]);

  // Check loyalty points when phone number is complete (e.g. 10 digits)
  useEffect(() => {
    const phone = formValues.mobileNumber.trim();
    if (phone.length >= 10) {
      const checkPoints = async () => {
        try {
          setCheckingLoyalty(true);
          const member = await loyaltyService.checkGuestPoints(phone, restaurantId);
          setLoyaltyMember(member);
          // Reset selected reward if member changes or is not found
          setSelectedReward(null);
        } catch (err) {
          console.error('Error checking loyalty profile:', err);
        } finally {
          setCheckingLoyalty(false);
        }
      };
      checkPoints();
    } else {
      setLoyaltyMember(null);
      setSelectedReward(null);
    }
  }, [formValues.mobileNumber, restaurantId]);

  const estimatedTotal = useMemo(() => {
    if (!checkoutState) return 0;
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

    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const orderPayload = {
        restaurantId: restaurantId,
        customerName: formValues.fullName.trim(),
        customerPhone: formValues.mobileNumber.trim(),
        orderNumber: buildOrderNumber(),
        totalAmount: Number(estimatedTotal),
        orderStatus: 'Pending',
        paymentStatus: 'Pending',
        items: checkoutState.cartItems.map((item) => ({
          itemId: item.itemId,
          itemName: item.itemName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          selectedModifiers: item.selectedModifiers
        })),
        fulfillmentDetails: {
          type: checkoutState.fulfillment,
          addressLine: formValues.addressLine.trim(),
          city: formValues.city.trim(),
          landmark: formValues.landmark.trim(),
          estimatedTime: checkoutState.fulfillment === 'Delivery'
              ? guestStorefront.fulfillment.delivery.estimatedDelivery
              : guestStorefront.fulfillment.pickup.pickupTime,
          // Attach loyalty redemption info if selected
          redeemedRewardId: selectedReward ? selectedReward.id : undefined,
          redeemedRewardName: selectedReward ? selectedReward.name : undefined
        }
      };

      const createdOrder = await placePublicOrder(orderPayload);

      try {
        const recent = JSON.parse(localStorage.getItem('recentOrders') || '[]');
        if (!recent.includes(createdOrder.orderNumber)) {
          recent.push(createdOrder.orderNumber);
          localStorage.setItem('recentOrders', JSON.stringify(recent));
        }
      } catch (storageErr) {
        console.error('Failed to store recent order:', storageErr);
      }

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

  // Filter rewards where points required <= guest current points
  const redeemableRewards = useMemo(() => {
    if (!loyaltyMember) return [];
    return availableRewards.filter(r => r.pointsRequired <= loyaltyMember.points);
  }, [loyaltyMember, availableRewards]);

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
                      placeholder="e.g. 9876543210"
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

            {/* Loyalty & Rewards Section */}
            <div className="card border-0 guest-info-card mb-4">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h2 className="h5 mb-0">🎁 Loyalty Rewards</h2>
                  {checkingLoyalty && <span className="spinner-border spinner-border-sm text-primary" role="status"></span>}
                </div>

                {loyaltyMember ? (
                  <div className="alert alert-success py-3 mb-3 border-0">
                    <h3 className="h6 mb-1 text-success-emphasis fw-semibold">
                      Welcome back, {loyaltyMember.customerName}!
                    </h3>
                    <p className="small mb-2 text-success-emphasis">
                      Tier: <strong>{loyaltyMember.tier}</strong> | Points Balance: <strong>{loyaltyMember.points}</strong>
                    </p>

                    {redeemableRewards.length > 0 ? (
                      <div className="mt-3">
                        <label className="form-label small text-success-emphasis fw-semibold" htmlFor="redeemRewardSelect">
                          Redeem an Available Reward:
                        </label>
                        <select
                          id="redeemRewardSelect"
                          className="form-select form-select-sm"
                          value={selectedReward ? selectedReward.id : ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                              setSelectedReward(null);
                            } else {
                              const rew = redeemableRewards.find(r => String(r.id) === String(val));
                              setSelectedReward(rew);
                            }
                          }}
                        >
                          <option value="">-- Select Reward to Redeem --</option>
                          {redeemableRewards.map(rew => (
                            <option key={rew.id} value={rew.id}>
                              {rew.name} ({rew.pointsRequired} pts)
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <p className="small text-secondary mb-0 mt-2">
                        Earn 10 points for every $1 spent. You don't have enough points to redeem any rewards yet.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="small text-secondary mb-0">
                    Enter your mobile number to search for your loyalty points and redeem rewards! If you're new, you'll be automatically enrolled upon completing your order.
                  </p>
                )}

                {selectedReward && (
                  <div className="alert alert-info py-2 px-3 mb-0 border-0 d-flex justify-content-between align-items-center">
                    <span className="small text-info-emphasis fw-semibold">
                      Selected: {selectedReward.name} (-{selectedReward.pointsRequired} points)
                    </span>
                    <button
                      type="button"
                      className="btn-close btn-sm"
                      onClick={() => setSelectedReward(null)}
                      style={{ fontSize: '0.75rem' }}
                    ></button>
                  </div>
                )}
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
                    {selectedReward && (
                      <div className="d-flex justify-content-between mb-2 text-success fw-semibold">
                        <span>Redeemed Reward</span>
                        <span>{selectedReward.name}</span>
                      </div>
                    )}
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
