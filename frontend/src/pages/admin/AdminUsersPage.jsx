import { useState } from 'react';

function AdminUsersPage() {
  const [users, setUsers] = useState([
    { id: 'usr_1', name: 'Super Admin', email: 'admin@platform.com', role: 'Platform Admin', status: 'Active' },
    { id: 'usr_2', name: 'Carlos Mendez', email: 'carlos@tacoexpress.com', role: 'Restaurant Owner', status: 'Active' },
    { id: 'usr_3', name: 'Alex Johnson', email: 'alex.driver@platform.com', role: 'Delivery Partner', status: 'Active' },
    { id: 'usr_4', name: 'Maria Garcia', email: 'maria.staff@tacoexpress.com', role: 'Staff', status: 'Active' },
  ]);

  const updateRole = (id, newRole) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            <i className="bi bi-people-fill text-primary me-2"></i> User & Role Management
          </h2>
          <p className="text-muted mb-0">Platform-wide user directory and role assignment matrix.</p>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light text-uppercase small text-muted">
              <tr>
                <th className="ps-4">User Name</th>
                <th>Email Address</th>
                <th>Assigned Role</th>
                <th>Status</th>
                <th className="pe-4 text-end">Role Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td className="ps-4 fw-bold text-dark">{u.name}</td>
                  <td className="text-muted">{u.email}</td>
                  <td>
                    <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-1 rounded-pill fw-semibold">
                      {u.role}
                    </span>
                  </td>
                  <td><span className="badge bg-success px-2 py-1">Active</span></td>
                  <td className="pe-4 text-end">
                    <select
                      className="form-select form-select-sm d-inline-block w-auto"
                      value={u.role}
                      onChange={(e) => updateRole(u.id, e.target.value)}
                    >
                      <option value="Platform Admin">Platform Admin</option>
                      <option value="Restaurant Owner">Restaurant Owner</option>
                      <option value="Staff">Staff</option>
                      <option value="Delivery Partner">Delivery Partner</option>
                    </select>
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

export default AdminUsersPage;
