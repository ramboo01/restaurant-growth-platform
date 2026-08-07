import { useState } from 'react';
import api from '../../services/api';

export default function DataExportPage() {
  const [downloading, setDownloading] = useState(false);
  const [redactPii, setRedactPii] = useState(true);
  const [exportFormat, setExportFormat] = useState('csv'); // 'json', 'csv', 'txt'
  const [message, setMessage] = useState('');

  const convertToCSV = (data, type) => {
    if (type === 'menu') {
      const items = data.menu?.items || [];
      const headers = ['Item ID', 'Name', 'Description', 'Price ($)', 'Category', 'Available'];
      const rows = items.map(item => [
        item.id,
        `"${(item.name || '').replace(/"/g, '""')}"`,
        `"${(item.description || '').replace(/"/g, '""')}"`,
        item.price,
        `"${(item.category || '').replace(/"/g, '""')}"`,
        item.is_available ? 'Yes' : 'No'
      ]);
      return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }

    if (type === 'customers') {
      const customers = data.customers || [];
      const headers = ['Customer ID', 'Name', 'Email', 'Phone', 'Total Orders', 'Total Spent ($)', 'Segment', 'Created At'];
      const rows = customers.map(c => [
        c.id,
        `"${(c.name || '').replace(/"/g, '""')}"`,
        `"${(c.email || '').replace(/"/g, '""')}"`,
        `"${(c.phone || '').replace(/"/g, '""')}"`,
        c.total_orders || 0,
        c.total_spent || 0,
        `"${(c.segment || '').replace(/"/g, '""')}"`,
        c.created_at
      ]);
      return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }

    if (type === 'orders') {
      const orders = data.orders || [];
      const headers = ['Order ID', 'Order Number', 'Total Amount ($)', 'Status', 'Payment Status', 'Date'];
      const rows = orders.map(o => [
        o.id,
        `"${(o.order_number || '').replace(/"/g, '""')}"`,
        o.total_amount || 0,
        `"${(o.status || '').replace(/"/g, '""')}"`,
        `"${(o.payment_status || '').replace(/"/g, '""')}"`,
        o.created_at
      ]);
      return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }

    if (type === 'all') {
      const sections = [];
      
      // Menu Section
      sections.push('--- MENU CATALOG ---');
      const menuItems = data.menu?.items || [];
      sections.push(['Item ID', 'Name', 'Description', 'Price ($)', 'Category', 'Available'].join(','));
      menuItems.forEach(item => {
        sections.push([
          item.id,
          `"${(item.name || '').replace(/"/g, '""')}"`,
          `"${(item.description || '').replace(/"/g, '""')}"`,
          item.price,
          `"${(item.category || '').replace(/"/g, '""')}"`,
          item.is_available ? 'Yes' : 'No'
        ].join(','));
      });
      sections.push('\n');

      // Customers Section
      sections.push('--- CUSTOMERS ---');
      const customers = data.customers || [];
      sections.push(['Customer ID', 'Name', 'Email', 'Phone', 'Total Orders', 'Total Spent ($)', 'Segment', 'Created At'].join(','));
      customers.forEach(c => {
        sections.push([
          c.id,
          `"${(c.name || '').replace(/"/g, '""')}"`,
          `"${(c.email || '').replace(/"/g, '""')}"`,
          `"${(c.phone || '').replace(/"/g, '""')}"`,
          c.total_orders || 0,
          c.total_spent || 0,
          `"${(c.segment || '').replace(/"/g, '""')}"`,
          c.created_at
        ].join(','));
      });
      sections.push('\n');

      // Orders Section
      sections.push('--- ORDERS ---');
      const orders = data.orders || [];
      sections.push(['Order ID', 'Order Number', 'Total Amount ($)', 'Status', 'Payment Status', 'Date'].join(','));
      orders.forEach(o => {
        sections.push([
          o.id,
          `"${(o.order_number || '').replace(/"/g, '""')}"`,
          o.total_amount || 0,
          `"${(o.status || '').replace(/"/g, '""')}"`,
          `"${(o.payment_status || '').replace(/"/g, '""')}"`,
          o.created_at
        ].join(','));
      });

      return sections.join('\n');
    }

    return '';
  };

  const convertToTXT = (data, type) => {
    const lines = [];
    lines.push(`==================================================`);
    lines.push(`RESTAURANT DATA EXPORT REPORT`);
    lines.push(`Exported At: ${data.exportTimestamp || new Date().toISOString()}`);
    lines.push(`Restaurant ID: ${data.restaurantId}`);
    lines.push(`PII Redacted: ${data.piiRedacted ? 'YES' : 'NO'}`);
    lines.push(`==================================================\n`);

    if (type === 'menu' || type === 'all') {
      lines.push(`--- MENU CATALOG ---`);
      const items = data.menu?.items || [];
      lines.push(`Total Items: ${items.length}\n`);
      items.forEach((item, idx) => {
        lines.push(`${idx + 1}. ${item.name} ($${item.price})`);
        lines.push(`   Category: ${item.category}`);
        lines.push(`   Description: ${item.description || 'N/A'}`);
        lines.push(`   Status: ${item.is_available ? 'Available' : 'Unavailable'}`);
        lines.push(`--------------------------------------------------`);
      });
      lines.push(`\n`);
    }

    if (type === 'customers' || type === 'all') {
      lines.push(`--- CUSTOMER DATABASE ---`);
      const customers = data.customers || [];
      lines.push(`Total Customers: ${customers.length}\n`);
      customers.forEach((c, idx) => {
        lines.push(`${idx + 1}. Name: ${c.name}`);
        lines.push(`   Email: ${c.email}`);
        lines.push(`   Phone: ${c.phone}`);
        lines.push(`   Total Orders: ${c.total_orders || 0}`);
        lines.push(`   Total Spent: $${c.total_spent || 0}`);
        lines.push(`   Segment: ${c.segment || 'Regular'}`);
        lines.push(`--------------------------------------------------`);
      });
      lines.push(`\n`);
    }

    if (type === 'orders' || type === 'all') {
      lines.push(`--- ORDER HISTORY ---`);
      const orders = data.orders || [];
      lines.push(`Total Orders: ${orders.length}\n`);
      orders.forEach((o, idx) => {
        lines.push(`${idx + 1}. Order Number: ${o.order_number}`);
        lines.push(`   Total Amount: $${o.total_amount}`);
        lines.push(`   Status: ${o.status}`);
        lines.push(`   Payment: ${o.payment_status}`);
        lines.push(`   Date: ${o.created_at}`);
        lines.push(`--------------------------------------------------`);
      });
    }

    return lines.join('\n');
  };

  const handleExport = async (type) => {
    try {
      setDownloading(true);
      setMessage('');
      const res = await api.get(`/api/owner/data-export?type=${type}&redactPii=${redactPii}`);
      const data = res.data;

      let blob;
      let filename;

      if (exportFormat === 'csv') {
        const csvContent = convertToCSV(data, type);
        blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        filename = `restaurant-${type}-export-${Date.now()}.csv`;
      } else if (exportFormat === 'txt') {
        const txtContent = convertToTXT(data, type);
        blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8;' });
        filename = `restaurant-${type}-export-${Date.now()}.txt`;
      } else {
        const jsonString = JSON.stringify(data, null, 2);
        blob = new Blob([jsonString], { type: 'application/json' });
        filename = `restaurant-${type}-export-${Date.now()}.json`;
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      setMessage(`✅ Successfully exported ${type} dataset as ${exportFormat.toUpperCase()}!`);
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
        
        <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
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

        <div className="d-flex align-items-center justify-content-between">
          <div>
            <div className="fw-semibold text-dark">Export File Format</div>
            <div className="text-secondary small">Choose your preferred download format (CSV is recommended for Excel/Sheets)</div>
          </div>
          <div className="btn-group" role="group" aria-label="Export Format">
            <button
              type="button"
              className={`btn btn-sm px-3 ${exportFormat === 'csv' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setExportFormat('csv')}
            >
              CSV (Excel)
            </button>
            <button
              type="button"
              className={`btn btn-sm px-3 ${exportFormat === 'txt' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setExportFormat('txt')}
            >
              Text (TXT)
            </button>
            <button
              type="button"
              className={`btn btn-sm px-3 ${exportFormat === 'json' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setExportFormat('json')}
            >
              JSON
            </button>
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
