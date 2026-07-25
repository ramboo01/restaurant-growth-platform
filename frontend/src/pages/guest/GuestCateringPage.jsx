import { useState } from 'react';

function GuestCateringPage() {
  const [eventName, setEventName] = useState('');
  const [headcount, setHeadcount] = useState(50);
  const [tier, setTier] = useState('executive');
  const [useInstallments, setUseInstallments] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [schedule, setSchedule] = useState([]);

  const tierPrices = {
    standard: 15,
    executive: 25,
    luxury: 45
  };

  const cost = headcount * tierPrices[tier];
  const deposit = cost * 0.25;
  const remaining = cost - deposit;
  const installmentAmount = remaining / 2;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Generate simulated payment dates
    const date1 = new Date();
    date1.setDate(date1.getDate() + 30);
    const date2 = new Date();
    date2.setDate(date2.getDate() + 60);

    setSchedule([
      { label: 'Deposit due now (25%)', amount: `$${deposit.toFixed(2)}`, date: 'Today' },
      { label: 'Installment #1 (37.5%)', amount: `$${installmentAmount.toFixed(2)}`, date: date1.toLocaleDateString() },
      { label: 'Installment #2 (37.5%)', amount: `$${installmentAmount.toFixed(2)}`, date: date2.toLocaleDateString() }
    ]);
    setSubmitted(true);
  };

  return (
    <div className="container py-5">
      <div className="text-center mb-5">
        <h1 className="fw-bold display-6">
          <i className="bi bi-briefcase text-primary me-2"></i> Corporate & Event Catering
        </h1>
        <p className="text-muted">High-quality, tailored menu selections for corporate gatherings and special occasions.</p>
      </div>

      {!submitted ? (
        <div className="card border-0 shadow-sm rounded-4 max-width-md mx-auto p-4" style={{ maxWidth: '650px' }}>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Event Name / Company</label>
              <input 
                type="text" 
                className="form-control" 
                required 
                placeholder="e.g. Acme Corp Annual Gala"
                value={eventName}
                onChange={e => setEventName(e.target.value)}
              />
            </div>

            <div className="row g-3 mb-3">
              <div className="col-6">
                <label className="form-label fw-semibold">Guest Headcount</label>
                <input 
                  type="number" 
                  className="form-control" 
                  min="10" 
                  required 
                  value={headcount}
                  onChange={e => setHeadcount(parseInt(e.target.value))}
                />
              </div>
              <div className="col-6">
                <label className="form-label fw-semibold">Catering Package</label>
                <select className="form-select" value={tier} onChange={e => setTier(e.target.value)}>
                  <option value="standard">Standard ($15/guest)</option>
                  <option value="executive">Executive ($25/guest)</option>
                  <option value="luxury">Luxury ($45/guest)</option>
                </select>
              </div>
            </div>

            <div className="p-3 bg-light rounded-3 mb-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="small text-muted">Estimated Total Cost:</span>
                <span className="fw-bold fs-5">${cost.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="small text-muted">Initial 25% Deposit due:</span>
                <span className="fw-bold text-success">${deposit.toFixed(2)}</span>
              </div>
            </div>

            <div className="form-check form-switch mb-4">
              <input 
                className="form-check-input" 
                type="checkbox" 
                id="useInstallments" 
                checked={useInstallments}
                onChange={e => setUseInstallments(e.target.checked)}
              />
              <label className="form-check-label fw-semibold" htmlFor="useInstallments">
                Enable Installment Payment Plan (2 installments of ${installmentAmount.toFixed(2)})
              </label>
            </div>

            <button type="submit" className="btn btn-primary w-100 py-3 fw-bold rounded-pill">
              Proceed to Deposit Payment
            </button>
          </form>
        </div>
      ) : (
        <div className="card border-0 shadow-sm rounded-4 max-width-md mx-auto p-5 text-center" style={{ maxWidth: '600px' }}>
          <div className="fs-1 text-success mb-3">
            <i className="bi bi-patch-check-fill"></i>
          </div>
          <h3 className="fw-bold text-dark mb-2">Catering Order Staged!</h3>
          <p className="text-muted mb-4">Your deposit of <strong>${deposit.toFixed(2)}</strong> has been processed successfully. Your booking is confirmed.</p>

          <h5 className="fw-bold text-start mb-3">Autopay Installment Schedule</h5>
          <div className="list-group mb-4">
            {schedule.map((s, idx) => (
              <div key={idx} className="list-group-item d-flex justify-content-between align-items-center py-3">
                <div className="text-start">
                  <div className="fw-semibold small">{s.label}</div>
                  <span className="text-muted small">Billing date: {s.date}</span>
                </div>
                <span className="fw-bold text-dark">{s.amount}</span>
              </div>
            ))}
          </div>

          <button className="btn btn-primary px-4 py-2" onClick={() => setSubmitted(false)}>
            Book Another Event
          </button>
        </div>
      )}
    </div>
  );
}

export default GuestCateringPage;
