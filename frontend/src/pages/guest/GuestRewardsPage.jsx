import { useState } from 'react';

function GuestRewardsPage() {
  const [points, setPoints] = useState(750);
  const [redeemedCode, setRedeemedCode] = useState('');
  const [toast, setToast] = useState('');

  const catalog = [
    { id: 'R-1', name: 'Free Fountain Drink', cost: 200, icon: 'bi-cup-straw' },
    { id: 'R-2', name: 'Free Garlic Bread', cost: 400, icon: 'bi-egg-fried' },
    { id: 'R-3', name: 'Free Truffle Fries', cost: 600, icon: 'bi-box-seam' },
    { id: 'R-4', name: 'Free Spicy Rigatoni Pasta', cost: 800, icon: 'bi-chat-heart' }
  ];

  const handleRedeem = (item) => {
    if (points >= item.cost) {
      setPoints(points - item.cost);
      const code = 'LOYAL-' + Math.floor(100000 + Math.random() * 900000);
      setRedeemedCode(code);
      setToast(`Successfully redeemed ${item.name}! Use code ${code} at checkout.`);
    } else {
      alert('Insufficient points for this reward!');
    }
  };

  return (
    <div className="container py-5">
      <div className="text-center mb-5">
        <h1 className="fw-bold display-6"><i className="bi bi-stars text-warning me-2"></i> RestruRent Loyalty Club</h1>
        <p className="text-muted">Earn 10 points for every $1 spent. Redeem points for delicious rewards.</p>
      </div>

      {toast && (
        <div className="alert alert-success text-center shadow-sm mb-4" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i> {toast}
        </div>
      )}

      {/* Points Card */}
      <div className="card border-0 shadow-sm rounded-4 mb-5 bg-dark text-white p-4">
        <div className="row align-items-center">
          <div className="col-12 col-md-6 text-center text-md-start mb-3 mb-md-0">
            <span className="text-secondary text-uppercase small fw-bold">Your Balance</span>
            <div className="display-4 fw-bold text-warning">{points} <span className="fs-3 text-white">Points</span></div>
          </div>
          <div className="col-12 col-md-6">
            <div className="d-flex justify-content-between mb-2">
              <span className="small text-secondary">Progress to Gold VIP Tier</span>
              <span className="small text-warning fw-bold">{points} / 1000 pts</span>
            </div>
            <div className="progress bg-secondary bg-opacity-30" style={{ height: '10px' }}>
              <div 
                className="progress-bar bg-warning" 
                role="progressbar" 
                style={{ width: `${Math.min((points / 1000) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Catalog */}
      <h4 className="fw-bold mb-4">Available Rewards Catalog</h4>
      <div className="row g-4">
        {catalog.map(item => (
          <div key={item.id} className="col-12 col-md-6 col-lg-3">
            <div className="card border-0 shadow-sm rounded-3 h-100 text-center p-3">
              <div className="fs-1 text-primary mb-3">
                <i className={`bi ${item.icon}`}></i>
              </div>
              <h6 className="fw-bold text-dark mb-1">{item.name}</h6>
              <p className="text-muted small mb-3">{item.cost} points required</p>
              <button 
                className="btn btn-outline-primary w-100 mt-auto fw-bold" 
                disabled={points < item.cost}
                onClick={() => handleRedeem(item)}
              >
                {points >= item.cost ? 'Redeem Reward' : 'Insufficient Points'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GuestRewardsPage;
