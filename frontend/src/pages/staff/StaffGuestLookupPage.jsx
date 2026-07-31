import { useState, useEffect } from 'react';
import api from '../../services/api';

function StaffGuestLookupPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGuests();
  }, []);

  async function fetchGuests() {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/customers');
      const data = res.data;
      // Support both array or { data: [...] } shaped responses
      const list = Array.isArray(data) ? data : (data?.data || data?.customers || []);
      setGuests(list);
    } catch (err) {
      console.error('Failed to fetch guests:', err);
      // Fallback to static demo data so the page is always useful
      setGuests([
        { id: 1, name: 'Sarah Jenkins', phone: '(555) 234-5678', segment: 'VIP', notes: 'Peanuts / Shellfish allergy. 24 total visits.', total_orders: 24, total_spent: 890.50 },
        { id: 2, name: 'Michael Scott', phone: '(555) 876-5432', segment: 'Regular', notes: 'Gluten-Free dietary preference. Prefers booth seating.', total_orders: 12, total_spent: 340.00 },
        { id: 3, name: 'Dwight Schrute', phone: '(555) 999-1111', segment: 'VIP', notes: 'Dairy intolerance. High-frequency lunch guest.', total_orders: 48, total_spent: 1820.75 },
      ]);
      setError('Live data unavailable — showing demo records.');
    } finally {
      setLoading(false);
    }
  }

  const filteredGuests = (Array.isArray(guests) ? guests : []).filter(g =>
    (g.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (g.phone || '').includes(searchTerm) ||
    (g.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTierBadge = (segment) => {
    if (!segment) return { label: 'Guest', cls: 'bg-secondary' };
    const s = segment.toLowerCase();
    if (s.includes('vip') || s.includes('premium') || s.includes('platinum')) return { label: segment, cls: 'bg-warning text-dark' };
    if (s.includes('loyal') || s.includes('gold')) return { label: segment, cls: 'bg-primary' };
    return { label: segment, cls: 'bg-secondary' };
  };

  const maskPhone = (phoneStr) => {
    if (!phoneStr) return 'No phone';
    const digits = phoneStr.replace(/\D/g, '');
    if (digits.length >= 10) {
      return `(${digits.slice(0,3)}) ***-${digits.slice(-4)}`;
    }
    return phoneStr;
  };

  return (
    <div className="container-fluid py-4" style={{ maxWidth: '960px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 text-dark">
            <i className="bi bi-person-search me-2 text-primary"></i> Front of House Guest Lookup
          </h2>
          <p className="text-muted mb-0">Search guest profiles — dietary restrictions, allergy flags, and VIP tiers for FOH staff.</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-secondary bg-opacity-10 text-secondary border px-3 py-2 rounded-pill small">
            <i className="bi bi-shield-lock me-1"></i> View-Only Staff Access
          </span>
          <button className="btn btn-outline-secondary btn-sm" onClick={fetchGuests}>
            <i className="bi bi-arrow-clockwise me-1" /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-warning py-2 px-3 mb-3 small">{error}</div>
      )}

      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body p-3">
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0 ps-0"
              placeholder="Search guest by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5 text-muted">
          <div className="spinner-border spinner-border-sm me-2" role="status"></div>
          Loading guest profiles...
        </div>
      ) : filteredGuests.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <i className="bi bi-person-x fs-2 d-block mb-2"></i>
          No matching guest profiles found.
        </div>
      ) : (
        <div className="row g-3">
          {filteredGuests.map(guest => {
            const tier = getTierBadge(guest.segment);
            const isAllergy = guest.notes && (guest.notes.toLowerCase().includes('allergy') || guest.notes.toLowerCase().includes('free') || guest.notes.toLowerCase().includes('intolerance'));
            return (
              <div className="col-12 col-md-6" key={guest.id}>
                <div className={`card border-0 shadow-sm rounded-4 h-100 ${isAllergy ? 'border-start border-4 border-danger' : ''}`}>
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h5 className="fw-bold mb-1 text-dark">{guest.name || 'Unknown Guest'}</h5>
                        <div className="text-muted small">
                          <i className="bi bi-telephone me-1"></i>{maskPhone(guest.phone)}
                        </div>
                        {guest.email && <div className="text-muted small"><i className="bi bi-envelope me-1"></i>{guest.email}</div>}
                      </div>
                      <span className={`badge ${tier.cls} px-3 py-1 rounded-pill`}>{tier.label}</span>
                    </div>

                    {guest.notes && (
                      <div className={`mt-3 p-3 rounded-3 ${isAllergy ? 'bg-danger bg-opacity-10 border border-danger border-opacity-25' : 'bg-light border'}`}>
                        <div className={`${isAllergy ? 'text-danger' : 'text-primary'} fw-bold extra-small uppercase`}>
                          <i className={`bi ${isAllergy ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill'} me-1`}></i>
                          {isAllergy ? 'ALLERGY / DIETARY FLAG' : 'SERVICE NOTES'}
                        </div>
                        <div className="fw-semibold text-dark fs-6 mt-1">{guest.notes}</div>
                      </div>
                    )}

                    <div className="d-flex justify-content-between mt-3 pt-2 border-top text-muted small">
                      <span>Total Visits: <strong className="text-dark">{guest.total_orders ?? 0}</strong></span>
                      <span>Lifetime Value: <strong className="text-success">${Number(guest.total_spent || 0).toFixed(2)}</strong></span>
                    </div>
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

export default StaffGuestLookupPage;
