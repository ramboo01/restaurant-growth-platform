import { useState } from 'react';

function SiteAppPage() {
  const [heroTitle, setHeroTitle] = useState('RestruRent Growth Platform');
  const [heroSubtitle, setHeroSubtitle] = useState('Delicious food delivered straight to your door. Freshly prepared, responsibly sourced, and lightning fast.');
  const [ctaText, setCtaText] = useState('Order Direct & Save');
  const [theme, setTheme] = useState('dark'); // 'dark' | 'light' | 'glass'
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    // Simulate API update
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    setToast('Storefront updated successfully! Changes will propagate to live website within 60 seconds.');
    setTimeout(() => setToast(''), 4000);
  };

  return (
    <div className="container-fluid py-4">
      <div className="mb-4">
        <h2 className="fw-bold mb-1">
          <i className="bi bi-window-sidebar text-primary me-2"></i>
          Site & App Content Editor
        </h2>
        <p className="text-muted mb-0">
          Modify your AI-generated storefront banner, call-to-actions, and design systems with live visual previews.
        </p>
      </div>

      {toast && (
        <div className="alert alert-success shadow-sm mb-4" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i> {toast}
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
                    onChange={(e) => setHeroTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Hero Description Subtext</label>
                  <textarea 
                    className="form-control" 
                    rows="3" 
                    value={heroSubtitle}
                    onChange={(e) => setHeroSubtitle(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Call to Action (CTA) Button Text</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    required
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
                      onChange={() => setTheme('dark')}
                    />
                    <label className="btn btn-outline-dark" htmlFor="themeDark">Midnight Dark</label>

                    <input 
                      type="radio" 
                      className="btn-check" 
                      name="themeBtn" 
                      id="themeLight" 
                      checked={theme === 'light'}
                      onChange={() => setTheme('light')}
                    />
                    <label className="btn btn-outline-dark" htmlFor="themeLight">Clean Light</label>

                    <input 
                      type="radio" 
                      className="btn-check" 
                      name="themeBtn" 
                      id="themeGlass" 
                      checked={theme === 'glass'}
                      onChange={() => setTheme('glass')}
                    />
                    <label className="btn btn-outline-dark" htmlFor="themeGlass">Glassmorphism</label>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold" disabled={saving}>
                  {saving ? 'Publishing Changes...' : <><i className="bi bi-cloud-arrow-up me-2"></i> Publish Live Updates</>}
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
              <div className="p-4" style={{ minHeight: '400px' }}>
                {/* Simulated Storefront Page */}
                <div className={`p-5 rounded-4 shadow-sm text-center ${
                  theme === 'dark' ? 'bg-dark text-white' : 
                  theme === 'light' ? 'bg-white text-dark' : 
                  'bg-white bg-opacity-70 text-dark border border-white'
                }`} style={{
                  backdropFilter: theme === 'glass' ? 'blur(10px)' : 'none',
                  transition: 'all 0.3s ease'
                }}>
                  <div className="d-flex justify-content-between align-items-center mb-5 pb-3 border-bottom border-opacity-25">
                    <span className="fw-bold fs-5">
                      <i className="bi bi-egg-fried text-primary me-2"></i> RestruRent Store
                    </span>
                    <div className="d-flex gap-3 small">
                      <span>Menu</span>
                      <span>Reviews</span>
                      <span>About</span>
                    </div>
                  </div>

                  <h1 className="display-5 fw-bold mb-3">{heroTitle}</h1>
                  <p className="lead mx-auto mb-4" style={{ maxWidth: '600px', fontSize: '1.1rem' }}>
                    {heroSubtitle}
                  </p>
                  <button className="btn btn-primary btn-lg px-5 py-3 fw-bold rounded-pill shadow-sm">
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
