import { Link, Outlet } from 'react-router-dom';

function StaffLayout() {
  return (
    <div className="app-min-vh d-flex flex-column">
      <header className="bg-dark text-white px-3 px-lg-4 py-3">
        <div className="d-flex justify-content-between align-items-center">
          <span className="fw-semibold">Staff Operations</span>
          <Link className="btn btn-outline-light btn-sm" to="/staff/orders">
            Order Queue
          </Link>
        </div>
      </header>
      <main className="flex-grow-1 p-3 p-lg-4">
        <Outlet />
      </main>
    </div>
  );
}

export default StaffLayout;
