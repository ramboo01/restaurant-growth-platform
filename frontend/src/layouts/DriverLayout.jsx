import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import PortalBar from '../components/navigation/PortalBar.jsx';

function DriverLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-min-vh d-flex flex-column bg-light pb-5 pb-md-0">
      <PortalBar />
      <header className="bg-dark text-white px-3 py-2 sticky-top shadow-sm">
        <div className="container-fluid d-flex justify-content-between align-items-center" style={{ maxWidth: '1000px' }}>
          <div className="d-flex align-items-center gap-2">
            <div className="bg-primary text-white p-1 px-2 rounded-3 fw-bold">
              <i className="bi bi-truck"></i>
            </div>
            <span className="fw-bold text-white fs-5">RestruRent Driver</span>
          </div>

          <div className="d-flex align-items-center gap-3">
            <span className="text-white-50 small d-none d-sm-inline">
              <i className="bi bi-person-circle me-1"></i> {user?.name || 'Alex (Driver)'}
            </span>
            <button onClick={logout} className="btn btn-outline-light btn-sm px-2 py-1">
              <i className="bi bi-box-arrow-right me-1"></i> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow-1">
        <Outlet />
      </main>

      {/* Mobile-First Bottom Navigation Bar */}
      <nav className="navbar fixed-bottom bg-white border-top shadow-lg p-0 d-md-none">
        <div className="container-fluid d-flex justify-content-around p-0">
          <NavLink 
            to="/driver" 
            end
            className={({ isActive }) => `flex-fill text-center py-2 text-decoration-none ${isActive ? 'text-primary border-top border-3 border-primary fw-bold' : 'text-muted'}`}
          >
            <i className="bi bi-speedometer2 d-block fs-5"></i>
            <span className="extra-small">Dashboard</span>
          </NavLink>

          <NavLink 
            to="/driver/orders" 
            className={({ isActive }) => `flex-fill text-center py-2 text-decoration-none ${isActive ? 'text-primary border-top border-3 border-primary fw-bold' : 'text-muted'}`}
          >
            <i className="bi bi-box-seam d-block fs-5"></i>
            <span className="extra-small">Orders</span>
          </NavLink>

          <NavLink 
            to="/driver/profile" 
            className={({ isActive }) => `flex-fill text-center py-2 text-decoration-none ${isActive ? 'text-primary border-top border-3 border-primary fw-bold' : 'text-muted'}`}
          >
            <i className="bi bi-person-badge d-block fs-5"></i>
            <span className="extra-small">Earnings</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}

export default DriverLayout;

