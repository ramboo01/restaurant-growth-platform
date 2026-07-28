import { useState } from 'react';

function StaffInventoryPage() {
  const [stock, setStock] = useState([
    { id: 1, name: 'Ground Beef (80/20)', category: 'Meat', count: 42, unit: 'lbs', lowThreshold: 20 },
    { id: 2, name: 'Corn Tortillas', category: 'Dry Goods', count: 180, unit: 'packs', lowThreshold: 50 },
    { id: 3, name: 'Avocados (Hass)', category: 'Produce', count: 12, unit: 'cases', lowThreshold: 15 },
    { id: 4, name: 'Oat Milk Barista', category: 'Dairy', count: 8, unit: 'cases', lowThreshold: 10 },
  ]);

  const updateCount = (id, delta) => {
    setStock(prev => prev.map(item => item.id === id ? { ...item, count: Math.max(0, item.count + delta) } : item));
  };

  return (
    <div className="container-fluid py-4" style={{ maxWidth: '900px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1 text-dark">
            <i className="bi bi-boxes text-success me-2"></i> Kitchen Stock Count Sheet
          </h2>
          <p className="text-muted mb-0">Daily kitchen physical inventory counting and stock update sheet.</p>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-uppercase small text-muted">
              <tr>
                <th className="ps-4">Ingredient Name</th>
                <th>Category</th>
                <th>Threshold</th>
                <th className="text-center">Current Stock</th>
                <th className="pe-4 text-end">Update Count</th>
              </tr>
            </thead>
            <tbody>
              {stock.map(item => {
                const isLow = item.count <= item.lowThreshold;
                return (
                  <tr key={item.id}>
                    <td className="ps-4 fw-bold text-dark">{item.name}</td>
                    <td><span className="badge bg-light text-dark border">{item.category}</span></td>
                    <td className="text-muted small">{item.lowThreshold} {item.unit}</td>
                    <td className="text-center">
                      <span className={`badge ${isLow ? 'bg-danger' : 'bg-success'} fs-6 px-3 py-2`}>
                        {item.count} {item.unit}
                      </span>
                    </td>
                    <td className="pe-4 text-end">
                      <div className="btn-group">
                        <button className="btn btn-outline-secondary btn-sm" onClick={() => updateCount(item.id, -1)}>-</button>
                        <button className="btn btn-outline-secondary btn-sm" onClick={() => updateCount(item.id, 1)}>+</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default StaffInventoryPage;
