import { Outlet } from 'react-router-dom';

function AdminLayout() {
  return (
    <div className="app-min-vh d-flex flex-column flex-lg-row">
      <aside className="app-sidebar bg-dark text-white p-3">
        <div className="fw-semibold">Platform Admin</div>
        <div className="text-white-50 small">Sidebar placeholder</div>
      </aside>
      <div className="app-layout-main flex-grow-1 d-flex flex-column">
        <header className="border-bottom bg-white px-3 px-lg-4 py-3">
          <span className="fw-semibold">Admin header placeholder</span>
        </header>
        <main className="flex-grow-1 p-3 p-lg-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
