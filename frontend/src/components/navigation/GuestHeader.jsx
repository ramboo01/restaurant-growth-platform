import { useContext, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';

function GuestHeader({ cartQuantity = 0, onCartClick }) {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  function handleLogout() {
    logout();
    setShowDropdown(false);
    navigate('/', { replace: true });
  }

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <header className="guest-header">
      <nav className="container d-flex align-items-center justify-content-between gap-3" aria-label="Guest navigation">
        <Link className="guest-brand" to="/">
          <span className="guest-brand-mark" aria-hidden="true">R</span>
          <span>RestruRent</span>
        </Link>

        <div className="guest-nav-links d-none d-md-flex">
          <NavLink className={({ isActive }) => `guest-nav-link ${isActive ? 'active' : ''}`} end to="/">
            Menu
          </NavLink>
          <NavLink className={({ isActive }) => `guest-nav-link ${isActive ? 'active' : ''}`} to="/rewards">
            Rewards
          </NavLink>
          <NavLink className={({ isActive }) => `guest-nav-link ${isActive ? 'active' : ''}`} to="/catering">
            Catering
          </NavLink>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button aria-label="Search menu" className="btn btn-light guest-icon-action d-none d-sm-inline-flex" type="button">
            <i className="bi bi-search" aria-hidden="true" />
          </button>

          {isAuthenticated ? (
            <div className="position-relative">
              <button
                className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2"
                onClick={() => setShowDropdown((prev) => !prev)}
                type="button"
                aria-expanded={showDropdown}
                aria-haspopup="true"
              >
                <span className="badge rounded-circle text-bg-primary" style={{ width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>
                  {initials}
                </span>
                <span className="d-none d-md-inline">{user?.name?.split(' ')[0]}</span>
                <i className="bi bi-chevron-down small" aria-hidden="true" />
              </button>

              {showDropdown ? (
                <>
                  <div className="position-fixed top-0 start-0 w-100 h-100" style={{ zIndex: 1050 }} onClick={() => setShowDropdown(false)} />
                  <div className="dropdown-menu show end-0 mt-1" style={{ position: 'absolute', right: 0, zIndex: 1051, minWidth: 200 }}>
                    <div className="px-3 py-2 border-bottom">
                      <p className="fw-semibold mb-0 small">{user?.name}</p>
                      <p className="text-secondary mb-0 small" style={{ fontSize: '0.75rem' }}>{user?.email}</p>
                    </div>
                    <Link className="dropdown-item small" to="/orders" onClick={() => setShowDropdown(false)}>
                      <i className="bi bi-receipt me-2" aria-hidden="true" />
                      My Orders
                    </Link>
                    <Link className="dropdown-item small" to="/rewards" onClick={() => setShowDropdown(false)}>
                      <i className="bi bi-star me-2" aria-hidden="true" />
                      Rewards
                    </Link>
                    <div className="dropdown-divider" />
                    <button className="dropdown-item small text-danger" onClick={handleLogout} type="button">
                      <i className="bi bi-box-arrow-right me-2" aria-hidden="true" />
                      Sign Out
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <Link className="btn btn-outline-secondary btn-sm d-none d-md-inline-flex" to="/signin">
              Sign in
            </Link>
          )}

          <button
            aria-label={`Cart with ${cartQuantity} items`}
            className="btn btn-dark btn-sm"
            onClick={onCartClick}
            type="button"
          >
            <i className="bi bi-bag me-sm-2" aria-hidden="true" />
            <span className="d-none d-sm-inline">Cart</span>
            <span className="badge text-bg-light ms-2">{cartQuantity}</span>
          </button>
        </div>
      </nav>
    </header>
  );
}

export default GuestHeader;
