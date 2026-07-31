import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { staffService } from '../../services/staffService.js';

const roleOptions = ['Manager', 'Chef', 'Cashier', 'Waiter', 'Delivery Driver'];
const shiftOptions = ['Morning', 'Evening', 'Night'];

function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [activeTab, setActiveTab] = useState('directory'); // 'directory', 'attendance', 'shifts'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
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

  const [shiftValues, setShiftValues] = useState({
    staffName: '',
    role: 'Kitchen',
    shiftDate: new Date().toISOString().split('T')[0],
    startTime: '09:00 AM',
    endTime: '05:00 PM',
    isOpenShift: false
  });

  const fetchStaff = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await staffService.getStaff();
      setStaff(data);
      try {
        const attData = await staffService.getAttendanceHistory();
        setAttendance(attData);
      } catch (attErr) {
        console.error('Failed to fetch attendance history:', attErr);
      }
      fetchShifts();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch staff.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchShifts = async () => {
    try {
      const res = await staffService.api?.get ? staffService.api.get('/api/shifts/owner') : null;
      if (res?.data?.data) {
        setShifts(res.data.data);
      }
    } catch (err) {
      // Fallback fetch via global fetch if service helper not imported
      try {
        const token = localStorage.getItem('token');
        const r = await fetch('/api/shifts/owner', { headers: { Authorization: `Bearer ${token}` } });
        const json = await r.json();
        if (json.data) setShifts(json.data);
      } catch (e) {
        console.error('Failed to fetch shifts:', e);
      }
    }
  };

  const handleCreateShift = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/shifts/owner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(shiftValues)
      });
      alert('Shift created successfully!');
      setShowShiftModal(false);
      fetchShifts();
    } catch (err) {
      alert('Failed to create shift');
    }
  };

  const handleSeedDemoStaff = async () => {
    try {
      setIsLoading(true);
      await staffService.createStaff({ name: 'Rahul Sharma', role: 'Manager', phone: '9876543210', email: 'rahul@restaurant.com', shift: 'Morning', status: 'Active' });
      await staffService.createStaff({ name: 'Priya Verma', role: 'Chef', phone: '9812345678', email: 'priya@restaurant.com', shift: 'Morning', status: 'Active' });
      await staffService.createStaff({ name: 'Amit Kumar', role: 'Cashier', phone: '9711223344', email: 'amit@restaurant.com', shift: 'Evening', status: 'Active' });
      await fetchStaff();
    } catch (err) {
      alert('Failed to seed demo staff.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClockIn = async (staffId) => {
    try {
      await staffService.clockIn(staffId);
      await fetchStaff();
      alert('Clock-in recorded successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Clock-in failed or already clocked in.');
    }
  };

  const handleClockOut = async (staffId) => {
    try {
      await staffService.clockOut(staffId);
      await fetchStaff();
      alert('Clock-out recorded successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Clock-out failed or session not active.');
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
    let finalVal = value;
    if (name === 'phone') {
      finalVal = value.replace(/\D/g, '').slice(0, 10);
    }
    setFormValues((current) => ({
      ...current,
      [name]: finalVal
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

      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
        <ul className="nav nav-tabs border-0">
          <li className="nav-item">
            <button
              className={`nav-link border-0 fw-semibold ${activeTab === 'directory' ? 'active text-primary border-bottom border-primary border-2' : 'text-secondary'}`}
              onClick={() => setActiveTab('directory')}
              type="button"
            >
              <i className="bi bi-people me-2"></i>Staff Directory ({summary.totalStaff})
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link border-0 fw-semibold ${activeTab === 'attendance' ? 'active text-primary border-bottom border-primary border-2' : 'text-secondary'}`}
              onClick={() => setActiveTab('attendance')}
              type="button"
            >
              <i className="bi bi-clock-history me-2"></i>Attendance & Shift Logs ({attendance.length})
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link border-0 fw-semibold ${activeTab === 'shifts' ? 'active text-primary border-bottom border-primary border-2' : 'text-secondary'}`}
              onClick={() => setActiveTab('shifts')}
              type="button"
            >
              <i className="bi bi-calendar-range me-2"></i>Shift Schedule & Open Shifts ({shifts.length})
            </button>
          </li>
        </ul>
        <div className="d-flex gap-2">
          {activeTab === 'shifts' && (
            <button className="btn btn-success btn-sm fw-semibold" onClick={() => setShowShiftModal(true)} type="button">
              <i className="bi bi-plus-circle me-1"></i> Create Shift / Open Shift
            </button>
          )}
          {summary.totalStaff === 0 && (
            <button className="btn btn-outline-success btn-sm" onClick={handleSeedDemoStaff} type="button">
              <i className="bi bi-magic me-1"></i> Seed Demo Team
            </button>
          )}
        </div>
      </div>

      {activeTab === 'directory' ? (
        <>
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
                      <th>Phone / Email</th>
                      <th>Shift</th>
                      <th>Status</th>
                      <th>Quick Attendance</th>
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
                          <td>
                            <div className="fw-semibold text-dark">{member.name}</div>
                            <div className="small text-muted">ID: #{member.id}</div>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark border">{member.role}</span>
                          </td>
                          <td>
                            <div>{member.phone}</div>
                            <div className="small text-muted">{member.email}</div>
                          </td>
                          <td>
                            <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25">
                              {member.shift} Shift
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${member.status === 'Active' ? 'text-bg-success' : 'text-bg-secondary'}`}>
                              {member.status}
                            </span>
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-outline-success py-1 px-2"
                                title="Clock In"
                                onClick={() => handleClockIn(member.id)}
                                type="button"
                              >
                                <i className="bi bi-play-circle me-1"></i>In
                              </button>
                              <button
                                className="btn btn-outline-warning py-1 px-2"
                                title="Clock Out"
                                onClick={() => handleClockOut(member.id)}
                                type="button"
                              >
                                <i className="bi bi-stop-circle me-1"></i>Out
                              </button>
                            </div>
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
                        <td colSpan="7" className="text-center text-secondary py-5">
                          <i className="bi bi-people fs-2 text-muted d-block mb-2"></i>
                          No staff members found in database.
                          <div className="mt-2">
                            <button className="btn btn-primary btn-sm me-2" onClick={openAddModal} type="button">
                              Add Staff Member
                            </button>
                            <button className="btn btn-outline-success btn-sm" onClick={handleSeedDemoStaff} type="button">
                              Seed Demo Team
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : activeTab === 'attendance' ? (
        <div className="card border-0 guest-info-card">
          <div className="card-header bg-white border-0 py-3">
            <h5 className="fw-bold mb-0">Live Staff Attendance & Timecards</h5>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Staff Name</th>
                    <th>Role</th>
                    <th>Clock In Time</th>
                    <th>Clock Out Time</th>
                    <th>Total Hours</th>
                    <th>Session Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.length ? (
                    attendance.map((log) => (
                      <tr key={log.id}>
                        <td className="fw-semibold">{log.staffName}</td>
                        <td><span className="badge bg-light text-dark border">{log.role}</span></td>
                        <td>{log.clockIn ? new Date(log.clockIn).toLocaleString() : '-'}</td>
                        <td>{log.clockOut ? new Date(log.clockOut).toLocaleString() : 'In Progress'}</td>
                        <td className="fw-bold text-primary">{log.totalHours ? `${log.totalHours} hrs` : '-'}</td>
                        <td>
                          <span className={`badge ${log.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                            {log.status === 'Active' ? 'Working Now' : 'Completed'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center text-secondary py-5">
                        <i className="bi bi-clock-history fs-2 text-muted d-block mb-2"></i>
                        No attendance logs recorded yet. Use the "Quick Attendance" buttons in Staff Directory to clock staff in/out.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* OWN-015 & OWN-016 Shift Planner & Open Shift Fill Monitor */
        <div className="card border-0 guest-info-card">
          <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
            <div>
              <h5 className="fw-bold mb-0">Weekly Shift Schedule & Open Shift Monitor (OWN-015, OWN-016)</h5>
              <span className="text-muted small">Schedule shifts or post open shifts for staff to claim in real time.</span>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowShiftModal(true)}>
              <i className="bi bi-plus-lg me-1"></i> Post New Shift
            </button>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Date</th>
                    <th>Role</th>
                    <th>Time Slot</th>
                    <th>Assigned Staff</th>
                    <th>Shift Status</th>
                    <th>Open Shift Alert</th>
                  </tr>
                </thead>
                <tbody>
                  {shifts.length ? (
                    shifts.map((shift) => (
                      <tr key={shift.id}>
                        <td className="fw-bold">{new Date(shift.shift_date || shift.shiftDate).toLocaleDateString()}</td>
                        <td><span className="badge bg-light text-dark border">{shift.role}</span></td>
                        <td className="fw-semibold text-primary">{shift.start_time || shift.startTime} - {shift.end_time || shift.endTime}</td>
                        <td className="fw-semibold">{shift.staff_name || shift.staffName}</td>
                        <td>
                          <span className={`badge ${shift.is_open_shift || shift.isOpenShift ? 'bg-warning text-dark' : 'bg-success'}`}>
                            {shift.status || (shift.is_open_shift ? 'Open Shift' : 'Scheduled')}
                          </span>
                        </td>
                        <td>
                          {shift.is_open_shift || shift.isOpenShift ? (
                            <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25">
                              <i className="bi bi-bell-fill me-1"></i> Open - Alert Sent
                            </span>
                          ) : (
                            <span className="text-muted small">Filled</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center text-secondary py-5">
                        <i className="bi bi-calendar-check fs-2 text-muted d-block mb-2"></i>
                        No shifts scheduled for this period. Click "Post New Shift" to add your team roster.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

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
                        Phone Number (Digits only)
                      </label>
                      <input
                        type="tel"
                        className="form-control"
                        id="staffPhone"
                        name="phone"
                        maxLength={10}
                        placeholder="e.g. 9876543210"
                        onChange={handleChange}
                        value={formValues.phone}
                      />
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

      {showShiftModal && (
        <>
          <div className="modal fade show d-block" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <form onSubmit={handleCreateShift}>
                  <div className="modal-header">
                    <h5 className="modal-title fw-bold">Post New Shift / Open Shift Alert</h5>
                    <button className="btn-close" onClick={() => setShowShiftModal(false)} type="button" />
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <div className="form-check form-switch p-2 bg-light rounded border">
                        <input
                          className="form-check-input ms-0 me-2"
                          type="checkbox"
                          id="isOpenShiftToggle"
                          checked={shiftValues.isOpenShift}
                          onChange={(e) => setShiftValues({ ...shiftValues, isOpenShift: e.target.checked })}
                        />
                        <label className="form-check-label fw-bold text-danger" htmlFor="isOpenShiftToggle">
                          ⚡ Post as "Open Shift" for Team Claim Broadcast
                        </label>
                      </div>
                    </div>

                    {!shiftValues.isOpenShift && (
                      <div className="mb-3">
                        <label className="form-label fw-semibold">Assign Staff Member</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Marco Rossi"
                          value={shiftValues.staffName}
                          onChange={(e) => setShiftValues({ ...shiftValues, staffName: e.target.value })}
                        />
                      </div>
                    )}

                    <div className="row g-3 mb-3">
                      <div className="col-6">
                        <label className="form-label fw-semibold">Role Required</label>
                        <select
                          className="form-select"
                          value={shiftValues.role}
                          onChange={(e) => setShiftValues({ ...shiftValues, role: e.target.value })}
                        >
                          <option>Executive Chef</option>
                          <option>Sous Chef</option>
                          <option>Line Cook</option>
                          <option>Cashier</option>
                          <option>Waiter</option>
                          <option>Delivery Driver</option>
                        </select>
                      </div>
                      <div className="col-6">
                        <label className="form-label fw-semibold">Shift Date</label>
                        <input
                          type="date"
                          className="form-control"
                          value={shiftValues.shiftDate}
                          onChange={(e) => setShiftValues({ ...shiftValues, shiftDate: e.target.value })}
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label fw-semibold">Start Time</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="09:00 AM"
                          value={shiftValues.startTime}
                          onChange={(e) => setShiftValues({ ...shiftValues, startTime: e.target.value })}
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label fw-semibold">End Time</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="05:00 PM"
                          value={shiftValues.endTime}
                          onChange={(e) => setShiftValues({ ...shiftValues, endTime: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button className="btn btn-outline-secondary" onClick={() => setShowShiftModal(false)} type="button">
                      Cancel
                    </button>
                    <button className="btn btn-success fw-bold" type="submit">
                      Post & Save Shift
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}
    </div>
  );
}

export default StaffPage;
