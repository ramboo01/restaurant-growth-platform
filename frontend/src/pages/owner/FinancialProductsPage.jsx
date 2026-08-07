import { useState, useEffect } from 'react';
import { franchiseService } from '../../services/franchiseService';
import { useRestaurant } from '../../context/RestaurantContext';
import LoadingState from '../../components/feedback/LoadingState';

function FinancialProductsPage() {
  const { activeRestaurantId } = useRestaurant();
  const [depositPct, setDepositPct] = useState(25);
  const [allowInstallments, setAllowInstallments] = useState(true);
  const [instantPayFee, setInstantPayFee] = useState(1.99);
  const [isSubsidized, setIsSubsidized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const settings = await franchiseService.getFinancialSettings();
        if (settings) {
          setDepositPct(settings.depositPct);
          setAllowInstallments(settings.allowInstallments);
          setInstantPayFee(settings.instantPayFee);
          setIsSubsidized(settings.isSubsidized);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load financial settings.');
      } finally {
        setLoading(false);
      }
    };
    if (activeRestaurantId) fetchData();
  }, [activeRestaurantId]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      await franchiseService.saveFinancialSettings({ allowInstallments, depositPct, isSubsidized, instantPayFee });
      setToast('Financial settings saved successfully.');
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="mb-4">
        <h2 className="fw-bold mb-1"><i className="bi bi-credit-card text-primary me-2"></i>Financial Settings</h2>
        <p className="text-muted mb-0">Configure catering installment policies and payment terms for your restaurant.</p>
      </div>

      {toast && <div className="alert alert-success shadow-sm mb-4"><i className="bi bi-check-circle-fill me-2"></i>{toast}</div>}
      {error && <div className="alert alert-danger shadow-sm mb-4"><i className="bi bi-exclamation-triangle-fill me-2"></i>{error}</div>}

      {loading ? (
        <div className="p-5"><LoadingState message="Loading financial settings..." /></div>
      ) : (
        <div className="row g-4">
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm rounded-3">
              <div className="card-header bg-white border-0 py-3"><h5 className="fw-bold mb-0">Installment Payment Policies</h5></div>
              <div className="card-body">
                <form onSubmit={handleSave}>
                  <div className="form-check form-switch mb-3">
                    <input className="form-check-input" type="checkbox" id="allowInstallments" checked={allowInstallments} onChange={e => setAllowInstallments(e.target.checked)} />
                    <label className="form-check-label fw-semibold" htmlFor="allowInstallments">Allow Installment Payments for Catering Orders &gt; $500</label>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Minimum Initial Deposit (%)</label>
                    <input type="number" className="form-control" value={depositPct} onChange={e => setDepositPct(parseInt(e.target.value) || 0)} disabled={!allowInstallments} required />
                    <div className="form-text small">Corporate clients pay this percentage at booking.</div>
                  </div>
                  <div className="mb-4">
                    <label className="form-label fw-semibold">Instant Pay Processing Fee ($)</label>
                    <input type="number" step="0.01" className="form-control" value={instantPayFee} onChange={e => setInstantPayFee(parseFloat(e.target.value) || 0)} />
                  </div>
                  <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                </form>
              </div>
            </div>
          </div>
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm rounded-3 h-100">
              <div className="card-body d-flex flex-column justify-content-center align-items-center text-center p-5">
                <i className="bi bi-briefcase text-primary display-4 mb-3"></i>
                <h5 className="fw-bold">Catering Orders Moved</h5>
                <p className="text-muted mb-3">All corporate catering order management has been moved to its own dedicated section.</p>
                <a href="/owner/catering" className="btn btn-outline-primary rounded-pill px-4">
                  <i className="bi bi-arrow-right me-1"></i> Go to Catering Management
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FinancialProductsPage;
