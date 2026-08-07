import { useState, useEffect } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import LoadingState from '../../components/feedback/LoadingState';
import api from '../../services/api';

const STATUSES = ['New Inquiry','Confirmed','Follow-Up Required','In Preparation','Ready for Dispatch','Delivered','Completed','Declined','Cancelled'];
const STATUS_COLORS = {
  'New Inquiry':'warning','Confirmed':'success','Follow-Up Required':'info','In Preparation':'primary',
  'Ready for Dispatch':'info','Delivered':'success','Completed':'secondary','Declined':'danger','Cancelled':'danger'
};

function OwnerCateringPage() {
  const { activeRestaurantId } = useRestaurant();
  const [orders, setOrders] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true); setError('');
      const res = await api.get(`/api/catering/restaurant/${activeRestaurantId}`);
      const d = res.data?.data || {};
      setOrders(d.orders || []);
      setCounts(d.counts || {});
    } catch (err) { setError(err.response?.data?.message || 'Failed to load catering orders.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (activeRestaurantId) fetchData(); }, [activeRestaurantId]);

  const handleStatus = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await api.patch(`/api/catering/${id}/status`, { status: newStatus });
      setToast(`Order #CAT-${String(id).padStart(4,'0')} → ${newStatus}`);
      setTimeout(() => setToast(''), 3000);
      fetchData();
    } catch { alert('Failed to update status.'); }
    finally { setUpdatingId(null); }
  };

  const handleSaveNote = async () => {
    if (!detail) return;
    setSavingNote(true);
    try {
      await api.patch(`/api/catering/${detail.id}/notes`, { ownerNotes: noteText });
      setToast('Notes saved.'); setTimeout(() => setToast(''), 3000);
      setDetail(null); fetchData();
    } catch { alert('Failed to save notes.'); }
    finally { setSavingNote(false); }
  };

  const summaryCards = [
    { label:'New Inquiries', key:'New Inquiry', color:'warning', icon:'bi-bell' },
    { label:'Confirmed', key:'Confirmed', color:'success', icon:'bi-check-circle' },
    { label:'In Preparation', key:'In Preparation', color:'primary', icon:'bi-fire' },
    { label:'Completed', key:'Completed', color:'secondary', icon:'bi-trophy' }
  ];

  return (
    <div className="container-fluid py-4">
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-4">
        <div>
          <h2 className="fw-bold mb-1"><i className="bi bi-briefcase text-primary me-2"></i>Catering Management</h2>
          <p className="text-muted mb-0">Manage corporate & event catering inquiries, bookings, and fulfillment.</p>
        </div>
        <button className="btn btn-outline-primary btn-sm rounded-pill" onClick={fetchData} disabled={loading}><i className="bi bi-arrow-clockwise me-1"></i>Refresh</button>
      </div>

      {toast && <div className="alert alert-success py-2 mb-3"><i className="bi bi-check-circle-fill me-2"></i>{toast}</div>}
      {error && <div className="alert alert-danger py-2 mb-3"><i className="bi bi-exclamation-triangle-fill me-2"></i>{error}</div>}

      {loading ? <LoadingState message="Loading catering orders..." /> : (<>
        {/* Summary */}
        <div className="row g-3 mb-4">
          {summaryCards.map(c => (
            <div className="col-6 col-lg-3" key={c.key}>
              <div className="card border-0 shadow-sm rounded-3 h-100">
                <div className="card-body d-flex align-items-center gap-3">
                  <div className={`d-flex align-items-center justify-content-center rounded-circle bg-${c.color} bg-opacity-10`} style={{width:48,height:48}}>
                    <i className={`bi ${c.icon} fs-5 text-${c.color}`}></i>
                  </div>
                  <div><div className="text-muted small">{c.label}</div><h3 className="fw-bold mb-0">{counts[c.key]||0}</h3></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="card border-0 shadow-sm rounded-3">
          <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
            <h5 className="fw-bold mb-0">All Catering Orders</h5>
            <span className="badge bg-primary bg-opacity-10 text-primary">{orders.length} Total</span>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr><th>ID</th><th>Company & Contact</th><th>Event</th><th>Guests</th><th>Amount</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr><td colSpan="7" className="text-center py-5 text-muted">No catering orders yet.</td></tr>
                  ) : orders.map(o => (
                    <tr key={o.id}>
                      <td><span className="badge bg-dark bg-opacity-10 text-dark font-monospace">CAT-{String(o.id).padStart(4,'0')}</span></td>
                      <td>
                        <div className="fw-bold text-dark small">{o.company_name}</div>
                        <div className="text-muted small">{o.contact_person} • {o.contact_phone}</div>
                        <div className="text-primary small">{o.contact_email}</div>
                      </td>
                      <td>
                        <div className="fw-semibold small">{o.event_date} @ {o.event_time}</div>
                        <div className="text-muted small text-truncate" style={{maxWidth:180}} title={o.venue_address}>{o.venue_address}</div>
                      </td>
                      <td><span className="fw-bold">{o.headcount}</span><div className="text-muted small">{o.package_tier}</div></td>
                      <td>
                        <div className="fw-bold">${parseFloat(o.total_amount).toFixed(2)}</div>
                        <div className="text-success small">Paid: ${parseFloat(o.paid_amount).toFixed(2)}</div>
                      </td>
                      <td>
                        <select className="form-select form-select-sm fw-semibold" value={o.status}
                          disabled={updatingId===o.id} onChange={e => handleStatus(o.id, e.target.value)}>
                          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary" onClick={() => { setDetail(o); setNoteText(o.owner_notes||''); }}>
                          <i className="bi bi-eye me-1"></i>Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </>)}

      {/* Detail Modal */}
      {detail && (
        <div className="modal d-block" style={{background:'rgba(0,0,0,.5)',zIndex:1060}} onClick={() => setDetail(null)}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" onClick={e=>e.stopPropagation()}>
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold"><i className="bi bi-briefcase text-primary me-2"></i>CAT-{String(detail.id).padStart(4,'0')} — {detail.company_name}</h5>
                <button className="btn-close" onClick={() => setDetail(null)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3 mb-4">
                  <div className="col-6"><div className="small text-muted">Contact Person</div><div className="fw-semibold">{detail.contact_person}</div></div>
                  <div className="col-6"><div className="small text-muted">Phone</div><div className="fw-semibold">{detail.contact_phone}</div></div>
                  <div className="col-6"><div className="small text-muted">Email</div><div className="fw-semibold text-primary">{detail.contact_email}</div></div>
                  <div className="col-6"><div className="small text-muted">Status</div><span className={`badge bg-${STATUS_COLORS[detail.status]||'secondary'} bg-opacity-10 text-${STATUS_COLORS[detail.status]||'secondary'}`}>{detail.status}</span></div>
                  <div className="col-12"><hr className="my-1" /></div>
                  <div className="col-6"><div className="small text-muted">Event Name</div><div className="fw-semibold">{detail.event_name||'—'}</div></div>
                  <div className="col-3"><div className="small text-muted">Date</div><div className="fw-semibold">{detail.event_date}</div></div>
                  <div className="col-3"><div className="small text-muted">Time</div><div className="fw-semibold">{detail.event_time}</div></div>
                  <div className="col-12"><div className="small text-muted">Venue</div><div className="fw-semibold">{detail.venue_address}</div></div>
                  <div className="col-4"><div className="small text-muted">Headcount</div><div className="fw-bold fs-5">{detail.headcount}</div></div>
                  <div className="col-4"><div className="small text-muted">Package</div><div className="fw-semibold">{detail.package_tier}</div></div>
                  <div className="col-4"><div className="small text-muted">Payment</div><div className="fw-semibold">{detail.payment_plan}</div></div>
                  {detail.dietary_notes && <div className="col-12"><div className="small text-muted">Dietary Notes</div><div className="p-2 bg-warning bg-opacity-10 rounded small">{detail.dietary_notes}</div></div>}
                  <div className="col-6"><div className="small text-muted">Total Amount</div><div className="fw-bold fs-5">${parseFloat(detail.total_amount).toFixed(2)}</div></div>
                  <div className="col-6"><div className="small text-muted">Paid So Far</div><div className="fw-bold fs-5 text-success">${parseFloat(detail.paid_amount).toFixed(2)}</div></div>
                </div>
                <div>
                  <label className="form-label fw-bold">Internal Notes (only visible to you)</label>
                  <textarea className="form-control" rows="3" value={noteText} onChange={e=>setNoteText(e.target.value)} placeholder="Add notes about menu customization, delivery logistics..."></textarea>
                </div>
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-outline-secondary" onClick={() => setDetail(null)}>Close</button>
                <button className="btn btn-primary" onClick={handleSaveNote} disabled={savingNote}>{savingNote?'Saving...':'Save Notes'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OwnerCateringPage;
