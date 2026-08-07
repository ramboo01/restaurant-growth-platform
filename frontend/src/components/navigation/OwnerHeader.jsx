import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../../services/notificationService.js';
import { AuthContext } from '../../context/AuthContext.jsx';
import { useRestaurant } from '../../context/RestaurantContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import api from '../../services/api.js';

function OwnerHeader() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const { activeRestaurantId, activeRestaurant, restaurants, switchRestaurant } = useRestaurant();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [restaurantName, setRestaurantName] = useState('My Restaurant');
  const [liveLocation, setLiveLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);

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

  const [restaurantStatus, setRestaurantStatus] = useState('Active');

  useEffect(() => {
    if (!activeRestaurantId) return;
    api.get(`/api/restaurants/${activeRestaurantId}`)
      .then((res) => {
        const rest = res.data?.data?.restaurant || res.data?.data || res.data || {};
        if (rest.name) setRestaurantName(rest.name);
        if (rest.status) setRestaurantStatus(rest.status);
      })
      .catch(() => {
        // fallback to default name silently
      });
  }, [activeRestaurantId]);

  // Live GPS location detection
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await response.json();
          const addr = data.address || {};
          const area = addr.suburb || addr.neighbourhood || addr.village || addr.town || addr.city_district || '';
          const city = addr.city || addr.state_district || addr.state || '';
          const locationText = [area, city].filter(Boolean).join(', ') || data.display_name?.split(',').slice(0, 2).join(',') || 'Location detected';
          setLiveLocation(locationText);
        } catch {
          setLiveLocation(null);
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        setLocationLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
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
          <i className="bi bi-geo-alt-fill text-danger fs-6" aria-hidden="true" />
          <div className="dropdown">
            <div className="text-secondary small lh-sm fw-medium d-flex align-items-center gap-1">
              <span>{locationLoading ? 'Detecting location...' : (liveLocation || 'Mansarovar, Jaipur')}</span>
              <span className="badge text-bg-success-subtle text-success border border-success-subtle p-0 px-1" style={{ fontSize: '0.65rem' }}>LIVE</span>
            </div>
            <button
              className="btn btn-link btn-sm p-0 fw-semibold text-body text-decoration-none dropdown-toggle"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              {restaurantName}
              {restaurantStatus === 'Suspended' && (
                <span className="badge bg-danger text-white ms-2" style={{ fontSize: '0.7rem' }}>
                  <i className="bi bi-slash-circle me-1"></i>SUSPENDED BY ADMIN
                </span>
              )}
            </button>
            <ul className="dropdown-menu shadow border-0 mt-1" style={{ minWidth: '300px' }}>
              {restaurants.length > 1 && (
                <>
                  <li className="px-3 pt-2 pb-1">
                    <div className="text-secondary fw-semibold" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>SWITCH RESTAURANT</div>
                  </li>
                  {restaurants.map(r => (
                    <li key={r.id}>
                      <button
                        className={`dropdown-item d-flex align-items-center gap-2 py-2 ${r.id === activeRestaurantId ? 'active' : ''}`}
                        onClick={() => { switchRestaurant(r.id); window.location.reload(); }}
                      >
                        <i className={`bi ${r.id === activeRestaurantId ? 'bi-check-circle-fill text-success' : 'bi-shop'}`} />
                        <div>
                          <div className="small fw-semibold">{r.name}</div>
                          <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                            {r.status === 'Active' ? '🟢' : r.status === 'Inactive' ? '🔴' : '🟡'} {r.status} · ID #{r.id}
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                  <li><hr className="dropdown-divider my-1" /></li>
                </>
              )}
              <li className="px-3 py-2">
                <div className="d-flex align-items-center gap-2">
                  <i className={`bi ${locationLoading ? 'bi-arrow-repeat' : 'bi-geo-alt-fill'} ${liveLocation ? 'text-success' : 'text-secondary'}`} aria-hidden="true" />
                  <div>
                    <div className="text-secondary" style={{ fontSize: '0.7rem' }}>LIVE GPS LOCATION</div>
                    <span className="small fw-medium">
                      {locationLoading ? 'Detecting...' : liveLocation || 'Location unavailable'}
                    </span>
                  </div>
                </div>
              </li>
            </ul>
          </div>
          {liveLocation && (
            <div className="text-secondary" style={{ fontSize: '0.65rem', marginTop: '1px' }}>
              <i className="bi bi-broadcast text-success me-1" style={{ fontSize: '0.6rem' }} aria-hidden="true" />
              {liveLocation}
            </div>
          )}
        </div>

        <div className="d-md-none">
          <div className="fw-semibold">{restaurantName}</div>
          <div className="text-secondary small">
            {locationLoading ? 'Detecting location...' : liveLocation || 'Owner Dashboard'}
          </div>
        </div>
      </div>

      <div className="d-flex align-items-center gap-2">
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
