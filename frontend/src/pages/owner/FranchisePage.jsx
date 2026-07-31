import { useEffect, useState, useContext } from 'react';
import LoadingState from '../../components/feedback/LoadingState.jsx';
import { franchiseService } from '../../services/franchiseService.js';
import { restaurantService } from '../../services/restaurantService.js';
import { useRestaurant } from '../../context/RestaurantContext.jsx';
import { AuthContext } from '../../context/AuthContext.jsx';

function FranchisePage() {
  const { user } = useContext(AuthContext);
  const { activeRestaurantId, setRestaurants } = useRestaurant();
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
    openingTime: '09:00',
    closingTime: '22:00'
  });
  const [submitting, setSubmitting] = useState(false);

  // Compliance state — loaded from DB
  const [compliance, setCompliance] = useState({
    pricingSync: true,
    requireApproval: false,
    auditLogs: true
  });
  const [complianceSaving, setComplianceSaving] = useState(false);

  // Edit modal state
  const [editingBranch, setEditingBranch] = useState(null);
  const [editForm, setEditForm] = useState({});

  const loadLocations = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await franchiseService.getMyRestaurants();
      const list = Array.isArray(data) ? data : [];
      setLocations(list);
      if (setRestaurants) {
        setRestaurants(list);
        localStorage.setItem('accessibleRestaurants', JSON.stringify(list));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load franchise locations.');
    } finally {
      setLoading(false);
    }
  };

  const loadComplianceSettings = async () => {
    try {
      const settings = await franchiseService.getSettings();
      setCompliance({
        pricingSync: Boolean(settings.pricingSync),
        requireApproval: Boolean(settings.requireApproval),
        auditLogs: Boolean(settings.auditLogs)
      });
    } catch {
      // Use defaults silently
    }
  };

  useEffect(() => {
    loadLocations();
    loadComplianceSettings();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const handleAddLocation = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      
      // Format time values for backend (HH:MM:SS)
      const payload = {
        ...newLocation,
        openingTime: newLocation.openingTime && newLocation.openingTime.length === 5 ? `${newLocation.openingTime}:00` : newLocation.openingTime,
        closingTime: newLocation.closingTime && newLocation.closingTime.length === 5 ? `${newLocation.closingTime}:00` : newLocation.closingTime
      };

      await restaurantService.createRestaurant(payload);
      showToast('New franchise branch created successfully!');
      setShowAddForm(false);
      setNewLocation({
        name: '', phone: '', email: '', address: '',
        cuisine: 'Italian', openingTime: '09:00', closingTime: '22:00'
      });
      loadLocations();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create restaurant location.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (restaurantId, newStatus) => {
    try {
      await franchiseService.updateRestaurantStatus(restaurantId, newStatus);
      showToast(`Branch status updated to "${newStatus}".`);
      loadLocations();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const handleComplianceChange = async (field, value) => {
    const updated = { ...compliance, [field]: value };
    setCompliance(updated);
    try {
      setComplianceSaving(true);
      await franchiseService.saveSettings(updated);
    } catch {
      // Revert on failure
      setCompliance(prev => ({ ...prev, [field]: !value }));
    } finally {
      setComplianceSaving(false);
    }
  };

  const handlePushMenu = async () => {
    try {
      setSyncing(true);
      const result = await franchiseService.syncMenu(activeRestaurantId);
      showToast(result.message || 'Menu synced to all branches!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to sync menu.');
    } finally {
      setSyncing(false);
    }
  };

  const handleEditBranch = (loc) => {
    setEditingBranch(loc.id);
    setEditForm({
      name: loc.name || '',
      phone: loc.phone || '',
      email: loc.email || '',
      address: loc.address || '',
      cuisine: loc.cuisine || '',
      openingTime: loc.openingTime ? loc.openingTime.slice(0, 5) : '09:00',
      closingTime: loc.closingTime ? loc.closingTime.slice(0, 5) : '22:00'
    });
  };

  const handleSaveEdit = async () => {
    try {
      setSubmitting(true);
      
      // Format time values for backend (HH:MM:SS)
      const payload = {
        ...editForm,
        openingTime: editForm.openingTime && editForm.openingTime.length === 5 ? `${editForm.openingTime}:00` : editForm.openingTime,
        closingTime: editForm.closingTime && editForm.closingTime.length === 5 ? `${editForm.closingTime}:00` : editForm.closingTime
      };

      await restaurantService.updateRestaurant(editingBranch, payload);
      showToast('Branch details updated!');
      setEditingBranch(null);
      loadLocations();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update branch.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      Active: { bg: 'bg-success', icon: 'bi-circle-fill' },
      Inactive: { bg: 'bg-secondary', icon: 'bi-pause-circle-fill' },
      Suspended: { bg: 'bg-warning', icon: 'bi-exclamation-triangle-fill' }
    };
    const s = map[status] || map.Active;
    return (
      <span className={`badge ${s.bg} bg-opacity-10 text-${s.bg.replace('bg-', '')} border border-${s.bg.replace('bg-', '')} border-opacity-25 px-2 py-1`}>
        <i className={`bi ${s.icon} me-1 small`}></i> {status}
      </span>
    );
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
          <button className="btn-close float-end" onClick={() => setError('')}></button>
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
                  <input type="text" className="form-control" required value={newLocation.name}
                    onChange={e => setNewLocation({...newLocation, name: e.target.value})}
                    placeholder="e.g. RestruRent North End"
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">Cuisine Specialty</label>
                  <input type="text" className="form-control" required value={newLocation.cuisine}
                    onChange={e => setNewLocation({...newLocation, cuisine: e.target.value})}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">Email Address</label>
                  <input type="email" className="form-control" required value={newLocation.email}
                    onChange={e => setNewLocation({...newLocation, email: e.target.value})}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold">Phone Number</label>
                  <input type="tel" className="form-control" required value={newLocation.phone}
                    onChange={e => setNewLocation({...newLocation, phone: e.target.value.replace(/\\D/g, '')})}
                    placeholder="e.g. 9876543210"
                    maxLength="15"
                  />
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold">Street Address</label>
                  <input type="text" className="form-control" required value={newLocation.address}
                    onChange={e => setNewLocation({...newLocation, address: e.target.value})}
                    placeholder="123 Main St, Chicago, IL"
                  />
                </div>
                <div className="col-6 col-md-3">
                  <label className="form-label fw-semibold">Opening Time</label>
                  <input type="time" className="form-control" required value={newLocation.openingTime}
                    onChange={e => setNewLocation({...newLocation, openingTime: e.target.value})}
                  />
                </div>
                <div className="col-6 col-md-3">
                  <label className="form-label fw-semibold">Closing Time</label>
                  <input type="time" className="form-control" required value={newLocation.closingTime}
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

      {/* Edit Modal */}
      {editingBranch && (
        <div className="card border-0 shadow-sm rounded-3 mb-4 border-start border-primary border-3">
          <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
            <h5 className="fw-bold mb-0"><i className="bi bi-pencil-square text-primary me-2"></i>Edit Branch #{editingBranch}</h5>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setEditingBranch(null)}>Cancel</button>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Name</label>
                <input type="text" className="form-control" value={editForm.name}
                  onChange={e => setEditForm({...editForm, name: e.target.value})} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Cuisine</label>
                <input type="text" className="form-control" value={editForm.cuisine}
                  onChange={e => setEditForm({...editForm, cuisine: e.target.value})} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Email</label>
                <input type="email" className="form-control" value={editForm.email}
                  onChange={e => setEditForm({...editForm, email: e.target.value})} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Phone</label>
                <input type="tel" className="form-control" value={editForm.phone}
                  onChange={e => setEditForm({...editForm, phone: e.target.value.replace(/\\D/g, '')})}
                  maxLength="15" />
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold">Address</label>
                <input type="text" className="form-control" value={editForm.address}
                  onChange={e => setEditForm({...editForm, address: e.target.value})} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Opening Time</label>
                <input type="time" className="form-control" value={editForm.openingTime}
                  onChange={e => setEditForm({...editForm, openingTime: e.target.value})} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-semibold">Closing Time</label>
                <input type="time" className="form-control" value={editForm.closingTime}
                  onChange={e => setEditForm({...editForm, closingTime: e.target.value})} />
              </div>
            </div>
            <button className="btn btn-primary mt-3 px-4" onClick={handleSaveEdit} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-5"><LoadingState message="Loading franchise network data..." /></div>
      ) : (
        <div className="row g-4">
          <div className="col-12 col-lg-8">
            <div className="card border-0 shadow-sm rounded-3">
              <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                <h5 className="fw-bold mb-0">Active Restaurant Branches</h5>
                <span className="badge bg-primary bg-opacity-10 text-primary">{locations.length} Locations</span>
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
                        <th style={{ width: '120px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {locations.map(loc => (
                        <tr key={loc.id}>
                          <td>
                            <div className="fw-bold text-dark">{loc.name}</div>
                            <span className="text-muted small">Branch ID: #{loc.id}</span>
                            {loc.isPrimary ? <span className="badge bg-primary ms-1" style={{ fontSize: '0.6rem' }}>PRIMARY</span> : null}
                          </td>
                          <td>{loc.cuisine}</td>
                          <td>
                            <div className="small">{loc.email}</div>
                            <div className="text-secondary small">{loc.phone}</div>
                          </td>
                          <td className="small text-muted">{loc.address}</td>
                          <td>
                            <div className="dropdown">
                              <button className="btn btn-sm p-0 border-0 bg-transparent dropdown-toggle" data-bs-toggle="dropdown">
                                {getStatusBadge(loc.status || 'Active')}
                              </button>
                              <ul className="dropdown-menu shadow border-0">
                                <li><button className="dropdown-item small" onClick={() => handleStatusChange(loc.id, 'Active')}><i className="bi bi-circle-fill text-success me-2 small"></i>Active</button></li>
                                <li><button className="dropdown-item small" onClick={() => handleStatusChange(loc.id, 'Inactive')}><i className="bi bi-pause-circle-fill text-secondary me-2 small"></i>Inactive</button></li>
                                <li><button className="dropdown-item small" onClick={() => handleStatusChange(loc.id, 'Suspended')}><i className="bi bi-exclamation-triangle-fill text-warning me-2 small"></i>Suspended</button></li>
                              </ul>
                            </div>
                          </td>
                          <td>
                            <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleEditBranch(loc)} title="Edit">
                              <i className="bi bi-pencil"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                      {locations.length === 0 && (
                        <tr><td colSpan="6" className="text-center text-muted py-4">No branches found. Add your first location above.</td></tr>
                      )}
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
                  <i className="bi bi-cloud-arrow-up me-2"></i> Brand Menu Push
                </h5>
                <p className="small text-muted mb-2">
                  Deploy the menu from your <strong>currently active restaurant</strong> to all other franchise branches.
                </p>
                <div className="alert alert-info small py-2 mb-3">
                  <i className="bi bi-info-circle me-1"></i>
                  Source: <strong>{locations.find(l => l.id === activeRestaurantId)?.name || 'Current Restaurant'}</strong> → All other branches
                </div>
                <button 
                  className="btn btn-primary w-100" 
                  onClick={handlePushMenu}
                  disabled={syncing || locations.length <= 1}
                >
                  {syncing ? (
                    <><span className="spinner-border spinner-border-sm me-2"></span>Syncing menu items...</>
                  ) : (
                    <><i className="bi bi-broadcast me-2"></i> Sync National Menu</>
                  )}
                </button>
                {locations.length <= 1 && (
                  <div className="text-muted small mt-2 text-center">Add more branches to enable menu sync.</div>
                )}
              </div>
            </div>

            <div className="card border-0 shadow-sm rounded-3">
              <div className="card-header bg-white border-0 py-3">
                <h5 className="fw-bold mb-0">
                  Compliance & Controls
                  {complianceSaving && <span className="spinner-border spinner-border-sm ms-2 text-primary"></span>}
                </h5>
              </div>
              <div className="card-body">
                <div className="form-check form-switch mb-3">
                  <input className="form-check-input" type="checkbox" id="pricingSync" 
                    checked={compliance.pricingSync}
                    onChange={e => handleComplianceChange('pricingSync', e.target.checked)}
                  />
                  <label className="form-check-label fw-semibold" htmlFor="pricingSync">Enforce National Pricing</label>
                  <div className="form-text small">Forces branches to use regional price indexes for all core menu items.</div>
                </div>

                <hr />

                <div className="form-check form-switch mb-3">
                  <input className="form-check-input" type="checkbox" id="requireApproval" 
                    checked={compliance.requireApproval}
                    onChange={e => handleComplianceChange('requireApproval', e.target.checked)}
                  />
                  <label className="form-check-label fw-semibold" htmlFor="requireApproval">Require Promotion Approvals</label>
                  <div className="form-text small">Local campaigns must be approved by HQ before broadcasting.</div>
                </div>

                <hr />

                <div className="form-check form-switch mb-0">
                  <input className="form-check-input" type="checkbox" id="auditLogs" 
                    checked={compliance.auditLogs}
                    onChange={e => handleComplianceChange('auditLogs', e.target.checked)}
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
