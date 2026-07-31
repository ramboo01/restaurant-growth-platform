import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext.jsx';

function ProtectedRoute({ allowedRoles }) {
  const { loading, isAuthenticated, user } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-warning d-inline-block p-4 rounded-4 shadow-sm my-4" style={{ maxWidth: 520 }}>
          <i className="bi bi-shield-exclamation text-warning display-4 d-block mb-3"></i>
          <h4 className="fw-bold mb-2">Staff / Owner Access Required</h4>
          <p className="text-secondary small mb-3">
            You are currently signed in as <strong>{user?.name || user?.email}</strong> with role{' '}
            <span className="badge text-bg-secondary">{user?.role || 'Customer'}</span>.
            <br />
            This operational screen requires a <strong>{allowedRoles.join(' or ')}</strong> account.
          </p>
          <div className="d-flex justify-content-center gap-2">
            <a href="/login" className="btn btn-primary btn-sm px-3 fw-semibold">
              <i className="bi bi-box-arrow-in-right me-1"></i> Log in as Staff / Owner
            </a>
            <a href="/" className="btn btn-outline-secondary btn-sm px-3">
              Back to Menu
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;
