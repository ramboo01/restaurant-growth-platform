import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { staffService } from '../../services/staffService.js';

const roleOptions = ['Manager', 'Chef', 'Cashier', 'Waiter', 'Delivery Driver'];
const shiftOptions = ['Morning', 'Evening', 'Night'];

function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formValues, setFormValues] = useState({
    name: '',
    role: 'Manager',
    phone: '',
    email: '',
    shift: 'Morning',
    status: 'Active'
  });

  const fetchStaff = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await staffService.getStaff();
      setStaff(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch staff.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const summary = useMemo(() => {
    return {
      totalStaff: staff.length,
      activeStaff: staff.filter((member) => member.status === 'Active').length,
      managers: staff.filter((member) => member.role === 'Manager').length,
      kitchenStaff: staff.filter((member) => member.role === 'Chef').length
    };
  }, [staff]);

  const filteredStaff = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return staff.filter((member) => {
      const matchesSearch =
        member.name.toLowerCase().includes(normalizedSearch) ||
        member.role.toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === 'All' || member.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [staff, searchTerm, statusFilter]);

  function openAddModal() {
    setEditingId(null);
    setFormValues({
      name: '',
      role: 'Manager',
      phone: '',
      email: '',
      shift: 'Morning',
      status: 'Active'
    });
    setShowModal(true);
  }

  function openEditModal(member) {
    setEditingId(member._id || member.id);
    setFormValues({
      name: member.name,
      role: member.role,
      phone: member.phone,
      email: member.email,
      shift: member.shift,
      status: member.status
    });
    setShowModal(true);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormValues((current) => ({
      ...current,
      [name]: value
    }));
  }

  async function handleSave() {
    try {
      if (editingId) {
        await staffService.updateStaff(editingId, formValues);
      } else {
        await staffService.createStaff(formValues);
      }
      await fetchStaff();
      setShowModal(false);
    } catch (err) {
      alert('Failed to save staff member.');
    }
  }

  async function handleDelete(member) {
    const confirmed = window.confirm(`Delete ${member.name}?`);
    if (!confirmed) {
      return;
    }

    try {
      await staffService.deleteStaff(member._id || member.id);
      await fetchStaff();
    } catch (err) {
      alert('Failed to delete staff member.');
    }
  }

  return (
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div>
          <p className="text-uppercase text-secondary small fw-semibold mb-2">Staff Management</p>
          <h1 className="h3 mb-1">Staff & Scheduling</h1>
          <p className="text-secondary mb-0">Manage team coverage and shifts.</p>
        </div>
        <div className="d-flex gap-2">
          <Link className="btn btn-outline-secondary btn-sm" to="/owner">
            Back to Owner Home
          </Link>
          <button className="btn btn-primary btn-sm" onClick={openAddModal} type="button">
            Add Staff
          </button>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6 col-xl-3">
          <div className="card border-0 guest-info-card h-100">
            <div className="card-body">
              <p className="text-secondary small mb-1">Total Staff</p>
              <h2 className="h4 mb-0">{summary.totalStaff}</h2>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <div className="card border-0 guest-info-card h-100">
            <div className="card-body">
              <p className="text-secondary small mb-1">Active Staff</p>
              <h2 className="h4 mb-0">{summary.activeStaff}</h2>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <div className="card border-0 guest-info-card h-100">
            <div className="card-body">
              <p className="text-secondary small mb-1">Managers</p>
              <h2 className="h4 mb-0">{summary.managers}</h2>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <div className="card border-0 guest-info-card h-100">
            <div className="card-body">
              <p className="text-secondary small mb-1">Kitchen Staff</p>
              <h2 className="h4 mb-0">{summary.kitchenStaff}</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-6">
          <label className="form-label" htmlFor="staffSearch">
            Search by Name or Role
          </label>
          <input
            className="form-control"
            id="staffSearch"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search staff..."
            value={searchTerm}
          />
        </div>
        <div className="col-12 col-lg-4">
          <label className="form-label" htmlFor="staffStatusFilter">
            Status Filter
          </label>
          <select
            className="form-select"
            id="staffStatusFilter"
            onChange={(event) => setStatusFilter(event.target.value)}
            value={statusFilter}
          >
            <option>All</option>
            <option>Active</option>
            <option>On Leave</option>
          </select>
        </div>
        <div className="col-12 col-lg-2 d-flex align-items-end">
          <button className="btn btn-outline-primary w-100" onClick={openAddModal} type="button">
            Add Staff
          </button>
        </div>
      </div>

      <div className="card border-0 guest-info-card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Shift</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="7" className="text-center text-danger py-4">
                      {error}
                    </td>
                  </tr>
                ) : filteredStaff.length ? (
                  filteredStaff.map((member) => (
                    <tr key={member._id || member.id}>
                      <td className="fw-semibold">{member.name}</td>
                      <td>{member.role}</td>
                      <td>{member.phone}</td>
                      <td>{member.email}</td>
                      <td>{member.shift}</td>
                      <td>
                        <span className={`badge ${member.status === 'Active' ? 'text-bg-success' : 'text-bg-secondary'}`}>
                          {member.status}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <button className="btn btn-outline-secondary btn-sm" onClick={() => openEditModal(member)} type="button">
                            Edit
                          </button>
                          <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(member)} type="button">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center text-secondary py-4">
                      No staff found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal ? (
        <>
          <div className="modal fade show d-block" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h2 className="modal-title h5 mb-0">{editingId ? 'Edit Staff' : 'Add Staff'}</h2>
                  <button className="btn-close" onClick={() => setShowModal(false)} type="button" />
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label" htmlFor="staffName">
                      Name
                    </label>
                    <input className="form-control" id="staffName" name="name" onChange={handleChange} value={formValues.name} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="staffRole">
                      Role
                    </label>
                    <select className="form-select" id="staffRole" name="role" onChange={handleChange} value={formValues.role}>
                      {roleOptions.map((role) => (
                        <option key={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="staffPhone">
                        Phone
                      </label>
                      <input className="form-control" id="staffPhone" name="phone" onChange={handleChange} value={formValues.phone} />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="staffEmail">
                        Email
                      </label>
                      <input className="form-control" id="staffEmail" name="email" onChange={handleChange} value={formValues.email} />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="staffShift">
                        Shift
                      </label>
                      <select className="form-select" id="staffShift" name="shift" onChange={handleChange} value={formValues.shift}>
                        {shiftOptions.map((shift) => (
                          <option key={shift}>{shift}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="staffStatus">
                        Status
                      </label>
                      <select className="form-select" id="staffStatus" name="status" onChange={handleChange} value={formValues.status}>
                        <option>Active</option>
                        <option>On Leave</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-outline-secondary" onClick={() => setShowModal(false)} type="button">
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    disabled={!formValues.name || !formValues.phone || !formValues.email}
                    onClick={handleSave}
                    type="button"
                  >
                    {editingId ? 'Save Changes' : 'Add Staff'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      ) : null}
    </div>
  );
}

export default StaffPage;
