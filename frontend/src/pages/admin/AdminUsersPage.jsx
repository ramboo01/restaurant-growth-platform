import { useState, useEffect } from 'react';
import api from '../../services/api.js';

function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/admin/users');
      const list = res.data?.data || res.data?.users || [];
      
      setUsers(list.map(u => ({
        id: u.id,
        name: u.name || 'Platform User',
        email: u.email || 'user@platform.com',
        role: u.role || 'Staff',
        status: 'Active'
      })));
    } catch (err) {
      console.error('Failed to load admin users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const updateRole = async (id, newRole) => {
    try {
      setSavingId(id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
      await api.patch(`/api/admin/users/${id}/role`, { role: newRole });
    } catch (err) {
      console.error('Failed to update user role:', err);
      loadUsers();
    } finally {
      setSavingId(null);
    }
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
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading users...</span>
            </div>
          </div>
        ) : (
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
                    <td className="ps-4 fw-bold text-dark">
                      <div className="d-flex align-items-center gap-2">
                        <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: 36, height: 36, fontSize: '0.85rem' }}>
                          {u.name ? u.name[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div>{u.name}</div>
                          <small className="text-muted fw-normal" style={{ fontSize: '0.75rem' }}>ID: #{u.id}</small>
                        </div>
                      </div>
                    </td>
                    <td className="text-muted">{u.email}</td>
                    <td>
                      <span className={`badge px-3 py-1 rounded-pill fw-semibold ${
                        u.role?.includes('Admin') ? 'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25' :
                        u.role?.includes('Owner') ? 'bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25' :
                        u.role?.includes('Driver') || u.role?.includes('Delivery') ? 'bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25' :
                        'bg-secondary bg-opacity-10 text-dark border'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td><span className="badge bg-success px-2 py-1">Active</span></td>
                    <td className="pe-4 text-end">
                      <select
                        className="form-select form-select-sm d-inline-block w-auto shadow-sm border-secondary-subtle fw-semibold"
                        value={u.role}
                        disabled={savingId === u.id}
                        onChange={(e) => updateRole(u.id, e.target.value)}
                      >
                        <option value="Admin">Platform Admin</option>
                        <option value="Owner">Restaurant Owner</option>
                        <option value="Staff">Staff</option>
                        <option value="Driver">Delivery Partner</option>
                        <option value="Customer">Customer / Guest</option>
                      </select>
                      {savingId === u.id && (
                        <span className="spinner-border spinner-border-sm ms-2 text-primary" role="status" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminUsersPage;
