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
  const [installments, setInstallments] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const [settings, activeInstallments] = await Promise.all([
          franchiseService.getFinancialSettings(),
          franchiseService.getCateringInstallments()
        ]);
        
        if (settings) {
          setDepositPct(settings.depositPct);
          setAllowInstallments(settings.allowInstallments);
          setInstantPayFee(settings.instantPayFee);
          setIsSubsidized(settings.isSubsidized);
        }
        setInstallments(activeInstallments || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load financial product configuration.');
      } finally {
        setLoading(false);
      }
    };

    if (activeRestaurantId) {
      fetchData();
    }
  }, [activeRestaurantId]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      await franchiseService.saveFinancialSettings({
        allowInstallments,
        depositPct,
        isSubsidized,
        instantPayFee
      });
      setToast('Financial product parameters and terms updated successfully.');
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save configuration.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="mb-4">
        <h2 className="fw-bold mb-1">
          <i className="bi bi-credit-card text-primary me-2"></i>
          Guest Financial Products & Catering Installments
        </h2>
        <p className="text-muted mb-0">
          Configure catering payment plans, staff early-wage payout policies, and bulk gift card options.
        </p>
      </div>

      {toast && (
        <div className="alert alert-success shadow-sm mb-4" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i> {toast}
        </div>
      )}

      {error && (
        <div className="alert alert-danger shadow-sm mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
        </div>
      )}

      {loading ? (
        <div className="p-5"><LoadingState message="Loading financial configurations..." /></div>
      ) : (
        <div className="row g-4">
          {/* Settings panel */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm rounded-3">
              <div className="card-header bg-white border-0 py-3">
                <h5 className="fw-bold mb-0">Financial Settings</h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSave}>
                  <h6 className="fw-bold text-dark mb-3"><i className="bi bi-calendar3 me-2 text-primary"></i> Catering Installment Plans</h6>
                  
                  <div className="form-check form-switch mb-3">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="allowInstallments" 
                      checked={allowInstallments} 
                      onChange={e => setAllowInstallments(e.target.checked)} 
                    />
                    <label className="form-check-label fw-semibold" htmlFor="allowInstallments">Allow Installment Payments for Catering Orders &gt; $500</label>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold">Minimum Initial Deposit (%)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={depositPct} 
                      onChange={e => setDepositPct(parseInt(e.target.value) || 0)}
                      disabled={!allowInstallments}
                      required
                    />
                    <div className="form-text small">Guests pay this percentage immediately at booking; the remainder is auto-billed.</div>
                  </div>

                  <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold" disabled={saving}>
                    {saving ? 'Saving changes...' : 'Save Configuration'}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Status board */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm rounded-3">
              <div className="card-header bg-white border-0 py-3">
                <h5 className="fw-bold mb-0">Active Installment Accounts</h5>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Account Info</th>
                        <th>Total Value</th>
                        <th>Paid / Deposit</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {installments.length ? (
                        installments.map(i => (
                          <tr key={i.id}>
                            <td>
                              <div className="fw-bold small text-dark">{i.guest}</div>
                              <span className="text-secondary small">{i.event}</span>
                            </td>
                            <td>{i.total}</td>
                            <td>
                              <div className="fw-bold text-success small">{i.paid}</div>
                              <span className="text-muted small">Deposit: {i.deposit}</span>
                            </td>
                            <td>
                              <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 small">
                                {i.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center py-4 text-secondary small">
                            No active installment accounts for this branch.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FinancialProductsPage;
