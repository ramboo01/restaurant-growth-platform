import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { sendOtpApi, verifyOtpApi } from '../../services/authService.js';

function GuestSignUpPage() {
  const navigate = useNavigate();
  const { register, login } = useContext(AuthContext);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });

  // OTP Verification state
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccessMessage, setOtpSuccessMessage] = useState('');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    if (name === 'phone') {
      // Sanitize: Digits ONLY, max 10 characters
      const cleaned = value.replace(/\D/g, '').slice(0, 10);
      setForm((current) => ({ ...current, phone: cleaned }));
      if (isPhoneVerified) {
        setIsPhoneVerified(false);
        setOtpSent(false);
      }
      setError('');
      setOtpError('');
      setOtpSuccessMessage('');
      return;
    }

    setForm((current) => ({ ...current, [name]: value }));
    setError('');
  }

  const [otpInfo, setOtpInfo] = useState({ isLiveConfigured: false, testOtp: null });

  async function handleSendOtp() {
    setOtpError('');
    setError('');

    if (form.phone.length !== 10) {
      return setOtpError('Please enter a valid 10-digit mobile number.');
    }

    setSendingOtp(true);
    try {
      const response = await sendOtpApi(form.phone);
      setOtpSent(true);
      setOtpValue('');
      setOtpInfo({
        isLiveConfigured: response.data?.isLiveConfigured || false,
        testOtp: response.data?.testOtp || null
      });
      setOtpSuccessMessage(response.message || `OTP sent to +91 ${form.phone}. Please check your SMS.`);
    } catch (err) {
      setOtpError(err.response?.data?.message || err.message || 'Failed to send OTP to your mobile number.');
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleVerifyOtp() {
    setOtpError('');

    if (otpValue.length !== 4) {
      return setOtpError('Please enter the 4-digit code sent to your mobile.');
    }

    setVerifyingOtp(true);
    try {
      await verifyOtpApi(form.phone, otpValue);
      setIsPhoneVerified(true);
      setOtpError('');
      setOtpSuccessMessage('Mobile number verified successfully!');
    } catch (err) {
      setOtpError(err.response?.data?.message || err.message || 'Invalid OTP code. Please try again.');
    } finally {
      setVerifyingOtp(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!form.name.trim()) return setError('Name is required.');
    if (!form.email.trim()) return setError('Email is required.');
    if (form.phone.length !== 10) return setError('A valid 10-digit mobile number is required.');
    if (!isPhoneVerified) return setError('Please verify your mobile number with OTP before proceeding.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');

    setSubmitting(true);

    try {
      // Register as Customer role
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim(),
        role: 'Customer'
      });

      // Auto-login after registration
      await login({ email: form.email.trim(), password: form.password });

      // Redirect to Guest Storefront
      navigate('/', { replace: true });
    } catch (err) {
      const errorMsg = Array.isArray(err.response?.data?.errors)
        ? err.response.data.errors.join('. ')
        : err.response?.data?.message || err.message || 'Sign up failed. Please try again.';
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-sm-10 col-md-7 col-lg-5">
          <div className="card border-0 guest-info-card">
            <div className="card-body p-4 p-lg-5">
              <div className="text-center mb-4">
                <div
                  className="guest-brand-mark mx-auto mb-3"
                  aria-hidden="true"
                  style={{ width: 48, height: 48, fontSize: '1.25rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  R
                </div>
                <h1 className="h4 mb-1">Create your account</h1>
                <p className="text-secondary small mb-0">Sign up to order food, earn rewards, and track deliveries.</p>
              </div>

              {error ? (
                <div className="alert alert-danger py-2 small" role="alert">
                  <i className="bi bi-exclamation-circle me-2" aria-hidden="true" />
                  {error}
                </div>
              ) : null}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-medium" htmlFor="guestSignupName">Full Name</label>
                  <input
                    autoComplete="name"
                    className="form-control"
                    id="guestSignupName"
                    name="name"
                    onChange={handleChange}
                    placeholder="John Doe"
                    required
                    type="text"
                    value={form.name}
                    disabled={submitting}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-medium" htmlFor="guestSignupEmail">Email Address</label>
                  <input
                    autoComplete="email"
                    className="form-control"
                    id="guestSignupEmail"
                    name="email"
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                    type="email"
                    value={form.email}
                    disabled={submitting}
                  />
                </div>

                {/* Mobile Number & OTP Verification */}
                <div className="mb-3">
                  <label className="form-label fw-medium" htmlFor="guestSignupPhone">
                    Mobile Number <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted fw-semibold">+91</span>
                    <input
                      autoComplete="tel"
                      className={`form-control ${isPhoneVerified ? 'is-valid border-success' : ''}`}
                      id="guestSignupPhone"
                      name="phone"
                      onChange={handleChange}
                      placeholder="10-digit mobile number"
                      required
                      type="tel"
                      maxLength={10}
                      value={form.phone}
                      disabled={submitting || isPhoneVerified}
                    />
                    {!isPhoneVerified && (
                      <button
                        className="btn btn-outline-primary fw-semibold"
                        type="button"
                        onClick={handleSendOtp}
                        disabled={form.phone.length !== 10 || sendingOtp}
                      >
                        {sendingOtp ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                            Sending...
                          </>
                        ) : otpSent ? (
                          'Resend OTP'
                        ) : (
                          'Send OTP'
                        )}
                      </button>
                    )}
                  </div>

                  {isPhoneVerified ? (
                    <div className="form-text text-success fw-bold mt-1 d-flex align-items-center gap-1">
                      <i className="bi bi-check-circle-fill" /> Mobile number verified successfully!
                    </div>
                  ) : (
                    <div className="form-text text-muted" style={{ fontSize: '0.78rem' }}>
                      Digits only. Required for delivery updates & loyalty points.
                    </div>
                  )}
                </div>

                {/* OTP Verification Card */}
                {otpSent && !isPhoneVerified && (
                  <div className="card border-primary border-opacity-25 bg-primary bg-opacity-10 p-3 mb-3 rounded-3">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="small fw-bold text-primary">Enter 4-Digit SMS OTP Code</span>
                      {otpInfo.testOtp ? (
                        <span className="badge text-bg-warning font-monospace" title="Add FAST2SMS_API_KEY in backend .env to send real SMS directly to mobile number">
                          Test Code: {otpInfo.testOtp}
                        </span>
                      ) : (
                        <span className="badge text-bg-success font-monospace">Live SMS Sent</span>
                      )}
                    </div>

                    {otpSuccessMessage && !otpError && (
                      <div className="alert alert-info py-2 small mb-2" role="alert" style={{ fontSize: '0.78rem' }}>
                        <i className="bi bi-envelope-check me-1" /> {otpSuccessMessage}
                      </div>
                    )}

                    {otpError && (
                      <div className="text-danger extra-small mb-2 fw-semibold">
                        <i className="bi bi-exclamation-triangle-fill me-1" /> {otpError}
                      </div>
                    )}

                    <div className="input-group mb-2">
                      <input
                        className="form-control text-center fw-bold fs-5 font-monospace"
                        placeholder="4-digit OTP"
                        maxLength={4}
                        value={otpValue}
                        onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      />
                      <button
                        className="btn btn-primary px-3 fw-bold"
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={otpValue.length !== 4 || verifyingOtp}
                      >
                        {verifyingOtp ? 'Verifying...' : 'Verify OTP'}
                      </button>
                    </div>

                    {otpInfo.testOtp ? (
                      <div className="small text-muted" style={{ fontSize: '0.75rem' }}>
                        💡 <strong>Real SMS Note:</strong> Live SMS deliver karne ke liye `FAST2SMS_API_KEY` ko `backend/.env` me add karein. Testing ke liye upar wala code <strong>{otpInfo.testOtp}</strong> enter karein.
                      </div>
                    ) : (
                      <div className="small text-success" style={{ fontSize: '0.75rem' }}>
                        📩 Live SMS delivered via gateway to <strong>+91 {form.phone}</strong>.
                      </div>
                    )}
                  </div>
                )}

                <div className="mb-4">
                  <label className="form-label fw-medium" htmlFor="guestSignupPassword">Password</label>
                  <input
                    autoComplete="new-password"
                    className="form-control"
                    id="guestSignupPassword"
                    minLength={6}
                    name="password"
                    onChange={handleChange}
                    placeholder="Min. 6 characters"
                    required
                    type="password"
                    value={form.password}
                    disabled={submitting}
                  />
                </div>

                <button
                  className="btn btn-primary w-100 py-2 mb-3 fw-semibold"
                  disabled={submitting || !isPhoneVerified}
                  type="submit"
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>

                <p className="text-center text-secondary small mb-0">
                  Already have an account?{' '}
                  <Link to="/signin">Sign in</Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GuestSignUpPage;

