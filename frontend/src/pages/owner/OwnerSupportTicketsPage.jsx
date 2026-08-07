import { useState, useEffect } from 'react';
import api from '../../services/api.js';

export default function OwnerSupportTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('General Inquiry');
  const [priority, setPriority] = useState('Medium');
  const [ticketMessage, setTicketMessage] = useState('');

  useEffect(() => {
    fetchOwnerTickets();
  }, []);

  async function fetchOwnerTickets() {
    try {
      setLoading(true);
      const res = await api.get('/api/owner/support/tickets');
      if (res?.data?.data) {
        setTickets(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch owner support tickets:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !ticketMessage.trim()) return;

    try {
      setSubmitting(true);
      setMessage('');
      const res = await api.post('/api/owner/support/tickets', {
        subject,
        category,
        priority,
        message: ticketMessage
      });

      if (res?.data?.message) {
        setMessage(res.data.message);
        setSubject('');
        setTicketMessage('');
        setShowForm(false);
        await fetchOwnerTickets();
      }
    } catch (err) {
      console.error(err);
      setMessage(`❌ ${err.response?.data?.message || 'Failed to submit support ticket.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const openTickets = tickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length;

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold m-0 text-dark d-flex align-items-center gap-2">
            <i className="bi bi-headset text-primary"></i> Merchant Support &amp; Help Desk
          </h2>
          <p className="text-secondary small m-0">
            Submit help queries, report technical issues, or request assistance directly from the platform admin team.
          </p>
        </div>
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-primary fw-semibold d-inline-flex align-items-center gap-1 shadow-sm"
            onClick={() => setShowForm(!showForm)}
          >
            <i className={`bi bi-${showForm ? 'dash' : 'plus'}-lg`} />
            {showForm ? 'Cancel Request' : 'Create New Support Ticket'}
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm fw-semibold"
            onClick={fetchOwnerTickets}
          >
            <i className="bi bi-arrow-clockwise" /> Refresh
          </button>
        </div>
      </div>

      {message && (
        <div className={`alert ${message.startsWith('🎉') ? 'alert-success' : 'alert-danger'} shadow-sm py-2.5 px-3 mb-4 d-flex align-items-center gap-2`} role="alert">
          <i className={`bi bi-${message.startsWith('🎉') ? 'check-circle-fill text-success' : 'exclamation-circle-fill text-danger'} fs-5`}></i>
          <div>{message}</div>
        </div>
      )}

      {/* New Ticket Form Modal/Drawer */}
      {showForm && (
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4 border-start border-4 border-primary">
          <h5 className="fw-bold text-dark mb-3 border-bottom pb-2 d-flex align-items-center justify-content-between">
            <span>📝 Submit New Support Ticket to Platform Admin</span>
            <span className="badge bg-primary bg-opacity-10 text-primary fw-normal extra-small">Fast Response SLA</span>
          </h5>
          <form onSubmit={handleSubmitTicket}>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label small fw-bold text-dark">Subject / Issue Summary *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Menu sync delay on DoorDash or Order payout query"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div className="col-12 col-md-3">
                <label className="form-label small fw-bold text-dark">Category</label>
                <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Technical">Technical Issue</option>
                  <option value="Order Dispute">Order Dispute</option>
                  <option value="Payout & Billing">Payout &amp; Billing</option>
                  <option value="Menu Sync">Menu Sync</option>
                </select>
              </div>
              <div className="col-12 col-md-3">
                <label className="form-label small fw-bold text-dark">Priority Level</label>
                <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High Priority</option>
                  <option value="Urgent">Urgent / Critical</option>
                </select>
              </div>
              <div className="col-12">
                <label className="form-label small fw-bold text-dark">Detailed Description *</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Provide clear details of what issue you are facing or what help you need..."
                  required
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                ></textarea>
              </div>
              <div className="col-12 text-end">
                <button type="submit" className="btn btn-primary fw-bold px-4 shadow-sm" disabled={submitting}>
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-send-fill me-1"></i> Submit Ticket
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Tickets Overview Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white d-flex flex-row align-items-center gap-3">
            <div className="bg-warning bg-opacity-10 text-warning p-3 rounded-circle">
              <i className="bi bi-hourglass-split fs-3"></i>
            </div>
            <div>
              <div className="fw-bold fs-4 text-dark">{openTickets}</div>
              <div className="text-muted small">Open &amp; Pending Admin Response</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6">
          <div className="card border-0 shadow-sm rounded-3 p-3 bg-white d-flex flex-row align-items-center gap-3">
            <div className="bg-success bg-opacity-10 text-success p-3 rounded-circle">
              <i className="bi bi-check-circle-fill fs-3"></i>
            </div>
            <div>
              <div className="fw-bold fs-4 text-dark">{tickets.filter(t => t.status === 'Resolved').length}</div>
              <div className="text-muted small">Resolved Tickets</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tickets List Card */}
      <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
        <h5 className="fw-bold text-dark mb-3 border-bottom pb-2 d-flex align-items-center justify-content-between">
          <span>📋 My Support Tickets History ({tickets.length})</span>
          <span className="badge bg-light text-dark border extra-small">Live Platform Help Tickets</span>
        </h5>

        {loading ? (
          <div className="text-center py-5 text-muted small">
            <div className="spinner-border spinner-border-sm text-primary mb-2"></div>
            <div>Loading support tickets...</div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-inbox display-4 text-secondary mb-2 d-block"></i>
            <h6 className="fw-bold text-dark">No Support Tickets Created Yet</h6>
            <p className="small mb-3">If you need help or have questions for the admin team, click below to create a ticket.</p>
            <button type="button" className="btn btn-outline-primary btn-sm fw-bold" onClick={() => setShowForm(true)}>
              <i className="bi bi-plus-circle me-1"></i> Create First Ticket
            </button>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {tickets.map((t) => (
              <div key={t.id} className="card border shadow-none rounded-3 p-3 bg-light bg-opacity-50">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2 mb-2">
                  <div>
                    <span className="badge bg-dark text-white font-monospace me-2">{t.ticket_number}</span>
                    <span className="fw-bold text-dark me-2">{t.subject}</span>
                    <span className="badge bg-secondary bg-opacity-10 text-secondary border extra-small me-1">{t.category}</span>
                    <span className={`badge ${t.priority === 'High' || t.priority === 'Urgent' ? 'bg-danger' : 'bg-info text-dark'} extra-small`}>{t.priority}</span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className={`badge ${t.status === 'Resolved' ? 'bg-success' : t.status === 'In Progress' ? 'bg-primary' : 'bg-warning text-dark'} px-2.5 py-1`}>
                      {t.status}
                    </span>
                    <span className="text-muted extra-small">{new Date(t.created_at).toLocaleString()}</span>
                  </div>
                </div>
                
                <p className="text-secondary small mb-2 bg-white p-2.5 rounded border">
                  <strong>My Query:</strong> {t.message}
                </p>

                {t.admin_response ? (
                  <div className="alert alert-success py-2 px-3 m-0 small rounded-3 border-start border-4 border-success">
                    <div className="fw-bold text-success d-flex align-items-center gap-1 mb-1">
                      <i className="bi bi-shield-check"></i> Admin Response:
                    </div>
                    <div>{t.admin_response}</div>
                    {t.resolved_at && (
                      <div className="text-muted extra-small mt-1">Resolved at: {new Date(t.resolved_at).toLocaleString()}</div>
                    )}
                  </div>
                ) : (
                  <div className="text-muted extra-small fst-italic">
                    <i className="bi bi-clock me-1"></i> Awaiting response from platform admin...
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
