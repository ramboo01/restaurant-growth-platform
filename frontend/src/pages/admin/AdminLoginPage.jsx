import { useState, useContext } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';

function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, logout, user: currentUser } = useContext(AuthContext);

  const [email, setEmail] = useState('admin@platform.com');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState(location.state?.error || '');
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Clear any existing non-admin session before authenticating
      if (currentUser && currentUser.role !== 'Admin') {
        logout();
      }

      // Call AuthContext login with payload object { email, password }
      const res = await login({ email: email.trim(), password });
      const loggedUser = res?.data?.user;

      // Strict Admin Role Enforcement
      if (loggedUser?.role !== 'Admin') {
        logout(); // clear non-admin user session
        setError(`🚫 Access Denied: Account "${loggedUser?.email}" has role "${loggedUser?.role}". Only Platform Super Admins can access this portal.`);
        setLoading(false);
        return;
      }

      // Redirect to /admin dashboard
      const origin = location.state?.from?.pathname || '/admin';
      navigate(origin, { replace: true });
    } catch (err) {
      console.error('[AdminLogin] Error:', err);
      const apiMessage = err.response?.data?.message || err.message;
      if (apiMessage) {
        setError(apiMessage);
      } else {
        setError('❌ Connection error. Please verify backend server status.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (fillEmail, fillPass) => {
    setEmail(fillEmail);
    setPassword(fillPass);
    setError('');
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center p-3"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #31102f 100%)',
        fontFamily: "'Inter', sans-serif"
      }}
    >
      <div className="w-100" style={{ maxWidth: '460px' }}>
        {/* Top Branding Header */}
        <div className="text-center mb-4">
          <div
            className="d-inline-flex align-items-center justify-content-center bg-danger bg-opacity-20 text-danger rounded-circle p-3 mb-3 border border-danger border-opacity-30 shadow-lg"
            style={{ width: '70px', height: '70px' }}
          >
            <i className="bi bi-shield-lock-fill fs-1"></i>
          </div>
          <h2 className="fw-bold text-white mb-1 tracking-tight">Platform Control Center</h2>
          <p className="text-white-50 small mb-0">RestruRent Multi-Tenant Super Admin Portal</p>
        </div>

        {/* Card */}
        <div className="card border-0 shadow-lg rounded-4 overflow-hidden" style={{ backgroundColor: 'rgba(255, 255, 255, 0.96)' }}>
          <div className="card-body p-4 p-sm-5">
            <div className="d-flex align-items-center justify-content-between mb-4">
              <h5 className="fw-bold text-dark mb-0">Admin Authentication</h5>
              <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2.5 py-1">
                Root Access
              </span>
            </div>

            {error && (
              <div className="alert alert-danger border-0 shadow-sm rounded-3 py-2.5 px-3 mb-4 small d-flex align-items-start gap-2" role="alert">
                <i className="bi bi-exclamation-triangle-fill fs-6 mt-0.5 text-danger flex-shrink-0"></i>
                <div className="text-dark fw-medium" style={{ wordBreak: 'break-word' }}>{error}</div>
              </div>
            )}

            <form onSubmit={handleAdminLogin}>
              <div className="mb-3">
                <label className="form-label fw-semibold text-dark small">Admin Email Address</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 text-muted">
                    <i className="bi bi-envelope-at"></i>
                  </span>
                  <input
                    type="email"
                    className="form-control bg-light border-start-0 ps-0"
                    placeholder="admin@platform.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label fw-semibold text-dark small mb-0">Secure Access Password</label>
                </div>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 text-muted">
                    <i className="bi bi-key-fill"></i>
                  </span>
                  <input
                    type="password"
                    className="form-control bg-light border-start-0 ps-0"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-danger w-100 py-2.5 fw-bold shadow-sm rounded-3 d-flex align-items-center justify-content-center gap-2 mb-3"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Authenticating Admin...
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-in-right fs-5"></i>
                    Sign In to Admin Console
                  </>
                )}
              </button>
            </form>

            {/* Quick Fill Accounts */}
            <div className="border-top pt-3 mt-3 text-center">
              <div className="text-muted extra-small mb-2 fw-semibold text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>
                Quick Fill Verified Admin Accounts
              </div>
              <div className="d-flex flex-wrap justify-content-center gap-1.5">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-dark py-1 px-2 fw-semibold"
                  style={{ fontSize: '0.75rem' }}
                  onClick={() => handleQuickFill('admin@platform.com', 'Admin@123')}
                >
                  <i className="bi bi-shield-check me-1 text-danger"></i> admin@platform.com
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-dark py-1 px-2 fw-semibold"
                  style={{ fontSize: '0.75rem' }}
                  onClick={() => handleQuickFill('ownerr@gmail.com', 'admin123')}
                >
                  <i className="bi bi-person-badge-fill me-1 text-primary"></i> ownerr@gmail.com
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-dark py-1 px-2 fw-semibold"
                  style={{ fontSize: '0.75rem' }}
                  onClick={() => handleQuickFill('adminn@gmail.com', 'admin123')}
                >
                  <i className="bi bi-person-fill-gear me-1 text-success"></i> adminn@gmail.com
                </button>
              </div>
            </div>
          </div>

          <div className="card-footer bg-light border-0 py-3 text-center">
            <span className="text-muted small">Not a Platform Admin? </span>
            <Link to="/login" className="text-danger fw-semibold text-decoration-none small">
              Go to Owner &amp; Staff Login →
            </Link>
          </div>
        </div>

        {/* Footer Security Notice */}
        <div className="text-center mt-4 text-white-50 extra-small">
          <i className="bi bi-shield-check text-success me-1"></i>
          Encrypted 256-bit SSL Session • Audit Logs Active
        </div>
      </div>
    </div>
  );
}

export default AdminLoginPage;
