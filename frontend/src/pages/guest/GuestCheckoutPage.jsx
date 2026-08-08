import { useMemo, useState, useEffect, useContext, useRef, useCallback } from 'react';
import { Link, Navigate, useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { guestStorefront } from '../../data/guestStorefrontData.js';
import { placePublicOrder } from '../../services/orderService.js';
import { loyaltyService } from '../../services/loyaltyService.js';
import { getPublicDeliveryConfig } from '../../services/deliveryService.js';
import api from '../../services/api.js';
import { AuthContext } from '../../context/AuthContext.jsx';

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value) || 0);
}

function buildOrderNumber() {
  return `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
}

function GuestCheckoutPage() {
  const { user } = useContext(AuthContext);
  const { clearCart } = useOutletContext();
  const location = useLocation();
  const navigate = useNavigate();
  // Read cart from router state first, then fall back to localStorage for refresh-safety
  const checkoutState = location.state || (() => {
    try {
      const savedCart = localStorage.getItem('rgp_cart');
      const savedItems = savedCart ? JSON.parse(savedCart) : [];
      if (!savedItems.length) return null;
      const subtotal = savedItems.reduce((sum, item) => sum + (item.total || 0), 0);
      return {
        cartItems: savedItems,
        subtotal,
        deliveryFee: 0,
        fulfillment: 'Delivery',
        restaurantId: Number(localStorage.getItem('selectedRestaurantId') || 1)
      };
    } catch { return null; }
  })();

  const [deliveryConfig, setDeliveryConfig] = useState(null);

  const [formValues, setFormValues] = useState({
    fullName: user?.name || '',
    mobileNumber: user?.phone || localStorage.getItem('loyaltyPhone') || '',
    email: user?.email || '',
    addressLine: '',
    city: '',
    landmark: '',
    paymentMethod: 'Cash on Delivery'
  });

  // Auto-fill details when user details load
  useEffect(() => {
    if (user) {
      const storedPhone = user.phone || localStorage.getItem('loyaltyPhone') || '';
      setFormValues((prev) => ({
        ...prev,
        fullName: user.name || prev.fullName,
        email: user.email || prev.email,
        mobileNumber: storedPhone || prev.mobileNumber
      }));
    }
  }, [user]);
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Loyalty states
  const [loyaltyMember, setLoyaltyMember] = useState(null);
  const [checkingLoyalty, setCheckingLoyalty] = useState(false);
  const [availableRewards, setAvailableRewards] = useState([]);
  const [selectedReward, setSelectedReward] = useState(null);

  const restaurantId = Number(checkoutState?.restaurantId || 1);

  // Load live delivery configuration from backend database
  useEffect(() => {
    if (!restaurantId) return;
    const fetchDeliveryCfg = async () => {
      try {
        const res = await getPublicDeliveryConfig(restaurantId);
        if (res.data) {
          setDeliveryConfig(res.data);
        }
      } catch (err) {
        console.error('Failed to load public delivery config:', err);
      }
    };
    fetchDeliveryCfg();
  }, [restaurantId]);

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

  // Auto-fetch loyalty points for logged-in users — no manual phone entry needed
  useEffect(() => {
    // If user is logged in and has a phone, auto-check their loyalty points
    if (user?.phone) {
      const autoPhone = user.phone.replace(/\D/g, '');
      setFormValues((prev) => ({ ...prev, mobileNumber: prev.mobileNumber || autoPhone }));
    }
  }, [user]);

  // Check loyalty points when phone number is complete (e.g. 10 digits)
  useEffect(() => {
    const phone = formValues.mobileNumber.trim().replace(/\D/g, '');
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

  // Promo Code States
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [verifyingPromo, setVerifyingPromo] = useState(false);

  const handleApplyPromo = async (codeOverride) => {
    const codeToTest = typeof codeOverride === 'string' ? codeOverride : promoInput;
    const cleanCode = codeToTest.trim();
    if (!cleanCode) return;

    // Check if it's a loyalty reward code
    if (cleanCode.startsWith('LOYAL-')) {
      try {
        const savedReward = JSON.parse(localStorage.getItem('activeLoyaltyReward'));
        if (savedReward && savedReward.code === cleanCode) {
          setAppliedPromo({
            code: cleanCode,
            discountAmount: savedReward.discountAmount,
            campaignName: savedReward.name
          });
          setPromoError('');
          localStorage.setItem('activePromoCode', cleanCode);
          return;
        }
      } catch (err) {}
      // If it starts with LOYAL- but isn't in localStorage, it's invalid
      setAppliedPromo(null);
      setPromoError('Invalid or expired loyalty reward code.');
      return;
    }

    try {
      setVerifyingPromo(true);
      setPromoError('');
      const response = await api.post('/api/campaigns/validate-promo', {
        code: cleanCode,
        subtotal: checkoutState?.subtotal || 0,
        restaurantId
      });

      if (response.data?.success) {
        setAppliedPromo(response.data.data);
        setPromoError('');
        localStorage.setItem('activePromoCode', cleanCode);
      }
    } catch (err) {
      setAppliedPromo(null);
      setPromoError(err.response?.data?.message || 'Invalid or expired promo code.');
    } finally {
      setVerifyingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoInput('');
    setPromoError('');
    localStorage.removeItem('activePromoCode');
  };

  // Auto-apply claimed promo code from localStorage on load
  useEffect(() => {
    const savedCode = localStorage.getItem('activePromoCode');
    if (savedCode && !appliedPromo) {
      setPromoInput(savedCode);
      handleApplyPromo(savedCode);
    }
  }, [checkoutState?.subtotal]);

  const loyaltyDiscount = useMemo(() => {
    if (!selectedReward) return 0;
    const specified = Number(selectedReward.discountAmount);
    if (!isNaN(specified) && specified > 0) {
      return specified;
    }
    const pts = Number(selectedReward.pointsRequired) || 0;
    return Math.max(1, Math.round(pts * 0.10 * 100) / 100);
  }, [selectedReward]);

  const effectiveDeliveryFee = useMemo(() => {
    if (!checkoutState) return 0;
    const sub = Number(checkoutState.subtotal) || 0;
    if (!deliveryConfig) return Number(checkoutState.deliveryFee) || 0;
    
    // Free delivery threshold check
    if (sub >= deliveryConfig.freeDeliveryThreshold) {
      return 0;
    }

    let fee = Number(deliveryConfig.baseDeliveryFee) || 0;
    if (deliveryConfig.isSurgeActive) {
      fee = fee * (Number(deliveryConfig.surgeMultiplier) || 1);
    }
    return Math.round(fee * 100) / 100;
  }, [checkoutState, deliveryConfig]);

  const estimatedTotal = useMemo(() => {
    if (!checkoutState) return 0;
    const sub = Number(checkoutState.subtotal) || 0;
    const del = effectiveDeliveryFee;
    const promoDisc = Number(appliedPromo?.discountAmount) || 0;
    const rewardDisc = loyaltyDiscount;
    return Math.max(0, sub + del - promoDisc - rewardDisc);
  }, [checkoutState, effectiveDeliveryFee, appliedPromo, loyaltyDiscount]);

  if (!checkoutState?.cartItems?.length) {
    return <Navigate replace to="/" />;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    let finalVal = value;
    if (name === 'mobileNumber') {
      finalVal = value.replace(/\D/g, '').slice(0, 10);
      if (finalVal) {
        localStorage.setItem('loyaltyPhone', finalVal);
      }
    }
    setFormValues((current) => ({
      ...current,
      [name]: finalVal
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

    if (checkoutState.fulfillment === 'Delivery' && deliveryConfig?.minOrderValue) {
      const minVal = Number(deliveryConfig.minOrderValue);
      if (minVal > 0 && checkoutState.subtotal < minVal) {
        nextErrors.addressLine = `Minimum order amount for delivery is $${minVal.toFixed(2)}. Current subtotal: $${checkoutState.subtotal.toFixed(2)}`;
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  const redeemableRewards = useMemo(() => {
    if (!loyaltyMember) return [];
    return availableRewards.filter(r => r.pointsRequired <= loyaltyMember.points);
  }, [loyaltyMember, availableRewards]);

  // ─────────────────────────────────────────────
  //  PAYMENT GATEWAY STATE
  // ─────────────────────────────────────────────

  // Card details state
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiry: '',
    cvv: '',
  });
  const [cardErrors, setCardErrors] = useState({});
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // UPI state
  const [upiTab, setUpiTab] = useState('id'); // 'id' | 'qr'
  const [upiId, setUpiId] = useState('');
  const [upiIdVerified, setUpiIdVerified] = useState(false);
  const [upiVerifying, setUpiVerifying] = useState(false);
  const [upiIdError, setUpiIdError] = useState('');

  // Payment processing modal state
  const [gatewayModal, setGatewayModal] = useState('closed'); // 'closed' | 'processing' | 'otp' | 'upi-waiting' | 'success' | 'failed'
  const [gatewayStep, setGatewayStep] = useState(0); // 0..2 for processing labels
  const [otpValue, setOtpValue] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpResendCountdown, setOtpResendCountdown] = useState(30);
  const [qrCountdown, setQrCountdown] = useState(180); // 3 min
  const [pendingOrderPayload, setPendingOrderPayload] = useState(null);
  const otpTimerRef = useRef(null);
  const qrTimerRef = useRef(null);
  const gatewayTimerRef = useRef(null);

  // ─── Card helpers ───
  function detectCardBrand(num) {
    const n = num.replace(/\s/g, '');
    if (/^4/.test(n)) return 'visa';
    if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'mastercard';
    if (/^3[47]/.test(n)) return 'amex';
    if (/^6[0-9]/.test(n)) return 'rupay';
    return 'generic';
  }

  function cardBrandIcon(brand) {
    const icons = {
      visa: '💳 VISA',
      mastercard: '🔴 MC',
      amex: '🔵 AMEX',
      rupay: '🟠 RuPay',
      generic: '💳',
    };
    return icons[brand] || '💳';
  }

  function formatCardNumber(value) {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  }

  function formatExpiry(value) {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  }

  function handleCardChange(e) {
    const { name, value } = e.target;
    let formatted = value;
    if (name === 'cardNumber') formatted = formatCardNumber(value);
    if (name === 'expiry') formatted = formatExpiry(value);
    if (name === 'cvv') formatted = value.replace(/\D/g, '').slice(0, 4);
    setCardDetails(prev => ({ ...prev, [name]: formatted }));
    setCardErrors(prev => ({ ...prev, [name]: '' }));
  }

  function validateCardDetails() {
    const errs = {};
    const num = cardDetails.cardNumber.replace(/\s/g, '');
    if (!num || num.length < 13) errs.cardNumber = 'Enter a valid card number.';
    if (!cardDetails.cardName.trim()) errs.cardName = 'Cardholder name is required.';
    const [mm, yy] = (cardDetails.expiry || '').split('/');
    const now = new Date();
    const fullYear = yy ? 2000 + parseInt(yy) : 0;
    const month = parseInt(mm);
    if (!mm || !yy || month < 1 || month > 12 || fullYear < now.getFullYear() || (fullYear === now.getFullYear() && month < now.getMonth() + 1)) {
      errs.expiry = 'Enter a valid expiry date.';
    }
    if (!cardDetails.cvv || cardDetails.cvv.length < 3) errs.cvv = 'Enter a valid CVV.';
    setCardErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ─── UPI helpers ───
  async function handleVerifyUpi() {
    const upiPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
    if (!upiId.trim() || !upiPattern.test(upiId.trim())) {
      setUpiIdError('Please enter a valid UPI ID (e.g. username@bank).');
      return;
    }
    setUpiVerifying(true);
    setUpiIdError('');
    // Simulate UPI verification API delay
    await new Promise(r => setTimeout(r, 1800));
    setUpiVerifying(false);
    setUpiIdVerified(true);
  }

  // ─── OTP Timer ───
  function startOtpTimer() {
    setOtpResendCountdown(30);
    if (otpTimerRef.current) clearInterval(otpTimerRef.current);
    otpTimerRef.current = setInterval(() => {
      setOtpResendCountdown(c => {
        if (c <= 1) { clearInterval(otpTimerRef.current); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  // ─── QR Countdown Timer ───
  function startQrTimer(onExpire) {
    setQrCountdown(180);
    if (qrTimerRef.current) clearInterval(qrTimerRef.current);
    qrTimerRef.current = setInterval(() => {
      setQrCountdown(c => {
        if (c <= 1) { clearInterval(qrTimerRef.current); onExpire && onExpire(); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  function stopAllTimers() {
    if (otpTimerRef.current) clearInterval(otpTimerRef.current);
    if (qrTimerRef.current) clearInterval(qrTimerRef.current);
    if (gatewayTimerRef.current) clearTimeout(gatewayTimerRef.current);
  }

  useEffect(() => () => stopAllTimers(), []);

  // ─── Build order payload (shared) ───
  function buildOrderPayload(transactionMeta = {}) {
    return {
      restaurantId: restaurantId,
      customerName: formValues.fullName.trim(),
      customerPhone: formValues.mobileNumber.trim(),
      orderNumber: buildOrderNumber(),
      totalAmount: Number(estimatedTotal),
      orderStatus: 'Pending',
      paymentStatus: transactionMeta.paid ? 'Paid' : 'Pending',
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
        promoCode: appliedPromo?.discountCode || '',
        discountAmount: (Number(appliedPromo?.discountAmount) || 0) + loyaltyDiscount,
        redeemedRewardId: selectedReward ? selectedReward.id : undefined,
        redeemedRewardName: selectedReward ? selectedReward.name : undefined,
        redeemedRewardDiscount: loyaltyDiscount,
        paymentGateway: transactionMeta.gateway || 'COD',
        transactionId: transactionMeta.txnId || null,
        cardBrand: transactionMeta.cardBrand || null,
        maskedCard: transactionMeta.maskedCard || null,
        upiId: transactionMeta.upiId || null,
      }
    };
  }

  // ─── Finalize order after gateway success ───
  async function finalizeOrder(payload) {
    try {
      const createdOrder = await placePublicOrder(payload);
      localStorage.removeItem('activePromoCode');
      localStorage.removeItem('activeLoyaltyReward');
      // ✅ Clear cart from localStorage and context after successful order
      clearCart();
      try {
        const recent = JSON.parse(localStorage.getItem('recentOrders') || '[]');
        if (!recent.includes(createdOrder.orderNumber)) {
          recent.push(createdOrder.orderNumber);
          localStorage.setItem('recentOrders', JSON.stringify(recent));
        }
      } catch {}
      stopAllTimers();
      setGatewayModal('closed');
      navigate('/order-success', {
        state: {
          order: createdOrder,
          estimatedTime: checkoutState.fulfillment === 'Delivery'
            ? guestStorefront.fulfillment.delivery.estimatedDelivery
            : guestStorefront.fulfillment.pickup.pickupTime
        }
      });
    } catch (err) {
      setGatewayModal('closed');
      setSubmitError(err.response?.data?.message || err.message || 'Failed to place order. Please try again.');
      setIsSubmitting(false);
    }
  }

  // ─── Run gateway processing steps animation ───
  async function runGatewayProcessing(steps, onComplete) {
    for (let i = 0; i < steps; i++) {
      setGatewayStep(i);
      await new Promise(r => setTimeout(r, 900 + Math.random() * 600));
    }
    onComplete();
  }

  // ─── Main place order handler ───
  async function handlePlaceOrder(event) {
    event.preventDefault();
    if (!validateForm()) return;

    const method = formValues.paymentMethod;

    // Cash on delivery: direct order placement
    if (method === 'Cash on Delivery') {
      try {
        setIsSubmitting(true);
        setSubmitError(null);
        const payload = buildOrderPayload({ paid: false, gateway: 'COD' });
        await finalizeOrder(payload);
      } catch (err) {
        setSubmitError(err.response?.data?.message || err.message || 'Failed to place order.');
        setIsSubmitting(false);
      }
      return;
    }

    // Card payment
    if (method === 'Card') {
      if (!validateCardDetails()) return;
      setIsSubmitting(true);
      setSubmitError(null);
      const brand = detectCardBrand(cardDetails.cardNumber);
      const maskedCard = '**** **** **** ' + cardDetails.cardNumber.replace(/\s/g, '').slice(-4);
      const txnMeta = {
        paid: true,
        gateway: 'MockStripe',
        txnId: 'TXN-' + Date.now(),
        cardBrand: brand,
        maskedCard
      };
      const payload = buildOrderPayload(txnMeta);
      setPendingOrderPayload(payload);
      setGatewayModal('processing');
      setGatewayStep(0);
      runGatewayProcessing(2, () => {
        setGatewayModal('otp');
        startOtpTimer();
      });
      return;
    }

    // UPI payment
    if (method === 'UPI') {
      if (upiTab === 'id' && !upiIdVerified) {
        setUpiIdError('Please verify your UPI ID before placing the order.');
        return;
      }
      setIsSubmitting(true);
      setSubmitError(null);
      const txnMeta = {
        paid: true,
        gateway: 'MockUPI',
        txnId: 'UPI-' + Date.now(),
        upiId: upiTab === 'id' ? upiId : 'QR-SCAN'
      };
      const payload = buildOrderPayload(txnMeta);
      setPendingOrderPayload(payload);
      setGatewayModal('processing');
      setGatewayStep(0);
      runGatewayProcessing(2, () => {
        setGatewayModal('upi-waiting');
        startQrTimer(() => {
          setGatewayModal('failed');
        });
      });
    }
  }

  // ─── OTP Submit Handler ───
  async function handleOtpSubmit(e) {
    e.preventDefault();
    setOtpError('');
    if (!otpValue || otpValue.length < 4) {
      setOtpError('Please enter the 4-digit OTP sent to your bank.');
      return;
    }
    // Mock: any OTP = success (demo mode)
    setGatewayModal('processing');
    setGatewayStep(2);
    await new Promise(r => setTimeout(r, 1200));
    if (pendingOrderPayload) await finalizeOrder(pendingOrderPayload);
  }

  // ─── UPI Approve (simulation) ───
  async function handleUpiApprove() {
    setGatewayModal('processing');
    setGatewayStep(2);
    await new Promise(r => setTimeout(r, 1000));
    if (pendingOrderPayload) await finalizeOrder(pendingOrderPayload);
  }

  function handleCloseGateway() {
    stopAllTimers();
    setGatewayModal('closed');
    setOtpValue('');
    setOtpError('');
    setIsSubmitting(false);
    setPendingOrderPayload(null);
  }

  const cardBrand = detectCardBrand(cardDetails.cardNumber);

  const PROCESSING_LABELS_CARD = [
    'Establishing secure connection...',
    'Validating card with issuing bank...',
    'Authorizing payment...'
  ];
  const PROCESSING_LABELS_UPI = [
    'Connecting to UPI network...',
    'Sending payment request...',
    'Awaiting authorization...'
  ];
  const processingLabels = formValues.paymentMethod === 'UPI' ? PROCESSING_LABELS_UPI : PROCESSING_LABELS_CARD;

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
            <div className="card border-0 guest-info-card shadow-sm mb-4">
              <div className="card-body p-4">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <div className="fs-4 text-primary"><i className="bi bi-person-badge"></i></div>
                  <h2 className="h5 mb-0 fw-bold">Customer Information</h2>
                </div>
                
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label small fw-semibold text-secondary" htmlFor="fullName">
                      Full Name*
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0 text-muted"><i className="bi bi-person"></i></span>
                      <input
                        className={`form-control border-start-0 bg-light bg-opacity-25 ${errors.fullName ? 'is-invalid' : ''}`}
                        id="fullName"
                        name="fullName"
                        onChange={handleChange}
                        value={formValues.fullName}
                        disabled={isSubmitting}
                        placeholder="John Doe"
                      />
                      {errors.fullName ? <div className="invalid-feedback">{errors.fullName}</div> : null}
                    </div>
                  </div>
                  
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold text-secondary" htmlFor="mobileNumber">
                      Mobile Number*
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0 text-muted"><i className="bi bi-telephone"></i></span>
                      <input
                        className={`form-control border-start-0 bg-light bg-opacity-25 ${errors.mobileNumber ? 'is-invalid' : ''}`}
                        id="mobileNumber"
                        name="mobileNumber"
                        onChange={handleChange}
                        value={formValues.mobileNumber}
                        disabled={isSubmitting}
                        placeholder="9876543210"
                      />
                      {errors.mobileNumber ? <div className="invalid-feedback">{errors.mobileNumber}</div> : null}
                    </div>
                  </div>
                  
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold text-secondary" htmlFor="email">
                      Email
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0 text-muted"><i className="bi bi-envelope"></i></span>
                      <input
                        className="form-control border-start-0 bg-light bg-opacity-25"
                        id="email"
                        name="email"
                        onChange={handleChange}
                        value={formValues.email}
                        disabled={isSubmitting}
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

             {/* Loyalty & Rewards Section */}
            <div className="card border-0 guest-info-card shadow-sm mb-4">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className="fs-4 text-warning"><i className="bi bi-gift"></i></div>
                    <h2 className="h5 mb-0 fw-bold">Loyalty Rewards</h2>
                  </div>
                  {checkingLoyalty && <span className="spinner-border spinner-border-sm text-primary" role="status"></span>}
                </div>

                {loyaltyMember ? (
                  <div className="card border-0 rounded-4 mb-3 position-relative overflow-hidden shadow-sm" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: '#fff' }}>
                    <div className="position-absolute end-0 bottom-0 opacity-10 translate-middle-x mb-n3 mr-n3" style={{ fontSize: '10rem', pointerEvents: 'none' }}>
                      <i className="bi bi-stars"></i>
                    </div>
                    <div className="card-body p-4 position-relative">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <span className="text-secondary text-uppercase small fw-bold tracking-wider">RestruRent VIP Member</span>
                          <h4 className="fw-bold text-white mb-0 mt-1">{loyaltyMember.customerName}</h4>
                        </div>
                        <span className="badge bg-warning text-dark fw-bold text-uppercase px-2.5 py-1.5 rounded-pill shadow-sm" style={{ fontSize: '0.75rem' }}>
                          <i className="bi bi-award-fill me-1"></i> {loyaltyMember.tier || 'Bronze'}
                        </span>
                      </div>
                      
                      <div className="row align-items-end mt-4">
                        <div className="col-12 col-md-6">
                          <span className="text-secondary small d-block">Points Balance</span>
                          <span className="display-6 fw-bold text-warning">{loyaltyMember.points} <span className="fs-6 text-white fw-normal">pts</span></span>
                        </div>
                        <div className="col-12 col-md-6 text-md-end mt-3 mt-md-0">
                          <span className="text-secondary small d-block">Member Phone</span>
                          <span className="fw-semibold text-white-50">{formValues.mobileNumber.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')}</span>
                        </div>
                      </div>

                      {redeemableRewards.length > 0 ? (
                        <div className="mt-4 border-top border-secondary border-opacity-30 pt-3">
                          <label className="form-label small text-secondary fw-semibold mb-2" htmlFor="redeemRewardSelect">
                            <i className="bi bi-ticket-perforated me-1"></i> Apply a Discount Reward:
                          </label>
                          <select
                            id="redeemRewardSelect"
                            className="form-select bg-dark text-white border-secondary border-opacity-40"
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
                            <option value="" className="bg-dark text-white">-- Select Discount Reward --</option>
                            {redeemableRewards.map(rew => {
                              const disc = Number(rew.discountAmount) || Math.max(1, Math.round((rew.pointsRequired || 0) * 0.10 * 100) / 100);
                              return (
                                <option key={rew.id} value={rew.id} className="bg-dark text-white">
                                  {rew.name} — ${disc.toFixed(2)} OFF ({rew.pointsRequired} pts)
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      ) : (
                        <p className="small text-secondary mb-0 mt-3 pt-3 border-top border-secondary border-opacity-30">
                          Earn 10 points for every $1 spent. You don't have enough points to redeem any discounts yet.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="alert alert-light border-secondary border-opacity-25 rounded-3 d-flex align-items-start gap-3 p-3">
                    <div className="fs-3 text-secondary mt-0.5"><i className="bi bi-info-circle-fill"></i></div>
                    <div>
                      <h4 className="h6 fw-bold mb-1">Enter your phone number to check rewards</h4>
                      <p className="small text-secondary mb-0">
                        Type in a 10-digit mobile number above to fetch your current loyalty points and unlock exclusive menu items! If you're a new guest, you will be enrolled automatically.
                      </p>
                    </div>
                  </div>
                )}

                {selectedReward && (
                  <div className="alert alert-warning border-0 shadow-sm d-flex align-items-center justify-content-between p-3 mt-3 mb-0">
                    <div className="d-flex align-items-center gap-2">
                      <i className="bi bi-check-circle-fill text-warning fs-5"></i>
                      <span className="small text-dark fw-bold">
                        Applied Reward: <span className="text-primary">{selectedReward.name}</span> (-{selectedReward.pointsRequired} pts / -{formatCurrency(loyaltyDiscount)})
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn-close btn-sm"
                      onClick={() => setSelectedReward(null)}
                      aria-label="Remove reward selection"
                    ></button>
                  </div>
                )}
                
                {estimatedTotal > 0 && (
                  <div className="text-success small fw-semibold mt-3 bg-success bg-opacity-10 p-2.5 rounded-3 d-flex align-items-center gap-2">
                    <i className="bi bi-sparkles text-success"></i>
                    <span>🎉 You will earn <strong>{Math.round(estimatedTotal * 10)}</strong> Loyalty Points on this order!</span>
                  </div>
                )}
              </div>
            </div>

            {checkoutState.fulfillment === 'Delivery' ? (
              <div className="card border-0 guest-info-card shadow-sm mb-4">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <div className="fs-4 text-primary"><i className="bi bi-geo-alt"></i></div>
                    <h2 className="h5 mb-0 fw-bold">Delivery Address</h2>
                  </div>
                  
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label small fw-semibold text-secondary" htmlFor="addressLine">
                        Address Line*
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0 text-muted"><i className="bi bi-map"></i></span>
                        <input
                          className={`form-control border-start-0 bg-light bg-opacity-25 ${errors.addressLine ? 'is-invalid' : ''}`}
                          id="addressLine"
                          name="addressLine"
                          onChange={handleChange}
                          value={formValues.addressLine}
                          disabled={isSubmitting}
                          placeholder="House No, Building Name, Street Name"
                        />
                        {errors.addressLine ? <div className="invalid-feedback">{errors.addressLine}</div> : null}
                      </div>
                    </div>
                    
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold text-secondary" htmlFor="city">
                        City
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0 text-muted"><i className="bi bi-building"></i></span>
                        <input
                          className="form-control border-start-0 bg-light bg-opacity-25"
                          id="city"
                          name="city"
                          onChange={handleChange}
                          value={formValues.city}
                          disabled={isSubmitting}
                          placeholder="e.g. New York"
                        />
                      </div>
                    </div>
                    
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold text-secondary" htmlFor="landmark">
                        Landmark
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0 text-muted"><i className="bi bi-compass"></i></span>
                        <input
                          className="form-control border-start-0 bg-light bg-opacity-25"
                          id="landmark"
                          name="landmark"
                          onChange={handleChange}
                          value={formValues.landmark}
                          disabled={isSubmitting}
                          placeholder="e.g. Near Metro Station"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card border-0 guest-info-card shadow-sm mb-4">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <div className="fs-4 text-primary"><i className="bi bi-shop"></i></div>
                    <h2 className="h5 mb-0 fw-bold">Store Pickup</h2>
                  </div>
                  <div className="vstack gap-2 bg-light bg-opacity-50 p-3 rounded-3">
                    <div className="d-flex justify-content-between gap-3 border-bottom pb-2">
                      <span className="text-secondary small fw-semibold">Restaurant Name</span>
                      <span className="fw-bold">{guestStorefront.restaurant.name}</span>
                    </div>
                    <div className="d-flex justify-content-between gap-3">
                      <span className="text-secondary small fw-semibold">Estimated Pickup Time</span>
                      <span className="fw-bold text-success">{guestStorefront.fulfillment.pickup.pickupTime}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Method Card */}
            <div className="card border-0 guest-info-card shadow-sm mb-4">
              <div className="card-body p-4">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <div className="fs-4 text-primary"><i className="bi bi-shield-lock"></i></div>
                  <h2 className="h5 mb-0 fw-bold">Payment Method</h2>
                  <span className="badge bg-success bg-opacity-10 text-success small ms-auto"><i className="bi bi-lock-fill me-1"></i>Secure</span>
                </div>

                {/* Method Selector */}
                <div className="d-flex gap-2 mb-4 flex-wrap">
                  {[
                    { method: 'Cash on Delivery', icon: 'bi-cash-coin', short: 'Cash' },
                    { method: 'Card', icon: 'bi-credit-card', short: 'Card' },
                    { method: 'UPI', icon: 'bi-phone', short: 'UPI' }
                  ].map(({ method, icon, short }) => (
                    <label
                      key={method}
                      htmlFor={`pm-${method}`}
                      className={`flex-fill text-center py-2 px-3 rounded-3 border fw-semibold small d-flex align-items-center justify-content-center gap-1`}
                      style={{
                        cursor: 'pointer',
                        background: formValues.paymentMethod === method ? 'var(--bs-primary)' : '#f8f9fa',
                        color: formValues.paymentMethod === method ? '#fff' : '#333',
                        borderColor: formValues.paymentMethod === method ? 'var(--bs-primary)' : '#dee2e6',
                        transition: 'all 0.2s'
                      }}
                    >
                      <input id={`pm-${method}`} type="radio" name="paymentMethod" value={method}
                        checked={formValues.paymentMethod === method}
                        onChange={handleChange} disabled={isSubmitting}
                        className="d-none" />
                      <i className={`bi ${icon}`}></i> {short}
                    </label>
                  ))}
                </div>

                {/* COD info */}
                {formValues.paymentMethod === 'Cash on Delivery' && (
                  <div className="alert alert-warning border-0 d-flex align-items-center gap-3 py-3 mb-0">
                    <i className="bi bi-cash-coin fs-3 text-warning"></i>
                    <div>
                      <div className="fw-bold small">Pay when your order arrives</div>
                      <div className="text-secondary" style={{fontSize:'0.8rem'}}>Keep exact change ready. Our rider will collect payment at delivery.</div>
                    </div>
                  </div>
                )}

                {/* ── Card Form ── */}
                {formValues.paymentMethod === 'Card' && (
                  <div>
                    {/* 3D Card Visual */}
                    <div className="mb-4 d-flex justify-content-center" style={{perspective:'1000px'}}>
                      <div
                        style={{
                          width:'320px', height:'190px', position:'relative',
                          transformStyle:'preserve-3d',
                          transform: isCardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                          transition:'transform 0.6s cubic-bezier(.4,0,.2,1)'
                        }}
                      >
                        {/* Front */}
                        <div style={{
                          position:'absolute', inset:0, backfaceVisibility:'hidden', borderRadius:'16px',
                          background:'linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)',
                          padding:'24px', color:'#fff', boxShadow:'0 20px 40px rgba(0,0,0,0.3)'
                        }}>
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div style={{fontSize:'1.4rem', letterSpacing:'2px', opacity:0.8}}>
                              {cardBrand === 'visa' ? '💳' : cardBrand === 'mastercard' ? '🔴' : cardBrand === 'amex' ? '🔵' : cardBrand === 'rupay' ? '🟠' : '💳'}
                            </div>
                            <div style={{fontSize:'0.65rem', opacity:0.6, textTransform:'uppercase', letterSpacing:'1px'}}>
                              {cardBrand === 'visa' ? 'VISA' : cardBrand === 'mastercard' ? 'MASTERCARD' : cardBrand === 'amex' ? 'AMEX' : cardBrand === 'rupay' ? 'RuPay' : 'CARD'}
                            </div>
                          </div>
                          <div style={{fontSize:'1.1rem', letterSpacing:'3px', fontFamily:'monospace', marginBottom:'20px', opacity: cardDetails.cardNumber ? 1 : 0.4}}>
                            {(cardDetails.cardNumber || '**** **** **** ****').padEnd(19, '*').slice(0,19)}
                          </div>
                          <div className="d-flex justify-content-between align-items-end">
                            <div>
                              <div style={{fontSize:'0.6rem', opacity:0.5, letterSpacing:'1px', textTransform:'uppercase'}}>Card Holder</div>
                              <div style={{fontSize:'0.85rem', letterSpacing:'1px', fontFamily:'monospace', opacity: cardDetails.cardName ? 1 : 0.4}}>
                                {cardDetails.cardName || 'YOUR NAME'}
                              </div>
                            </div>
                            <div>
                              <div style={{fontSize:'0.6rem', opacity:0.5, letterSpacing:'1px', textTransform:'uppercase'}}>Expires</div>
                              <div style={{fontSize:'0.85rem', fontFamily:'monospace', opacity: cardDetails.expiry ? 1 : 0.4}}>
                                {cardDetails.expiry || 'MM/YY'}
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Back */}
                        <div style={{
                          position:'absolute', inset:0, backfaceVisibility:'hidden', borderRadius:'16px',
                          background:'linear-gradient(135deg,#1a1a2e 0%,#0f3460 100%)',
                          transform:'rotateY(180deg)', boxShadow:'0 20px 40px rgba(0,0,0,0.3)'
                        }}>
                          <div style={{height:'40px', background:'#111', marginBottom:'24px', marginTop:'24px'}}></div>
                          <div style={{padding:'0 24px'}}>
                            <div style={{fontSize:'0.6rem', color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'6px'}}>CVV</div>
                            <div style={{background:'rgba(255,255,255,0.1)', borderRadius:'6px', padding:'8px 16px', fontFamily:'monospace', color:'#fff', letterSpacing:'4px', textAlign:'right'}}>
                              {cardDetails.cvv ? '•'.repeat(cardDetails.cvv.length) : '•••'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Inputs */}
                    <div className="row g-3">
                      <div className="col-12">
                        <label className="form-label small fw-semibold text-secondary" htmlFor="cardNumber">Card Number</label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-end-0"><i className="bi bi-credit-card text-muted"></i></span>
                          <input
                            id="cardNumber" name="cardNumber" type="text" inputMode="numeric"
                            className={`form-control border-start-0 font-monospace ${cardErrors.cardNumber ? 'is-invalid' : ''}`}
                            placeholder="0000 0000 0000 0000"
                            value={cardDetails.cardNumber}
                            onChange={handleCardChange}
                            disabled={isSubmitting}
                          />
                          {cardErrors.cardNumber && <div className="invalid-feedback">{cardErrors.cardNumber}</div>}
                        </div>
                      </div>
                      <div className="col-12">
                        <label className="form-label small fw-semibold text-secondary" htmlFor="cardName">Cardholder Name</label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-end-0"><i className="bi bi-person text-muted"></i></span>
                          <input
                            id="cardName" name="cardName" type="text"
                            className={`form-control border-start-0 ${cardErrors.cardName ? 'is-invalid' : ''}`}
                            placeholder="Name as on card"
                            value={cardDetails.cardName}
                            onChange={handleCardChange}
                            disabled={isSubmitting}
                          />
                          {cardErrors.cardName && <div className="invalid-feedback">{cardErrors.cardName}</div>}
                        </div>
                      </div>
                      <div className="col-6">
                        <label className="form-label small fw-semibold text-secondary" htmlFor="expiry">Expiry Date</label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-end-0"><i className="bi bi-calendar text-muted"></i></span>
                          <input
                            id="expiry" name="expiry" type="text" inputMode="numeric"
                            className={`form-control border-start-0 font-monospace ${cardErrors.expiry ? 'is-invalid' : ''}`}
                            placeholder="MM/YY"
                            value={cardDetails.expiry}
                            onChange={handleCardChange}
                            disabled={isSubmitting}
                          />
                          {cardErrors.expiry && <div className="invalid-feedback">{cardErrors.expiry}</div>}
                        </div>
                      </div>
                      <div className="col-6">
                        <label className="form-label small fw-semibold text-secondary" htmlFor="cvv">CVV</label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-end-0"><i className="bi bi-lock text-muted"></i></span>
                          <input
                            id="cvv" name="cvv" type="password" inputMode="numeric"
                            className={`form-control border-start-0 font-monospace ${cardErrors.cvv ? 'is-invalid' : ''}`}
                            placeholder="•••"
                            value={cardDetails.cvv}
                            onChange={handleCardChange}
                            onFocus={() => setIsCardFlipped(true)}
                            onBlur={() => setIsCardFlipped(false)}
                            disabled={isSubmitting}
                          />
                          {cardErrors.cvv && <div className="invalid-feedback">{cardErrors.cvv}</div>}
                        </div>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2 mt-3 text-secondary" style={{fontSize:'0.75rem'}}>
                      <i className="bi bi-shield-check text-success"></i>
                      Your card data is encrypted with 256-bit SSL. We never store card details.
                    </div>
                  </div>
                )}

                {/* ── UPI Form ── */}
                {formValues.paymentMethod === 'UPI' && (
                  <div>
                    {/* UPI App Logos */}
                    <div className="d-flex gap-3 mb-3 justify-content-center flex-wrap">
                      {[
                        { name: 'Google Pay', img: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Google_Pay_Logo_%282020%29.svg' },
                        { name: 'PhonePe', img: 'https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg' },
                        { name: 'Paytm', img: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg' },
                        { name: 'BHIM UPI', img: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg' }
                      ].map(app => (
                        <div key={app.name} className="text-center">
                          <div className="rounded-3 bg-white border p-1 mb-1 shadow-sm transition-transform hover-scale" style={{width:64, height:44, display:'flex', alignItems:'center', justifyContent:'center'}}>
                            <img src={app.img} alt={app.name} style={{maxWidth:'85%', maxHeight:'85%', objectFit:'contain'}} />
                          </div>
                          <div style={{fontSize:'0.65rem',color:'#6c757d',fontWeight:'500'}}>{app.name}</div>
                        </div>
                      ))}
                    </div>

                    {/* Tabs */}
                    <div className="d-flex gap-2 mb-3">
                      <button type="button"
                        className={`btn btn-sm flex-fill ${upiTab==='id' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setUpiTab('id')}>
                        <i className="bi bi-at me-1"></i>UPI ID
                      </button>
                      <button type="button"
                        className={`btn btn-sm flex-fill ${upiTab==='qr' ? 'btn-primary' : 'btn-outline-secondary'}`}
                        onClick={() => setUpiTab('qr')}>
                        <i className="bi bi-qr-code me-1"></i>Scan QR
                      </button>
                    </div>

                    {upiTab === 'id' && (
                      <div>
                        <label className="form-label small fw-semibold text-secondary" htmlFor="upiId">Enter UPI ID / VPA</label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-end-0"><i className="bi bi-at text-muted"></i></span>
                          <input
                            id="upiId" type="text"
                            className={`form-control border-start-0 ${upiIdError ? 'is-invalid' : upiIdVerified ? 'is-valid' : ''}`}
                            placeholder="yourname@bank"
                            value={upiId}
                            onChange={e => { setUpiId(e.target.value); setUpiIdVerified(false); setUpiIdError(''); }}
                            disabled={isSubmitting || upiVerifying}
                          />
                          <button type="button" className="btn btn-outline-primary" onClick={handleVerifyUpi} disabled={upiVerifying || !upiId.trim() || upiIdVerified}>
                            {upiVerifying ? <span className="spinner-border spinner-border-sm"></span> : upiIdVerified ? <i className="bi bi-check-lg text-success"></i> : 'Verify'}
                          </button>
                          {upiIdError && <div className="invalid-feedback">{upiIdError}</div>}
                          {upiIdVerified && <div className="valid-feedback">UPI ID verified! ✓</div>}
                        </div>
                      </div>
                    )}

                    {upiTab === 'qr' && (
                      <div className="text-center">
                        <p className="text-secondary small mb-3">Scan this QR code with any UPI app to pay</p>
                        {/* Mock QR as grid of dots */}
                        <div className="d-inline-block p-3 border rounded-3 bg-white mb-3">
                          <svg width="160" height="160" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
                            <rect width="160" height="160" fill="white"/>
                            {/* QR pattern simulation */}
                            {[0,1,2,3,4,5,6].map(r => [0,1,2,3,4,5,6].map(c => (
                              (r<3||r>3)&&(c<3||c>3) ? null :
                              <rect key={`${r}-${c}`} x={10+c*10} y={10+r*10} width="8" height="8" fill="#222" rx="1"/>
                            )))}
                            {Array.from({length:60}).map((_,i)=>{
                              const x = 10+(i%12)*12; const y = 40+Math.floor(i/12)*12;
                              return Math.random()>0.5 ? <rect key={i} x={x} y={y} width="8" height="8" fill="#222" rx="1"/> : null;
                            })}
                            <rect x="110" y="10" width="40" height="40" fill="none" stroke="#222" strokeWidth="4"/>
                            <rect x="10" y="10" width="40" height="40" fill="none" stroke="#222" strokeWidth="4"/>
                            <rect x="10" y="110" width="40" height="40" fill="none" stroke="#222" strokeWidth="4"/>
                          </svg>
                        </div>
                        <div className="d-flex align-items-center justify-content-center gap-2">
                          <i className="bi bi-clock text-warning"></i>
                          <span className="small text-secondary">QR expires in <strong className="text-dark">{Math.floor(qrCountdown/60)}:{String(qrCountdown%60).padStart(2,'0')}</strong></span>
                        </div>
                        <div className="alert alert-info border-0 py-2 mt-3 small">
                          After scanning, click <strong>"Simulate Payment"</strong> below when prompted during checkout.
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-12 col-xl-5">
            {/* Order Summary Card */}
            <div className="card border-0 guest-info-card shadow-sm sticky-xl-top" style={{ top: '90px' }}>
              <div className="card-body p-4">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <div className="fs-4 text-primary"><i className="bi bi-receipt"></i></div>
                  <h2 className="h5 mb-0 fw-bold">Order Summary</h2>
                </div>
                
                <div className="vstack gap-2.5 mb-4" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                  {checkoutState.cartItems.map((item) => (
                    <article className="card border-0 guest-cart-item bg-light bg-opacity-25" key={item.cartEntryId}>
                      <div className="card-body p-3">
                        <div className="d-flex justify-content-between gap-3 align-items-start">
                          <div>
                            <h3 className="h6 mb-1 fw-bold text-dark">{item.itemName}</h3>
                            <p className="text-secondary small mb-0">
                              Qty {item.quantity} · {formatCurrency(item.unitPrice)} each
                            </p>
                          </div>
                          <p className="fw-bold mb-0 text-dark">{formatCurrency(item.total)}</p>
                        </div>
                        {item.selectedModifiers
                          ?.filter((group) => group.options.length)
                          .map((group) => (
                            <div className="mt-2 border-top border-secondary border-opacity-10 pt-1.5" key={group.groupId}>
                              <p className="text-secondary small mb-1 fw-semibold">{group.groupName}</p>
                              <p className="small mb-0 text-dark-50">{group.options.map((option) => option.name).join(', ')}</p>
                            </div>
                          ))}
                      </div>
                    </article>
                  ))}
                </div>

                {/* Promo / Coupon Code Section */}
                <div className="card border-0 rounded-3 p-3 mb-4" style={{ backgroundColor: '#faf8f5', border: '1px dashed #d9cbb6' }}>
                  <label className="form-label fw-bold small text-dark mb-2">
                    <i className="bi bi-ticket-perforated-fill text-warning me-1"></i> Have a Promo / Coupon Code?
                  </label>
                  {appliedPromo ? (
                    <div className="alert alert-success d-flex align-items-center justify-content-between p-2 mb-0 border-0 shadow-sm">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-check-circle-fill text-success fs-5 me-2"></i>
                        <div>
                          <div className="fw-bold small text-dark">
                            Code <code className="bg-white px-1.5 py-0.5 rounded border">{appliedPromo.discountCode}</code> Applied!
                          </div>
                          <div className="small text-success fw-semibold">
                            {appliedPromo.discountPercent}% OFF (-{formatCurrency(appliedPromo.discountAmount)})
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm py-0.5 px-2 text-nowrap fw-semibold"
                        style={{ fontSize: '0.75rem' }}
                        onClick={handleRemovePromo}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control text-uppercase font-monospace border-secondary border-opacity-25"
                          placeholder="e.g. DARG123 or SAVE20"
                          value={promoInput}
                          onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleApplyPromo())}
                          disabled={verifyingPromo}
                        />
                        <button
                          type="button"
                          className="btn btn-warning fw-bold px-3 text-dark"
                          onClick={() => handleApplyPromo()}
                          disabled={verifyingPromo || !promoInput.trim()}
                        >
                          {verifyingPromo ? (
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          ) : (
                            'Apply'
                          )}
                        </button>
                      </div>
                      {promoError && (
                        <div className="text-danger small mt-1.5 fw-semibold">
                          <i className="bi bi-exclamation-triangle-fill me-1"></i> {promoError}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Receipt Calculations */}
                <div className="card border-0 bg-light bg-opacity-50 p-3 rounded-4">
                  <div className="vstack gap-2">
                    <div className="d-flex justify-content-between mb-1.5 text-secondary small">
                      <span>Subtotal</span>
                      <span className="fw-semibold">{formatCurrency(checkoutState.subtotal)}</span>
                    </div>
                    
                    <div className="d-flex justify-content-between mb-1.5 text-secondary small">
                      <span>
                        Delivery Fee 
                        {deliveryConfig?.isSurgeActive ? (
                          <span className="badge bg-warning text-dark extra-small ms-1.5">
                            <i className="bi bi-lightning-fill"></i> Surge
                          </span>
                        ) : null}
                      </span>
                      <span className={`fw-semibold ${effectiveDeliveryFee === 0 ? 'text-success fw-bold' : ''}`}>
                        {effectiveDeliveryFee === 0 ? 'FREE' : formatCurrency(effectiveDeliveryFee)}
                      </span>
                    </div>
                    
                    {appliedPromo && (
                      <div className="d-flex justify-content-between mb-1.5 text-success small fw-bold">
                        <span><i className="bi bi-tag-fill me-1"></i> Promo Discount</span>
                        <span>-{formatCurrency(appliedPromo.discountAmount)}</span>
                      </div>
                    )}
                    
                    {selectedReward && (
                      <div className="d-flex justify-content-between mb-1.5 text-success small fw-semibold">
                        <span><i className="bi bi-gift-fill me-1"></i> Reward Discount</span>
                        <span>-{formatCurrency(loyaltyDiscount)}</span>
                      </div>
                    )}
                    
                    <div className="d-flex justify-content-between fw-bold border-top pt-2.5 mt-1 border-secondary border-opacity-10 text-dark">
                      <span>Estimated Total</span>
                      <span className="fs-5 text-primary fw-bold">{formatCurrency(estimatedTotal)}</span>
                    </div>
                  </div>
                </div>

                <button className="btn btn-primary w-100 mt-4 py-3 fw-bold rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-2 fs-6" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      Placing Order...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-bag-check-fill"></i>
                      Place Order · {formatCurrency(estimatedTotal)}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* ══════════════════════════════════════════════════
          PAYMENT GATEWAY MODAL OVERLAY
      ══════════════════════════════════════════════════ */}
      {gatewayModal !== 'closed' && (
        <div
          style={{
            position:'fixed', inset:0, zIndex:9999,
            background:'rgba(10,10,20,0.85)',
            display:'flex', alignItems:'center', justifyContent:'center',
            backdropFilter:'blur(6px)'
          }}
        >
          <div style={{
            background:'#fff', borderRadius:'20px', padding:'40px 32px',
            maxWidth:'420px', width:'90%', boxShadow:'0 32px 80px rgba(0,0,0,0.4)',
            position:'relative', textAlign:'center'
          }}>

            {/* ─ Processing ─ */}
            {gatewayModal === 'processing' && (
              <div>
                <div className="mb-4" style={{position:'relative',display:'inline-block'}}>
                  <div style={{
                    width:80, height:80, borderRadius:'50%',
                    background:'linear-gradient(135deg,#667eea,#764ba2)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    margin:'0 auto', boxShadow:'0 8px 24px rgba(102,126,234,0.4)'
                  }}>
                    <i className="bi bi-shield-lock-fill text-white" style={{fontSize:'2rem'}}></i>
                  </div>
                  <div style={{
                    position:'absolute', inset:-4, borderRadius:'50%',
                    border:'3px solid transparent',
                    borderTopColor:'#667eea',
                    animation:'spin 1s linear infinite'
                  }}></div>
                </div>
                <h5 className="fw-bold mb-2">Secure Payment Processing</h5>
                <p className="text-secondary small mb-3">{processingLabels[Math.min(gatewayStep, processingLabels.length-1)]}</p>
                <div className="d-flex justify-content-center gap-2 mt-2">
                  {processingLabels.map((_, i) => (
                    <div key={i} style={{
                      width: i <= gatewayStep ? 24 : 8, height:8, borderRadius:4,
                      background: i <= gatewayStep ? '#667eea' : '#e9ecef',
                      transition:'all 0.3s'
                    }}></div>
                  ))}
                </div>
                <div className="d-flex align-items-center justify-content-center gap-2 mt-4 text-success small">
                  <i className="bi bi-lock-fill"></i> 256-bit SSL Encrypted Connection
                </div>
              </div>
            )}

            {/* ─ OTP Verification (Card) ─ */}
            {gatewayModal === 'otp' && (
              <form onSubmit={handleOtpSubmit}>
                <div style={{
                  width:64, height:64, borderRadius:'50%', margin:'0 auto 20px',
                  background:'linear-gradient(135deg,#f093fb,#f5576c)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow:'0 8px 24px rgba(240,93,251,0.3)'
                }}>
                  <i className="bi bi-phone-fill text-white" style={{fontSize:'1.6rem'}}></i>
                </div>
                <h5 className="fw-bold mb-1">Bank OTP Verification</h5>
                <p className="text-secondary small mb-4">
                  A 4-digit OTP has been sent to your registered bank mobile number ending in <strong>••••{formValues.mobileNumber.slice(-4)}</strong>
                </p>

                {/* OTP Input */}
                <div className="d-flex justify-content-center gap-2 mb-3">
                  {[0,1,2,3].map(i => (
                    <input
                      key={i}
                      type="text" inputMode="numeric" maxLength={1}
                      className="form-control text-center fw-bold fs-5 font-monospace"
                      style={{width:52, height:52, borderRadius:12, border:'2px solid #dee2e6'}}
                      value={otpValue[i] || ''}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/,'');
                        const arr = (otpValue + '    ').slice(0,4).split('');
                        arr[i] = val;
                        setOtpValue(arr.join('').trim());
                        if (val && e.target.nextSibling) e.target.nextSibling.focus();
                      }}
                      onKeyDown={e => {
                        if (e.key==='Backspace' && !otpValue[i] && e.target.previousSibling) {
                          e.target.previousSibling.focus();
                        }
                      }}
                    />
                  ))}
                </div>

                {otpError && <div className="text-danger small mb-2 fw-semibold"><i className="bi bi-exclamation-triangle me-1"></i>{otpError}</div>}

                <button type="submit" className="btn btn-primary w-100 py-2 fw-bold mb-3">
                  <i className="bi bi-check-circle me-1"></i>Verify & Pay {formatCurrency(estimatedTotal)}
                </button>

                <div className="d-flex justify-content-between align-items-center small text-secondary">
                  <span>Resend OTP {otpResendCountdown > 0 ? `in ${otpResendCountdown}s` : ''}</span>
                  {otpResendCountdown === 0 && (
                    <button type="button" className="btn btn-link btn-sm p-0" onClick={startOtpTimer}>
                      Resend
                    </button>
                  )}
                </div>

                <div className="mt-3 pt-3 border-top">
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleCloseGateway}>
                    <i className="bi bi-arrow-left me-1"></i> Cancel & Go Back
                  </button>
                </div>
              </form>
            )}

            {/* ─ UPI Waiting ─ */}
            {gatewayModal === 'upi-waiting' && (
              <div>
                <div style={{
                  width:64, height:64, borderRadius:'50%', margin:'0 auto 20px',
                  background:'linear-gradient(135deg,#43e97b,#38f9d7)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow:'0 8px 24px rgba(67,233,123,0.3)'
                }}>
                  <i className="bi bi-phone-vibrate-fill text-white" style={{fontSize:'1.6rem'}}></i>
                </div>
                <h5 className="fw-bold mb-1">Awaiting UPI Authorization</h5>
                <p className="text-secondary small mb-3">
                  {upiTab === 'id'
                    ? <>A payment request has been sent to <strong>{upiId}</strong>. Open your UPI app and approve it.</>
                    : 'Complete the payment in your UPI app after scanning the QR code.'
                  }
                </p>

                {/* Countdown ring */}
                <div className="position-relative d-inline-flex align-items-center justify-content-center mb-4" style={{width:100, height:100}}>
                  <svg width="100" height="100" style={{position:'absolute',top:0,left:0,transform:'rotate(-90deg)'}}>
                    <circle cx="50" cy="50" r="44" fill="none" stroke="#e9ecef" strokeWidth="8"/>
                    <circle cx="50" cy="50" r="44" fill="none" stroke="#43e97b" strokeWidth="8"
                      strokeDasharray={`${2*Math.PI*44}`}
                      strokeDashoffset={`${2*Math.PI*44*(1 - qrCountdown/180)}`}
                      strokeLinecap="round"
                      style={{transition:'stroke-dashoffset 1s linear'}}
                    />
                  </svg>
                  <div className="text-center">
                    <div className="fw-bold" style={{fontSize:'1.2rem'}}>{Math.floor(qrCountdown/60)}:{String(qrCountdown%60).padStart(2,'0')}</div>
                    <div style={{fontSize:'0.6rem', color:'#888'}}>remaining</div>
                  </div>
                </div>

                <div className="d-flex flex-column gap-2">
                  <button type="button" className="btn btn-success py-2 fw-bold" onClick={handleUpiApprove}>
                    <i className="bi bi-check-circle-fill me-2"></i>Simulate Payment Approval ✓
                  </button>
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleCloseGateway}>
                    <i className="bi bi-x me-1"></i>Cancel Payment
                  </button>
                </div>
              </div>
            )}

            {/* ─ Failed ─ */}
            {gatewayModal === 'failed' && (
              <div>
                <div style={{
                  width:64, height:64, borderRadius:'50%', margin:'0 auto 20px',
                  background:'linear-gradient(135deg,#f5576c,#f093fb)',
                  display:'flex', alignItems:'center', justifyContent:'center'
                }}>
                  <i className="bi bi-x-circle-fill text-white" style={{fontSize:'1.6rem'}}></i>
                </div>
                <h5 className="fw-bold mb-2 text-danger">Payment Failed</h5>
                <p className="text-secondary small mb-4">The UPI request expired or was declined. Please try again with a different payment method.</p>
                <button type="button" className="btn btn-primary w-100 py-2 fw-bold" onClick={handleCloseGateway}>
                  <i className="bi bi-arrow-left me-1"></i> Try Again
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Spin animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default GuestCheckoutPage;
