import { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import NotificationBell from './NotificationBell.jsx';

// All available portals with role-based access control
const ALL_PORTALS = [
  { label: 'Customer Menu', path: '/',               icon: 'bi-shop',       roles: ['Admin'] },
  { label: 'Owner Portal',  path: '/owner',          icon: 'bi-building',   roles: ['Owner', 'Manager', 'Admin'] },
  { label: 'Kitchen KDS',   path: '/staff/kitchen',  icon: 'bi-egg-fried',  roles: ['Staff', 'Owner', 'Manager', 'Admin'] },
  { label: 'Driver App',    path: '/driver/orders',  icon: 'bi-truck',      roles: ['Driver', 'Admin'] },
  { label: 'Admin Panel',   path: '/admin',          icon: 'bi-shield-lock', roles: ['Admin'] },
];

function PortalBar() {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useContext(AuthContext);

  // Filter portals based on current user's role
  const visiblePortals = ALL_PORTALS.filter((portal) =>
    portal.roles.includes(user?.role)
  );

  return (
    <div className="bg-dark text-white py-1 px-2 px-sm-3 border-bottom border-secondary border-opacity-25 portal-bar-wrapper position-relative" style={{ fontSize: '0.8rem', zIndex: 1050, maxWidth: '100%' }}>
      <div className="container-fluid d-flex align-items-center justify-content-between gap-2 px-1">
        <div className="d-flex align-items-center gap-1 overflow-x-auto py-1 mw-100" style={{ scrollbarWidth: 'none' }}>
          <span className="text-secondary me-2 fw-semibold d-none d-md-inline" style={{ fontSize: '0.75rem' }}>
            <i className="bi bi-grid-3x3-gap-fill me-1"></i> PORTAL SWITCHER:
          </span>
          {visiblePortals.map((portal) => {
            const isActive = portal.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(portal.path);

            return (
              <Link
                key={portal.path}
                to={portal.path}
                className={`btn btn-sm rounded-pill px-2 py-0 text-nowrap d-inline-flex align-items-center gap-1 ${
                  isActive ? 'btn-primary fw-bold text-white' : 'btn-outline-light text-white-50 border-0'
                }`}
                style={{ fontSize: '0.78rem' }}
              >
                <i className={`bi ${portal.icon}`}></i>
                <span>{portal.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="d-flex align-items-center gap-2 text-nowrap ms-auto">
          <NotificationBell />
          {isAuthenticated ? (
            <div className="d-flex align-items-center gap-2">
              <span className="badge text-bg-warning rounded-pill text-nowrap" style={{ fontSize: '0.7rem' }}>
                Role: {user?.role || 'User'}
              </span>
              <span className="text-light d-none d-sm-inline">{user?.name}</span>
              <button
                className="btn btn-link text-white-50 p-0 text-decoration-none ms-1"
                onClick={logout}
                style={{ fontSize: '0.78rem' }}
                title="Sign Out"
              >
                <i className="bi bi-box-arrow-right me-1"></i> Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default PortalBar;

