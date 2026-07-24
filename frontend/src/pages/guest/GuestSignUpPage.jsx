import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';

function GuestSignUpPage() {
  const navigate = useNavigate();
  const { register, login } = useContext(AuthContext);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!form.name.trim()) return setError('Name is required.');
    if (!form.email.trim()) return setError('Email is required.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');

    setSubmitting(true);

    try {
      // Register as Customer role — no role selection exposed
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
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
                <div className="guest-brand-mark mx-auto mb-3" aria-hidden="true" style={{ width: 48, height: 48, fontSize: '1.25rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>R</div>
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
                  <label className="form-label" htmlFor="guestSignupName">Full Name</label>
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
                  <label className="form-label" htmlFor="guestSignupEmail">Email Address</label>
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

                <div className="mb-3">
                  <label className="form-label" htmlFor="guestSignupPhone">Phone Number <span className="text-secondary">(Optional)</span></label>
                  <input
                    autoComplete="tel"
                    className="form-control"
                    id="guestSignupPhone"
                    name="phone"
                    onChange={handleChange}
                    placeholder="555-0199"
                    type="tel"
                    value={form.phone}
                    disabled={submitting}
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label" htmlFor="guestSignupPassword">Password</label>
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

                <button className="btn btn-primary w-100 py-2 mb-3" disabled={submitting} type="submit">
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
