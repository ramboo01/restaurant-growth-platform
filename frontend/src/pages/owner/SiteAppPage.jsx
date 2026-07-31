import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'restaurant_site_app_config';

const DEFAULT_CONFIG = {
  heroTitle: 'RestruRent Growth Platform',
  heroSubtitle: 'Delicious food delivered straight to your door. Freshly prepared, responsibly sourced, and lightning fast.',
  ctaText: 'Order Direct & Save',
  theme: 'dark',
  promoText: '20% OFF Your First Online Order! Code: WELCOME20'
};

function SiteAppPage() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setConfig((prev) => ({ ...prev, ...JSON.parse(saved) }));
      }
    } catch (err) {
      console.error('Failed to load site config from storage:', err);
    }
  }, []);

  const updateField = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      // Simulate minor network sync delay for realistic experience
      await new Promise((resolve) => setTimeout(resolve, 600));
      setSaving(false);
      setToast('Storefront published successfully! Your live website & app branding have been updated.');
      setTimeout(() => setToast(''), 4000);
    } catch (err) {
      setSaving(false);
      console.error('Failed to save site config:', err);
    }
  };

  const { heroTitle, heroSubtitle, ctaText, theme, promoText } = config;

  return (
    <div className="container-fluid py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            <i className="bi bi-window-sidebar text-primary me-2"></i>
            Site & App Content Editor
          </h2>
          <p className="text-muted mb-0">
            Modify your AI-generated storefront banner, call-to-actions, and design systems with live visual previews.
          </p>
        </div>
        <a
          className="btn btn-outline-primary fw-semibold rounded-pill px-4"
          href="/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <i className="bi bi-box-arrow-up-right me-2"></i>
          View Live Customer Storefront
        </a>
      </div>

      {toast && (
        <div className="alert alert-success shadow-sm mb-4 d-flex align-items-center" role="alert">
          <i className="bi bi-check-circle-fill fs-5 me-2"></i>
          <div>{toast}</div>
        </div>
      )}

      <div className="row g-4">
        {/* Control Panel */}
        <div className="col-12 col-xl-5">
          <div className="card border-0 shadow-sm rounded-3">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="fw-bold mb-0">Storefront Customizer</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSave}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Hero Heading</label>
                  <input
                    type="text"
                    className="form-control"
                    value={heroTitle}
                    onChange={(e) => updateField('heroTitle', e.target.value)}
                    placeholder="Main headline on your website..."
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Hero Description Subtext</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={heroSubtitle}
                    onChange={(e) => updateField('heroSubtitle', e.target.value)}
                    placeholder="Short description or restaurant tagline..."
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Call to Action (CTA) Button Text</label>
                  <input
                    type="text"
                    className="form-control"
                    value={ctaText}
                    onChange={(e) => updateField('ctaText', e.target.value)}
                    placeholder="Button text e.g. Order Direct & Save"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Top Announcement Banner</label>
                  <input
                    type="text"
                    className="form-control"
                    value={promoText}
                    onChange={(e) => updateField('promoText', e.target.value)}
                    placeholder="e.g. 20% OFF Your First Online Order!"
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold d-block">App Branding Theme</label>
                  <div className="btn-group w-100" role="group">
                    <input
                      type="radio"
                      className="btn-check"
                      name="themeBtn"
                      id="themeDark"
                      checked={theme === 'dark'}
                      onChange={() => updateField('theme', 'dark')}
                    />
                    <label className="btn btn-outline-dark" htmlFor="themeDark">Midnight Dark</label>

                    <input
                      type="radio"
                      className="btn-check"
                      name="themeBtn"
                      id="themeLight"
                      checked={theme === 'light'}
                      onChange={() => updateField('theme', 'light')}
                    />
                    <label className="btn btn-outline-dark" htmlFor="themeLight">Clean Light</label>

                    <input
                      type="radio"
                      className="btn-check"
                      name="themeBtn"
                      id="themeGlass"
                      checked={theme === 'glass'}
                      onChange={() => updateField('theme', 'glass')}
                    />
                    <label className="btn btn-outline-dark" htmlFor="themeGlass">Glassmorphism</label>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold" disabled={saving}>
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                      Publishing Changes...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-cloud-arrow-up me-2"></i> Publish Live Updates
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Live Preview Panel */}
        <div className="col-12 col-xl-7">
          <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
            <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0">Live Guest-Facing Preview</h5>
              <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1">
                <i className="bi bi-eye-fill me-1"></i> Interactive Mockup
              </span>
            </div>
            <div className="card-body p-0 bg-light border-top">
              <div className="p-2 p-sm-4 overflow-hidden" style={{ minHeight: '420px' }}>
                {/* Simulated Storefront Page */}
                <div
                  className={`p-3 p-md-5 rounded-4 shadow-sm text-center overflow-hidden ${
                    theme === 'dark'
                      ? 'bg-dark text-white'
                      : theme === 'light'
                      ? 'bg-white text-dark border'
                      : 'bg-white bg-opacity-70 text-dark border border-white'
                  }`}
                  style={{
                    backdropFilter: theme === 'glass' ? 'blur(10px)' : 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {promoText && (
                    <div
                      className="bg-primary text-white py-1 px-3 rounded-pill d-inline-block small fw-semibold mb-4 shadow-sm text-wrap mw-100"
                      style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}
                    >
                      <i className="bi bi-megaphone me-1"></i> {promoText}
                    </div>
                  )}

                  <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-opacity-25 flex-wrap gap-2">
                    <span className="fw-bold fs-6">
                      <i className="bi bi-egg-fried text-primary me-2"></i> RestruRent Store
                    </span>
                    <div className="d-flex gap-3 small fw-semibold">
                      <span>Menu</span>
                      <span>Reviews</span>
                      <span>About</span>
                    </div>
                  </div>

                  <h1 className="fs-3 fs-md-1 fw-bold mb-3 text-break">{heroTitle}</h1>
                  <p className="lead mx-auto mb-4 text-wrap" style={{ maxWidth: '600px', fontSize: '1rem' }}>
                    {heroSubtitle}
                  </p>
                  <button className="btn btn-primary btn-lg px-4 py-3 fw-bold rounded-pill shadow-sm text-wrap mw-100">
                    {ctaText}
                  </button>

                  <div className="mt-5 pt-3 text-muted small">
                    Powered by Restaurant Growth Platform SEO Engine
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SiteAppPage;
