import { useState, useEffect } from 'react';
import api from '../../services/api';

function StaffInventoryPage() {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [successId, setSuccessId] = useState(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  async function fetchInventory() {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/inventory');
      const data = res.data;
      const list = Array.isArray(data) ? data : (data?.data || data?.items || data?.inventory || []);
      setStock(list);
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
      // Graceful fallback
      setStock([
        { id: 1, name: 'Ground Beef (80/20)', category: 'Meat', quantity: 42, unit: 'lbs', reorder_level: 20 },
        { id: 2, name: 'Corn Tortillas', category: 'Dry Goods', quantity: 180, unit: 'packs', reorder_level: 50 },
        { id: 3, name: 'Avocados (Hass)', category: 'Produce', quantity: 12, unit: 'cases', reorder_level: 15 },
        { id: 4, name: 'Oat Milk Barista', category: 'Dairy', quantity: 8, unit: 'cases', reorder_level: 10 },
      ]);
      setError('Live data unavailable — showing demo stock counts.');
    } finally {
      setLoading(false);
    }
  }

  const updateCount = async (id, delta) => {
    setStock(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(0, (item.quantity || 0) + delta) } : item));
    try {
      setSavingId(id);
      const item = stock.find(s => s.id === id);
      const newQty = Math.max(0, (item?.quantity || 0) + delta);
      await api.put(`/api/inventory/${id}`, { quantity: newQty });
      setSuccessId(id);
      setTimeout(() => setSuccessId(null), 2000);
    } catch (err) {
      console.error('Failed to update inventory count:', err);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="container-fluid py-4" style={{ maxWidth: '960px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 text-dark">
            <i className="bi bi-boxes text-success me-2"></i> Kitchen Stock Count Sheet (ST-008)
          </h2>
          <p className="text-muted mb-0">Daily kitchen physical inventory counting and live stock update interface.</p>
        </div>
        <button className="btn btn-outline-secondary btn-sm" onClick={fetchInventory}>
          <i className="bi bi-arrow-clockwise me-1" /> Refresh
        </button>
      </div>

      {error && (
        <div className="alert alert-warning py-2 px-3 mb-3 small">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-5 text-muted">
          <div className="spinner-border spinner-border-sm me-2" role="status"></div>
          Loading inventory stock...
        </div>
      ) : (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light text-uppercase small text-muted">
                <tr>
                  <th className="ps-4">Ingredient / Item</th>
                  <th>Category</th>
                  <th>Reorder Level</th>
                  <th className="text-center">Live Count</th>
                  <th className="pe-4 text-center">Update Count</th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(stock) ? stock : []).map(item => {
                  const qty = item.quantity ?? item.count ?? 0;
                  const threshold = item.reorder_level ?? item.lowThreshold ?? 0;
                  const isLow = qty <= threshold;
                  const isSaving = savingId === item.id;
                  const isSuccess = successId === item.id;
                  return (
                    <tr key={item.id}>
                      <td className="ps-4 fw-bold text-dark">{item.name}</td>
                      <td>
                        <span className="badge bg-light text-dark border">{item.category}</span>
                      </td>
                      <td className="text-muted small">{threshold} {item.unit}</td>
                      <td className="text-center">
                        <span className={`badge ${isLow ? 'bg-danger' : 'bg-success'} fs-6 px-3 py-2`}>
                          {qty} {item.unit}
                        </span>
                        {isLow && (
                          <div className="text-danger extra-small mt-1 fw-bold">⚠ Low Stock</div>
                        )}
                      </td>
                      <td className="pe-4 text-center">
                        <div className="btn-group">
                          <button
                            className="btn btn-outline-secondary btn-sm"
                            disabled={isSaving}
                            onClick={() => updateCount(item.id, -1)}
                          >
                            <i className="bi bi-dash" />
                          </button>
                          <button
                            className="btn btn-outline-secondary btn-sm"
                            disabled={isSaving}
                            onClick={() => updateCount(item.id, 1)}
                          >
                            <i className="bi bi-plus" />
                          </button>
                        </div>
                        {isSaving && <div className="text-muted small mt-1">Saving...</div>}
                        {isSuccess && <div className="text-success small mt-1">✓ Saved</div>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default StaffInventoryPage;
