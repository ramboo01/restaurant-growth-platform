import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext.jsx';

function AdminRoute() {
  const { loading, isAuthenticated, user } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-dark text-white">
        <div className="text-center">
          <div className="spinner-border text-danger mb-2" role="status">
            <span className="visually-hidden">Authenticating Admin...</span>
          </div>
          <div className="small text-muted">Verifying Platform Admin Permissions...</div>
        </div>
      </div>
    );
  }

  // If not logged in, redirect directly to /admin/login
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  // If logged in but NOT an Admin, redirect to /admin/login with error message
  if (user?.role !== 'Admin') {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{
          error: `Access Denied: You are logged in as "${user?.email}" (${user?.role}). Only Platform Super Admins can access the Admin Console.`
        }}
      />
    );
  }

  return <Outlet />;
}

export default AdminRoute;
