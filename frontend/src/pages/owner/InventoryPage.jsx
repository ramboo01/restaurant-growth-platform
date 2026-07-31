import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { inventoryService } from '../../services/inventoryService.js';

function getStatus(item) {
  if (item.currentStock <= 0) return 'Out of Stock';
  if (item.currentStock <= item.minimumStock) return 'Low Stock';
  return 'In Stock';
}

function formatCurrency(v) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(v) || 0);
}

function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [txnSummary, setTxnSummary] = useState({});
  const [activeTab, setActiveTab] = useState('stock');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [txnTypeFilter, setTxnTypeFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formValues, setFormValues] = useState({ name: '', category: '', currentStock: '', unit: '', minimumStock: '', costPerUnit: '' });

  // Transaction modal
  const [showTxnModal, setShowTxnModal] = useState(false);
  const [txnAction, setTxnAction] = useState(''); // 'stock-in', 'usage', 'wastage'
  const [txnItemId, setTxnItemId] = useState(null);
  const [txnItemName, setTxnItemName] = useState('');
  const [txnForm, setTxnForm] = useState({ quantity: '', performedBy: '', notes: '', costPerUnit: '' });

  const fetchAll = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await inventoryService.getInventory();
      setInventory(data);
      try {
        const txns = await inventoryService.getTransactions();
        setTransactions(txns);
        const summary = await inventoryService.getTransactionSummary();
        setTxnSummary(summary);
      } catch (e) { console.error('Txn fetch error:', e); }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch inventory.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const summary = useMemo(() => {
    const cats = new Set(inventory.map(i => i.category));
    const totalValue = inventory.reduce((sum, i) => sum + (i.currentStock * (i.costPerUnit || 0)), 0);
    return {
      totalItems: inventory.length,
      lowStock: inventory.filter(i => getStatus(i) === 'Low Stock').length,
      outOfStock: inventory.filter(i => getStatus(i) === 'Out of Stock').length,
      categories: cats.size,
      totalValue
    };
  }, [inventory]);

  const filteredInventory = useMemo(() => {
    const s = searchTerm.trim().toLowerCase();
    return inventory.filter(i => {
      const ms = i.name.toLowerCase().includes(s) || i.category.toLowerCase().includes(s);
      const mf = statusFilter === 'All' || getStatus(i) === statusFilter;
      return ms && mf;
    });
  }, [inventory, searchTerm, statusFilter]);

  const filteredTxns = useMemo(() => {
    if (txnTypeFilter === 'All') return transactions;
    return transactions.filter(t => t.type === txnTypeFilter);
  }, [transactions, txnTypeFilter]);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormValues(c => ({ ...c, [name]: value }));
  }

  const handleSaveItem = async () => {
    try {
      const payload = {
        name: formValues.name, category: formValues.category,
        currentStock: Number(formValues.currentStock), unit: formValues.unit,
        minimumStock: Number(formValues.minimumStock)
      };
      if (editingId) { await inventoryService.updateInventoryItem(editingId, payload); }
      else { await inventoryService.createInventoryItem(payload); }
      await fetchAll();
      setShowModal(false);
      setEditingId(null);
      setFormValues({ name: '', category: '', currentStock: '', unit: '', minimumStock: '', costPerUnit: '' });
    } catch { alert('Failed to save inventory item'); }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormValues({ name: item.name, category: item.category, currentStock: item.currentStock, unit: item.unit, minimumStock: item.minimumStock, costPerUnit: item.costPerUnit || '' });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this item?')) {
      try { await inventoryService.deleteInventoryItem(id); await fetchAll(); }
      catch { alert('Failed to delete'); }
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormValues({ name: '', category: '', currentStock: '', unit: '', minimumStock: '', costPerUnit: '' });
    setShowModal(true);
  };

  const openTxnModal = (action, item) => {
    setTxnAction(action);
    setTxnItemId(item.id);
    setTxnItemName(item.name);
    setTxnForm({ quantity: '', performedBy: '', notes: '', costPerUnit: item.costPerUnit || '' });
    setShowTxnModal(true);
  };

  const handleTxnSubmit = async () => {
    try {
      const payload = { quantity: Number(txnForm.quantity), performedBy: txnForm.performedBy || 'Owner', notes: txnForm.notes, costPerUnit: Number(txnForm.costPerUnit) || 0 };
      if (txnAction === 'stock-in') { await inventoryService.stockIn(txnItemId, payload); }
      else if (txnAction === 'usage') { await inventoryService.recordUsage(txnItemId, payload); }
      else if (txnAction === 'wastage') { await inventoryService.recordWastage(txnItemId, payload); }
      await fetchAll();
      setShowTxnModal(false);
      setTxnForm({ quantity: '', performedBy: '', notes: '', costPerUnit: '' });
    } catch (err) { alert(err.response?.data?.message || 'Transaction failed'); }
  };

  const txnLabels = { 'stock-in': { title: 'Stock In — Receive Inventory', color: 'success', icon: 'bi-box-arrow-in-down' }, usage: { title: 'Record Usage', color: 'warning', icon: 'bi-dash-circle' }, wastage: { title: 'Log Wastage / Spoilage', color: 'danger', icon: 'bi-trash3' } };
  const txnBadge = { 'Stock In': 'bg-success', Usage: 'bg-warning text-dark', Wastage: 'bg-danger', Adjustment: 'bg-info', 'Order Deduction': 'bg-primary' };

  return (
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div>
          <p className="text-uppercase text-secondary small fw-semibold mb-2">Inventory Management</p>
          <h1 className="h3 mb-1">Inventory & Stock Control</h1>
          <p className="text-secondary mb-0">Full transaction tracking, usage logs, and wastage management.</p>
        </div>
        <div className="d-flex gap-2">
          <Link className="btn btn-outline-secondary btn-sm" to="/owner">Back to Owner Home</Link>
          <button className="btn btn-primary btn-sm" onClick={openAddModal} type="button">Add Item</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total Items', val: summary.totalItems, icon: 'bi-box-seam' },
          { label: 'Low Stock', val: summary.lowStock, icon: 'bi-exclamation-triangle', cls: summary.lowStock > 0 ? 'text-warning' : '' },
          { label: 'Out of Stock', val: summary.outOfStock, icon: 'bi-x-octagon', cls: summary.outOfStock > 0 ? 'text-danger' : '' },
          { label: 'Inventory Value', val: formatCurrency(summary.totalValue), icon: 'bi-currency-dollar' },
          { label: 'Monthly Wastage', val: formatCurrency(txnSummary.monthlyWastageCost || 0), icon: 'bi-trash3', cls: 'text-danger' }
        ].map((c, i) => (
          <div className="col-6 col-md-4 col-xl" key={i}>
            <div className="card border-0 guest-info-card h-100">
              <div className="card-body">
                <p className="text-secondary small mb-1"><i className={`bi ${c.icon} me-1`}></i>{c.label}</p>
                <h2 className={`h4 mb-0 ${c.cls || ''}`}>{c.val}</h2>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        {[
          { key: 'stock', label: 'Stock Overview', icon: 'bi-box-seam' },
          { key: 'transactions', label: `Transaction Log (${transactions.length})`, icon: 'bi-clock-history' },
          { key: 'wastage', label: 'Wastage Tracker', icon: 'bi-trash3' }
        ].map(t => (
          <li className="nav-item" key={t.key}>
            <button className={`nav-link border-0 fw-semibold ${activeTab === t.key ? 'active text-primary' : 'text-secondary'}`} onClick={() => setActiveTab(t.key)} type="button">
              <i className={`bi ${t.icon} me-2`}></i>{t.label}
            </button>
          </li>
        ))}
      </ul>

      {/* Tab 1: Stock Overview */}
      {activeTab === 'stock' && (
        <>
          <div className="row g-3 mb-4">
            <div className="col-12 col-lg-6">
              <input className="form-control" placeholder="Search by ingredient or category..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="col-12 col-lg-3">
              <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option>All</option><option>Low Stock</option><option>Out of Stock</option><option>In Stock</option>
              </select>
            </div>
            <div className="col-12 col-lg-3">
              <button className="btn btn-primary w-100" onClick={openAddModal} type="button">Add Item</button>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>
          ) : error ? (
            <div className="alert alert-danger">{error}</div>
          ) : (
            <div className="card border-0 guest-info-card">
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Item</th><th>Category</th><th>Stock</th><th>Unit</th><th>Cost/Unit</th><th>Value</th><th>Status</th><th>Quick Actions</th><th>Manage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInventory.length ? filteredInventory.map(item => {
                        const status = getStatus(item);
                        const value = item.currentStock * (item.costPerUnit || 0);
                        return (
                          <tr key={item.id}>
                            <td><div className="fw-semibold">{item.name}</div><div className="small text-muted">ID: #{item.id}</div></td>
                            <td><span className="badge bg-light text-dark border">{item.category}</span></td>
                            <td className="fw-bold">{Number(item.currentStock).toFixed(1)}</td>
                            <td>{item.unit}</td>
                            <td>{formatCurrency(item.costPerUnit)}</td>
                            <td className="fw-semibold text-primary">{formatCurrency(value)}</td>
                            <td><span className={`badge ${status === 'In Stock' ? 'text-bg-success' : status === 'Low Stock' ? 'text-bg-warning' : 'text-bg-danger'}`}>{status}</span></td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <button className="btn btn-outline-success py-1 px-2" title="Stock In" onClick={() => openTxnModal('stock-in', item)} type="button"><i className="bi bi-plus-circle me-1"></i>In</button>
                                <button className="btn btn-outline-warning py-1 px-2" title="Record Usage" onClick={() => openTxnModal('usage', item)} type="button"><i className="bi bi-dash-circle me-1"></i>Use</button>
                                <button className="btn btn-outline-danger py-1 px-2" title="Log Wastage" onClick={() => openTxnModal('wastage', item)} type="button"><i className="bi bi-trash3 me-1"></i>Waste</button>
                              </div>
                            </td>
                            <td>
                              <div className="d-flex gap-1">
                                <button className="btn btn-outline-secondary btn-sm" onClick={() => handleEdit(item)} type="button">Edit</button>
                                <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(item.id)} type="button">Del</button>
                              </div>
                            </td>
                          </tr>
                        );
                      }) : (
                        <tr><td colSpan="9" className="text-center text-secondary py-5"><i className="bi bi-box-seam fs-2 d-block mb-2"></i>No inventory items found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Tab 2: Transaction Log */}
      {activeTab === 'transactions' && (
        <>
          <div className="row g-3 mb-4">
            <div className="col-12 col-lg-4">
              <select className="form-select" value={txnTypeFilter} onChange={e => setTxnTypeFilter(e.target.value)}>
                <option value="All">All Types</option>
                <option value="Stock In">Stock In</option>
                <option value="Usage">Usage</option>
                <option value="Wastage">Wastage</option>
                <option value="Order Deduction">Order Deduction</option>
                <option value="Adjustment">Adjustment</option>
              </select>
            </div>
          </div>
          <div className="card border-0 guest-info-card">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr><th>Date & Time</th><th>Item</th><th>Type</th><th>Qty</th><th>Before → After</th><th>By</th><th>Notes</th></tr>
                  </thead>
                  <tbody>
                    {filteredTxns.length ? filteredTxns.map(t => (
                      <tr key={t.id}>
                        <td className="small">{new Date(t.createdAt).toLocaleString()}</td>
                        <td className="fw-semibold">{t.itemName}</td>
                        <td><span className={`badge ${txnBadge[t.type] || 'bg-secondary'}`}>{t.type}</span></td>
                        <td className="fw-bold">{Number(t.quantity).toFixed(1)} {t.unit}</td>
                        <td className="small">{Number(t.previousStock).toFixed(1)} → {Number(t.newStock).toFixed(1)}</td>
                        <td><span className="badge bg-light text-dark border">{t.performedBy}</span></td>
                        <td className="small text-muted" style={{ maxWidth: 200 }}>{t.notes}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="7" className="text-center text-secondary py-5"><i className="bi bi-clock-history fs-2 d-block mb-2"></i>No transactions recorded yet. Use "Quick Actions" in Stock Overview to start tracking.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Tab 3: Wastage Tracker */}
      {activeTab === 'wastage' && (
        <>
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-4">
              <div className="card border-0 border-start border-danger border-3 guest-info-card h-100">
                <div className="card-body">
                  <p className="text-secondary small mb-1"><i className="bi bi-trash3 me-1"></i>Monthly Wastage Cost</p>
                  <h2 className="h4 mb-0 text-danger">{formatCurrency(txnSummary.monthlyWastageCost || 0)}</h2>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="card border-0 border-start border-warning border-3 guest-info-card h-100">
                <div className="card-body">
                  <p className="text-secondary small mb-1"><i className="bi bi-graph-down me-1"></i>Monthly Wastage Qty</p>
                  <h2 className="h4 mb-0 text-warning">{Number(txnSummary.monthlyWastageQty || 0).toFixed(1)} units</h2>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="card border-0 border-start border-info border-3 guest-info-card h-100">
                <div className="card-body">
                  <p className="text-secondary small mb-1"><i className="bi bi-piggy-bank me-1"></i>Total Inventory Value</p>
                  <h2 className="h4 mb-0 text-info">{formatCurrency(txnSummary.totalInventoryValue || 0)}</h2>
                </div>
              </div>
            </div>
          </div>
          <div className="card border-0 guest-info-card">
            <div className="card-header bg-white border-0 py-3"><h5 className="fw-bold mb-0 text-danger"><i className="bi bi-trash3 me-2"></i>Wastage Log</h5></div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light"><tr><th>Date</th><th>Item</th><th>Qty Wasted</th><th>Cost Loss</th><th>By</th><th>Reason</th></tr></thead>
                  <tbody>
                    {transactions.filter(t => t.type === 'Wastage').length ? transactions.filter(t => t.type === 'Wastage').map(t => (
                      <tr key={t.id}>
                        <td className="small">{new Date(t.createdAt).toLocaleString()}</td>
                        <td className="fw-semibold">{t.itemName}</td>
                        <td className="fw-bold text-danger">{Number(t.quantity).toFixed(1)} {t.unit}</td>
                        <td className="fw-bold text-danger">{formatCurrency(t.quantity * (t.costPerUnit || 0))}</td>
                        <td><span className="badge bg-light text-dark border">{t.performedBy}</span></td>
                        <td className="small text-muted">{t.notes}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="6" className="text-center text-secondary py-5"><i className="bi bi-emoji-smile fs-2 d-block mb-2"></i>No wastage recorded — Great job keeping waste low!</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Item Add/Edit Modal */}
      {showModal && (
        <>
          <div className="modal fade show d-block" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header"><h2 className="modal-title h5 mb-0">{editingId ? 'Edit Item' : 'Add Inventory Item'}</h2><button className="btn-close" onClick={() => setShowModal(false)} type="button" /></div>
                <div className="modal-body">
                  <div className="mb-3"><label className="form-label">Ingredient Name</label><input className="form-control" name="name" onChange={handleChange} value={formValues.name} /></div>
                  <div className="mb-3"><label className="form-label">Category</label><input className="form-control" name="category" onChange={handleChange} value={formValues.category} /></div>
                  <div className="row g-3">
                    <div className="col-6"><label className="form-label">Current Stock</label><input className="form-control" name="currentStock" type="number" onChange={handleChange} value={formValues.currentStock} /></div>
                    <div className="col-6"><label className="form-label">Unit</label><input className="form-control" name="unit" onChange={handleChange} value={formValues.unit} /></div>
                    <div className="col-6"><label className="form-label">Minimum Stock</label><input className="form-control" name="minimumStock" type="number" onChange={handleChange} value={formValues.minimumStock} /></div>
                    <div className="col-6"><label className="form-label">Cost / Unit ($)</label><input className="form-control" name="costPerUnit" type="number" step="0.01" onChange={handleChange} value={formValues.costPerUnit} /></div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-outline-secondary" onClick={() => setShowModal(false)} type="button">Cancel</button>
                  <button className="btn btn-primary" disabled={!formValues.name || !formValues.category || !formValues.currentStock || !formValues.unit || !formValues.minimumStock} onClick={handleSaveItem} type="button">{editingId ? 'Save Changes' : 'Add Item'}</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}

      {/* Transaction Modal */}
      {showTxnModal && (
        <>
          <div className="modal fade show d-block" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className={`modal-header bg-${txnLabels[txnAction]?.color} bg-opacity-10`}>
                  <h2 className="modal-title h5 mb-0"><i className={`bi ${txnLabels[txnAction]?.icon} me-2`}></i>{txnLabels[txnAction]?.title}</h2>
                  <button className="btn-close" onClick={() => setShowTxnModal(false)} type="button" />
                </div>
                <div className="modal-body">
                  <div className="alert alert-light border mb-3"><strong>Item:</strong> {txnItemName}</div>
                  <div className="mb-3"><label className="form-label fw-semibold">Quantity *</label><input className="form-control" type="number" step="0.1" min="0.1" placeholder="e.g. 10" value={txnForm.quantity} onChange={e => setTxnForm(c => ({ ...c, quantity: e.target.value }))} /></div>
                  <div className="mb-3"><label className="form-label fw-semibold">Performed By</label><input className="form-control" placeholder="e.g. Rahul, Chef Priya" value={txnForm.performedBy} onChange={e => setTxnForm(c => ({ ...c, performedBy: e.target.value }))} /></div>
                  <div className="mb-3"><label className="form-label fw-semibold">Notes / Reason</label><textarea className="form-control" rows={2} placeholder={txnAction === 'wastage' ? 'e.g. Expired, Dropped, Burnt' : 'Optional notes...'} value={txnForm.notes} onChange={e => setTxnForm(c => ({ ...c, notes: e.target.value }))} /></div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-outline-secondary" onClick={() => setShowTxnModal(false)} type="button">Cancel</button>
                  <button className={`btn btn-${txnLabels[txnAction]?.color}`} disabled={!txnForm.quantity || Number(txnForm.quantity) <= 0} onClick={handleTxnSubmit} type="button">
                    {txnAction === 'stock-in' ? 'Receive Stock' : txnAction === 'usage' ? 'Record Usage' : 'Log Wastage'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}
    </div>
  );
}

export default InventoryPage;
