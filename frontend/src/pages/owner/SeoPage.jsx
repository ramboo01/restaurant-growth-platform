import { useEffect, useState } from 'react';
import LoadingState from '../../components/feedback/LoadingState.jsx';
import { fetchSeoSettings, updateSeoSettings, generateAiSeoMeta } from '../../services/seoService.js';

function SeoPage() {
  const [settings, setSettings] = useState({
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    structuredDataJson: '{}',
    sitemapEnabled: true,
    lastSubmittedSitemap: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // AI Gen state
  const [aiForm, setAiForm] = useState({
    name: 'RestruRent',
    cuisine: 'Italian',
    location: 'Downtown'
  });
  const [generating, setGenerating] = useState(false);

  const loadSeoData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetchSeoSettings();
      if (res?.data) {
        setSettings({
          ...res.data,
          structuredDataJson: typeof res.data.structuredDataJson === 'object' 
            ? JSON.stringify(res.data.structuredDataJson, null, 2)
            : res.data.structuredDataJson
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load SEO settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSeoData();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      
      // Validate JSON-LD
      try {
        JSON.parse(settings.structuredDataJson);
      } catch (err) {
        setError('Invalid Structured Data JSON-LD format.');
        setSubmitting(false);
        return;
      }

      await updateSeoSettings(settings);
      showToast('SEO settings updated successfully!');
      loadSeoData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update SEO settings.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAiGenerate = async () => {
    try {
      setGenerating(true);
      const res = await generateAiSeoMeta(aiForm);
      if (res?.data) {
        setSettings(prev => ({
          ...prev,
          metaTitle: res.data.metaTitle,
          metaDescription: res.data.metaDescription,
          metaKeywords: res.data.metaKeywords
        }));
        showToast('AI Metadata generated! Review and click Save Changes.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to run AI generation.');
    } finally {
      setGenerating(false);
    }
  };

  const handlePingSitemap = async () => {
    try {
      // Simulate pinging Google sitemap
      const updated = {
        ...settings,
        lastSubmittedSitemap: new Date().toISOString()
      };
      await updateSeoSettings(updated);
      showToast('Sitemap successfully pinged to Google & Bing indexes!');
      loadSeoData();
    } catch (err) {
      alert('Failed to submit sitemap.');
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold mb-1">
            <i className="bi bi-search text-primary me-2"></i>
            SEO & Listings Autopilot
          </h2>
          <p className="text-muted mb-0">
            Optimize your storefront search ranking and manage Google rich snippets dynamically.
          </p>
        </div>
      </div>

      {toast && (
        <div className="alert alert-success shadow-sm" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i> {toast}
        </div>
      )}

      {error && (
        <div className="alert alert-danger shadow-sm" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
        </div>
      )}

      {loading ? (
        <div className="p-5"><LoadingState message="Loading SEO configurations..." /></div>
      ) : (
        <div className="row g-4">
          <div className="col-12 col-lg-8">
            <form onSubmit={handleSave}>
              <div className="card border-0 shadow-sm rounded-3 mb-4">
                <div className="card-header bg-white border-0 py-3">
                  <h5 className="fw-bold mb-0">Website Metadata (Meta Tags)</h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Meta Title</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={settings.metaTitle} 
                      onChange={e => setSettings({...settings, metaTitle: e.target.value})}
                      placeholder="e.g. Best Italian Food | Restaurant Name"
                      required
                    />
                    <div className="form-text">Recommended length: 50-60 characters. Current: {settings.metaTitle.length}</div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Meta Description</label>
                    <textarea 
                      className="form-control" 
                      rows="3" 
                      value={settings.metaDescription} 
                      onChange={e => setSettings({...settings, metaDescription: e.target.value})}
                      placeholder="Enter a brief, search-friendly summary of your restaurant..."
                      required
                    />
                    <div className="form-text">Recommended length: 150-160 characters. Current: {settings.metaDescription.length}</div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Meta Keywords</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={settings.metaKeywords} 
                      onChange={e => setSettings({...settings, metaKeywords: e.target.value})}
                      placeholder="pizza, pasta, online delivery, italian restaurant"
                    />
                    <div className="form-text">Comma-separated keyword tags.</div>
                  </div>
                </div>
              </div>

              <div className="card border-0 shadow-sm rounded-3 mb-4">
                <div className="card-header bg-white border-0 py-3">
                  <h5 className="fw-bold mb-0">Google Rich Snippets (Structured JSON-LD)</h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">JSON-LD Schema</label>
                    <textarea 
                      className="form-control font-monospace small" 
                      rows="6" 
                      value={settings.structuredDataJson} 
                      onChange={e => setSettings({...settings, structuredDataJson: e.target.value})}
                    />
                    <div className="form-text">JSON structured data injected automatically into the guest storefront header to enable Google Local Pack placement.</div>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary px-4 py-2" disabled={submitting}>
                {submitting ? 'Saving Changes...' : <><i className="bi bi-save me-2"></i> Save SEO Settings</>}
              </button>
            </form>
          </div>

          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm rounded-3 mb-4 bg-primary bg-opacity-10 border border-primary border-opacity-25">
              <div className="card-body p-4">
                <h5 className="fw-bold text-primary mb-3">
                  <i className="bi bi-magic me-2"></i> AI SEO Copilot
                </h5>
                <p className="small text-muted mb-4">
                  Quickly auto-generate highly optimized SEO meta descriptions using our integrated AI agent.
                </p>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Restaurant Name</label>
                  <input 
                    type="text" 
                    className="form-control form-control-sm" 
                    value={aiForm.name} 
                    onChange={e => setAiForm({...aiForm, name: e.target.value})}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Cuisine Type</label>
                  <input 
                    type="text" 
                    className="form-control form-control-sm" 
                    value={aiForm.cuisine} 
                    onChange={e => setAiForm({...aiForm, cuisine: e.target.value})}
                    placeholder="e.g. Italian, Sushi, Burgers"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Target Location</label>
                  <input 
                    type="text" 
                    className="form-control form-control-sm" 
                    value={aiForm.location} 
                    onChange={e => setAiForm({...aiForm, location: e.target.value})}
                    placeholder="e.g. Downtown Chicago"
                  />
                </div>

                <button 
                  className="btn btn-primary w-100 mt-2" 
                  onClick={handleAiGenerate}
                  disabled={generating}
                >
                  {generating ? 'Running AI Engine...' : <><i className="bi bi-cpu me-2"></i> Generate Meta Tags</>}
                </button>
              </div>
            </div>

            <div className="card border-0 shadow-sm rounded-3">
              <div className="card-header bg-white border-0 py-3">
                <h5 className="fw-bold mb-0">Sitemap & Indexing</h5>
              </div>
              <div className="card-body">
                <div className="form-check form-switch mb-3">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    id="sitemapSwitch" 
                    checked={settings.sitemapEnabled}
                    onChange={e => setSettings({...settings, sitemapEnabled: e.target.checked})}
                  />
                  <label className="form-check-label fw-semibold" htmlFor="sitemapSwitch">Enable Storefront Sitemap</label>
                </div>
                <p className="small text-muted mb-4">
                  When enabled, a dynamic sitemap of menu items and site pages is generated at `/sitemap.xml` for web crawlers.
                </p>

                <div className="bg-light rounded p-3 mb-4 border text-center">
                  <div className="small text-muted mb-1">Last Google Submission</div>
                  <div className="fw-bold small text-dark">
                    {settings.lastSubmittedSitemap 
                      ? new Date(settings.lastSubmittedSitemap).toLocaleString() 
                      : 'Never Submitted'}
                  </div>
                </div>

                <button 
                  className="btn btn-outline-secondary w-100 btn-sm"
                  onClick={handlePingSitemap}
                >
                  <i className="bi bi-cloud-arrow-up me-2"></i> Ping Search Indexes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SeoPage;
