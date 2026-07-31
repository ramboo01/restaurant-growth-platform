import { Outlet } from 'react-router-dom';
import OwnerHeader from '../components/navigation/OwnerHeader.jsx';
import OwnerSidebar from '../components/navigation/OwnerSidebar.jsx';
import PortalBar from '../components/navigation/PortalBar.jsx';
import '../styles/owner.css';

function OwnerLayout() {
  return (
    <div className="owner-shell app-min-vh">
      <OwnerSidebar />
      <div className="owner-content-shell">
        <PortalBar />
        <OwnerHeader />
        <main className="owner-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default OwnerLayout;
