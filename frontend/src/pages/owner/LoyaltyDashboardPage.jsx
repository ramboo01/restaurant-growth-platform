import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { loyaltyService } from '../../services/loyaltyService.js';

const loyaltyRules = [
  '$1 spent = 10 Points',
  'Birthday Bonus (Coming Soon)',
  'Referral Bonus (Coming Soon)'
];

function LoyaltyDashboardPage() {
  const [summary, setSummary] = useState({ totalMembers: 0, activeMembers: 0, totalPointsIssued: 0, rewardsRedeemed: 0 });
  const [rewards, setRewards] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formValues, setFormValues] = useState({
    name: '',
    pointsRequired: '',
    discountAmount: '',
    description: '',
    status: 'Active'
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [summaryData, rewardsData] = await Promise.all([
        loyaltyService.getSummary(),
        loyaltyService.getRewards()
      ]);
      setSummary(summaryData);
      setRewards(rewardsData);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch loyalty data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredRewards = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return rewards.filter((reward) => reward.name.toLowerCase().includes(normalizedSearch));
  }, [rewards, searchTerm]);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormValues((current) => ({
      ...current,
      [name]: value
    }));
  }

  async function handleCreateReward() {
    try {
      await loyaltyService.createReward({
        ...formValues,
        pointsRequired: Number(formValues.pointsRequired)
      });
      await fetchData();
      setShowModal(false);
      setFormValues({
        name: '',
        pointsRequired: '',
        discountAmount: '',
        description: '',
        status: 'Active'
      });
    } catch (err) {
      console.error(err);
      alert('Failed to create reward');
    }
  }

  if (isLoading) {
    return (
      <div className="container-fluid px-0 text-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid px-0">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div>
          <p className="text-uppercase text-secondary small fw-semibold mb-2">Loyalty & Rewards</p>
          <h1 className="h3 mb-1">Loyalty Dashboard</h1>
          <p className="text-secondary mb-0">Points, rewards, and loyalty rules.</p>
        </div>
        <Link className="btn btn-outline-secondary btn-sm" to="/owner">
          Back to Owner Home
        </Link>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6 col-xl-3">
          <div className="card border-0 guest-info-card h-100">
            <div className="card-body">
              <p className="text-secondary small mb-1">Total Members</p>
              <h2 className="h4 mb-0">{summary.totalMembers}</h2>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <div className="card border-0 guest-info-card h-100">
            <div className="card-body">
              <p className="text-secondary small mb-1">Active Members</p>
              <h2 className="h4 mb-0">{summary.activeMembers}</h2>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <div className="card border-0 guest-info-card h-100">
            <div className="card-body">
              <p className="text-secondary small mb-1">Total Points Issued</p>
              <h2 className="h4 mb-0">{summary.totalPointsIssued}</h2>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <div className="card border-0 guest-info-card h-100">
            <div className="card-body">
              <p className="text-secondary small mb-1">Rewards Redeemed</p>
              <h2 className="h4 mb-0">{summary.rewardsRedeemed}</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12 col-xl-7">
          <div className="card border-0 guest-info-card mb-4">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
                <h2 className="h5 mb-0">Rewards List</h2>
                <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)} type="button">
                  Create Reward
                </button>
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="rewardSearch">
                  Search rewards
                </label>
                <input
                  className="form-control"
                  id="rewardSearch"
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by reward name..."
                  value={searchTerm}
                />
              </div>
              <div className="vstack gap-3">
                {filteredRewards.length > 0 ? (
                  filteredRewards.map((reward) => (
                    <div className="card border-0 guest-cart-item" key={reward.id}>
                      <div className="card-body d-flex justify-content-between gap-3">
                        <div>
                          <h3 className="h6 mb-1">{reward.name}</h3>
                          <p className="text-secondary small mb-0">{reward.description}</p>
                        </div>
                        <div className="text-end">
                          <div className="fw-semibold mb-1">{reward.pointsRequired} points</div>
                          <div className="text-success small fw-bold mb-1">${Number(reward.discountAmount || 0).toFixed(2)} OFF</div>
                          <span className={`badge ${reward.status === 'Active' ? 'text-bg-success' : 'text-bg-secondary'}`}>
                            {reward.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-muted small">No rewards found.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-5">
          <div className="card border-0 guest-info-card">
            <div className="card-body p-4">
              <h2 className="h5 mb-3">Loyalty Rules</h2>
              <div className="vstack gap-2">
                {loyaltyRules.map((rule) => (
                  <div className="guest-fulfillment-row" key={rule}>
                    <i className="bi bi-check-circle text-success" aria-hidden="true" />
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal ? (
        <>
          <div className="modal fade show d-block" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h2 className="modal-title h5 mb-0">Create Reward</h2>
                  <button className="btn-close" onClick={() => setShowModal(false)} type="button" />
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label" htmlFor="rewardName">
                      Reward Name
                    </label>
                    <input className="form-control" id="rewardName" name="name" onChange={handleChange} value={formValues.name} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="pointsRequired">
                      Points Required
                    </label>
                    <input
                      className="form-control"
                      id="pointsRequired"
                      name="pointsRequired"
                      onChange={handleChange}
                      type="number"
                      value={formValues.pointsRequired}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="discountAmount">
                      Discount Amount ($)
                    </label>
                    <input
                      className="form-control"
                      id="discountAmount"
                      name="discountAmount"
                      onChange={handleChange}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="e.g. 5.00"
                      value={formValues.discountAmount}
                    />
                    <div className="form-text text-muted small">Dollar amount to discount from the order. If left empty, defaults to 10% of points.</div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="rewardDescription">
                      Description
                    </label>
                    <textarea
                      className="form-control"
                      id="rewardDescription"
                      name="description"
                      onChange={handleChange}
                      rows="3"
                      value={formValues.description}
                    />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="rewardStatus">
                      Status
                    </label>
                    <select className="form-select" id="rewardStatus" name="status" onChange={handleChange} value={formValues.status}>
                      <option>Active</option>
                      <option>Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-outline-secondary" onClick={() => setShowModal(false)} type="button">
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    disabled={!formValues.name || !formValues.pointsRequired}
                    onClick={handleCreateReward}
                    type="button"
                  >
                    Create Reward
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      ) : null}
    </div>
  );
}

export default LoyaltyDashboardPage;
