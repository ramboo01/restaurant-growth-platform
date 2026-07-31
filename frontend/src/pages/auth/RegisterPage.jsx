import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { registerOwner } from '../../services/authService.js';

function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match.');
    }
    if (form.password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }

    setSubmitting(true);

    try {
      // Register as Owner using ownerRegister endpoint
      await registerOwner({
        name: form.name,
        email: form.email,
        password: form.password
      });

      // Auto-login and navigate directly to Owner dashboard
      await login({ email: form.email, password: form.password });
      navigate('/owner', { replace: true });
    } catch (err) {
      const errorMsg = Array.isArray(err.response?.data?.errors)
        ? err.response.data.errors.join('. ')
        : err.response?.data?.message || err.message || 'Registration failed.';
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
                <p className="badge text-bg-primary mb-2">Restaurant Owner Portal</p>
                <h1 className="h4 mb-1">Create Owner Account</h1>
                <p className="text-secondary small mb-0">
                  Register your restaurant and get access to your owner dashboard.
                  <br />
                  <span className="text-muted" style={{ fontSize: '0.78rem' }}>
                    Staff accounts are created from within your Owner Dashboard.
                  </span>
                </p>
              </div>

              {error ? (
                <div className="alert alert-danger py-2 small" role="alert">
                  <i className="bi bi-exclamation-circle me-2" aria-hidden="true" />
                  {error}
                </div>
              ) : null}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label" htmlFor="regName">Full Name</label>
                  <input
                    className="form-control"
                    id="regName"
                    required
                    placeholder="Your full name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    disabled={submitting}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="regEmail">Email Address</label>
                  <input
                    className="form-control"
                    id="regEmail"
                    type="email"
                    required
                    placeholder="owner@restaurant.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    disabled={submitting}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="regPassword">Password (Min. 6 chars)</label>
                  <input
                    className="form-control"
                    id="regPassword"
                    type="password"
                    required
                    minLength={6}
                    placeholder="Create a strong password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    disabled={submitting}
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label" htmlFor="regConfirmPassword">Confirm Password</label>
                  <input
                    className="form-control"
                    id="regConfirmPassword"
                    type="password"
                    required
                    placeholder="Re-enter your password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    disabled={submitting}
                  />
                </div>

                <button className="btn btn-primary w-100 py-2 mb-3" disabled={submitting} type="submit">
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                      Creating Account...
                    </>
                  ) : 'Create Owner Account'}
                </button>

                <p className="text-center text-secondary small mb-0">
                  Already have an account?{' '}
                  <Link to="/login">Login to Portal</Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
