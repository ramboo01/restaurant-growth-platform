import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import PortalBar from '../components/navigation/PortalBar.jsx';

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext) || {};

  const handleLogout = () => {
    if (logout) logout();
    navigate('/login');
  };

  const handleMobileNavClick = (to) => {
    navigate(to);
    // Programmatically close the Bootstrap offcanvas drawer
    const closeBtn = document.querySelector('#adminMobileNav .btn-close');
    if (closeBtn) {
      closeBtn.click();
    }
  };

  const navSections = [
    {
      label: 'Platform Overview',
      items: [
        { to: '/admin', label: 'Dashboard', icon: 'bi-speedometer2', end: true },
        { to: '/admin/restaurants', label: 'Tenants & Locations', icon: 'bi-shop' },
        { to: '/admin/users', label: 'User & Role Matrix', icon: 'bi-people' },
      ]
    },
    {
      label: 'Infrastructure & Security',
      items: [
        { to: '/admin/reports', label: 'Platform Reports & GMV', icon: 'bi-graph-up-arrow' },
        { to: '/admin/ecosystem', label: 'Ecosystem & Channels Hub', icon: 'bi-arrow-repeat' },
        { to: '/admin/monitoring', label: 'System Health Monitor', icon: 'bi-hdd-network' },
        { to: '/admin/security', label: 'Security & 2FA Governance', icon: 'bi-shield-lock-fill' },
      ]
    },
    {
      label: 'Compliance & Governance',
      items: [
        { to: '/admin/privacy-console', label: 'GDPR Privacy Console', icon: 'bi-person-lock' },
        { to: '/admin/financial-compliance', label: 'Financial Settlements', icon: 'bi-bank' },
        { to: '/admin/audit-logs', label: 'Platform Audit Log', icon: 'bi-journal-text' },
      ]
    },
    {
      label: 'Operations & Support',
      items: [
        { to: '/admin/support', label: 'Support & Tickets', icon: 'bi-envelope-paper' },
      ]
    }
  ];

  return (
    <div className="admin-shell app-min-vh">
      {/* Desktop Sidebar (visible on large screens only) */}
      <aside className="admin-sidebar d-none d-lg-flex bg-dark text-white p-0 flex-column" style={{ width: '260px' }}>
        <div className="p-3 border-bottom border-secondary">
          <div className="fw-bold text-white fs-5">
            <i className="bi bi-shield-lock-fill text-danger me-2"></i> RestruRent
          </div>
          <div className="text-white-50 small">Internal Support Console</div>
        </div>
        <nav className="flex-grow-1 overflow-auto py-3">
          {navSections.map(section => (
            <div key={section.label} className="mb-3">
              <div className="px-3 text-secondary text-uppercase small fw-semibold mb-1" style={{ fontSize: '0.65rem', letterSpacing: '0.04em' }}>
                {section.label}
              </div>
              {section.items.map((item, idx) => (
                <NavLink
                  key={`${item.to}-${idx}`}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `d-flex align-items-center gap-2 px-3 py-2 text-decoration-none small admin-nav-link ${isActive ? 'active text-white' : 'text-white-50'}`
                  }
                >
                  <i className={`bi ${item.icon}`}></i>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="p-3 border-top border-secondary">
          <button className="btn btn-outline-secondary btn-sm w-100" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right me-1"></i> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Offcanvas Sidebar (visible on smaller screens when toggled) */}
      <div
        aria-labelledby="adminMobileNavLabel"
        className="offcanvas offcanvas-start bg-dark text-white admin-offcanvas"
        id="adminMobileNav"
        tabIndex="-1"
        style={{ width: '280px' }}
      >
        <div className="offcanvas-header border-bottom border-secondary">
          <div>
            <div className="fw-bold text-white fs-5" id="adminMobileNavLabel">
              <i className="bi bi-shield-lock-fill text-danger me-2"></i> RestruRent
            </div>
            <div className="text-white-50 small">Internal Support Console</div>
          </div>
          <button aria-label="Close navigation" className="btn-close btn-close-white" data-bs-dismiss="offcanvas" type="button" />
        </div>
        <div className="offcanvas-body d-flex flex-column p-0">
          <nav className="flex-grow-1 overflow-auto py-3">
            {navSections.map(section => (
              <div key={section.label} className="mb-3">
                <div className="px-3 text-secondary text-uppercase small fw-semibold mb-1" style={{ fontSize: '0.65rem', letterSpacing: '0.04em' }}>
                  {section.label}
                </div>
                {section.items.map((item, idx) => {
                  const isActive = item.to === '/admin'
                    ? location.pathname === '/admin'
                    : location.pathname.startsWith(item.to);
                  return (
                    <button
                      key={`${item.to}-${idx}`}
                      onClick={() => handleMobileNavClick(item.to)}
                      className={`w-100 border-0 bg-transparent text-start d-flex align-items-center gap-2 px-3 py-2 text-decoration-none small admin-nav-link ${isActive ? 'active text-white' : 'text-white-50'}`}
                      style={{ outline: 'none' }}
                    >
                      <i className={`bi ${item.icon}`}></i>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
          <div className="p-3 border-top border-secondary">
            <button className="btn btn-outline-secondary btn-sm w-100" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-1"></i> Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Shell */}
      <div className="admin-content-shell flex-grow-1">
        <PortalBar />
        <header className="border-bottom bg-white px-3 px-lg-4 py-3 d-flex justify-content-between align-items-center shadow-sm">
          <div className="d-flex align-items-center gap-2">
            <button
              aria-controls="adminMobileNav"
              aria-label="Open admin navigation"
              className="btn btn-outline-secondary btn-sm d-lg-none"
              data-bs-target="#adminMobileNav"
              data-bs-toggle="offcanvas"
              type="button"
            >
              <i className="bi bi-list fs-5" aria-hidden="true" />
            </button>
            <span className="fw-semibold text-dark d-flex align-items-center gap-2">
              <i className="bi bi-lock-fill text-danger"></i>
              <span className="d-none d-sm-inline">Security Level:</span>
              <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25">Root Admin</span>
            </span>
          </div>
          {user && (
            <span className="text-muted small d-none d-sm-inline-block">
              <span>Logged in as: </span>
              <strong>{user.firstName || user.email}</strong>
              <span className="badge bg-danger bg-opacity-10 text-danger ms-2">{user.role || 'Admin'}</span>
            </span>
          )}
        </header>
        <main className="flex-grow-1 p-3 p-lg-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
