import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

function StaffLayout() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext) || {};

  const handleLogout = () => {
    if (logout) logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/staff', label: 'Dashboard', icon: 'bi-speedometer2', end: true },
    { to: '/staff/orders', label: 'Order Queue', icon: 'bi-receipt' },
    { to: '/staff/kitchen', label: 'Kitchen Display', icon: 'bi-fire' },
    { to: '/staff/86-board', label: "86'd Items", icon: 'bi-slash-circle' },
    { to: '/staff/guest-lookup', label: 'Guest Lookup', icon: 'bi-person-search' },
    { to: '/staff/inventory', label: 'Stock Counts', icon: 'bi-boxes' },
  ];

  return (
    <div className="app-min-vh d-flex flex-column">
      <header className="bg-dark text-white px-3 px-lg-4 py-3 shadow-sm">
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <span className="fw-bold fs-5">
              <i className="bi bi-egg-fried text-warning me-2"></i>Staff Operations
            </span>
            <div className="d-none d-md-flex gap-2 ms-3">
              {navLinks.map(link => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `btn btn-sm d-flex align-items-center gap-1 ${isActive ? 'btn-light text-dark' : 'btn-outline-light'}`
                  }
                >
                  <i className={`bi ${link.icon}`}></i>
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
            {user && (
              <span className="text-secondary small d-none d-md-inline">
                {user.firstName || user.email}
              </span>
            )}
            <button className="btn btn-outline-secondary btn-sm" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-1"></i> Logout
            </button>
          </div>
        </div>
        {/* Mobile nav */}
        <div className="d-flex d-md-none gap-2 mt-2 pt-2 border-top border-secondary">
          {navLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `btn btn-sm flex-fill text-center ${isActive ? 'btn-light text-dark' : 'btn-outline-light'}`
              }
            >
              <i className={`bi ${link.icon} d-block`}></i>
              <span style={{ fontSize: '0.65rem' }}>{link.label}</span>
            </NavLink>
          ))}
        </div>
      </header>
      <main className="flex-grow-1 p-3 p-lg-4">
        <Outlet />
      </main>
    </div>
  );
}

export default StaffLayout;
