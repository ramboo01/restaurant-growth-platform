import { useState, useEffect } from 'react';
import { getDeliveryConfig, updateDeliveryConfig } from '../../services/deliveryService';

function DeliveryConfigPage() {
  const [radius, setRadius] = useState(5.5);
  const [deliveryFee, setDeliveryFee] = useState(3.99);
  const [minOrder, setMinOrder] = useState(15.00);
  const [freeDeliveryOver, setFreeDeliveryOver] = useState(50.00);
  const [surgeMultiplier, setSurgeMultiplier] = useState(1.5);
  const [isSurgeActive, setIsSurgeActive] = useState(false);
  const [priority, setPriority] = useState(['Owned Couriers', 'DoorDash Drive', 'Uber Direct']);
  const [partners, setPartners] = useState({
    doordash: { connected: false, status: 'Simulation Mode' },
    uber: { connected: false, status: 'Simulation Mode' }
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadConfig() {
      try {
        setLoading(true);
        const res = await getDeliveryConfig();
        if (res.data) {
          const cfg = res.data;
          setRadius(cfg.radiusLimit ?? 5.5);
          setDeliveryFee(cfg.baseDeliveryFee ?? 3.99);
          setMinOrder(cfg.minOrderValue ?? 15.00);
          setFreeDeliveryOver(cfg.freeDeliveryThreshold ?? 50.00);
          setSurgeMultiplier(cfg.surgeMultiplier ?? 1.5);
          setIsSurgeActive(cfg.isSurgeActive ?? false);
          if (Array.isArray(cfg.priority) && cfg.priority.length) {
            setPriority(cfg.priority);
          }
          if (cfg.partners) {
            setPartners(cfg.partners);
          }
        }
      } catch (err) {
        console.error('Failed to load delivery config:', err);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    try {
      await updateDeliveryConfig({
        radiusLimit: radius,
        baseDeliveryFee: deliveryFee,
        minOrderValue: minOrder,
        freeDeliveryThreshold: freeDeliveryOver,
        isSurgeActive: isSurgeActive,
        surgeMultiplier: surgeMultiplier,
        priority: priority
      });
      setToast('Delivery configurations saved to database successfully.');
      setTimeout(() => setToast(''), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to save delivery configurations.');
    } finally {
      setSaving(false);
    }
  };

  const shiftPriority = (index, direction) => {
    const newPriority = [...priority];
    const targetIndex = index + direction;
    if (targetIndex >= 0 && targetIndex < newPriority.length) {
      const temp = newPriority[index];
      newPriority[index] = newPriority[targetIndex];
      newPriority[targetIndex] = temp;
      setPriority(newPriority);
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="mb-4">
        <h2 className="fw-bold mb-1">
          <i className="bi bi-truck text-primary me-2"></i>
          Delivery & Dispatcher Configuration
        </h2>
        <p className="text-muted mb-0">
          Set delivery zone bounds, configure surge rate triggers, and manage logistics partner routing.
        </p>
      </div>

      {toast && (
        <div className="alert alert-success shadow-sm mb-4" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i> {toast}
        </div>
      )}

      {errorMsg && (
        <div className="alert alert-danger shadow-sm mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i> {errorMsg}
        </div>
      )}

      {loading && (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading settings...</span>
          </div>
        </div>
      )}

      <div className="row g-4">
        {/* Core Zone Rules */}
        <div className="col-12 col-lg-7">
          <div className="card border-0 shadow-sm rounded-3 mb-4">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="fw-bold mb-0">Zone Boundaries & Fees</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSave}>
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">Delivery Radius Limit (miles)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      className="form-control" 
                      value={radius} 
                      onChange={e => setRadius(parseFloat(e.target.value))}
                      required 
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">Base Delivery Fee ($)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="form-control" 
                      value={deliveryFee} 
                      onChange={e => setDeliveryFee(parseFloat(e.target.value))}
                      required 
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">Minimum Order Value ($)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="form-control" 
                      value={minOrder} 
                      onChange={e => setMinOrder(parseFloat(e.target.value))}
                      required 
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">Free Delivery Threshold ($)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="form-control" 
                      value={freeDeliveryOver} 
                      onChange={e => setFreeDeliveryOver(parseFloat(e.target.value))}
                      required 
                    />
                  </div>
                </div>

                <hr className="my-4" />

                <h6 className="fw-bold mb-3"><i className="bi bi-lightning-fill text-warning me-2"></i> Weather & Rush Hour Surge Rules</h6>
                <div className="row g-3 align-items-center">
                  <div className="col-12 col-md-6">
                    <div className="form-check form-switch">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="isSurgeActive" 
                        checked={isSurgeActive} 
                        onChange={e => setIsSurgeActive(e.target.checked)} 
                      />
                      <label className="form-check-label fw-semibold" htmlFor="isSurgeActive">Enable Active Surge Fee</label>
                    </div>
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">Surge Price Multiplier (e.g. 1.5)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      className="form-control" 
                      value={surgeMultiplier} 
                      onChange={e => setSurgeMultiplier(parseFloat(e.target.value))} 
                      disabled={!isSurgeActive}
                      required 
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary mt-4 px-4 py-2" disabled={saving}>
                  {saving ? 'Saving changes...' : 'Save Settings'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Priority and Partner Configuration */}
        <div className="col-12 col-lg-5">
          <div className="card border-0 shadow-sm rounded-3 mb-4">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="fw-bold mb-0">Fulfillment Priority</h5>
            </div>
            <div className="card-body">
              <p className="small text-muted mb-3">
                Decide the fallback order for dispatching orders to delivery drivers. Lower priority channels will only be selected if higher options are unavailable.
              </p>
              
              <ul className="list-group mb-4">
                {priority.map((p, index) => (
                  <li key={p} className="list-group-item d-flex justify-content-between align-items-center py-3">
                    <div className="d-flex align-items-center">
                      <span className="badge bg-secondary me-3">{index + 1}</span>
                      <span className="fw-semibold">{p}</span>
                    </div>
                    <div className="btn-group btn-group-sm">
                      <button 
                        className="btn btn-outline-secondary" 
                        disabled={index === 0} 
                        onClick={() => shiftPriority(index, -1)}
                      >
                        <i className="bi bi-chevron-up"></i>
                      </button>
                      <button 
                        className="btn btn-outline-secondary" 
                        disabled={index === priority.length - 1} 
                        onClick={() => shiftPriority(index, 1)}
                      >
                        <i className="bi bi-chevron-down"></i>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              <h6 className="fw-bold mb-3">Integrated Partner Status</h6>
              <div className="d-flex flex-column gap-2">
                <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded-3 border">
                  <div>
                    <div className="fw-bold small">DoorDash Drive API</div>
                    <span className="text-muted small">
                      {partners.doordash.connected ? 'Automatic pricing & dispatch sync' : 'Simulation Mode (Key in .env required for live dispatch)'}
                    </span>
                  </div>
                  <span className={`badge ${partners.doordash.connected ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-25' : 'bg-warning bg-opacity-25 text-dark border border-warning'}`}>
                    {partners.doordash.connected ? 'Connected' : 'Simulation Mode'}
                  </span>
                </div>
                <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded-3 border">
                  <div>
                    <div className="fw-bold small">Uber Direct Integration</div>
                    <span className="text-muted small">
                      {partners.uber.connected ? 'Automatic courier summoning' : 'Simulation Mode (Key in .env required for live dispatch)'}
                    </span>
                  </div>
                  <span className={`badge ${partners.uber.connected ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-25' : 'bg-warning bg-opacity-25 text-dark border border-warning'}`}>
                    {partners.uber.connected ? 'Connected' : 'Simulation Mode'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeliveryConfigPage;
