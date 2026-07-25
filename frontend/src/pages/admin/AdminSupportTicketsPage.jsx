import { useState } from 'react';

function AdminSupportTicketsPage() {
  const [tickets, setTickets] = useState([
    { id: 'TKT-104', merchant: 'Downtown Flagship', issue: 'Yelp Rating feed sync failing on Direct Reply', priority: 'High', sla: '12 min remaining', status: 'Open' },
    { id: 'TKT-105', merchant: 'West Loop Branch', issue: 'Customer refund dispute for Order #9403', priority: 'Medium', sla: '2 hrs remaining', status: 'Open' },
    { id: 'TKT-106', merchant: 'Lincoln Park', issue: 'Stripe payout delay verification inquiry', priority: 'Low', sla: '4 hrs remaining', status: 'Pending Merchant' },
  ]);

  const [toast, setToast] = useState('');

  const resolveTicket = (id) => {
    setTickets(prev => prev.filter(t => t.id !== id));
    setToast(`Ticket ${id} resolved and archived.`);
    setTimeout(() => setToast(''), 3000);
  };

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="mb-4">
        <h2 className="fw-bold mb-1">
          <i className="bi bi-envelope-paper-fill text-danger me-2"></i> Support & Case Management
        </h2>
        <p className="text-muted mb-0">Manage merchant support cases, transaction payouts disputes, and API configuration help requests.</p>
      </div>

      {toast && (
        <div className="alert alert-success shadow-sm mb-4" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i> {toast}
        </div>
      )}

      {/* Tickets List */}
      <div className="card border-0 shadow-sm rounded-3">
        <div className="card-header bg-white border-0 py-3">
          <h5 className="fw-bold mb-0">Merchant Help Tickets</h5>
        </div>
        <div className="card-body p-0">
          {tickets.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-check-circle-fill text-success fs-2 d-block mb-2"></i>
              All merchant cases resolved! Support queue empty.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Ticket ID</th>
                    <th>Merchant / Location</th>
                    <th>Summary of Issue</th>
                    <th>Priority</th>
                    <th>SLA Countdown</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map(t => (
                    <tr key={t.id}>
                      <td className="fw-bold text-dark">{t.id}</td>
                      <td>{t.merchant}</td>
                      <td>{t.issue}</td>
                      <td>
                        <span className={`badge bg-${t.priority === 'High' ? 'danger' : t.priority === 'Medium' ? 'warning' : 'info'} bg-opacity-10 text-${t.priority === 'High' ? 'danger' : t.priority === 'Medium' ? 'warning' : 'info'} px-2`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="text-muted small">{t.sla}</td>
                      <td>
                        <span className="badge bg-secondary bg-opacity-10 text-dark small">{t.status}</span>
                      </td>
                      <td>
                        <button className="btn btn-outline-success btn-sm py-1" onClick={() => resolveTicket(t.id)}>
                          <i className="bi bi-check-lg me-1"></i> Resolve Ticket
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
    </div>
  );
}

export default AdminSupportTicketsPage;
