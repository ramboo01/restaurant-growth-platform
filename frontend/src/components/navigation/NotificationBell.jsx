import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';

function NotificationBell() {
  const { user } = useContext(AuthContext);
  const socketContext = useSocket();
  const socket = socketContext?.socket;

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [claimedCode, setClaimedCode] = useState('');

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/api/notifications', {
        params: { userId: user?.id, limit: 20 }
      });

      const list = response.data?.data?.items || response.data?.data || response.data || [];
      const notifArray = Array.isArray(list) ? list : [];
      setNotifications(notifArray);
      setUnreadCount(notifArray.filter((n) => !n.isRead && !n.is_read).length);
    } catch (err) {
      console.error('[NotificationBell] Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    if (!socket) return;

    // Socket.IO real-time listener for live broadcasts & status updates
    const handleBroadcast = (data) => {
      console.log('[NotificationBell] Real-time notification received:', data);
      setNotifications((prev) => [data, ...prev]);
      setUnreadCount((c) => c + 1);
    };

    socket.on('CAMPAIGN_BROADCAST', handleBroadcast);
    socket.on('NEW_ORDER', fetchNotifications);
    socket.on('ORDER_STATUS_CHANGED', fetchNotifications);

    return () => {
      socket.off('CAMPAIGN_BROADCAST', handleBroadcast);
      socket.off('NEW_ORDER', fetchNotifications);
      socket.off('ORDER_STATUS_CHANGED', fetchNotifications);
    };
  }, [user, socket]);

  const handleMarkAllRead = async (e) => {
    if (e) e.stopPropagation();
    try {
      await api.patch('/api/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark notifications read:', err);
    }
  };

  const handleNotificationClick = async (n) => {
    setSelectedNotif(n);
    setIsOpen(false);

    if (!n.isRead && !n.is_read) {
      try {
        await api.patch(`/api/notifications/${n.id}/read`);
        setNotifications((prev) =>
          prev.map((item) => (item.id === n.id ? { ...item, isRead: true, is_read: true } : item))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (err) {
        console.error('Failed to mark notification read:', err);
      }
    }
  };

  const [copiedCode, setCopiedCode] = useState('');

  const handleCopyCode = (code, e) => {
    if (e) e.stopPropagation();
    if (!code) return;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code);
      }
    } catch (err) {
      console.log('Clipboard fallback:', err);
    }

    localStorage.setItem('activePromoCode', code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 3000);
  };

  return (
    <div className="position-relative d-inline-block me-2" style={{ zIndex: 1075 }}>
      {/* Bell Icon Button */}
      <button
        type="button"
        className="btn btn-light rounded-circle p-2 position-relative shadow-sm border"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        title="Notifications"
        style={{ width: '38px', height: '38px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <i className="bi bi-bell-fill text-warning fs-6"></i>
        {unreadCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger shadow-sm border border-light" style={{ fontSize: '0.65rem' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Copy Code Toast */}
      {copiedCode && (
        <div
          className="position-fixed bottom-0 end-0 m-3 alert alert-success shadow-lg border-0 py-2.5 px-3 fw-bold"
          style={{ zIndex: 1200 }}
        >
          <i className="bi bi-clipboard-check-fill me-2 text-success fs-5"></i>
          Promo Code <code>{copiedCode}</code> copied to clipboard & ready for checkout!
        </div>
      )}

      {/* Backdrop for Closing Dropdown */}
      {isOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{ zIndex: 1070 }}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className="card position-absolute end-0 mt-2 shadow-lg border-0 rounded-3 overflow-hidden"
          style={{ width: '350px', maxWidth: '92vw', zIndex: 1080 }}
        >
          <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center py-2 px-3">
            <h6 className="mb-0 fw-bold fs-6">
              <i className="bi bi-bell-fill me-2 text-warning"></i> Notifications
            </h6>
            {unreadCount > 0 && (
              <button
                className="btn btn-link btn-sm text-warning p-0 text-decoration-none fw-semibold small"
                onClick={handleMarkAllRead}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="card-body p-0 overflow-y-auto" style={{ maxHeight: '380px' }}>
            {notifications.length === 0 ? (
              <div className="text-center py-4 text-muted small">
                <i className="bi bi-inbox fs-3 d-block mb-1 opacity-50"></i>
                No notifications yet
              </div>
            ) : (
              <div className="list-group list-group-flush">
                {notifications.map((n) => {
                  const isUnread = !n.isRead && !n.is_read;
                  const discountCode = n.discountCode || n.discount_code;

                  return (
                    <div
                      key={n.id || Math.random()}
                      className={`list-group-item list-group-item-action p-3 cursor-pointer transition-all ${
                        isUnread ? 'bg-primary bg-opacity-10 border-start border-primary border-3' : ''
                      }`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleNotificationClick(n)}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <span className="fw-bold small text-dark me-2">
                          {isUnread && <span className="badge bg-primary me-1 py-0.5">NEW</span>}
                          {n.title}
                        </span>
                        {n.createdAt && (
                          <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      <p className="mb-2 text-secondary small text-truncate" style={{ fontSize: '0.82rem', maxWidth: '300px' }}>
                        {n.message}
                      </p>

                      {discountCode && (
                        <div className="d-flex align-items-center justify-content-between bg-body-tertiary p-1.5 rounded border mt-1">
                          <span className="small fw-semibold text-muted" style={{ fontSize: '0.75rem' }}>Promo Code:</span>
                          <div className="d-flex align-items-center gap-1.5">
                            <code className="fw-bold text-primary px-1.5 py-0.5 bg-white border rounded small">
                              {discountCode}
                            </code>
                            <button
                              type="button"
                              className="btn btn-sm btn-primary py-0 px-2.5 fw-semibold d-inline-flex align-items-center gap-1"
                              style={{ fontSize: '0.75rem' }}
                              onClick={(e) => handleCopyCode(discountCode, e)}
                            >
                              <i className={`bi bi-${copiedCode === discountCode ? 'check-lg text-white' : 'clipboard'}`}></i>
                              {copiedCode === discountCode ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full Notification Detail Modal */}
      {selectedNotif && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1150 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-3">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-bell-fill text-warning me-2"></i>
                  {selectedNotif.title}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedNotif(null)}
                ></button>
              </div>

              <div className="modal-body p-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <span className="badge bg-primary px-2.5 py-1">
                    {selectedNotif.type || 'CAMPAIGN'}
                  </span>
                  {selectedNotif.createdAt && (
                    <span className="text-muted small">
                      {new Date(selectedNotif.createdAt).toLocaleString()}
                    </span>
                  )}
                </div>

                <div className="p-3 bg-body-tertiary rounded-3 border mb-3">
                  <p className="mb-0 text-dark" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                    {selectedNotif.message}
                  </p>
                </div>

                {(selectedNotif.discountCode || selectedNotif.discount_code) && (
                  <div className="alert alert-success d-flex align-items-center justify-content-between m-0 p-3 shadow-sm border-0">
                    <div>
                      <div className="small text-muted fw-semibold mb-0.5">EXCLUSIVE PROMO CODE</div>
                      <code className="fs-5 fw-bold text-success">
                        {selectedNotif.discountCode || selectedNotif.discount_code}
                      </code>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary fw-bold shadow-sm"
                      onClick={(e) => {
                        handleCopyCode(selectedNotif.discountCode || selectedNotif.discount_code, e);
                      }}
                    >
                      <i className={`bi bi-${copiedCode === (selectedNotif.discountCode || selectedNotif.discount_code) ? 'check-lg' : 'clipboard'} me-1`}></i>
                      {copiedCode === (selectedNotif.discountCode || selectedNotif.discount_code) ? 'Copied!' : 'Copy Code'}
                    </button>
                  </div>
                )}
              </div>

              <div className="modal-footer bg-light">
                <button
                  type="button"
                  className="btn btn-secondary fw-semibold"
                  onClick={() => setSelectedNotif(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
