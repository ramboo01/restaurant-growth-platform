import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LoadingState from '../../components/feedback/LoadingState';
import api from '../../services/api';

const STATUS_COLORS = { 'Confirmed':'success', 'In Preparation':'primary', 'Ready for Dispatch':'info' };

function StaffCateringPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const restaurantId = localStorage.getItem('staffRestaurantId') || 1;

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/catering/staff/${restaurantId}`);
      setEvents(res.data?.data || []);
    } catch (err) { console.error('Failed to load catering events:', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleAdvance = async (event) => {
    let next = '';
    if (event.status === 'Confirmed') next = 'In Preparation';
    else if (event.status === 'In Preparation') next = 'Ready for Dispatch';
    else return;

    setUpdatingId(event.id);
    try {
      await api.patch(`/api/catering/${event.id}/status`, { status: next });
      setToast(`Event #CAT-${String(event.id).padStart(4,'0')} → ${next}`);
      setTimeout(() => setToast(''), 3000);
      fetchEvents();
    } catch { alert('Failed to update.'); }
    finally { setUpdatingId(null); }
  };

  const getDaysUntil = (dateStr) => {
    const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000*60*60*24));
    if (diff < 0) return 'Past';
    if (diff === 0) return 'TODAY';
    if (diff === 1) return 'Tomorrow';
    return `${diff} days`;
  };

  return (
    <div className="container-fluid px-0">
      {toast && <div className="alert alert-success py-2">{toast}</div>}

      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div>
          <p className="text-uppercase text-secondary small fw-semibold mb-2">Staff View</p>
          <h1 className="h3 mb-1"><i className="bi bi-briefcase me-2 text-primary"></i>Catering Events</h1>
          <p className="text-secondary mb-0">Upcoming catering orders to prepare.</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary btn-sm" onClick={fetchEvents} disabled={loading}>Refresh</button>
          <Link className="btn btn-outline-secondary btn-sm" to="/staff">Back</Link>
        </div>
      </div>

      {loading ? <LoadingState message="Loading catering events..." /> : events.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-3 text-center p-5">
          <i className="bi bi-calendar-check text-muted display-4 mb-3"></i>
          <h4 className="fw-bold">No Upcoming Catering Events</h4>
          <p className="text-muted">No confirmed catering orders need preparation right now.</p>
        </div>
      ) : (
        <div className="row g-3">
          {events.map(ev => {
            const countdown = getDaysUntil(ev.event_date);
            const isToday = countdown === 'TODAY';
            const isPast = countdown === 'Past';
            return (
              <div className="col-12 col-md-6 col-xxl-4" key={ev.id}>
                <div className={`card border-0 shadow-sm rounded-3 h-100 ${isToday ? 'border-start border-danger border-4' : ''}`}>
                  <div className="card-body d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <span className="badge bg-dark bg-opacity-10 text-dark font-monospace mb-1">CAT-{String(ev.id).padStart(4,'0')}</span>
                        <h5 className="fw-bold mb-0">{ev.company_name}</h5>
                        <span className="text-muted small">{ev.event_name || 'Corporate Event'}</span>
                      </div>
                      <div className="text-end">
                        <span className={`badge bg-${STATUS_COLORS[ev.status]||'secondary'} mb-1`}>{ev.status}</span>
                        <div className={`small fw-bold ${isToday?'text-danger':isPast?'text-muted':'text-primary'}`}>{countdown}</div>
                      </div>
                    </div>

                    <div className="vstack gap-2 mb-3">
                      <div className="d-flex justify-content-between"><span className="text-secondary small">Date & Time</span><span className="fw-semibold small">{ev.event_date} @ {ev.event_time}</span></div>
                      <div className="d-flex justify-content-between"><span className="text-secondary small">Guests</span><span className="fw-bold">{ev.headcount} ({ev.package_tier})</span></div>
                      <div className="d-flex justify-content-between"><span className="text-secondary small">Contact</span><span className="small">{ev.contact_person} • {ev.contact_phone}</span></div>
                      <div><span className="text-secondary small">Venue: </span><span className="small">{ev.venue_address}</span></div>
                      {ev.dietary_notes && (
                        <div className="p-2 bg-warning bg-opacity-10 rounded small">
                          <i className="bi bi-exclamation-triangle me-1 text-warning"></i><strong>Diet Notes:</strong> {ev.dietary_notes}
                        </div>
                      )}
                    </div>

                    <button className="btn btn-primary mt-auto" disabled={updatingId===ev.id || ev.status==='Ready for Dispatch'}
                      onClick={() => handleAdvance(ev)}>
                      {updatingId===ev.id ? 'Updating...' : ev.status==='Confirmed' ? 'Start Preparation' : ev.status==='In Preparation' ? 'Mark Ready for Dispatch' : 'Ready'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default StaffCateringPage;
