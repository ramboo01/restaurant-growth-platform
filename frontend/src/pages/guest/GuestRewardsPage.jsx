import { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../../context/AuthContext.jsx';
import { loyaltyService } from '../../services/loyaltyService.js';

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function getTierConfig(tier) {
  const t = (tier || '').toLowerCase();
  if (t.includes('gold')) return { label: 'Gold VIP', badge: 'bg-warning text-dark', next: null, max: 1000 };
  if (t.includes('silver')) return { label: 'Silver', badge: 'bg-secondary', next: 'Gold VIP', max: 1000 };
  return { label: 'Bronze', badge: 'bg-primary', next: 'Silver', max: 500 };
}

function getRewardIcon(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('drink') || n.includes('beverage')) return 'bi-cup-straw';
  if (n.includes('dessert') || n.includes('sweet')) return 'bi-cake';
  if (n.includes('burger') || n.includes('sandwich')) return 'bi-emoji-smile';
  if (n.includes('fries') || n.includes('appetizer') || n.includes('starter')) return 'bi-egg-fried';
  if (n.includes('pizza')) return 'bi-pie-chart';
  if (n.includes('off') || n.includes('discount')) return 'bi-percent';
  return 'bi-gift';
}

function maskPhone(ph) {
  const s = String(ph).replace(/\D/g, '');
  if (s.length >= 10) return `(${s.slice(0,3)}) ${s.slice(3,6)}-${s.slice(6,10)}`;
  return ph;
}

