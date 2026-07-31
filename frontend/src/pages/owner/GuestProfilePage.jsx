import { useMemo, useState, useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { customerService } from '../../services/customerService.js';

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value) || 0);
}

function formatDate(dateStr) {
  if (!dateStr) return 'Never';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getSegmentBadgeClass(segment) {
  switch (segment) {
    case 'VIP':
      return 'bg-gradient-vip text-white';
    case 'Active':
      return 'bg-success-subtle text-success border border-success-subtle';
    case 'New':
      return 'bg-primary-subtle text-primary border border-primary-subtle';
    case 'Lapsed':
      return 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
    case 'Churned':
      return 'bg-secondary-subtle text-secondary border border-secondary-subtle';
    default:
      return 'bg-light text-dark border';
  }
}

function getTierBadgeClass(tier) {
  switch (tier) {
    case 'Platinum':
      return 'text-bg-info';
    case 'Gold':
      return 'text-bg-warning';
    case 'Silver':
      return 'text-bg-secondary';
    case 'Bronze':
    default:
      return 'text-bg-light border';
  }
}

function GuestProfilePage() {
  const { guestId } = useParams();
  const [guest, setGuest] = useState(null);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const fetchGuest = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await customerService.getCustomerById(guestId);
      const target = res?.customer || res?.data?.customer || res?.data || res;
      setGuest(target);
      setNotes(target?.notes || '');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch guest details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGuest();
  }, [guestId]);

  const recentOrders = useMemo(() => guest?.recentOrders ?? [], [guest]);

  // Calculate progress to next loyalty tier
  const tierProgress = useMemo(() => {
    if (!guest) return { current: 0, next: 'Silver', target: 500, percent: 0 };
    const points = Number(guest.loyaltyPoints || 0);
    if (points >= 2000) {
      return { current: points, next: 'Max Tier', target: 2000, percent: 100 };
    }
    if (points >= 1000) {
      return { current: points, next: 'Platinum', target: 2000, percent: ((points - 1000) / 1000) * 100 };
    }
    if (points >= 500) {
      return { current: points, next: 'Gold', target: 1000, percent: ((points - 500) / 500) * 100 };
    }
    return { current: points, next: 'Silver', target: 500, percent: (points / 500) * 100 };
  }, [guest]);

  const handleSaveNotes = async () => {
    try {
      setIsSavingNotes(true);
      const payload = {
        restaurantId: guest.restaurantId,
        name: guest.name,
        phone: guest.phone,
        email: guest.email,
        totalOrders: guest.totalOrders,
        totalSpent: guest.totalSpend,
        lastOrderAt: guest.lastOrderAt,
        notes: notes,
        segment: guest.segment
      };
      await customerService.updateCustomer(guestId, payload);
      alert('Notes saved successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to save notes.');
    } finally {
      setIsSavingNotes(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container-fluid px-0 text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid px-0">
        <div className="alert alert-danger">{error}</div>
        <Link className="btn btn-outline-secondary btn-sm" to="/owner/guests">
          Back to Guests
        </Link>
      </div>
    );
  }

  if (!guest && !isLoading) {
    return <Navigate replace to="/owner/guests" />;
  }

  return (
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-2">
            <span className="text-uppercase text-secondary small fw-semibold">Guest Profile</span>
            <span className={`badge rounded-pill px-2 py-1 ${getSegmentBadgeClass(guest.segment)}`}>
              {guest.segment} Segment
            </span>
          </div>
          <h1 className="h3 mb-1">{guest.name}</h1>
          <p className="text-secondary mb-0">Customer details, loyalty, and order timeline.</p>
        </div>
        <Link className="btn btn-outline-secondary btn-sm" to="/owner/guests">
          Back to Guests
        </Link>
      </div>

      <div className="row g-4">
        <div className="col-12 col-xl-7">
          <div className="card border-0 guest-info-card mb-4">
            <div className="card-body p-4">
              <h2 className="h5 mb-3">Basic Details</h2>
              <div className="vstack gap-3">
                <div className="d-flex justify-content-between border-bottom pb-2">
                  <span className="text-secondary">Phone Number</span>
                  <span className="fw-semibold">{guest.phone}</span>
                </div>
                <div className="d-flex justify-content-between border-bottom pb-2">
                  <span className="text-secondary">Email Address</span>
                  <span className="fw-semibold">{guest.email || 'N/A'}</span>
                </div>
                <div className="d-flex justify-content-between border-bottom pb-2">
                  <span className="text-secondary">Total Orders Placed</span>
                  <span className="fw-semibold">{guest.totalOrders}</span>
                </div>
                <div className="d-flex justify-content-between border-bottom pb-2">
                  <span className="text-secondary">Total Spend Amount</span>
                  <span className="fw-semibold text-success">{formatCurrency(guest.totalSpend)}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-secondary">Last Order Date</span>
                  <span className="fw-semibold">{formatDate(guest.lastVisit)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card border-0 guest-info-card">
            <div className="card-body p-4">
              <h2 className="h5 mb-3">Timeline & Purchase History</h2>
              {recentOrders.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Order No.</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th className="text-end">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((ord) => (
                        <tr key={ord.id}>
                          <td>
                            <Link to={`/owner/orders`} className="text-decoration-none fw-semibold">
                              {ord.orderNumber}
                            </Link>
                          </td>
                          <td className="small text-secondary">{formatDate(ord.createdAt)}</td>
                          <td>
                            <span className="badge text-bg-light border">{ord.orderStatus}</span>
                          </td>
                          <td className="text-end fw-semibold">{formatCurrency(ord.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted small mb-0">No purchase timeline records found for this guest.</p>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-5">
          <div className="card border-0 guest-info-card mb-4 bg-light border-0">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="h5 mb-0">Loyalty Status</h2>
                <span className={`badge ${getTierBadgeClass(guest.loyaltyTier || 'Bronze')}`}>
                  {guest.loyaltyTier || 'Bronze'} Tier
                </span>
              </div>
              <div className="mb-4">
                <span className="display-5 fw-bold text-primary mb-1 d-block">
                  {guest.loyaltyPoints}
                </span>
                <span className="text-secondary small">Total loyalty points balance</span>
              </div>

              {tierProgress.next !== 'Max Tier' && (
                <div>
                  <div className="d-flex justify-content-between text-secondary small mb-1">
                    <span>Next Tier: {tierProgress.next}</span>
                    <span>{tierProgress.current} / {tierProgress.target} pts</span>
                  </div>
                  <div className="progress" style={{ height: '8px' }}>
                    <div
                      className="progress-bar progress-bar-striped bg-success"
                      role="progressbar"
                      style={{ width: `${tierProgress.percent}%` }}
                      aria-valuenow={tierProgress.percent}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card border-0 guest-info-card">
            <div className="card-body p-4">
              <h2 className="h5 mb-3">Customer CRM Notes</h2>
              <textarea
                className="form-control mb-3"
                onChange={(event) => setNotes(event.target.value)}
                rows="5"
                placeholder="Leave notes about guest preferences, allergies, special events, etc."
                value={notes}
              />
              <button
                className="btn btn-primary w-100"
                onClick={handleSaveNotes}
                type="button"
                disabled={isSavingNotes}
              >
                {isSavingNotes ? 'Saving Notes...' : 'Save CRM Notes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GuestProfilePage;
