import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function SiteContentEditorPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    hero_title: 'Delicious Food Delivered Straight To Your Door',
    hero_subtitle: 'Freshly prepared, responsibly sourced, and lightning fast.',
    hero_image_url: '',
    banner_text: '🎉 Special Offer: Order direct & save 15% on your first meal! Code: DIRECT15',
    banner_enabled: true,
    primary_color: '#e91e8c',
    secondary_color: '#667eea',
    announcement_ticker: '🚚 Free delivery on orders over $30 | ⏱️ Avg Delivery Time: 25 Mins',
    store_hours: 'Mon - Sun: 10:00 AM - 11:00 PM'
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      setLoading(true);
      const res = await api.get('/api/site-settings/owner');
      if (res.data?.data) {
        setFormData({
          ...res.data.data,
          banner_enabled: Boolean(res.data.data.banner_enabled)
        });
      }
    } catch (err) {
      console.error('Failed to load site settings:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage('');
      await api.put('/api/site-settings/owner', formData);
      setMessage('✅ Storefront settings saved & published live!');
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      console.error('Failed to update site settings:', err);
      setMessage('❌ Failed to save site settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="spinner-border text-primary mb-2" />
        <div>Loading Site Content Editor...</div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold m-0" style={{ color: '#1a1f36' }}>
            <i className="bi bi-palette-fill text-primary me-2" />
            Storefront Site Content Editor (OWN-007)
          </h2>
          <p className="text-secondary small m-0">
            Customize your guest ordering site headlines, colors, banners, and announcement tickers with live instant updates.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="btn text-white fw-bold px-4 py-2 shadow-sm"
          style={{ background: 'linear-gradient(135deg, #e91e8c, #667eea)', borderRadius: 10 }}
        >
          {saving ? 'Publishing...' : '🚀 Publish Changes Live'}
        </button>
      </div>

      {message && (
        <div className={`alert ${message.startsWith('✅') ? 'alert-success' : 'alert-danger'} shadow-sm py-2 px-3 mb-4`}>
          {message}
        </div>
      )}

      <div className="row g-4">
        {/* Editor Form Controls */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm p-4 rounded-4" style={{ background: '#fff' }}>
            <h5 className="fw-bold mb-3 border-bottom pb-2">✏️ Storefront Settings</h5>

            <form onSubmit={handleSubmit}>
              {/* Announcement Banner */}
              <div className="mb-3 p-3 rounded-3" style={{ background: '#f8f9fa' }}>
                <div className="form-check form-switch mb-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="banner_enabled"
                    name="banner_enabled"
                    checked={formData.banner_enabled}
                    onChange={handleChange}
                  />
                  <label className="form-check-label fw-bold" htmlFor="banner_enabled">
                    Show Promo Banner Bar
                  </label>
                </div>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  name="banner_text"
                  value={formData.banner_text}
                  onChange={handleChange}
                  placeholder="e.g. 🎉 Get 15% off using code DIRECT15"
                />
              </div>

              {/* Hero Section Title & Subtitle */}
              <div className="mb-3">
                <label className="form-label fw-semibold small">Hero Headline</label>
                <input
                  type="text"
                  className="form-control"
                  name="hero_title"
                  value={formData.hero_title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold small">Hero Subtitle</label>
                <textarea
                  className="form-control"
                  rows={2}
                  name="hero_subtitle"
                  value={formData.hero_subtitle}
                  onChange={handleChange}
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold small">Hero Image URL (Optional)</label>
                <input
                  type="url"
                  className="form-control"
                  name="hero_image_url"
                  value={formData.hero_image_url || ''}
                  onChange={handleChange}
                  placeholder="https://images.unsplash.com/photo-..."
                />
              </div>

              {/* Ticker & Store Hours */}
              <div className="mb-3">
                <label className="form-label fw-semibold small">Announcement Ticker</label>
                <input
                  type="text"
                  className="form-control"
                  name="announcement_ticker"
                  value={formData.announcement_ticker}
                  onChange={handleChange}
                  placeholder="🚚 Free delivery over $30..."
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold small">Store Opening Hours</label>
                <input
                  type="text"
                  className="form-control"
                  name="store_hours"
                  value={formData.store_hours}
                  onChange={handleChange}
                />
              </div>

              {/* Theme Colors */}
              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className="form-label fw-semibold small">Primary Theme Color</label>
                  <div className="d-flex align-items-center gap-2">
                    <input
                      type="color"
                      className="form-control form-control-color"
                      name="primary_color"
                      value={formData.primary_color}
                      onChange={handleChange}
                    />
                    <span className="small text-monospace">{formData.primary_color}</span>
                  </div>
                </div>
                <div className="col-6">
                  <label className="form-label fw-semibold small">Secondary Theme Color</label>
                  <div className="d-flex align-items-center gap-2">
                    <input
                      type="color"
                      className="form-control form-control-color"
                      name="secondary_color"
                      value={formData.secondary_color}
                      onChange={handleChange}
                    />
                    <span className="small text-monospace">{formData.secondary_color}</span>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Live Interactive Preview Pane */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-lg rounded-4 overflow-hidden" style={{ background: '#f4f6f8' }}>
            <div className="px-3 py-2 bg-dark text-white d-flex align-items-center justify-content-between">
              <span className="small fw-bold">📱 Storefront Live Preview</span>
              <span className="badge bg-success">Real-Time Sync</span>
            </div>

            {/* Banner Preview */}
            {formData.banner_enabled && (
              <div
                className="text-center py-2 px-3 text-white small fw-semibold"
                style={{ background: formData.primary_color }}
              >
                {formData.banner_text}
              </div>
            )}

            {/* Announcement Ticker */}
            <div className="bg-light py-1 px-3 border-bottom small text-center text-muted">
              {formData.announcement_ticker}
            </div>

            {/* Hero Banner Preview */}
            <div
              className="p-5 text-white text-center position-relative"
              style={{
                background: `linear-gradient(135deg, ${formData.primary_color}, ${formData.secondary_color})`,
                minHeight: 240,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <h3 className="fw-extrabold mb-2">{formData.hero_title}</h3>
              <p className="opacity-90 max-w-md small">{formData.hero_subtitle}</p>
              <div className="mt-3">
                <button
                  type="button"
                  className="btn btn-light rounded-pill px-4 fw-bold shadow-sm"
                  style={{ color: formData.primary_color }}
                >
                  Order Now
                </button>
              </div>
            </div>

            {/* Footer Hours Preview */}
            <div className="p-3 bg-white border-top text-center text-secondary small">
              <i className="bi bi-clock me-1" />
              Hours: <span className="fw-semibold">{formData.store_hours}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
