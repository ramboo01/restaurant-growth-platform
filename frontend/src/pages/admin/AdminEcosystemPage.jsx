import { useState, useEffect } from 'react';
import api from '../../services/api.js';

export default function AdminEcosystemPage() {
  const [channels, setChannels] = useState([]);
  const [seoListings, setSeoListings] = useState([]);
  const [franchiseApps, setFranchiseApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('channels');
  const [message, setMessage] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Connection settings modal state
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configItem, setConfigItem] = useState(null);
  const [configType, setConfigType] = useState('');
  const [formFields, setFormFields] = useState({});
  const [savingConfig, setSavingConfig] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    fetchEcosystemData();
  }, []);

  async function fetchEcosystemData() {
    try {
      setLoading(true);
      const [chRes, seoRes, appRes] = await Promise.all([
        api.get('/api/admin/channels').catch(() => null),
        api.get('/api/admin/seo-listings').catch(() => null),
        api.get('/api/admin/franchise-apps').catch(() => null)
      ]);

      if (chRes?.data?.data) {
        setChannels(chRes.data.data);
      } else {
        setChannels([]);
      }

      if (seoRes?.data?.data) {
        setSeoListings(seoRes.data.data);
      } else {
        setSeoListings([]);
      }

      if (appRes?.data?.data) {
        setFranchiseApps(appRes.data.data);
      } else {
        setFranchiseApps([]);
      }
    } catch (err) {
      console.error('Failed to fetch ecosystem data:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleForceSync = async (id) => {
    try {
      setActionLoadingId(id);
      setMessage('');
      const res = await api.post('/api/admin/channels/sync', { id });
      if (res?.data) {
        setMessage('🎉 Channel force-synced live in database!');
        await fetchEcosystemData();
      }
    } catch (err) {
      console.error(err);
      const errMsg = err?.response?.data?.message || '❌ Channel sync failed.';
      setMessage(errMsg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSyncSeo = async (id) => {
    try {
      setActionLoadingId(`seo_${id}`);
      setMessage('');
      const res = await api.post('/api/admin/seo-listings/sync', { id });
      if (res?.data) {
        setMessage('🎉 Local SEO NAP listing re-synced live!');
        await fetchEcosystemData();
      }
    } catch (err) {
      console.error(err);
      const errMsg = err?.response?.data?.message || '❌ SEO sync failed.';
      setMessage(errMsg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleFranchiseAction = async (id, action) => {
    try {
      setActionLoadingId(`app_${id}`);
      setMessage('');
      const res = await api.post('/api/admin/franchise-apps/action', { id, action });
      if (res?.data) {
        setMessage(`🎉 Franchise application ${action.toLowerCase()} live in database!`);
        await fetchEcosystemData();
      }
    } catch (err) {
      console.error(err);
      setMessage('❌ Action failed.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const openConfigModal = (item, type) => {
    setConfigItem(item);
    setConfigType(type);

    let parsedConfig = {};
    if (item.api_config) {
      try {
        parsedConfig = typeof item.api_config === 'string' ? JSON.parse(item.api_config) : item.api_config;
      } catch (e) {
        console.error('Failed to parse config:', e);
      }
    }

    // Determine initial form values based on partner name
    const name = type === 'channel' ? item.channel_name : item.platform_name;
    const initialFields = {};

    if (name.includes('Toast')) {
      initialFields.toastClientId = parsedConfig.toastClientId || '';
      initialFields.toastClientSecret = parsedConfig.toastClientSecret || '';
      initialFields.restaurantGuid = parsedConfig.restaurantGuid || '';
    } else if (name.includes('UberEats')) {
      initialFields.storeId = parsedConfig.storeId || '';
      initialFields.accessToken = parsedConfig.accessToken || '';
    } else if (name.includes('DoorDash')) {
      initialFields.developerJwt = parsedConfig.developerJwt || '';
      initialFields.merchantId = parsedConfig.merchantId || '';
    } else if (name.includes('Google Business') || name.includes('Google Reserve')) {
      initialFields.locationId = parsedConfig.locationId || '';
      initialFields.authCode = parsedConfig.authCode || '';
    } else if (name.includes('WhatsApp')) {
      initialFields.phoneNumberId = parsedConfig.phoneNumberId || '';
      initialFields.systemToken = parsedConfig.systemToken || '';
    } else if (name.includes('Yelp')) {
      initialFields.apiKey = parsedConfig.apiKey || '';
      initialFields.businessAlias = parsedConfig.businessAlias || '';
    } else if (name.includes('TripAdvisor')) {
      initialFields.partnerId = parsedConfig.partnerId || '';
      initialFields.locationId = parsedConfig.locationId || '';
    } else if (name.includes('Apple')) {
      initialFields.developerToken = parsedConfig.developerToken || '';
    } else {
      initialFields.genericApiKey = parsedConfig.genericApiKey || '';
    }

    setFormFields(initialFields);
    setModalError('');
    setShowConfigModal(true);
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    try {
      setSavingConfig(true);
      setModalError('');
      const url = configType === 'channel' 
        ? '/api/admin/channels/configure' 
        : '/api/admin/seo-listings/configure';
      
      const res = await api.post(url, { id: configItem.id, config: formFields });
      if (res?.data) {
        setMessage(res.data.message || '🎉 Configuration saved successfully!');
        setShowConfigModal(false);
        setModalError('');
        await fetchEcosystemData();
      }
    } catch (err) {
      console.error(err);
      const errMsg = err?.response?.data?.message || '❌ Failed to save configuration.';
      setModalError(errMsg);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleDisconnect = async (item, type) => {
    if (!window.confirm(`Are you sure you want to disconnect ${type === 'channel' ? item.channel_name : item.platform_name}? This will remove all saved API credentials.`)) return;
    try {
      setActionLoadingId(`disc_${item.id}`);
      const res = await api.post('/api/admin/integrations/disconnect', { id: item.id, type });
      if (res?.data) {
        setMessage(res.data.message);
        await fetchEcosystemData();
      }
    } catch (err) {
      setMessage('❌ Failed to disconnect.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold m-0 text-dark">
            🌐 Channel Sync, Local SEO & Franchise Onboarding Workspace
          </h2>
          <p className="text-secondary small m-0">
            Enterprise hub: Manage POS/Delivery channel sync, local directory listings, and prospective franchise unit applications.
          </p>
        </div>
        <button type="button" className="btn btn-outline-secondary btn-sm fw-semibold" onClick={fetchEcosystemData}>
          <i className="bi bi-arrow-clockwise me-1" /> Refresh Workspace
        </button>
      </div>

      {message && (
        <div className={`alert ${message.startsWith('🎉') ? 'alert-success' : 'alert-danger'} shadow-sm py-2 px-3 mb-4 d-flex align-items-center`}>
          <i className="bi bi-check-circle-fill me-2 fs-5"></i>
          <div>{message}</div>
        </div>
      )}

      <ul className="nav nav-tabs border-bottom mb-4">
        <li className="nav-item">
          <button
            className={`nav-link border-0 fw-semibold ${activeTab === 'channels' ? 'active text-primary border-bottom border-primary border-2' : 'text-secondary'}`}
            onClick={() => setActiveTab('channels')}
          >
            <i className="bi bi-arrow-repeat me-2" /> Channel Sync Monitor ({channels.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link border-0 fw-semibold ${activeTab === 'seo' ? 'active text-primary border-bottom border-primary border-2' : 'text-secondary'}`}
            onClick={() => setActiveTab('seo')}
          >
            <i className="bi bi-globe me-2" /> Local SEO Listings Directory ({seoListings.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link border-0 fw-semibold ${activeTab === 'franchise' ? 'active text-primary border-bottom border-primary border-2' : 'text-secondary'}`}
            onClick={() => setActiveTab('franchise')}
          >
            <i className="bi bi-building-add me-2" /> Franchise Signup Workspace ({franchiseApps.length})
          </button>
        </li>
      </ul>

      {activeTab === 'channels' && (
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
          <h5 className="fw-bold mb-3 border-bottom pb-2 text-dark">
            🔌 POS & Delivery Aggregator Live Channel Health
          </h5>
          {loading ? (
            <div className="text-center py-4 text-muted small">
              <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
              Loading live channels from database...
            </div>
          ) : channels.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <i className="bi bi-plug fs-2 d-block mb-2 text-secondary" />
              No external POS or delivery channels configured in database.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Channel Partner</th>
                    <th>Integration Type</th>
                    <th>Sync Status</th>
                    <th>Last Heartbeat Sync</th>
                    <th>Credentials Status</th>
                    <th>HQ Action</th>
                  </tr>
                </thead>
                <tbody>
                  {channels.map((ch) => {
                    const isConnected = ch.connection_status === 'Connected';
                    return (
                      <tr key={ch.id}>
                        <td className="fw-bold text-dark">{ch.channel_name}</td>
                        <td><span className="badge bg-light text-dark border">{ch.channel_type}</span></td>
                        <td>
                          <span className={`badge ${isConnected ? 'bg-success bg-opacity-10 text-success border border-success' : 'bg-warning bg-opacity-10 text-warning border border-warning'} px-2 py-1`}>
                            <i className={`bi ${isConnected ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-1`} /> 
                            {isConnected ? 'Active' : 'Not Connected'}
                          </span>
                        </td>
                        <td className="small text-muted font-monospace">
                          {isConnected && ch.last_synced_at ? new Date(ch.last_synced_at).toLocaleString() : '—'}
                        </td>
                        <td>
                          <span className={`badge ${isConnected ? 'bg-light text-success' : 'bg-light text-danger'}`}>
                            {isConnected ? '🔑 Linked & Verified' : '❌ Not Configured'}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex gap-1 flex-wrap">
                            <button
                              type="button"
                              className={`btn ${isConnected ? 'btn-outline-primary' : 'btn-primary'} btn-sm fw-semibold d-inline-flex align-items-center gap-1`}
                              onClick={() => openConfigModal(ch, 'channel')}
                            >
                              <i className="bi bi-gear-fill" /> {isConnected ? 'Reconfigure' : 'Configure API'}
                            </button>
                            {isConnected && (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary btn-sm fw-semibold d-inline-flex align-items-center gap-1"
                                  disabled={actionLoadingId === ch.id}
                                  onClick={() => handleForceSync(ch.id)}
                                >
                                  {actionLoadingId === ch.id ? (
                                    <span className="spinner-border spinner-border-sm" role="status" />
                                  ) : (
                                    <i className="bi bi-arrow-clockwise" />
                                  )}
                                  Sync
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline-danger btn-sm fw-semibold d-inline-flex align-items-center gap-1"
                                  disabled={actionLoadingId === `disc_${ch.id}`}
                                  onClick={() => handleDisconnect(ch, 'channel')}
                                >
                                  <i className="bi bi-x-circle" /> Disconnect
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'seo' && (
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
          <h5 className="fw-bold mb-3 border-bottom pb-2 text-dark">
            📍 Local SEO Directory Listing Auto-Sync (NAP Verification)
          </h5>
          {loading ? (
            <div className="text-center py-4 text-muted small">
              <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
              Loading SEO listings from database...
            </div>
          ) : seoListings.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <i className="bi bi-globe fs-2 d-block mb-2 text-secondary" />
              No local SEO listings stored in database.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Platform Directory</th>
                    <th>Listing Category</th>
                    <th>Sync Status</th>
                    <th>Last Sync Update</th>
                    <th>Credentials Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {seoListings.map((dir) => {
                    const isConnected = dir.connection_status === 'Connected';
                    return (
                      <tr key={dir.id || dir.platform_name}>
                        <td className="fw-bold text-primary">{dir.platform_name}</td>
                        <td>{dir.listing_category}</td>
                        <td>
                          <span className={`badge ${isConnected ? 'bg-success bg-opacity-10 text-success border border-success' : 'bg-warning bg-opacity-10 text-warning border border-warning'} px-2 py-1`}>
                            {isConnected ? (dir.sync_status || 'Synced 100%') : 'Not Connected'}
                          </span>
                        </td>
                        <td className="small text-muted font-monospace">
                          {isConnected && dir.last_synced_at ? new Date(dir.last_synced_at).toLocaleString() : '—'}
                        </td>
                        <td>
                          <span className={`badge ${isConnected ? 'bg-light text-success' : 'bg-light text-danger'}`}>
                            {isConnected ? '🔑 Linked & Verified' : '❌ Not Configured'}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex gap-1 flex-wrap">
                            <button
                              type="button"
                              className={`btn ${isConnected ? 'btn-outline-secondary' : 'btn-secondary'} btn-sm fw-semibold d-inline-flex align-items-center gap-1 text-white`}
                              onClick={() => openConfigModal(dir, 'seo')}
                            >
                              <i className="bi bi-gear-fill" /> {isConnected ? 'Reconfigure' : 'Configure API'}
                            </button>
                            {isConnected && (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary btn-sm fw-semibold d-inline-flex align-items-center gap-1"
                                  disabled={actionLoadingId === `seo_${dir.id}`}
                                  onClick={() => handleSyncSeo(dir.id)}
                                >
                                  {actionLoadingId === `seo_${dir.id}` ? (
                                    <span className="spinner-border spinner-border-sm" role="status" />
                                  ) : (
                                    <i className="bi bi-arrow-clockwise" />
                                  )}
                                  Re-Verify NAP
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-outline-danger btn-sm fw-semibold d-inline-flex align-items-center gap-1"
                                  disabled={actionLoadingId === `disc_${dir.id}`}
                                  onClick={() => handleDisconnect(dir, 'seo')}
                                >
                                  <i className="bi bi-x-circle" /> Disconnect
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'franchise' && (
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
          <h5 className="fw-bold mb-3 border-bottom pb-2 text-dark">
            📝 Prospective Franchise Owner Applications Queue
          </h5>
          {loading ? (
            <div className="text-center py-4 text-muted small">
              <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
              Loading applications...
            </div>
          ) : franchiseApps.length === 0 ? (
            <div className="text-center py-4 text-muted">
              <i className="bi bi-folder-x fs-2 d-block mb-2 text-secondary" />
              No franchise applications submitted yet.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Applicant Name</th>
                    <th>Contact Info</th>
                    <th>Target Market / City</th>
                    <th>Liquid Capital</th>
                    <th>Status</th>
                    <th>HQ Action</th>
                  </tr>
                </thead>
                <tbody>
                  {franchiseApps.map((app) => (
                    <tr key={app.id}>
                      <td className="fw-bold text-dark">{app.applicant_name}</td>
                      <td className="small">
                        <div>{app.email}</div>
                        <div className="text-muted">{app.phone}</div>
                      </td>
                      <td className="fw-semibold text-primary">{app.target_city}</td>
                      <td className="fw-bold text-success">${Number(app.investment_capacity).toLocaleString()}</td>
                      <td>
                        <span className={`badge ${app.status === 'Approved' ? 'bg-success' : app.status === 'Rejected' ? 'bg-danger' : 'bg-warning text-dark'} px-2 py-1`}>
                          {app.status}
                        </span>
                      </td>
                      <td>
                        {app.status === 'Under Review' ? (
                          <div className="btn-group btn-group-sm">
                            <button
                              type="button"
                              className="btn btn-success fw-semibold d-inline-flex align-items-center gap-1"
                              disabled={actionLoadingId === `app_${app.id}`}
                              onClick={() => handleFranchiseAction(app.id, 'Approved')}
                            >
                              {actionLoadingId === `app_${app.id}` && (
                                <span className="spinner-border spinner-border-sm" role="status" />
                              )}
                              Approve
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger fw-semibold d-inline-flex align-items-center gap-1"
                              disabled={actionLoadingId === `app_${app.id}`}
                              onClick={() => handleFranchiseAction(app.id, 'Rejected')}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted small">Decision Logged</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Dynamic API Configuration Modal */}
      {showConfigModal && configItem && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 rounded-4 shadow-lg bg-white">
              <div className="modal-header border-bottom py-3">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <i className="bi bi-key-fill text-primary" />
                  Configure API: {configType === 'channel' ? configItem.channel_name : configItem.platform_name}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowConfigModal(false)}
                />
              </div>
              <form onSubmit={handleSaveConfig}>
                <div className="modal-body p-4">
                  <p className="text-muted small mb-3">
                    Enter the production credentials and connection details below to establish a real database synchronization with this aggregator/directory service.
                  </p>

                  {modalError && (
                    <div className="alert alert-danger py-2 px-3 mb-3 d-flex align-items-start gap-2 small">
                      <i className="bi bi-shield-exclamation fs-5 text-danger mt-1"></i>
                      <div>
                        <strong>Validation Failed</strong>
                        <div className="mt-1">{modalError}</div>
                      </div>
                    </div>
                  )}
                  {Object.keys(formFields).map((fieldKey) => {
                    // Make label human-readable from camelCase
                    const label = fieldKey
                      .replace(/([A-Z])/g, ' $1')
                      .replace(/^./, (str) => str.toUpperCase());
                    
                    const isSecret = fieldKey.toLowerCase().includes('secret') || fieldKey.toLowerCase().includes('token') || fieldKey.toLowerCase().includes('key') || fieldKey.toLowerCase().includes('code');

                    return (
                      <div className="mb-3" key={fieldKey}>
                        <label className="form-label small fw-semibold text-secondary">{label}</label>
                        <input
                          type={isSecret ? 'password' : 'text'}
                          className="form-control"
                          required
                          placeholder={`Enter ${label.toLowerCase()}`}
                          value={formFields[fieldKey]}
                          onChange={(e) => setFormFields({ ...formFields, [fieldKey]: e.target.value })}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="modal-footer border-top p-3 d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-light fw-semibold"
                    onClick={() => setShowConfigModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary fw-semibold d-inline-flex align-items-center gap-2"
                    disabled={savingConfig}
                  >
                    {savingConfig && (
                      <span className="spinner-border spinner-border-sm" role="status" />
                    )}
                    Save & Test Connection
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
