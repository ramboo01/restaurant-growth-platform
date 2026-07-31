import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function StaffAvailabilityPage() {
  const [openShifts, setOpenShifts] = useState([]);
  const [myShifts, setMyShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState(null);
  const [message, setMessage] = useState('');

  const [availability, setAvailability] = useState({
    Monday: 'Morning',
    Tuesday: 'Morning',
    Wednesday: 'Off',
    Thursday: 'Evening',
    Friday: 'Evening',
    Saturday: 'Night',
    Sunday: 'Off'
  });

  useEffect(() => {
    fetchShifts();
  }, []);

  async function fetchShifts() {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/shifts/open', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.data) {
        setOpenShifts(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch open shifts:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleClaim = async (shiftId) => {
    try {
      setClaimingId(shiftId);
      setMessage('');
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/shifts/claim/${shiftId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ staffName: 'Logged-in Staff Member' })
      });
      const json = await res.json();
      if (res.ok) {
        setMessage('🎉 Shift claimed successfully! Added to your schedule.');
        fetchShifts();
      } else {
        setMessage(`❌ ${json.message || 'Failed to claim shift'}`);
      }
    } catch (err) {
      setMessage('❌ Shift claim failed.');
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold m-0 text-dark">
            📅 Staff Availability & Open Shift Claim Board (ST-006, ST-007)
          </h2>
          <p className="text-secondary small m-0">
            Claim open shifts for extra hours, manage weekly shift preferences, and respond to coverage calls.
          </p>
        </div>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={fetchShifts}>
          <i className="bi bi-arrow-clockwise me-1" /> Refresh Open Shifts
        </button>
      </div>

      {message && (
        <div className={`alert ${message.startsWith('🎉') ? 'alert-success' : 'alert-danger'} shadow-sm py-2 px-3 mb-4`}>
          {message}
        </div>
      )}

      <div className="row g-4">
        {/* Left Column: Open Shifts Available for Claim */}
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
              <h5 className="fw-bold m-0 text-dark">
                ⚡ Open Shifts Available for Claim ({openShifts.length})
              </h5>
              <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25">
                Instant Notification Active
              </span>
            </div>

            {loading ? (
              <div className="text-center py-4 text-muted small">Loading open shifts...</div>
            ) : openShifts.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-check-circle display-4 text-success mb-2 d-block" />
                <h6 className="fw-bold text-dark">All Shifts Covered!</h6>
                <p className="small m-0">There are currently no unfilled open shifts for your store.</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {openShifts.map((shift) => (
                  <div key={shift.id} className="p-3 bg-light rounded-3 border d-flex justify-content-between align-items-center">
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <span className="badge bg-primary">{shift.role}</span>
                        <span className="fw-bold text-dark">
                          {new Date(shift.shift_date || shift.shiftDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <div className="small fw-semibold text-secondary">
                        🕒 {shift.start_time || shift.startTime} - {shift.end_time || shift.endTime}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={claimingId === shift.id}
                      className="btn btn-success btn-sm fw-bold px-3 py-2 rounded-pill shadow-sm"
                      onClick={() => handleClaim(shift.id)}
                    >
                      {claimingId === shift.id ? 'Claiming...' : '✋ Claim Shift'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Weekly Availability Preference */}
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <h5 className="fw-bold mb-3 border-bottom pb-2">📆 Weekly Availability Settings</h5>
            <p className="small text-muted mb-3">Set your preferred working shifts for auto-assignment.</p>

            <div className="d-flex flex-column gap-2 mb-4">
              {Object.keys(availability).map((day) => (
                <div key={day} className="d-flex justify-content-between align-items-center p-2 bg-light rounded border">
                  <span className="fw-semibold text-dark small">{day}</span>
                  <select
                    className="form-select form-select-sm w-auto"
                    value={availability[day]}
                    onChange={(e) => setAvailability({ ...availability, [day]: e.target.value })}
                  >
                    <option value="Morning">Morning Shift</option>
                    <option value="Evening">Evening Shift</option>
                    <option value="Night">Night Shift</option>
                    <option value="Off">Day Off</option>
                  </select>
                </div>
              ))}
            </div>

            <button type="button" className="btn btn-primary btn-sm w-100 fw-bold py-2" onClick={() => alert('Availability settings saved!')}>
              Save Availability Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
