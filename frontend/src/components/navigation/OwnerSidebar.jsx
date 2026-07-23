import { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { currentLocation, currentOwner, ownerNavigationGroups } from '../../data/ownerDashboardData.js';
import { AuthContext } from '../../context/AuthContext.jsx';

function OwnerNavLinks({ mobile = false }) {
  return (
    <nav className="owner-nav" aria-label="Owner navigation">
      {ownerNavigationGroups.map((group) => (
        <div className="owner-nav-group" key={group.label}>
          <div className="owner-nav-label">{group.label}</div>
          <div className="nav nav-pills flex-column gap-1">
            {group.items.map((item) => (
              <NavLink
                className={({ isActive }) => `owner-nav-link nav-link ${isActive ? 'active' : ''}`}
                data-bs-dismiss={mobile ? 'offcanvas' : undefined}
                end={item.end}
                key={item.label}
                to={item.to}
              >
                <i className={`bi ${item.icon}`} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

function OwnerUserSummary() {
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  const name = user?.name || currentOwner.name;
  const role = user?.role || currentOwner.role;
  const initials = name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="owner-user-summary">
      <div className="d-flex align-items-center gap-2 mb-3">
        <div className="owner-avatar" aria-hidden="true">
          {initials || 'AM'}
        </div>
        <div>
          <div className="fw-semibold">{name}</div>
          <div className="text-secondary small">{role}</div>
        </div>
      </div>
      <div className="small text-secondary mb-3">
        <div>Location:</div>
        <div className="fw-semibold text-body">{currentLocation.name}</div>
      </div>
      <button className="btn btn-outline-secondary btn-sm w-100" onClick={handleLogout} type="button">
        <i className="bi bi-box-arrow-right me-2" aria-hidden="true" />
        Sign out
      </button>
    </div>
  );
}

function OwnerSidebar() {
  return (
    <>
      <aside className="owner-sidebar d-none d-lg-flex">
        <div className="owner-sidebar-inner">
          <div className="owner-brand">
            <div className="owner-brand-mark" aria-hidden="true">
              R
            </div>
            <div>
              <div className="fw-bold">RestruRent</div>
              <div className="text-secondary small">Growth Platform</div>
            </div>
          </div>
          <OwnerNavLinks />
          <OwnerUserSummary />
        </div>
      </aside>

      <div
        aria-labelledby="ownerMobileNavLabel"
        className="offcanvas offcanvas-start owner-offcanvas"
        id="ownerMobileNav"
        tabIndex="-1"
      >
        <div className="offcanvas-header border-bottom">
          <div className="owner-brand mb-0">
            <div className="owner-brand-mark" aria-hidden="true">
              R
            </div>
            <div>
              <h2 className="h6 mb-0" id="ownerMobileNavLabel">
                RestruRent
              </h2>
              <div className="text-secondary small">Growth Platform</div>
            </div>
          </div>
          <button aria-label="Close navigation" className="btn-close" data-bs-dismiss="offcanvas" type="button" />
        </div>
        <div className="offcanvas-body d-flex flex-column">
          <OwnerNavLinks mobile />
          <OwnerUserSummary />
        </div>
      </div>
    </>
  );
}

export default OwnerSidebar;