/* ─── Component ──────────────────────────────────────────────────────────── */
function GuestRewardsPage() {
  const { user } = useContext(AuthContext);
  const restaurantId = Number(localStorage.getItem('selectedRestaurantId') || 1);

  // Determine initial phone: if logged in use user's stored phone, else localStorage
  const getInitialPhone = () => {
    if (user?.phone) return user.phone.replace(/\D/g, '');
    return localStorage.getItem('loyaltyPhone') || '';
  };

  const [phone, setPhone] = useState(getInitialPhone);
  const [phoneInput, setPhoneInput] = useState(getInitialPhone);
  const [points, setPoints] = useState(0);
  const [loyaltyMember, setLoyaltyMember] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ text: '', type: 'success' });
  const [error, setError] = useState(null);

  const tierConfig = getTierConfig(loyaltyMember?.tier);

  // ─── Load reward catalog ──────────────────────────────────────────────────
  useEffect(() => {
    loyaltyService.getPublicRewards(restaurantId).then(setCatalog).catch(() => {});
  }, [restaurantId]);

  // ─── Auto-load if logged in or phone already saved ────────────────────────
  useEffect(() => {
    const autoPhone = getInitialPhone();
    if (autoPhone && autoPhone.length >= 9) {
      setPhone(autoPhone);
      setPhoneInput(autoPhone);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ─── Fetch loyalty member whenever phone changes ───────────────────────────
  const fetchPoints = useCallback(async (phoneNum) => {
    if (!phoneNum || phoneNum.length < 9) return;
    try {
      setIsLoading(true);
      setError(null);
      // Pass user's real name so DB updates from "Valued Guest" to actual name
      const name = user?.name || user?.firstName
        ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.name
        : undefined;
      const member = await loyaltyService.checkGuestPoints(phoneNum, restaurantId, name);
      if (member) {
        setLoyaltyMember(member);
        setPoints(member.points || 0);
      } else {
        setError('No loyalty profile found for this number. Place an order to start earning points!');
      }
    } catch {
      setError('Could not fetch loyalty profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId, user]);

  useEffect(() => {
    if (phone) fetchPoints(phone);
  }, [phone, fetchPoints]);

  // ─── Phone form submit (only shown for non-logged-in guests) ─────────────
  const handlePhoneSubmit = (e) => {
    e.preventDefault();
    const clean = phoneInput.replace(/\D/g, '');
    if (clean.length < 10) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }
    localStorage.setItem('loyaltyPhone', clean);
    setPhone(clean);
  };

  // ─── Redeem ───────────────────────────────────────────────────────────────
  const handleRedeem = async (reward) => {
    const cost = reward.pointsRequired || reward.points_required || 0;
    if (points < cost) {
      setToast({ text: `You need ${cost - points} more points to redeem "${reward.name}".`, type: 'warning' });
      setTimeout(() => setToast({ text: '', type: 'success' }), 4000);
      return;
    }
    try {
      const result = await loyaltyService.redeemPoints(phone, restaurantId, cost);
      if (result) {
        setPoints(result.points);
        setLoyaltyMember((prev) => ({ ...prev, points: result.points, tier: result.tier }));
        const code = 'LOYAL-' + Math.floor(100000 + Math.random() * 900000);
        
        // Save both the code AND the discount details so checkout doesn't need to validate it against the campaigns DB
        localStorage.setItem('activePromoCode', code);
        localStorage.setItem('activeLoyaltyReward', JSON.stringify({
          code,
          name: reward.name,
          discountAmount: reward.discountAmount || (cost * 0.10) // fallback to 10% of points if not defined
        }));

        setToast({ text: `✅ "${reward.name}" redeemed! Discount automatically applied to your next order.`, type: 'success' });
        setTimeout(() => setToast({ text: '', type: 'success' }), 6000);
      }
    } catch (err) {
      setToast({ text: err.response?.data?.message || 'Failed to redeem. Please try again.', type: 'danger' });
      setTimeout(() => setToast({ text: '', type: 'success' }), 4000);
    }
  };

  const handleSwitchAccount = () => {
    setPhone('');
    setPhoneInput('');
    setPoints(0);
    setLoyaltyMember(null);
    setError(null);
    localStorage.removeItem('loyaltyPhone');
  };

  /* ─── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="container py-5" style={{ maxWidth: '900px' }}>
      {/* Header */}
      <div className="text-center mb-5">
        <h1 className="fw-bold display-6">
          <i className="bi bi-stars text-warning me-2"></i> RestruRent Loyalty Club
        </h1>
        <p className="text-muted">Earn 10 points for every $1 spent. Redeem points for delicious rewards.</p>
      </div>

      {/* Toast */}
      {toast.text && (
        <div className={`alert alert-${toast.type} text-center shadow-sm mb-4 rounded-3`} role="alert">
          {toast.text}
        </div>
      )}

      {/* ── State 1: Not logged in, no phone → show phone entry ── */}
      {!phone && !user ? (
        <div className="row justify-content-center">
          <div className="col-12 col-md-6 col-lg-5">
            <div className="card border-0 shadow-sm rounded-4 p-4 text-center">
              <div className="fs-1 text-warning mb-3"><i className="bi bi-gift-fill"></i></div>
              <h4 className="fw-bold mb-2">Check Your Rewards</h4>
              <p className="text-muted small mb-4">
                Enter your registered mobile number to view your points balance and available rewards.
              </p>
              <form onSubmit={handlePhoneSubmit}>
                <div className="mb-3">
                  <input
                    type="text"
                    className="form-control form-control-lg text-center"
                    placeholder="Enter 10-Digit Mobile Number"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    required
                    maxLength={10}
                  />
                </div>
                <button type="submit" className="btn btn-warning btn-lg w-100 fw-bold">
                  View My Points Balance
                </button>
              </form>
            </div>
          </div>
        </div>

      /* ── State 2: Loading ── */
      ) : isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-warning" role="status"></div>
          <div className="text-muted mt-3">Loading your loyalty profile...</div>
        </div>

      /* ── State 3: Error (no profile found) ── */
      ) : error ? (
        <div className="text-center py-5">
          <div className="fs-1 text-muted mb-3"><i className="bi bi-person-slash"></i></div>
          <h5 className="fw-bold mb-2">No Loyalty Profile Found</h5>
          <p className="text-muted">{error}</p>
          {!user && (
            <button className="btn btn-outline-warning btn-sm mt-2" onClick={handleSwitchAccount}>
              Try a Different Number
            </button>
          )}
        </div>

      /* ── State 4: Loyalty Dashboard ── */
      ) : loyaltyMember ? (
        <>
          {/* Points Balance Card */}
          <div className="card border-0 shadow-sm rounded-4 mb-5 text-white p-4" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
            <div className="row align-items-center g-4">
              <div className="col-12 col-md-6">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span className="text-secondary text-uppercase small fw-bold">Your Balance</span>
                  <span className={`badge ${tierConfig.badge} text-uppercase small px-2`}>{tierConfig.label}</span>
                </div>
                <div className="d-flex align-items-baseline gap-2 mb-2">
                  <span className="fw-bold text-warning" style={{ fontSize: '3.5rem', lineHeight: 1 }}>{points}</span>
                  <span className="fs-4 text-white">Points</span>
                </div>
                <div className="small text-secondary">
                  {user
                    ? <>Linked to <strong className="text-white">{user.name || user.email}</strong></>
                    : <>
                        Linked to <strong className="text-white">{maskPhone(phone)}</strong>{' '}
                        <button className="btn btn-link btn-sm text-warning p-0 ms-1 text-decoration-none small" onClick={handleSwitchAccount}>
                          (Change)
                        </button>
                      </>
                  }
                </div>
              </div>
              <div className="col-12 col-md-6">
                {tierConfig.next ? (
                  <>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="small text-secondary">Progress to {tierConfig.next}</span>
                      <span className="small text-warning fw-bold">{points} / {tierConfig.max} pts</span>
                    </div>
                    <div className="progress bg-secondary bg-opacity-30 rounded-pill" style={{ height: '10px' }}>
                      <div
                        className="progress-bar bg-warning rounded-pill"
                        style={{ width: `${Math.min((points / tierConfig.max) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="small text-secondary mt-2">
                      <i className="bi bi-arrow-up-circle me-1 text-warning"></i>
                      {Math.max(0, tierConfig.max - points)} more points to reach {tierConfig.next}
                    </div>
                  </>
                ) : (
                  <div className="text-warning fw-bold">
                    <i className="bi bi-trophy-fill me-2"></i> You are at the highest tier — Gold VIP!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rewards Catalog */}
          <h4 className="fw-bold mb-4">
            <i className="bi bi-gift me-2 text-warning"></i>Available Rewards Catalog
          </h4>
          {catalog.length === 0 ? (
            <div className="alert alert-light text-center py-4 rounded-4">
              No active rewards available right now. Check back soon!
            </div>
          ) : (
            <div className="row g-4">
              {catalog.map((reward) => {
                const cost = reward.pointsRequired || reward.points_required || reward.cost || 0;
                const canRedeem = points >= cost;
                return (
                  <div key={reward.id} className="col-12 col-md-6 col-lg-3">
                    <div className={`card border-0 shadow-sm rounded-4 h-100 text-center p-3 ${!canRedeem ? 'opacity-75' : ''}`}
                         style={{ transition: 'transform 0.2s', cursor: canRedeem ? 'pointer' : 'default' }}>
                      <div className={`fs-1 mb-3 ${canRedeem ? 'text-primary' : 'text-muted'}`}>
                        <i className={`bi ${getRewardIcon(reward.name)}`}></i>
                      </div>
                      <h6 className="fw-bold text-dark mb-1">{reward.name}</h6>
                      {reward.description && (
                        <p className="text-secondary small mb-2">{reward.description}</p>
                      )}
                      <div className="mb-3">
                        <span className={`badge ${canRedeem ? 'bg-success bg-opacity-10 text-success' : 'bg-secondary bg-opacity-10 text-secondary'} px-3 py-1 rounded-pill`}>
                          <i className="bi bi-stars me-1"></i>{cost} pts required
                        </span>
                      </div>
                      {!canRedeem && (
                        <div className="small text-danger mb-2">
                          <i className="bi bi-lock-fill me-1"></i> Need {cost - points} more pts
                        </div>
                      )}
                      <button
                        className={`btn ${canRedeem ? 'btn-warning fw-bold' : 'btn-outline-secondary'} w-100 mt-auto rounded-3`}
                        disabled={!canRedeem}
                        onClick={() => handleRedeem(reward)}
                      >
                        {canRedeem ? '🎁 Redeem Now' : 'Locked'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

export default GuestRewardsPage;
