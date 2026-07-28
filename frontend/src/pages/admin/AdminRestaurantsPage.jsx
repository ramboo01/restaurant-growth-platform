import { useState } from 'react';

function AdminRestaurantsPage() {
  const [restaurants, setRestaurants] = useState([
    { id: 'rest_1', name: 'Taco Express', location: 'Lincoln Park', status: 'Active', orders: 1420, revenue: 45200.00, owner: 'Carlos Mendez' },
    { id: 'rest_2', name: 'Sushiko Sushi', location: 'Loop Flagship', status: 'Active', orders: 980, revenue: 38400.00, owner: 'Kenji Sato' },
    { id: 'rest_3', name: 'The Burger Barn', location: 'South End', status: 'Pending Approval', orders: 0, revenue: 0.00, owner: 'Robert Miller' },
    { id: 'rest_4', name: 'Pizzeria Bella', location: 'River North', status: 'Suspended', orders: 610, revenue: 19800.00, owner: 'Mario Rossi' },
  ]);

  const updateStatus = (id, newStatus) => {
    setRestaurants(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            <i className="bi bi-shop text-primary me-2"></i> Tenant Restaurant Management
          </h2>
          <p className="text-muted mb-0">Approve merchant signups, monitor location status, or suspend/reactivate store access.</p>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-uppercase small text-muted">
              <tr>
                <th className="ps-4">Restaurant Name</th>
                <th>Location</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Orders</th>
                <th>Revenue</th>
                <th className="pe-4 text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {restaurants.map(rest => (
                <tr key={rest.id}>
                  <td className="ps-4 fw-bold text-dark">{rest.name}</td>
                  <td>{rest.location}</td>
                  <td>{rest.owner}</td>
                  <td>
                    <span className={`badge ${rest.status === 'Active' ? 'bg-success' : rest.status === 'Pending Approval' ? 'bg-warning text-dark' : 'bg-danger'} px-3 py-1 rounded-pill`}>
                      {rest.status}
                    </span>
                  </td>
                  <td className="fw-medium">{rest.orders}</td>
                  <td className="fw-bold text-success">${rest.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="pe-4 text-end">
                    {rest.status === 'Pending Approval' && (
                      <button className="btn btn-success btn-sm me-2 fw-semibold" onClick={() => updateStatus(rest.id, 'Active')}>
                        <i className="bi bi-check-circle me-1"></i> Approve
                      </button>
                    )}
                    {rest.status === 'Active' && (
                      <button className="btn btn-outline-danger btn-sm fw-semibold" onClick={() => updateStatus(rest.id, 'Suspended')}>
                        <i className="bi bi-pause-circle me-1"></i> Suspend
                      </button>
                    )}
                    {rest.status === 'Suspended' && (
                      <button className="btn btn-outline-success btn-sm fw-semibold" onClick={() => updateStatus(rest.id, 'Active')}>
                        <i className="bi bi-play-circle me-1"></i> Reactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminRestaurantsPage;
