import { Link, NavLink } from 'react-router-dom';

function GuestHeader({ cartQuantity = 0, onCartClick }) {
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
          <Link className="btn btn-outline-secondary btn-sm d-none d-md-inline-flex" to="/login">
            Sign in
          </Link>
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
