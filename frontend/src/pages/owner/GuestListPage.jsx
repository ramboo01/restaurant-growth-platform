import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { customerService } from '../../services/customerService.js';

function formatCurrency(value) {
  return `$${value.toFixed(2)}`;
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
      setCustomers(data);
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
  }, [searchTerm]);

  return (
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div>
          <p className="text-uppercase text-secondary small fw-semibold mb-2">Guest CRM</p>
          <h1 className="h3 mb-1">Guests</h1>
          <p className="text-secondary mb-0">Customer list and profile notes.</p>
        </div>
        <Link className="btn btn-outline-secondary btn-sm" to="/owner">
          Back to Owner Home
        </Link>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-6">
          <label className="form-label" htmlFor="guestCrmSearch">
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
        <div className="col-12 col-xl-7">
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
                <div className="col-12 col-md-6" key={guest._id || guest.id}>
                  <Link className="text-decoration-none" to={`/owner/guests/${guest._id || guest.id}`}>
                    <article className="card border-0 guest-cart-item h-100">
                      <div className="card-body">
                        <h2 className="h6 mb-2">{guest.name}</h2>
                        <div className="vstack gap-1 text-secondary small">
                          <span>{guest.phone}</span>
                          <span>{guest.email}</span>
                          <span>{guest.totalOrders} total orders</span>
                          <span>{formatCurrency(guest.totalSpend)} spent</span>
                          <span>{guest.loyaltyPoints} loyalty points</span>
                        </div>
                      </div>
                    </article>
                  </Link>
                </div>
              ))
            ) : (
              <div className="col-12">
                <div className="alert alert-light border mb-0">No guests found.</div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default GuestListPage;
