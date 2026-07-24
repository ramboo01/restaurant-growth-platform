import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { currentLocation } from '../../data/ownerDashboardData.js';
import { notificationService } from '../../services/notificationService.js';
import { AuthContext } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';

function OwnerHeader() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await notificationService.getNotifications();
      const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      setNotifications(list);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch notifications.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNewOrderNotification = () => {
      console.log('[OwnerHeader] Socket newOrder event caught. Refreshing notifications.');
      fetchNotifications();
    };

    socket.on('newOrder', handleNewOrderNotification);
    return () => {
      socket.off('newOrder', handleNewOrderNotification);
    };
  }, [socket]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      await fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getUserInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="owner-header">
      <div className="d-flex align-items-center gap-3">
        <button
          aria-controls="ownerMobileNav"
          aria-label="Open owner navigation"
          className="btn btn-outline-secondary btn-sm d-lg-none"
          data-bs-target="#ownerMobileNav"
          data-bs-toggle="offcanvas"
          type="button"
        >
          <i className="bi bi-list fs-5" aria-hidden="true" />
        </button>

        <div className="d-none d-md-flex align-items-center gap-2 owner-location-selector">
          <i className="bi bi-geo-alt text-secondary" aria-hidden="true" />
          <div>
            <div className="text-secondary small lh-sm">Current location</div>
            <button className="btn btn-link btn-sm p-0 fw-semibold text-body text-decoration-none" type="button">
              {currentLocation.name}
              <i className="bi bi-chevron-down ms-1 small" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="d-md-none">
          <div className="fw-semibold">Owner Dashboard</div>
          <div className="text-secondary small">{currentLocation.name}</div>
        </div>
      </div>

      <div className="d-flex align-items-center gap-2">
        <button aria-label="Search" className="btn btn-light owner-icon-button d-none d-sm-inline-flex" type="button">
          <i className="bi bi-search" aria-hidden="true" />
        </button>
        <div className="dropdown d-inline-block">
          <button 
            aria-label={`${unreadCount} notifications`} 
            className="btn btn-light owner-icon-button position-relative" 
            type="button"
            data-bs-toggle="dropdown"
          >
            <i className="bi bi-bell" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill text-bg-danger">
                {unreadCount}
              </span>
            )}
          </button>
          <div className="dropdown-menu dropdown-menu-end shadow p-0" style={{ width: '320px', zIndex: 1050 }}>
            <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-light">
              <h6 className="mb-0">Notifications</h6>
            </div>
            <div className="list-group list-group-flush" style={{ maxHeight: '350px', overflowY: 'auto' }}>
              {isLoading ? (
                <div className="text-center p-4">
                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="text-center text-danger p-4 small">{error}</div>
              ) : notifications.length ? (
                notifications.map((notif) => (
                  <div key={notif.id || notif._id} className={`list-group-item p-3 ${notif.isRead ? 'bg-light text-muted' : ''}`}>
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <strong className="small">{notif.title}</strong>
                      {!notif.isRead && (
                        <button className="btn btn-link btn-sm p-0 text-decoration-none small" onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notif.id || notif._id); }}>
                          Mark read
                        </button>
                      )}
                    </div>
                    <div className="small mb-1">{notif.message}</div>
                    <div className="small text-secondary">{notif.time || notif.createdAt}</div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted p-4 small">No notifications found.</div>
              )}
            </div>
          </div>
        </div>

        <div className="dropdown d-inline-block">
          <button 
            aria-label={`${user?.name || 'User'} account menu`} 
            className="btn owner-avatar-button dropdown-toggle-split" 
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            {getUserInitials(user?.name)}
          </button>
          <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2">
            <li className="px-3 py-2 border-bottom">
              <div className="fw-semibold text-truncate" style={{ maxWidth: '180px' }}>{user?.name || 'Owner'}</div>
              <div className="text-muted small text-truncate" style={{ maxWidth: '180px' }}>{user?.email}</div>
              <span className="badge bg-primary-subtle text-primary mt-1">{user?.role || 'Owner'}</span>
            </li>
            <li>
              <button className="dropdown-menu-item text-danger dropdown-item d-flex align-items-center gap-2 mt-1" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right" /> Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}

export default OwnerHeader;
