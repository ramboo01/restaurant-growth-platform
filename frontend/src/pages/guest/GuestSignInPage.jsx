import { useContext, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';

function GuestSignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Where user was trying to go before being redirected to signin
  const redirectTo = location.state?.from?.pathname || '/';

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!form.email.trim()) return setError('Email is required.');
    if (!form.password) return setError('Password is required.');

    setSubmitting(true);

    try {
      const response = await login(form);
      const loggedUser = response?.data?.user;
      const userRole = loggedUser?.role;

      // ❌ Block non-customer roles from using the customer sign-in page
      if (userRole && userRole !== 'Customer') {
        // Log them out immediately so their session is cleared
        localStorage.removeItem('jwt');
        localStorage.removeItem('user');
        setError(
          `This sign-in is for customers only. Your account has the role "${userRole}". Please use the Staff / Owner Portal below.`
        );
        setSubmitting(false);
        return;
      }

      // ✅ Customer: go back to what they were trying to access
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Sign in failed.';
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
                <h1 className="h4 mb-1">Welcome back</h1>
                <p className="text-secondary small mb-0">Sign in to your account to continue.</p>
              </div>

              {error ? (
                <div className="alert alert-danger py-2 small" role="alert">
                  <i className="bi bi-exclamation-circle me-2" aria-hidden="true" />
                  {error}
                </div>
              ) : null}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label" htmlFor="guestSigninEmail">Email Address</label>
                  <input
                    autoComplete="email"
                    className="form-control"
                    id="guestSigninEmail"
                    name="email"
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                    type="email"
                    value={form.email}
                    disabled={submitting}
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label" htmlFor="guestSigninPassword">Password</label>
                  <input
                    autoComplete="current-password"
                    className="form-control"
                    id="guestSigninPassword"
                    name="password"
                    onChange={handleChange}
                    placeholder="Enter your password"
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
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>

                <p className="text-center text-secondary small mb-2">
                  Don't have an account?{' '}
                  <Link to="/signup">Create account</Link>
                </p>

                <div className="text-center mt-3">
                  <div className="text-muted small mb-2">— or —</div>
                  <Link
                    to="/"
                    className="btn btn-outline-secondary btn-sm w-100"
                    replace
                  >
                    <i className="bi bi-eye me-1"></i>
                    Browse Menu Without Signing In
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GuestSignInPage;
