import { useContext, useEffect, useRef, useState } from 'react';
import { AuthContext } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import api from '../../services/api.js';

const TYPE_ICONS = {
  review_reply: { icon: 'bi-chat-heart-fill', color: '#e91e8c', bg: '#fce4f1' },
  loyalty_points: { icon: 'bi-star-fill', color: '#f59e0b', bg: '#fef3c7' },
  offer: { icon: 'bi-tag-fill', color: '#10b981', bg: '#d1fae5' },
  general: { icon: 'bi-bell-fill', color: '#6366f1', bg: '#ede9fe' }
};

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function CustomerNotificationBell() {
  const { user, isAuthenticated } = useContext(AuthContext);
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const [copiedCode, setCopiedCode] = useState(null);

  function handleCopyCode(code, e) {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  // Fetch notifications from API on mount
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchNotifications();
  }, [isAuthenticated]);

  // Join personal user room and listen for live notifications
  useEffect(() => {
    if (!socket || !user?.id) return;

    socket.emit('joinUserRoom', user.id);

    const handleNew = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on('customerNotification', handleNew);

    return () => {
      socket.off('customerNotification', handleNew);
      socket.emit('leaveUserRoom', user.id);
    };
  }, [socket, user?.id]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function fetchNotifications() {
    try {
      setLoading(true);
      const res = await api.get('/api/customer/notifications');
      setNotifications(res.data?.data?.notifications || []);
      setUnreadCount(res.data?.data?.unreadCount || 0);
    } catch {
      // Silently fail — not critical
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAllRead() {
    try {
      await api.put('/api/customer/notifications/read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {/* silent */}
  }

  async function handleMarkOneRead(id) {
    try {
      await api.put(`/api/customer/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {/* silent */}
  }

  if (!isAuthenticated) return null;

  return (
    <div className="position-relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        className="btn btn-light guest-icon-action position-relative"
        onClick={() => {
          setOpen((prev) => !prev);
        }}
        style={{ padding: '6px 10px' }}
      >
        <i className="bi bi-bell-fill" style={{ fontSize: '1rem', color: unreadCount > 0 ? '#e91e8c' : '#555' }} />
        {unreadCount > 0 && (
          <span
            className="position-absolute badge rounded-pill text-white"
            style={{
              top: -4, right: -4, minWidth: 18, height: 18, fontSize: '0.65rem',
              background: '#e91e8c', display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'pulse 1.5s ease-in-out infinite'
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="position-fixed top-0 start-0 w-100 h-100"
            style={{ zIndex: 1050 }}
            onClick={() => setOpen(false)}
          />
          <div className="dropdown-menu show shadow-lg border-0 notification-dropdown">
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom"
              style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', flexShrink: 0 }}>
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-bell-fill" />
                <span className="fw-bold small">Notifications</span>
                {unreadCount > 0 && (
                  <span className="badge rounded-pill" style={{ background: 'rgba(255,255,255,0.25)', fontSize: '0.65rem' }}>
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0 text-white opacity-75 text-decoration-none"
                  style={{ fontSize: '0.75rem' }}
                  onClick={handleMarkAllRead}
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Body */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {loading ? (
                <div className="text-center py-4 text-secondary small">
                  <div className="spinner-border spinner-border-sm mb-2" />
                  <div>Loading...</div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-5 px-3">
                  <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🔔</div>
                  <div className="fw-semibold text-dark mb-1 small">You're all caught up!</div>
                  <div className="text-secondary" style={{ fontSize: '0.75rem' }}>
                    Notifications for review replies, loyalty rewards, and offers will appear here.
                  </div>
                </div>
              ) : (
                notifications.map((n) => {
                  const { icon, color, bg } = TYPE_ICONS[n.type] || TYPE_ICONS.general;
                  const discountCode = n.discountCode || n.discount_code;
                  return (
                    <div
                      key={n.id}
                      className="d-flex gap-3 px-3 py-3 border-bottom"
                      style={{
                        background: n.isRead ? '#fff' : '#f8f6ff',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onClick={() => !n.isRead && handleMarkOneRead(n.id)}
                    >
                      {/* Icon */}
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%', background: bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <i className={`bi ${icon}`} style={{ color, fontSize: '1rem' }} />
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="d-flex justify-content-between align-items-start mb-1">
                          <span className="fw-bold" style={{ fontSize: '0.95rem', color: '#111827' }}>
                            {n.title}
                          </span>
                          {!n.isRead && (
                            <span style={{
                              width: 8, height: 8, borderRadius: '50%',
                              background: '#e91e8c', flexShrink: 0, marginLeft: 6, marginTop: 4
                            }} />
                          )}
                        </div>
                        <p className="mb-2 text-dark" style={{ fontSize: '0.85rem', color: '#374151', lineHeight: '1.4' }}>
                          {n.message}
                        </p>
                        {discountCode && (
                          <div className="d-flex align-items-center justify-content-between bg-light p-2 rounded border my-2" onClick={(e) => e.stopPropagation()}>
                            <span className="fw-semibold text-secondary" style={{ fontSize: '0.75rem' }}>Promo Code:</span>
                            <div className="d-flex align-items-center gap-2">
                              <code className="fw-bold text-primary px-2 py-1 bg-white border rounded" style={{ fontSize: '0.8rem' }}>
                                {discountCode}
                              </code>
                              <button
                                type="button"
                                className="btn btn-sm btn-primary py-0.5 px-2 fw-semibold d-inline-flex align-items-center gap-1"
                                style={{ fontSize: '0.75rem' }}
                                onClick={(e) => handleCopyCode(discountCode, e)}
                              >
                                <i className={`bi bi-${copiedCode === discountCode ? 'check-lg' : 'clipboard'}`}></i>
                                {copiedCode === discountCode ? 'Copied!' : 'Copy'}
                              </button>
                            </div>
                          </div>
                        )}
                        <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                          {timeAgo(n.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        .notification-dropdown {
          position: absolute;
          right: 0;
          top: 110%;
          z-index: 1051;
          width: 360px;
          max-height: 480px;
          display: flex;
          flex-direction: column;
          border-radius: 16px;
          overflow: hidden;
          background: #fff;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
        }
        @media (max-width: 576px) {
          .notification-dropdown {
            position: fixed;
            top: 70px;
            right: 15px;
            left: 15px;
            width: auto;
            max-height: calc(100vh - 90px);
          }
        }
      `}</style>
    </div>
  );
}
