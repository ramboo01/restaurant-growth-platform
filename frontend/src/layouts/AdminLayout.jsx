import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

function AdminLayout() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext) || {};

  const handleLogout = () => {
    if (logout) logout();
    navigate('/login');
  };

  const navSections = [
    {
      label: 'Platform Overview',
      items: [
        { to: '/admin', label: 'Dashboard', icon: 'bi-speedometer2', end: true },
        { to: '/admin/guests', label: 'Guest Merge Queue', icon: 'bi-people' },
      ]
    },
    {
      label: 'Infrastructure & APIs',
      items: [
        { to: '/admin/sync', label: 'Channel Sync Health', icon: 'bi-diagram-3' },
        { to: '/admin/support', label: 'Support & Tickets', icon: 'bi-envelope-paper' },
      ]
    },
    {
      label: 'Operations & Audits',
      items: [
        { to: '/admin/onboarding', label: 'Onboarding Specialist', icon: 'bi-box-arrow-in-right' },
        { to: '/admin/audit', label: 'Platform Audit Log', icon: 'bi-journal-text' },
      ]
    }
  ];

  return (
    <div className="app-min-vh d-flex flex-column flex-lg-row">
      <aside className="app-sidebar bg-dark text-white p-0 d-flex flex-column" style={{ minWidth: '240px' }}>
        <div className="p-3 border-bottom border-secondary">
          <div className="fw-bold text-white fs-5">
            <i className="bi bi-shield-lock-fill text-danger me-2"></i> RestruRent
          </div>
          <div className="text-white-50 small">Internal Support Console</div>
        </div>
        <nav className="flex-grow-1 overflow-auto py-3">
          {navSections.map(section => (
            <div key={section.label} className="mb-3">
              <div className="px-3 text-secondary text-uppercase small fw-semibold mb-1" style={{ fontSize: '0.65rem' }}>
                {section.label}
              </div>
              {section.items.map((item, idx) => (
                <NavLink
                  key={`${item.to}-${idx}`}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `d-flex align-items-center gap-2 px-3 py-2 text-decoration-none small ${isActive ? 'bg-primary text-white' : 'text-white-50'}`
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
      <div className="app-layout-main flex-grow-1 d-flex flex-column bg-light">
        <header className="border-bottom bg-white px-3 px-lg-4 py-3 d-flex justify-content-between align-items-center">
          <span className="fw-semibold text-dark">
            <i className="bi bi-lock-fill text-danger me-2"></i> Security Level: Root Admin Access
          </span>
          {user && (
            <span className="text-muted small">
              Logged in as: <strong>{user.firstName || user.email}</strong>
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
