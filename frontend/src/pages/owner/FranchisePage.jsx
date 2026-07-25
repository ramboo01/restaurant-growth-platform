import { useEffect, useState } from 'react';
import LoadingState from '../../components/feedback/LoadingState.jsx';
import { restaurantService } from '../../services/restaurantService.js';

function FranchisePage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [syncing, setSyncing] = useState(false);
  
  // Create location state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLocation, setNewLocation] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    cuisine: 'Italian',
    openingTime: '09:00:00',
    closingTime: '22:00:00'
  });
  const [submitting, setSubmitting] = useState(false);

  // Compliance state
  const [compliance, setCompliance] = useState({
    pricingSync: true,
    requireApproval: false,
    auditLogs: true
  });

  const loadLocations = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await restaurantService.getRestaurants();
      setLocations(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load franchise locations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleAddLocation = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      await restaurantService.createRestaurant(newLocation);
      showToast('New franchise branch created successfully!');
      setShowAddForm(false);
      setNewLocation({
        name: '',
        phone: '',
        email: '',
        address: '',
        cuisine: 'Italian',
        openingTime: '09:00:00',
        closingTime: '22:00:00'
      });
      loadLocations();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create restaurant location.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePushMenu = async () => {
    try {
      setSyncing(true);
      // Simulate pushing national menu to all branches
      await new Promise(resolve => setTimeout(resolve, 1500));
      showToast('Standardized national menu items pushed to all active branches!');
    } catch (err) {
      alert('Failed to push menu updates.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold mb-1">
            <i className="bi bi-diagram-3 text-primary me-2"></i>
            Multi-Location Franchise Console
          </h2>
          <p className="text-muted mb-0">
            Control regional settings, push unified menus, and manage compliance across your restaurant brand network.
          </p>
        </div>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-primary" 
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <i className={`bi ${showAddForm ? 'bi-x-lg' : 'bi-plus-lg'} me-2`}></i>
            {showAddForm ? 'Cancel' : 'Add New Branch'}
          </button>
        </div>
      </div>

      {toast && (
        <div className="alert alert-success shadow-sm" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i> {toast}
        </div>
      )}

      {error && (
        <div className="alert alert-danger shadow-sm" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
        </div>
      )}

      {showAddForm && (
        <div className="card border-0 shadow-sm rounded-3 mb-4">
          <div className="card-header bg-white border-0 py-3">
            <h5 className="fw-bold mb-0">Create New Branch Location</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleAddLocation}>
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">Restaurant Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    value={newLocation.name}
                    onChange={e => setNewLocation({...newLocation, name: e.target.value})}
                    placeholder="e.g. RestruRent North End"
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">Cuisine Specialty</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    value={newLocation.cuisine}
                    onChange={e => setNewLocation({...newLocation, cuisine: e.target.value})}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">Email Address</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    required 
                    value={newLocation.email}
                    onChange={e => setNewLocation({...newLocation, email: e.target.value})}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">Phone Number</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    value={newLocation.phone}
                    onChange={e => setNewLocation({...newLocation, phone: e.target.value})}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold">Street Address</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    value={newLocation.address}
                    onChange={e => setNewLocation({...newLocation, address: e.target.value})}
                    placeholder="123 Main St, Chicago, IL"
                  />
                </div>
                <div className="col-6 col-md-3">
                  <label className="form-label fw-semibold">Opening Time</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    value={newLocation.openingTime}
                    onChange={e => setNewLocation({...newLocation, openingTime: e.target.value})}
                  />
                </div>
                <div className="col-6 col-md-3">
                  <label className="form-label fw-semibold">Closing Time</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    value={newLocation.closingTime}
                    onChange={e => setNewLocation({...newLocation, closingTime: e.target.value})}
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-success mt-4 px-4" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Location'}
              </button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-5"><LoadingState message="Loading franchise network data..." /></div>
      ) : (
        <div className="row g-4">
          <div className="col-12 col-lg-8">
            <div className="card border-0 shadow-sm rounded-3">
              <div className="card-header bg-white border-0 py-3">
                <h5 className="fw-bold mb-0">Active Restaurant Branches</h5>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Branch Name</th>
                        <th>Cuisine</th>
                        <th>Contact</th>
                        <th>Address</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {locations.map(loc => (
                        <tr key={loc.id}>
                          <td>
                            <div className="fw-bold text-dark">{loc.name}</div>
                            <span className="text-muted small">Branch ID: #{loc.id}</span>
                          </td>
                          <td>{loc.cuisine}</td>
                          <td>
                            <div className="small">{loc.email}</div>
                            <div className="text-secondary small">{loc.phone}</div>
                          </td>
                          <td className="small text-muted">{loc.address}</td>
                          <td>
                            <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1">
                              <i className="bi bi-circle-fill me-1 small"></i> Active
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm rounded-3 mb-4 bg-primary bg-opacity-10 border border-primary border-opacity-25">
              <div className="card-body p-4">
                <h5 className="fw-bold text-primary mb-3">
                  <i className="bi bi-cloud-arrow-up me-2"></i> Brand menu push
                </h5>
                <p className="small text-muted mb-4">
                  Deploy corporate menu items, pricing corrections, and marketing banners to all franchises concurrently.
                </p>
                <button 
                  className="btn btn-primary w-100" 
                  onClick={handlePushMenu}
                  disabled={syncing}
                >
                  {syncing ? 'Broadcasting menu data...' : <><i className="bi bi-broadcast me-2"></i> Sync National Menu</>}
                </button>
              </div>
            </div>

            <div className="card border-0 shadow-sm rounded-3">
              <div className="card-header bg-white border-0 py-3">
                <h5 className="fw-bold mb-0">Compliance & Controls</h5>
              </div>
              <div className="card-body">
                <div className="form-check form-switch mb-3">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    id="pricingSync" 
                    checked={compliance.pricingSync}
                    onChange={e => setCompliance({...compliance, pricingSync: e.target.checked})}
                  />
                  <label className="form-check-label fw-semibold" htmlFor="pricingSync">Enforce National Pricing</label>
                  <div className="form-text small">Forces branches to use regional price indexes for all core menu items.</div>
                </div>

                <hr />

                <div className="form-check form-switch mb-3">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    id="requireApproval" 
                    checked={compliance.requireApproval}
                    onChange={e => setCompliance({...compliance, requireApproval: e.target.checked})}
                  />
                  <label className="form-check-label fw-semibold" htmlFor="requireApproval">Require Promotion Approvals</label>
                  <div className="form-text small">Local campaigns must be approved by HQ before broadcasting.</div>
                </div>

                <hr />

                <div className="form-check form-switch mb-0">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    id="auditLogs" 
                    checked={compliance.auditLogs}
                    onChange={e => setCompliance({...compliance, auditLogs: e.target.checked})}
                  />
                  <label className="form-check-label fw-semibold" htmlFor="auditLogs">HQ Activity Auditing</label>
                  <div className="form-text small">Log all owner operations for brand audit logs.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FranchisePage;
