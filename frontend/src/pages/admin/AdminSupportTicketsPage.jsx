import { useState, useEffect } from 'react';
import api from '../../services/api.js';

function AdminSupportTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [activeTicket, setActiveTicket] = useState(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [actionStatus, setActionStatus] = useState('Resolved');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  async function fetchTickets() {
    try {
      setLoading(true);
      const res = await api.get('/api/admin/support/tickets');
      if (res?.data?.data) {
        setTickets(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch admin support tickets:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenRespondModal = (ticket) => {
    setActiveTicket(ticket);
    setAdminResponse(ticket.admin_response || '');
    setActionStatus(ticket.status === 'Resolved' ? 'Resolved' : 'Resolved');
  };

  const handleSendResponse = async (e) => {
    e.preventDefault();
    if (!activeTicket) return;

    try {
      setSubmitting(true);
      setMessage('');
      const res = await api.post('/api/admin/support/respond-ticket', {
        ticket_id: activeTicket.id,
        admin_response: adminResponse,
        status: actionStatus
      });

      if (res?.data?.message) {
        setMessage(res.data.message);
        setActiveTicket(null);
        setAdminResponse('');
        await fetchTickets();
      }
    } catch (err) {
      console.error(err);
      setMessage(`❌ ${err.response?.data?.message || 'Failed to update support ticket.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTickets = tickets.filter(t => filterStatus === 'All' || t.status === filterStatus);
  const openCount = tickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length;
  const resolvedCount = tickets.filter(t => t.status === 'Resolved').length;

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold m-0 text-dark d-flex align-items-center gap-2">
            <i className="bi bi-headset text-danger"></i> Support &amp; Merchant Case Management (ADM-006)
          </h2>
          <p className="text-secondary small m-0">
            Real-time merchant support queue: Respond to owner inquiries, resolve dispute tickets, and dispatch help.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm fw-semibold d-inline-flex align-items-center gap-1 shadow-sm"
          onClick={fetchTickets}
        >
          <i className="bi bi-arrow-clockwise" /> Refresh Support Queue
        </button>
      </div>

      {message && (
        <div className={`alert ${message.startsWith('🎉') ? 'alert-success' : 'alert-danger'} shadow-sm py-2.5 px-3 mb-4 d-flex align-items-center gap-2`} role="alert">
          <i className={`bi bi-${message.startsWith('🎉') ? 'check-circle-fill text-success' : 'exclamation-circle-fill text-danger'} fs-5`}></i>
          <div>{message}</div>
        </div>
      )}

      {/* Overview Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white d-flex flex-row align-items-center gap-3">
            <div className="bg-primary bg-opacity-10 text-primary p-3 rounded-circle">
              <i className="bi bi-inbox fs-3"></i>
            </div>
            <div>
              <div className="fw-bold fs-4 text-dark">{tickets.length}</div>
              <div className="text-muted small">Total Merchant Tickets</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white d-flex flex-row align-items-center gap-3">
            <div className="bg-warning bg-opacity-10 text-warning p-3 rounded-circle">
              <i className="bi bi-hourglass-split fs-3"></i>
            </div>
            <div>
              <div className="fw-bold fs-4 text-dark">{openCount}</div>
              <div className="text-muted small">Pending / Open Tickets</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white d-flex flex-row align-items-center gap-3">
            <div className="bg-success bg-opacity-10 text-success p-3 rounded-circle">
              <i className="bi bi-check-circle-fill fs-3"></i>
            </div>
            <div>
              <div className="fw-bold fs-4 text-dark">{resolvedCount}</div>
              <div className="text-muted small">Resolved Tickets</div>
            </div>
          </div>
        </div>
      </div>

      {/* Response Modal Drawer */}
      {activeTicket && (
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4 border-start border-4 border-danger">
          <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
            <h5 className="fw-bold text-dark m-0">
              💬 Respond to Merchant Support Ticket: <span className="text-danger font-monospace">{activeTicket.ticket_number}</span>
            </h5>
            <button type="button" className="btn-close" onClick={() => setActiveTicket(null)}></button>
          </div>
          
          <div className="mb-3 bg-light p-3 rounded-3 border">
            <div className="d-flex justify-content-between text-muted small mb-1">
              <span><strong>Merchant:</strong> {activeTicket.restaurant_name} ({activeTicket.user_name} - {activeTicket.user_email})</span>
              <span><strong>Submitted:</strong> {new Date(activeTicket.created_at).toLocaleString()}</span>
            </div>
            <div className="fw-bold text-dark mb-1">Subject: {activeTicket.subject}</div>
            <div className="text-secondary small"><strong>Merchant Message:</strong> {activeTicket.message}</div>
          </div>

          <form onSubmit={handleSendResponse}>
            <div className="mb-3">
              <label className="form-label small fw-bold text-dark">Admin Reply / Resolution Notes *</label>
              <textarea
                className="form-control"
                rows="3"
                placeholder="Type official admin response to be sent back to the restaurant owner..."
                required
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
              ></textarea>
            </div>
            <div className="row g-3 align-items-center">
              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold text-dark me-2">Set Ticket Status:</label>
                <select className="form-select form-select-sm d-inline-block w-auto" value={actionStatus} onChange={(e) => setActionStatus(e.target.value)}>
                  <option value="Resolved">Resolved (Close Case)</option>
                  <option value="In Progress">In Progress (Under Review)</option>
                  <option value="Open">Open</option>
                </select>
              </div>
              <div className="col-12 col-md-6 text-end">
                <button type="button" className="btn btn-outline-secondary btn-sm me-2" onClick={() => setActiveTicket(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger btn-sm fw-bold px-4 shadow-sm" disabled={submitting}>
                  {submitting ? 'Sending...' : 'Send Response & Update Ticket'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Tickets List Card */}
      <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
        <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
          <h5 className="fw-bold m-0 text-dark">
            📋 Merchant Help Tickets Queue ({filteredTickets.length})
          </h5>
          <div className="d-flex align-items-center gap-2">
            <span className="small text-muted fw-semibold">Status:</span>
            <select className="form-select form-select-sm w-auto fw-semibold" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="All">All Tickets</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5 text-muted small">
            <div className="spinner-border spinner-border-sm text-danger mb-2"></div>
            <div>Loading merchant support tickets from database...</div>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-shield-check display-4 text-success mb-2 d-block"></i>
            <h6 className="fw-bold text-dark">No Support Tickets Pending</h6>
            <p className="small m-0">All merchant help tickets have been processed and resolved.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light text-uppercase small text-muted">
                <tr>
                  <th className="ps-3">Ticket ID</th>
                  <th>Merchant / Restaurant</th>
                  <th>Subject &amp; Category</th>
                  <th>Priority</th>
                  <th>Submitted At</th>
                  <th>Status</th>
                  <th className="pe-3 text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((t) => (
                  <tr key={t.id}>
                    <td className="ps-3 fw-bold font-monospace text-dark">{t.ticket_number}</td>
                    <td>
                      <div className="fw-bold text-dark">{t.restaurant_name}</div>
                      <div className="text-muted extra-small">{t.user_name} ({t.user_email})</div>
                    </td>
                    <td>
                      <div className="fw-semibold text-dark">{t.subject}</div>
                      <span className="badge bg-light text-dark border extra-small">{t.category}</span>
                    </td>
                    <td>
                      <span className={`badge ${t.priority === 'High' || t.priority === 'Urgent' ? 'bg-danger' : t.priority === 'Medium' ? 'bg-warning text-dark' : 'bg-info text-dark'} px-2 py-1`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="small text-muted">{new Date(t.created_at).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${t.status === 'Resolved' ? 'bg-success' : t.status === 'In Progress' ? 'bg-primary' : 'bg-warning text-dark'} px-2.5 py-1`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="pe-3 text-end">
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm fw-semibold shadow-sm"
                        onClick={() => handleOpenRespondModal(t)}
                      >
                        <i className="bi bi-chat-text-fill me-1" />
                        {t.admin_response ? 'View / Edit Reply' : 'Respond & Resolve'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminSupportTicketsPage;
