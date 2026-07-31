import { useState } from 'react';
import api from '../../services/api';

export default function DataExportPage() {
  const [downloading, setDownloading] = useState(false);
  const [redactPii, setRedactPii] = useState(true);
  const [message, setMessage] = useState('');

  const handleExport = async (type) => {
    try {
      setDownloading(true);
      setMessage('');
      const res = await api.get(`/api/owner/data-export?type=${type}&redactPii=${redactPii}`);

      const jsonString = JSON.stringify(res.data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `restaurant-${type}-export-${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      setMessage(`✅ Successfully exported ${type} dataset!`);
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      console.error('Export failed:', err);
      setMessage('❌ Failed to export data. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="mb-4">
        <h2 className="fw-bold m-0" style={{ color: '#1a1f36' }}>
          📦 Data Export & Portability Tool (OWN-030)
        </h2>
        <p className="text-secondary small m-0">
          Download complete portable datasets of your menu catalog, guest database, and order ledger anytime.
        </p>
      </div>

      {message && (
        <div className={`alert ${message.startsWith('✅') ? 'alert-success' : 'alert-danger'} shadow-sm py-2 px-3 mb-4`}>
          {message}
        </div>
      )}

      {/* Safety & PII Configuration */}
      <div className="card border-0 shadow-sm p-4 rounded-4 mb-4" style={{ background: '#fff' }}>
        <h5 className="fw-bold mb-3 border-bottom pb-2">🛡️ Export Security & PII Protection</h5>
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <div className="fw-semibold text-dark">Redact Customer Personally Identifiable Information (PII)</div>
            <div className="text-secondary small">Mask emails, phone numbers, and full names in the exported dataset for compliance</div>
          </div>
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              style={{ width: 44, height: 22 }}
              checked={redactPii}
              onChange={(e) => setRedactPii(e.target.checked)}
            />
          </div>
        </div>
      </div>

      {/* Export Options Cards */}
      <div className="row g-4">
        {/* Full Bundle */}
        <div className="col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-4 text-center h-100" style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff' }}>
            <div className="display-5 mb-2">📁</div>
            <h5 className="fw-bold">Complete Package</h5>
            <p className="small opacity-80 mb-4">Export full bundle: Menu, Customers, and Order History in one file.</p>
            <button
              type="button"
              className="btn btn-light fw-bold text-primary w-100 rounded-3 mt-auto"
              disabled={downloading}
              onClick={() => handleExport('all')}
            >
              {downloading ? 'Generating...' : 'Download Full Bundle'}
            </button>
          </div>
        </div>

        {/* Menu Catalog */}
        <div className="col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-4 text-center h-100" style={{ background: '#fff' }}>
            <div className="display-5 mb-2 text-warning">🍔</div>
            <h5 className="fw-bold text-dark">Menu Catalog</h5>
            <p className="small text-secondary mb-4">Categories, menu items, modifier groups, and channel pricing.</p>
            <button
              type="button"
              className="btn btn-outline-warning fw-bold w-100 rounded-3 mt-auto"
              disabled={downloading}
              onClick={() => handleExport('menu')}
            >
              Export Menu Data
            </button>
          </div>
        </div>

        {/* Customer Base */}
        <div className="col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-4 text-center h-100" style={{ background: '#fff' }}>
            <div className="display-5 mb-2 text-primary">👥</div>
            <h5 className="fw-bold text-dark">Customer Database</h5>
            <p className="small text-secondary mb-4">Registered guests, loyalty tiers, opt-in statuses, and RFM metrics.</p>
            <button
              type="button"
              className="btn btn-outline-primary fw-bold w-100 rounded-3 mt-auto"
              disabled={downloading}
              onClick={() => handleExport('customers')}
            >
              Export Customer Graph
            </button>
          </div>
        </div>

        {/* Order History */}
        <div className="col-md-6 col-lg-3">
          <div className="card border-0 shadow-sm rounded-4 p-4 text-center h-100" style={{ background: '#fff' }}>
            <div className="display-5 mb-2 text-success">🧾</div>
            <h5 className="fw-bold text-dark">Order History</h5>
            <p className="small text-secondary mb-4">Complete transaction ledger, status logs, and totals.</p>
            <button
              type="button"
              className="btn btn-outline-success fw-bold w-100 rounded-3 mt-auto"
              disabled={downloading}
              onClick={() => handleExport('orders')}
            >
              Export Order History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
