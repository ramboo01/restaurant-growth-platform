import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { customerService } from '../../services/customerService.js';

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value) || 0);
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

function GuestListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await customerService.getCustomers();
      // Service returns paginated result: { items: [...], meta: {...} } or array
      setCustomers(data.items || data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch customers.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredGuests = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return customers.filter((guest) => {
      return (
        (guest.name || '').toLowerCase().includes(normalizedSearch) ||
        (guest.phone || '').toLowerCase().includes(normalizedSearch)
      );
    });
  }, [customers, searchTerm]);

  return (
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div>
          <p className="text-uppercase text-secondary small fw-semibold mb-2">Guest CRM</p>
          <h1 className="h3 mb-1">Guests</h1>
          <p className="text-secondary mb-0">Customer segmentations, spend profiles, and loyalty details.</p>
        </div>
        <Link className="btn btn-outline-secondary btn-sm" to="/owner">
          Back to Owner Home
        </Link>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-6">
          <label className="form-label small fw-semibold text-secondary" htmlFor="guestCrmSearch">
            Search by Name or Phone
          </label>
          <input
            className="form-control"
            id="guestCrmSearch"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search guests..."
            value={searchTerm}
          />
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12">
          <div className="row g-3">
            {isLoading ? (
              <div className="col-12 text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : error ? (
              <div className="col-12">
                <div className="alert alert-danger">{error}</div>
              </div>
            ) : filteredGuests.length ? (
              filteredGuests.map((guest) => (
                <div className="col-12 col-md-6 col-lg-4" key={guest.id}>
                  <Link className="text-decoration-none" to={`/owner/guests/${guest.id}`}>
                    <article className="card border-0 guest-cart-item h-100 shadow-sm hover-shadow transition-all">
                      <div className="card-body d-flex flex-column justify-content-between p-4">
                        <div>
                          <div className="d-flex justify-content-between align-items-start mb-2 gap-2">
                            <h2 className="h6 mb-0 text-dark fw-bold">{guest.name}</h2>
                            <span className={`badge rounded-pill small px-2 py-1 ${getSegmentBadgeClass(guest.segment)}`}>
                              {guest.segment}
                            </span>
                          </div>
                          <div className="vstack gap-1 text-secondary small mb-3">
                            <span>📞 {guest.phone}</span>
                            <span>📧 {guest.email || 'No email provided'}</span>
                          </div>
                        </div>
                        <div className="border-top pt-3 mt-2 d-flex justify-content-between text-secondary small">
                          <div>
                            <span className="d-block text-dark fw-semibold">{guest.totalOrders}</span>
                            <span>Orders</span>
                          </div>
                          <div>
                            <span className="d-block text-success fw-semibold">{formatCurrency(guest.totalSpend)}</span>
                            <span>Spent</span>
                          </div>
                          <div>
                            <span className="d-block text-primary fw-semibold">{guest.loyaltyPoints}</span>
                            <span>Points ({guest.loyaltyTier || 'Bronze'})</span>
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                </div>
              ))
            ) : (
              <div className="col-12">
                <div className="alert alert-light border mb-0 text-center py-4">No guests found matching search criteria.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GuestListPage;
