import { useState } from 'react';

function StaffGuestLookupPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [guests] = useState([
    { id: 1, name: 'Sarah Jenkins', phone: '(555) 234-5678', tier: 'VIP Gold', allergy: 'Peanuts / Shellfish', visits: 24, lastOrder: '2 days ago' },
    { id: 2, name: 'Michael Scott', phone: '(555) 876-5432', tier: 'Regular', allergy: 'Gluten-Free', visits: 12, lastOrder: 'Yesterday' },
    { id: 3, name: 'Dwight Schrute', phone: '(555) 999-1111', tier: 'VIP Platinum', allergy: 'Dairy', visits: 48, lastOrder: '3 hours ago' },
  ]);

  const filteredGuests = guests.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    g.phone.includes(searchTerm)
  );

  return (
    <div className="container-fluid py-4" style={{ maxWidth: '900px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 text-primary">
            <i className="bi bi-person-search me-2"></i> Staff Guest Lookup
          </h2>
          <p className="text-muted mb-0">Search guest preferences, dietary restrictions, and allergy flags for FOH & kitchen staff.</p>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body p-3">
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0 ps-0"
              placeholder="Search guest by name or phone number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="row g-3">
        {filteredGuests.map(guest => (
          <div className="col-12 col-md-6" key={guest.id}>
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h5 className="fw-bold mb-1 text-dark">{guest.name}</h5>
                    <div className="text-muted small">{guest.phone}</div>
                  </div>
                  <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-1 rounded-pill">{guest.tier}</span>
                </div>

                <div className="mt-3 p-3 bg-danger bg-opacity-10 rounded-3 border border-danger border-opacity-25">
                  <div className="text-danger fw-bold extra-small uppercase">
                    <i className="bi bi-exclamation-triangle-fill me-1"></i> ALLERGY / DIETARY FLAG
                  </div>
                  <div className="fw-bold text-dark fs-6 mt-1">{guest.allergy}</div>
                </div>

                <div className="d-flex justify-content-between mt-3 pt-2 border-top text-muted small">
                  <span>Total Visits: <strong>{guest.visits}</strong></span>
                  <span>Last Order: <strong>{guest.lastOrder}</strong></span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StaffGuestLookupPage;
