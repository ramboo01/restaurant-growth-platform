import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function GuestPreferencesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [erasureModalOpen, setErasureModalOpen] = useState(false);
  const [erasureSubmitting, setErasureSubmitting] = useState(false);
  const [erasureSuccess, setErasureSuccess] = useState(false);

  const [prefs, setPrefs] = useState({
    email_opt_in: true,
    sms_opt_in: true,
    whatsapp_opt_in: true,
    push_opt_in: true,
    direct_incentive_opt_in: true,
    erasure_requested: false
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  async function fetchPreferences() {
    try {
      setLoading(true);
      const res = await api.get('/api/customer/preferences');
      if (res.data?.data) {
        setPrefs({
          email_opt_in: Boolean(res.data.data.email_opt_in),
          sms_opt_in: Boolean(res.data.data.sms_opt_in),
          whatsapp_opt_in: Boolean(res.data.data.whatsapp_opt_in),
          push_opt_in: Boolean(res.data.data.push_opt_in),
          direct_incentive_opt_in: Boolean(res.data.data.direct_incentive_opt_in),
          erasure_requested: Boolean(res.data.data.erasure_requested)
        });
      }
    } catch (err) {
      console.error('Failed to load guest preferences:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleToggle = (key) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage('');
      await api.put('/api/customer/preferences', prefs);
      setMessage('✅ Privacy & notification preferences saved successfully!');
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      console.error('Failed to save preferences:', err);
      setMessage('❌ Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleErasureRequest = async () => {
    try {
      setErasureSubmitting(true);
      await api.post('/api/customer/privacy/erasure-request');
      setErasureSuccess(true);
      setPrefs((prev) => ({ ...prev, erasure_requested: true }));
    } catch (err) {
      console.error('Erasure request failed:', err);
      alert('Failed to submit erasure request. Please try again.');
    } finally {
      setErasureSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary mb-2" />
        <div>Loading Preferences & Privacy Settings...</div>
      </div>
    );
  }

  return (
    <div className="container py-4 max-w-2xl" style={{ maxWidth: 720 }}>
      <div className="mb-4">
        <h2 className="fw-bold" style={{ color: '#111' }}>
          🔒 Privacy & Notification Preferences (GST-009)
        </h2>
        <p className="text-secondary small">
          Control which channels the restaurant uses to send you order updates, loyalty alerts, and special offers.
        </p>
      </div>

      {message && (
        <div className={`alert ${message.startsWith('✅') ? 'alert-success' : 'alert-danger'} shadow-sm py-2 px-3 mb-4`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSave}>
        {/* Channel Preferences Card */}
        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4" style={{ background: '#fff' }}>
          <h5 className="fw-bold mb-3 border-bottom pb-2">🔔 Notification Channels</h5>

          <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
            <div>
              <div className="fw-semibold text-dark">Email Alerts</div>
              <div className="text-secondary extra-small">Order confirmations, receipts, & monthly reward reminders</div>
            </div>
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                checked={prefs.email_opt_in}
                onChange={() => handleToggle('email_opt_in')}
              />
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
            <div>
              <div className="fw-semibold text-dark">SMS Text Messages</div>
              <div className="text-secondary extra-small">Time-sensitive order status updates & driver tracking</div>
            </div>
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                checked={prefs.sms_opt_in}
                onChange={() => handleToggle('sms_opt_in')}
              />
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center py-3 border-bottom">
            <div>
              <div className="fw-semibold text-dark">WhatsApp Broadcasts</div>
              <div className="text-secondary extra-small">Exclusive VIP discounts & direct order promotional codes</div>
            </div>
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                checked={prefs.whatsapp_opt_in}
                onChange={() => handleToggle('whatsapp_opt_in')}
              />
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center py-3">
            <div>
              <div className="fw-semibold text-dark">Web / App Push Notifications</div>
              <div className="text-secondary extra-small">Real-time alerts when kitchen starts preparing your food</div>
            </div>
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                checked={prefs.push_opt_in}
                onChange={() => handleToggle('push_opt_in')}
              />
            </div>
          </div>
        </div>

        {/* Marketing & Arbitrage Incentive Preferences */}
        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4" style={{ background: '#fff' }}>
          <h5 className="fw-bold mb-3 border-bottom pb-2">🏷️ Direct Order Incentives</h5>

          <div className="d-flex justify-content-between align-items-center py-2">
            <div>
              <div className="fw-semibold text-dark">Order Direct & Save Offers</div>
              <div className="text-secondary extra-small">Receive special discounts when ordering directly instead of via third-party apps</div>
            </div>
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                checked={prefs.direct_incentive_opt_in}
                onChange={() => handleToggle('direct_incentive_opt_in')}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn btn-primary fw-bold rounded-3 px-4 py-2 mb-5"
          style={{ background: '#e91e8c', borderColor: '#e91e8c' }}
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </form>

      {/* GDPR Data Erasure / Right-to-be-forgotten Section */}
      <div className="card border-danger border-opacity-25 shadow-sm rounded-4 p-4" style={{ background: '#fff5f5' }}>
        <h5 className="fw-bold text-danger mb-2">🗑️ Right-to-be-Forgotten (Data Erasure)</h5>
        <p className="text-secondary small mb-3">
          Under platform privacy rules, you have the right to request permanent anonymization of your profile, PII, and order history.
        </p>

        {prefs.erasure_requested ? (
          <div className="alert alert-warning mb-0 py-2 px-3 small">
            ⌛ <strong>Erasure Request Active:</strong> Your profile is queued for PII anonymization within 30 days.
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-outline-danger btn-sm align-self-start fw-semibold"
            onClick={() => setErasureModalOpen(true)}
          >
            Request Account Data Erasure
          </button>
        )}
      </div>

      {/* Erasure Modal */}
      {erasureModalOpen && (
        <div className="modal show d-block tab-modal-backdrop" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 p-3">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-header-title fw-bold text-danger m-0">Confirm Data Erasure Request</h5>
                <button type="button" className="btn-close" onClick={() => setErasureModalOpen(false)} />
              </div>
              <div className="modal-body py-3">
                {erasureSuccess ? (
                  <div className="alert alert-success m-0 small">
                    ✅ Your data erasure request has been recorded. Personal identifiers will be anonymized within 30 days.
                  </div>
                ) : (
                  <p className="small text-secondary m-0">
                    Are you sure you want to request data deletion? Your name, email, phone number, and address will be permanently anonymized within 30 days. Any active loyalty point balance will be forfeited.
                  </p>
                )}
              </div>
              <div className="modal-footer border-0 pt-0">
                {erasureSuccess ? (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setErasureModalOpen(false)}>
                    Close
                  </button>
                ) : (
                  <>
                    <button type="button" className="btn btn-light btn-sm" onClick={() => setErasureModalOpen(false)}>
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      disabled={erasureSubmitting}
                      onClick={handleErasureRequest}
                    >
                      {erasureSubmitting ? 'Submitting...' : 'Yes, Request Erasure'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
