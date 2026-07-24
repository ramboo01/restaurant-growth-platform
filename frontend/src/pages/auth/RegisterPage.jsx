import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';

function RegisterPage() {
  const navigate = useNavigate();
  const { register, login } = useContext(AuthContext);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Owner',
    restaurantId: ''
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await register({
        ...form,
        restaurantId: form.restaurantId ? Number(form.restaurantId) : undefined
      });

      // Auto-login after registration
      const loginRes = await login({ email: form.email, password: form.password });
      const userRole = loginRes?.data?.user?.role || form.role;

      let destination = '/owner';
      if (userRole === 'Staff') destination = '/staff';
      else if (userRole === 'Driver') destination = '/driver';
      else if (userRole === 'Admin') destination = '/admin';

      navigate(destination, { replace: true });
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
        <div className="col-12 col-sm-10 col-md-8 col-lg-6">
          <div className="card border-0 guest-info-card">
            <div className="card-body p-4 p-lg-5">
              <div className="text-center mb-4">
                <div className="guest-brand-mark mx-auto mb-3" aria-hidden="true" style={{ width: 48, height: 48, fontSize: '1.25rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>R</div>
                <p className="badge text-bg-warning mb-2">Internal Registration</p>
                <h1 className="h4 mb-1">Create Staff / Owner Account</h1>
                <p className="text-secondary small mb-0">This form is for restaurant owners, managers, staff, and drivers only. Customers should use <Link to="/signup">Guest Sign Up</Link>.</p>
              </div>

              {error ? (
                <div className="alert alert-danger py-2 small" role="alert">
                  <i className="bi bi-exclamation-circle me-2" aria-hidden="true" />
                  {error}
                </div>
              ) : null}

              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="regName">Full Name</label>
                    <input className="form-control" id="regName" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={submitting} />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="regEmail">Email Address</label>
                    <input className="form-control" id="regEmail" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={submitting} />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label" htmlFor="regPassword">Password (Min. 6 chars)</label>
                    <input className="form-control" id="regPassword" type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} disabled={submitting} />
                  </div>
                  <div className="col-12 col-md-3">
                    <label className="form-label" htmlFor="regRole">Role</label>
                    <select className="form-select" id="regRole" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} disabled={submitting}>
                      <option value="Owner">Owner</option>
                      <option value="Manager">Manager</option>
                      <option value="Staff">Staff (Kitchen)</option>
                      <option value="Driver">Driver</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                  <div className="col-12 col-md-3">
                    <label className="form-label" htmlFor="regRestaurantId">Restaurant ID</label>
                    <input className="form-control" id="regRestaurantId" type="number" placeholder="Auto" value={form.restaurantId} onChange={(e) => setForm({ ...form, restaurantId: e.target.value })} disabled={submitting} />
                  </div>
                </div>

                <button className="btn btn-primary w-100 py-2 mt-4 mb-3" disabled={submitting} type="submit">
                  {submitting ? 'Creating...' : 'Create Internal Account'}
                </button>

                <p className="text-center text-secondary small mb-2">
                  Already have an account?{' '}
                  <Link to="/login">Login to Portal</Link>
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

export default RegisterPage;
