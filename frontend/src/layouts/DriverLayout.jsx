import { Outlet } from 'react-router-dom';

function DriverLayout() {
  return (
    <div className="app-min-vh d-flex flex-column">
      <header className="bg-white border-bottom px-3 py-3 sticky-top">
        <div className="d-flex justify-content-between align-items-center">
          <span className="fw-semibold">Driver</span>
          <span className="badge text-bg-secondary">Foundation</span>
        </div>
      </header>
      <main className="flex-grow-1 p-3">
        <Outlet />
      </main>
    </div>
  );
}

export default DriverLayout;
