import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function StaffPosLoyaltyPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [members, setMembers] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedReward, setSelectedReward] = useState(null);
  const [loading, setLoading] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchRewards();
    fetchMembers();
  }, []);

  async function fetchRewards() {
    try {
      const res = await api.get('/api/loyalty/rewards');
      if (res.data?.data) {
        setRewards(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch rewards:', err);
    }
  }

  async function fetchMembers() {
    try {
      setLoading(true);
      const res = await api.get('/api/loyalty');
      if (res.data?.data?.loyaltyMembers) {
        setMembers(res.data.data.loyaltyMembers);
      }
    } catch (err) {
      console.error('Failed to fetch loyalty members:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredMembers = members.filter(
    (m) =>
      m.phone?.includes(searchTerm) ||
      m.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRedeem = async () => {
    if (!selectedMember || !selectedReward) return;
    try {
      setRedeeming(true);
      setMessage('');
      const res = await api.post('/api/loyalty/redeem-pos', {
        phone: selectedMember.phone,
        pointsToDeduct: selectedReward.pointsRequired,
        rewardName: selectedReward.name
      });

      const receiptData = res.data.data;
      setReceipt(receiptData);
      setMessage('🎉 Reward successfully redeemed!');

      // Refresh list & updated member state
      fetchMembers();
      setSelectedMember((prev) => ({
        ...prev,
        points: receiptData.remainingPoints,
        tier: receiptData.tier
      }));
    } catch (err) {
      console.error('POS Redemption failed:', err);
      setMessage(`❌ ${err.response?.data?.message || err.message}`);
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold m-0 text-dark">
            💳 FOH Register POS Loyalty Redemption (ST-004)
          </h2>
          <p className="text-secondary small m-0">
            Look up walk-in guests by phone number or name, verify point balances, and apply rewards directly at the register.
          </p>
        </div>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={fetchMembers}>
          <i className="bi bi-arrow-clockwise me-1" /> Refresh Members
        </button>
      </div>

      {message && (
        <div className={`alert ${message.startsWith('🎉') ? 'alert-success' : 'alert-danger'} shadow-sm py-2 px-3 mb-4`}>
          {message}
        </div>
      )}

      <div className="row g-4">
        {/* Left Column: Guest Search & Member List */}
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm rounded-4 p-4" style={{ background: '#fff' }}>
            <h5 className="fw-bold mb-3 border-bottom pb-2">🔎 Lookup Guest</h5>

            <div className="input-group mb-3">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-search text-muted" />
              </span>
              <input
                type="text"
                className="form-control bg-light border-start-0"
                placeholder="Search phone number or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="text-center py-4 text-muted small">Loading loyalty members...</div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-4 text-muted small">No loyalty members found.</div>
            ) : (
              <div className="list-group list-group-flush max-vh-50 overflow-auto">
                {filteredMembers.map((member) => {
                  const isSelected = selectedMember?.id === member.id;
                  return (
                    <button
                      key={member.id}
                      type="button"
                      className={`list-group-item list-group-item-action py-3 px-3 border-0 rounded-3 mb-2 transition-all ${
                        isSelected ? 'bg-primary text-white shadow-sm' : 'bg-light'
                      }`}
                      onClick={() => {
                        setSelectedMember(member);
                        setSelectedReward(null);
                        setReceipt(null);
                        setMessage('');
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="fw-bold">{member.customerName}</span>
                        <span className={`badge ${isSelected ? 'bg-light text-primary' : 'bg-warning text-dark'}`}>
                          {member.points} PTS ({member.tier})
                        </span>
                      </div>
                      <div className={`small ${isSelected ? 'text-white-50' : 'text-secondary'}`}>
                        📞 {member.phone}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Reward Catalog & POS Checkout Voucher */}
        <div className="col-lg-7">
          {selectedMember ? (
            <div className="card border-0 shadow-sm rounded-4 p-4" style={{ background: '#fff' }}>
              <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                <div>
                  <h5 className="fw-bold m-0">{selectedMember.customerName}</h5>
                  <span className="text-secondary small">Member Phone: {selectedMember.phone}</span>
                </div>
                <div className="text-end">
                  <div className="fs-4 fw-extrabold text-primary">{selectedMember.points} PTS</div>
                  <span className="badge bg-secondary">{selectedMember.tier} Tier</span>
                </div>
              </div>

              <h6 className="fw-bold mb-3 text-dark">🎁 Available Rewards Catalog</h6>

              <div className="row g-3 mb-4">
                {rewards.length === 0 ? (
                  <div className="col-12 text-muted small">No rewards configured in catalog.</div>
                ) : (
                  rewards.map((reward) => {
                    const canAfford = selectedMember.points >= reward.pointsRequired;
                    const isSelected = selectedReward?.id === reward.id;

                    return (
                      <div className="col-md-6" key={reward.id}>
                        <div
                          className={`card h-100 p-3 border-2 rounded-3 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-primary bg-primary bg-opacity-10'
                              : canAfford
                              ? 'border-light bg-light hover-shadow'
                              : 'border-light bg-light opacity-50'
                          }`}
                          onClick={() => canAfford && setSelectedReward(reward)}
                        >
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <span className="fw-bold text-dark">{reward.name}</span>
                            <span className="badge bg-primary">{reward.pointsRequired} PTS</span>
                          </div>
                          <p className="extra-small text-secondary m-0 mb-2">{reward.description}</p>
                          <div className="fw-semibold text-success small mt-auto">
                            ${reward.discountAmount} Off Order
                          </div>
                          {!canAfford && (
                            <span className="badge bg-danger bg-opacity-10 text-danger mt-2">
                              Needs {reward.pointsRequired - selectedMember.points} more pts
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {selectedReward && (
                <div className="p-3 bg-light rounded-3 mb-4 border">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-semibold text-dark">Selected Redemption:</span>
                    <span className="fw-bold text-primary">{selectedReward.name}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center small text-secondary">
                    <span>Points to deduct:</span>
                    <span className="fw-bold text-danger">-{selectedReward.pointsRequired} PTS</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center small text-secondary">
                    <span>Remaining Balance:</span>
                    <span className="fw-bold text-success">{selectedMember.points - selectedReward.pointsRequired} PTS</span>
                  </div>
                </div>
              )}

              <button
                type="button"
                disabled={!selectedReward || redeeming}
                className="btn btn-success fw-bold py-2 w-100 rounded-3 shadow-sm"
                onClick={handleRedeem}
              >
                {redeeming ? 'Processing Redemption...' : '⚡ Redeem Reward & Apply to POS Bill'}
              </button>

              {/* Receipt Voucher Display */}
              {receipt && (
                <div className="mt-4 p-4 border border-2 border-dashed rounded-4 text-center bg-white">
                  <h6 className="fw-bold text-uppercase text-secondary mb-1">POS Redemption Voucher</h6>
                  <div className="fs-3 fw-extrabold text-monospace text-primary my-2">{receipt.voucherCode}</div>
                  <p className="small text-secondary m-0">
                    Applied <strong>{receipt.rewardName}</strong> for <strong>{receipt.customerName}</strong>.
                  </p>
                  <div className="mt-2 text-muted extra-small">
                    New Balance: {receipt.remainingPoints} PTS | Hand to Cashier
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-light text-muted">
              <i className="bi bi-person-bounding-box display-4 mb-3" />
              <h5>No Guest Selected</h5>
              <p className="small">Select a customer from the left list or search by phone number to manage POS loyalty points.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
