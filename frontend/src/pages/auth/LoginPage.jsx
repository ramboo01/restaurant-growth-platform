import { useContext, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await login(form);
      const loggedUser = response?.data?.user;
      const userRole = loggedUser?.role;
      let defaultDestination = '/owner';
      if (userRole === 'Staff') defaultDestination = '/staff/kitchen';
      else if (userRole === 'Driver') defaultDestination = '/driver/orders';
      else if (userRole === 'Admin') defaultDestination = '/admin';
      else if (userRole === 'Customer') defaultDestination = '/';

      const fromPath = location.state?.from?.pathname;
      let destination = defaultDestination;
      if (fromPath && fromPath !== '/' && fromPath !== '/login' && fromPath !== '/signin') {
        destination = fromPath;
      }
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
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
                <p className="badge text-bg-warning mb-2">Staff / Owner Portal</p>
                <h1 className="h4 mb-1">Internal Login</h1>
                <p className="text-secondary small mb-0">Access for restaurant owners, staff, drivers, and admins only.</p>
              </div>

              {error ? (
                <div className="alert alert-danger py-2 small" role="alert">
                  <i className="bi bi-exclamation-circle me-2" aria-hidden="true" />
                  {error}
                </div>
              ) : null}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label" htmlFor="portalEmail">Email</label>
                  <input
                    autoComplete="email"
                    className="form-control"
                    id="portalEmail"
                    type="email"
                    required
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                    disabled={submitting}
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label" htmlFor="portalPassword">Password</label>
                  <input
                    autoComplete="current-password"
                    className="form-control"
                    id="portalPassword"
                    type="password"
                    required
                    value={form.password}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                    disabled={submitting}
                  />
                </div>

                <button className="btn btn-primary w-100 py-2 mb-3" disabled={submitting} type="submit">
                  {submitting ? 'Signing in...' : 'Login to Portal'}
                </button>

                <p className="text-center text-secondary small mb-2">
                  Need a staff account?{' '}
                  <Link to="/register">Register (Internal)</Link>
                </p>
                <p className="text-center mb-0">
                  <Link className="text-secondary small" to="/signin">
                    ← Back to Customer Sign In
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
