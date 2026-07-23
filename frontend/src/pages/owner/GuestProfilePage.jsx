import { useMemo, useState, useEffect } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { customerService } from '../../services/customerService.js';

function formatCurrency(value) {
  return `$${value.toFixed(2)}`;
}

function GuestProfilePage() {
  const { guestId } = useParams();
  const [guest, setGuest] = useState(null);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGuest = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await customerService.getCustomerById(guestId);
      setGuest(data);
      setNotes(data.notes || '');
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

  const handleSaveNotes = async () => {
    try {
      await customerService.updateCustomer(guestId, { notes });
      await fetchGuest();
    } catch (err) {
      alert('Failed to save notes.');
    }
  };

  return (
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div>
          <p className="text-uppercase text-secondary small fw-semibold mb-2">Guest Profile</p>
          <h1 className="h3 mb-1">{guest.name}</h1>
          <p className="text-secondary mb-0">Customer details and notes.</p>
        </div>
        <Link className="btn btn-outline-secondary btn-sm" to="/owner/guests">
          Back to Guests
        </Link>
      </div>

      <div className="row g-3">
        <div className="col-12 col-xl-7">
          <div className="card border-0 guest-info-card mb-4">
            <div className="card-body p-4">
              <h2 className="h5 mb-3">Basic Details</h2>
              <div className="vstack gap-2">
                <div className="d-flex justify-content-between gap-3">
                  <span className="text-secondary">Phone</span>
                  <span>{guest.phone}</span>
                </div>
                <div className="d-flex justify-content-between gap-3">
                  <span className="text-secondary">Email</span>
                  <span className="text-end">{guest.email}</span>
                </div>
                <div className="d-flex justify-content-between gap-3">
                  <span className="text-secondary">Total Orders</span>
                  <span>{guest.totalOrders}</span>
                </div>
                <div className="d-flex justify-content-between gap-3">
                  <span className="text-secondary">Total Spend</span>
                  <span>{formatCurrency(guest.totalSpend)}</span>
                </div>
                <div className="d-flex justify-content-between gap-3">
                  <span className="text-secondary">Last Visit</span>
                  <span>{guest.lastVisit}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card border-0 guest-info-card mb-4">
            <div className="card-body p-4">
              <h2 className="h5 mb-3">Recent Orders</h2>
              <div className="d-flex flex-wrap gap-2">
                {recentOrders.map((orderId) => (
                  <span className="badge text-bg-light border" key={orderId}>
                    {orderId}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-5">
          <div className="card border-0 guest-info-card mb-4">
            <div className="card-body p-4">
              <h2 className="h5 mb-3">Loyalty Points</h2>
              <p className="display-6 fw-semibold mb-0">{guest.loyaltyPoints}</p>
            </div>
          </div>

          <div className="card border-0 guest-info-card">
            <div className="card-body p-4">
              <h2 className="h5 mb-3">Notes</h2>
              <textarea
                className="form-control mb-3"
                onChange={(event) => setNotes(event.target.value)}
                rows="5"
                value={notes}
              />
              <button className="btn btn-primary" onClick={handleSaveNotes} type="button">
                Save Notes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GuestProfilePage;
