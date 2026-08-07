import { useContext } from 'react';
import { Navigate, Outlet, useLocation, useOutletContext } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';

/**
 * GuestAuthRoute - Protects guest storefront pages.
 * If user is NOT logged in → redirect to /signin
 * If user IS logged in → allow access to the page
 */
function GuestAuthRoute() {
  const { loading, isAuthenticated } = useContext(AuthContext);
  const location = useLocation();
  const context = useOutletContext();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Save where user was trying to go, so we can redirect after login
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  return <Outlet context={context} />;
}

export default GuestAuthRoute;
