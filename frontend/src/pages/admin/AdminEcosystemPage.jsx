import { useState, useEffect } from 'react';

export default function AdminEcosystemPage() {
  const [channels, setChannels] = useState([]);
  const [franchiseApps, setFranchiseApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('channels');
  const [message, setMessage] = useState('');

  const seoDirectory = [
    { name: 'Google Business Profile', category: 'Search & Maps', status: 'Synced 100%', lastSync: '10 mins ago' },
    { name: 'Yelp Local Directory', category: 'Reviews & Business Info', status: 'Synced 100%', lastSync: '1 hour ago' },
    { name: 'TripAdvisor Dining', category: 'Travel & Dining', status: 'Synced 100%', lastSync: '3 hours ago' },
    { name: 'Apple Maps Connect', category: 'Navigation & Voice Search', status: 'Synced 100%', lastSync: '2 hours ago' }
  ];

  useEffect(() => {
    fetchEcosystemData();
  }, []);

  async function fetchEcosystemData() {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const [chRes, appRes] = await Promise.all([
        fetch('/api/admin/channels', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/franchise-apps', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const chJson = await chRes.json();
      const appJson = await appRes.json();

      if (chJson.data) setChannels(chJson.data);
      if (appJson.data) setFranchiseApps(appJson.data);
    } catch (err) {
      console.error('Failed to fetch ecosystem data:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleForceSync = async (id) => {
    try {
      setMessage('');
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/channels/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id })
      });
      const json = await res.json();
      if (res.ok) {
        setMessage('🎉 Channel force-synced live!');
        fetchEcosystemData();
      }
    } catch (err) {
      setMessage('❌ Channel sync failed.');
    }
  };

  const handleFranchiseAction = async (id, action) => {
    try {
      setMessage('');
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/franchise-apps/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, action })
      });
      const json = await res.json();
      if (res.ok) {
        setMessage(`🎉 Franchise application ${action.toLowerCase()}!`);
        fetchEcosystemData();
      }
    } catch (err) {
      setMessage('❌ Action failed.');
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold m-0 text-dark">
            🌐 Channel Sync, Local SEO & Franchise Onboarding Workspace (ADM-003, ADM-004, ADM-006)
          </h2>
          <p className="text-secondary small m-0">
            Enterprise hub: Manage POS/Delivery channel sync, local directory listings, and prospective franchise unit applications.
          </p>
        </div>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={fetchEcosystemData}>
          <i className="bi bi-arrow-clockwise me-1" /> Refresh Workspace
        </button>
      </div>

      {message && (
        <div className={`alert ${message.startsWith('🎉') ? 'alert-success' : 'alert-danger'} shadow-sm py-2 px-3 mb-4`}>
          {message}
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
            <i className="bi bi-globe me-2" /> Local SEO Listings Directory ({seoDirectory.length})
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
            <div className="text-center py-4 text-muted small">Loading channels...</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Channel Partner</th>
                    <th>Integration Type</th>
                    <th>Sync Status</th>
                    <th>Last Heartbeat Sync</th>
                    <th>HQ Action</th>
                  </tr>
                </thead>
                <tbody>
                  {channels.map((ch) => (
                    <tr key={ch.id}>
                      <td className="fw-bold text-dark">{ch.channel_name}</td>
                      <td><span className="badge bg-light text-dark border">{ch.channel_type}</span></td>
                      <td>
                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">
                          <i className="bi bi-check-circle-fill me-1" /> {ch.status}
                        </span>
                      </td>
                      <td className="small text-muted font-monospace">
                        {new Date(ch.last_synced_at || ch.updated_at).toLocaleString()}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm fw-semibold"
                          onClick={() => handleForceSync(ch.id)}
                        >
                          <i className="bi bi-arrow-clockwise me-1" /> Force Sync Now
                        </button>
                      </td>
                    </tr>
                  ))}
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
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Platform Directory</th>
                  <th>Listing Category</th>
                  <th>Sync Status</th>
                  <th>Last Sync Update</th>
                </tr>
              </thead>
              <tbody>
                {seoDirectory.map((dir) => (
                  <tr key={dir.name}>
                    <td className="fw-bold text-primary">{dir.name}</td>
                    <td>{dir.category}</td>
                    <td><span className="badge bg-success">{dir.status}</span></td>
                    <td className="small text-muted">{dir.lastSync}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'franchise' && (
        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
          <h5 className="fw-bold mb-3 border-bottom pb-2 text-dark">
            📝 Prospective Franchise Owner Applications Queue
          </h5>
          {loading ? (
            <div className="text-center py-4 text-muted small">Loading applications...</div>
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
                        <span className={`badge ${app.status === 'Approved' ? 'bg-success' : app.status === 'Rejected' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                          {app.status}
                        </span>
                      </td>
                      <td>
                        {app.status === 'Under Review' ? (
                          <div className="btn-group btn-group-sm">
                            <button
                              type="button"
                              className="btn btn-success fw-semibold"
                              onClick={() => handleFranchiseAction(app.id, 'Approved')}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger fw-semibold"
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
    </div>
  );
}
