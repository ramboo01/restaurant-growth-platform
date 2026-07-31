import { useState } from 'react';

export default function StaffPerformancePayoutPage() {
  const [searchPhone, setSearchPhone] = useState('');
  const [searchedGuest, setSearchedGuest] = useState(null);
  const [tipsEarned, setTipsEarned] = useState(65.50);
  const [basePay, setBasePay] = useState(110.00);
  const [payoutMessage, setPayoutMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const mockGuests = {
    '555-0199': {
      name: 'John Doe',
      phone: '+1-555-0199',
      vipTier: 'Gold VIP (1,450 pts)',
      allergies: 'Gluten Free, Nut Allergy',
      dietary: 'Vegetarian Options Preferred',
      recentOrder: 'Truffle Mushroom Burger (No Bun), Iced Matcha Latte',
      notes: 'Prefers table near window. High spender on weekend dinners.'
    },
    '555-0188': {
      name: 'Sarah Smith',
      phone: '+1-555-0188',
      vipTier: 'Platinum Elite (3,800 pts)',
      allergies: 'Dairy Sensitive',
      dietary: 'Vegan / Plant-Based',
      recentOrder: 'Avocado Superfood Salad, Fresh Cold-Pressed Juice',
      notes: 'Always orders extra dressing on the side. Regular lunch guest.'
    }
  };

  const handleSearchGuest = (e) => {
    e.preventDefault();
    const found = mockGuests[searchPhone.trim()] || {
      name: `Guest (${searchPhone || 'Unknown'})`,
      phone: searchPhone || 'N/A',
      vipTier: 'Silver Member (250 pts)',
      allergies: 'None Listed',
      dietary: 'No Special Restrictions',
      recentOrder: 'Classic Cheeseburger & Fries',
      notes: 'First time visiting or standard guest profile.'
    };
    setSearchedGuest(found);
  };

  const handleRequestInstantPayout = async () => {
    try {
      setIsProcessing(true);
      setPayoutMessage('');
      
      // Simulate API call to payout provider (e.g. Stripe Instant Payout)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setPayoutMessage('🎉 Instant payout requested successfully! Funds will arrive shortly.');
      setTipsEarned(0);
      setBasePay(0);
    } catch (err) {
      setPayoutMessage('❌ Failed to request instant payout.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="mb-4">
        <h2 className="fw-bold m-0 text-dark">
          ⭐ Front-of-House Guest Lookup, Shift Scorecard & Instant Payout (ST-001, ST-009, ST-010)
        </h2>
        <p className="text-secondary small m-0">
          Staff service terminal: FOH guest lookup card, real-time performance scorecard, and end-of-shift instant payout slip.
        </p>
      </div>

      {payoutMessage && (
        <div className={`alert ${payoutMessage.startsWith('🎉') ? 'alert-success' : 'alert-danger'} shadow-sm py-2 px-3 mb-4`}>
          {payoutMessage}
        </div>
      )}

      <div className="row g-4">
        {/* Left Column: ST-001 Front-Of-House Guest Lookup Card */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
            <h5 className="fw-bold mb-3 text-dark">
              🔍 ST-001 FOH Guest Profile Lookup Card
            </h5>
            <form onSubmit={handleSearchGuest} className="mb-3">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter guest phone (e.g. 555-0199)..."
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                />
                <button type="submit" className="btn btn-primary fw-bold">
                  <i className="bi bi-search me-1" /> Search Card
                </button>
              </div>
            </form>

            {searchedGuest ? (
              <div className="p-3 bg-light rounded-3 border">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="fw-bold text-dark m-0">{searchedGuest.name}</h6>
                  <span className="badge bg-warning text-dark">{searchedGuest.vipTier}</span>
                </div>
                <div className="small mb-2">
                  <strong>Phone:</strong> {searchedGuest.phone}
                </div>
                <div className="small mb-2">
                  <strong className="text-danger">⚠️ Allergies:</strong> {searchedGuest.allergies}
                </div>
                <div className="small mb-2">
                  <strong className="text-success">🥗 Dietary Preferences:</strong> {searchedGuest.dietary}
                </div>
                <div className="small mb-2">
                  <strong>🍔 Last Order:</strong> {searchedGuest.recentOrder}
                </div>
                <div className="small text-muted border-top pt-2 mt-2">
                  <strong>💡 Hostess Notes:</strong> {searchedGuest.notes}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted small">
                Search guest phone number to view allergen badges & dietary preferences.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: ST-009 Scorecard & ST-010 Instant Payout */}
        <div className="col-lg-6">
          {/* ST-009 Performance Scorecard */}
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
            <h5 className="fw-bold mb-3 text-dark">
              📊 ST-009 Shift Performance Scorecard
            </h5>
            <div className="row g-2 text-center">
              <div className="col-4">
                <div className="p-3 bg-primary bg-opacity-10 rounded-3 border border-primary border-opacity-25">
                  <span className="text-muted extra-small uppercase d-block fw-bold">Order Packing</span>
                  <span className="fs-3 fw-bold text-primary">98.5%</span>
                </div>
              </div>
              <div className="col-4">
                <div className="p-3 bg-success bg-opacity-10 rounded-3 border border-success border-opacity-25">
                  <span className="text-muted extra-small uppercase d-block fw-bold">Ticket Prep Time</span>
                  <span className="fs-3 fw-bold text-success">3.8 min</span>
                </div>
              </div>
              <div className="col-4">
                <div className="p-3 bg-warning bg-opacity-25 rounded-3 border border-warning">
                  <span className="text-muted extra-small uppercase d-block fw-bold">Guest Rating</span>
                  <span className="fs-3 fw-bold text-dark">⭐ 5.0</span>
                </div>
              </div>
            </div>
          </div>

          {/* ST-010 Instant Payout Slip */}
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <h5 className="fw-bold mb-3 text-dark">
              💵 ST-010 End-of-Shift Instant Payout Slip
            </h5>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-secondary small">Base Shift Pay:</span>
              <span className="fw-bold">${basePay.toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="text-secondary small">Collected Digital Tips:</span>
              <span className="fw-bold text-success">+${tipsEarned.toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between align-items-center border-top border-bottom py-2 mb-3">
              <span className="fw-bold text-dark">Total Earnings Ready for Payout:</span>
              <span className="fs-4 fw-extrabold text-primary">${(basePay + tipsEarned).toFixed(2)}</span>
            </div>

            <button
              type="button"
              className="btn btn-success btn-lg w-100 fw-bold shadow-sm"
              onClick={handleRequestInstantPayout}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                  Processing Cash Out...
                </>
              ) : (
                <>
                  <i className="bi bi-cash-stack me-2" /> Request Instant Payout to Bank Account
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
