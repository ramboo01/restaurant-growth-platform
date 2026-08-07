import { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

const TIERS = [
  { key: 'standard', name: 'Standard', price: 15, icon: 'bi-box-seam', color: '#198754',
    desc: 'Artisan sandwiches, fresh garden salads, seasonal fruit platters & craft beverages.',
    items: ['Gourmet Sandwich Platter', 'Garden Salad Bar', 'Fresh Fruit Display', 'Craft Beverages'] },
  { key: 'executive', name: 'Executive', price: 25, icon: 'bi-briefcase-fill', color: '#0d6efd', popular: true,
    desc: 'Hot buffet setup, roasted entrees, gourmet sides, artisan appetizers & dessert bar.',
    items: ['Hot Buffet Entrees', 'Artisan Appetizers', 'Premium Sides', 'Dessert Bar', 'Specialty Drinks'] },
  { key: 'luxury', name: 'Luxury VIP', price: 45, icon: 'bi-gem', color: '#6f42c1',
    desc: 'Live chef station, multi-course plated dinner, fine wine/cocktail pairing & full staff.',
    items: ['Live Chef Station', 'Multi-Course Plated Dinner', 'Wine & Cocktail Pairing', 'Dedicated Wait Staff', 'Custom Dessert Experience'] }
];

const STATUS_COLORS = {
  'New Inquiry': 'warning', 'Confirmed': 'success', 'Follow-Up Required': 'info',
  'In Preparation': 'primary', 'Ready for Dispatch': 'info', 'Delivered': 'success',
  'Completed': 'secondary', 'Declined': 'danger', 'Cancelled': 'danger'
};

function GuestCateringPage() {
  const authCtx = useContext(AuthContext);
  const user = authCtx?.user;
  const [tab, setTab] = useState('packages');
  const [restaurants, setRestaurants] = useState([]);

  // Form
  const [restaurantId, setRestaurantId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState(user?.name || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('12:00');
  const [venueAddress, setVenueAddress] = useState('');
  const [headcount, setHeadcount] = useState(30);
  const [tier, setTier] = useState('executive');
  const [dietaryNotes, setDietaryNotes] = useState('');
  const [paymentPlan, setPaymentPlan] = useState('Installments');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  // Track
  const [trackEmail, setTrackEmail] = useState(user?.email || '');
  const [myOrders, setMyOrders] = useState([]);
  const [loadingTrack, setLoadingTrack] = useState(false);
  const [trackedOnce, setTrackedOnce] = useState(false);

  useEffect(() => {
    api.get('/api/public/restaurants').then(r => {
      const rawData = r.data?.data;
      const list = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.restaurants)
        ? rawData.restaurants
        : Array.isArray(r.data?.restaurants)
        ? r.data.restaurants
        : [];
      if (list.length > 0) {
        setRestaurants(list);
        setRestaurantId(list[0].id || list[0].restaurant_id || 1);
      } else {
        setRestaurants([{ id: 1, name: 'Pulse Valley Main', address: 'Residency Rd' }]);
        setRestaurantId(1);
      }
    }).catch(() => {
      setRestaurants([{ id: 1, name: 'Pulse Valley Main', address: 'Residency Rd' }]);
      setRestaurantId(1);
    });
  }, []);

  useEffect(() => {
    if (user) {
      if (user.name) setContactPerson(user.name);
      if (user.email) { setContactEmail(user.email); setTrackEmail(user.email); }
      if (user.phone) setContactPhone(user.phone);
    }
  }, [user]);

  const tierObj = TIERS.find(t => t.key === tier) || TIERS[1];
  const rawTotal = headcount * tierObj.price;
  const discount = paymentPlan === 'Full Payment' ? rawTotal * 0.05 : 0;
  const total = rawTotal - discount;
  const depositAmt = total * 0.25;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!restaurantId) { setError('Please select a restaurant.'); return; }
    try {
      setSubmitting(true);
      const res = await api.post('/api/catering/request', {
        restaurantId, companyName, contactPerson, contactPhone, contactEmail: contactEmail.toLowerCase().trim(),
        eventName: eventName || `${companyName} Event`, eventDate, eventTime, venueAddress,
        headcount, packageTier: tierObj.name, dietaryNotes, paymentPlan,
        totalAmount: total, depositAmount: depositAmt
      });
      setSuccess(res.data?.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally { setSubmitting(false); }
  };

  const handleTrack = async () => {
    if (!trackEmail) return;
    setLoadingTrack(true);
    setTrackedOnce(true);
    try {
      const res = await api.get('/api/catering/my-orders', { params: { email: trackEmail.toLowerCase().trim() } });
      setMyOrders(res.data?.data || []);
    } catch { setMyOrders([]); }
    finally { setLoadingTrack(false); }
  };

  const resetForm = () => { setSuccess(null); setTab('packages'); };

  // ─── RENDER ─────────────────────────────────────────────
  return (
    <div className="container py-4 py-lg-5">
      {/* Header */}
      <div className="text-center mb-4" style={{ maxWidth: 780, margin: '0 auto' }}>
        <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-3 py-2 rounded-pill fw-semibold mb-2">
          <i className="bi bi-briefcase-fill me-1"></i> Corporate & Private Events
        </span>
        <h1 className="fw-bold display-6 text-dark mb-2">Corporate & Event Catering</h1>
        <p className="text-muted">Premium catering tailored for corporate events, celebrations & large gatherings.</p>

        <div className="d-flex flex-wrap justify-content-center gap-2 mt-3">
          {[['packages','bi-grid-fill','Our Packages'],['book','bi-calendar-plus','Book Event'],['track','bi-search','Track Orders']].map(([k,ic,lb]) => (
            <button key={k} className={`btn px-3 py-2 rounded-pill fw-semibold ${tab===k?'btn-primary shadow-sm':'btn-outline-secondary'}`} onClick={() => setTab(k)}>
              <i className={`bi ${ic} me-1`}></i> {lb}
            </button>
          ))}
        </div>
      </div>

      {/* ──────── TAB: PACKAGES ──────── */}
      {tab === 'packages' && (
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div className="row g-4">
            {TIERS.map(t => (
              <div className="col-12 col-md-4" key={t.key}>
                <div className="card border-0 shadow-sm rounded-4 h-100 text-center p-4 position-relative overflow-hidden">
                  {t.popular && <span className="badge bg-primary position-absolute top-0 end-0 m-3 px-3 py-2 rounded-pill">Most Popular</span>}
                  <div className="mb-3">
                    <div className="d-inline-flex align-items-center justify-content-center rounded-circle" style={{ width:64,height:64,background:`${t.color}15` }}>
                      <i className={`bi ${t.icon} fs-3`} style={{ color: t.color }}></i>
                    </div>
                  </div>
                  <h4 className="fw-bold">{t.name}</h4>
                  <div className="mb-3"><span className="display-6 fw-bold" style={{ color: t.color }}>${t.price}</span><span className="text-muted"> / guest</span></div>
                  <p className="text-muted small mb-3">{t.desc}</p>
                  <ul className="list-unstyled text-start small mb-4">
                    {t.items.map((item,i) => <li key={i} className="mb-1"><i className="bi bi-check-circle-fill text-success me-2"></i>{item}</li>)}
                  </ul>
                  <button className="btn btn-outline-primary rounded-pill w-100 mt-auto fw-semibold" onClick={() => { setTier(t.key); setTab('book'); }}>
                    Get Quote <i className="bi bi-arrow-right ms-1"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ──────── TAB: BOOK ──────── */}
      {tab === 'book' && !success && (
        <div className="card border-0 shadow-sm rounded-4 mx-auto p-3 p-md-4" style={{ maxWidth: 880 }}>
          {error && <div className="alert alert-danger"><i className="bi bi-exclamation-triangle-fill me-2"></i>{error}</div>}
          <form onSubmit={handleSubmit}>
            {/* Restaurant Selection */}
            <div className="mb-4 p-3 bg-light rounded-3 border">
              <label className="form-label fw-bold"><i className="bi bi-shop me-2 text-primary"></i>Select Restaurant <span className="text-danger">*</span></label>
              <select className="form-select" required value={restaurantId} onChange={e => setRestaurantId(e.target.value)}>
                <option value="">-- Choose a restaurant --</option>
                {restaurants.map(r => <option key={r.id || r.restaurant_id} value={r.id || r.restaurant_id}>{r.name} {r.address ? `(${r.address})` : ''}</option>)}
              </select>
            </div>

            {/* Section 1 */}
            <div className="border-bottom pb-4 mb-4">
              <h5 className="fw-bold mb-3"><span className="badge bg-primary rounded-circle me-2" style={{width:28,height:28,display:'inline-flex',alignItems:'center',justifyContent:'center'}}>1</span>Company & Contact</h5>
              <div className="row g-3">
                <div className="col-12 col-md-6"><label className="form-label fw-semibold">Company Name <span className="text-danger">*</span></label>
                  <input className="form-control" required placeholder="e.g. TechNova Solutions" value={companyName} onChange={e=>setCompanyName(e.target.value)} /></div>
                <div className="col-12 col-md-6"><label className="form-label fw-semibold">Contact Person <span className="text-danger">*</span></label>
                  <input className="form-control" required placeholder="e.g. Priya Sharma" value={contactPerson} onChange={e=>setContactPerson(e.target.value)} /></div>
                <div className="col-12 col-md-6"><label className="form-label fw-semibold">Phone <span className="text-danger">*</span></label>
                  <input type="tel" className="form-control" required placeholder="+91 98765-43210" value={contactPhone} onChange={e=>setContactPhone(e.target.value)} /></div>
                <div className="col-12 col-md-6"><label className="form-label fw-semibold">Email <span className="text-danger">*</span></label>
                  <input type="email" className="form-control" required placeholder="events@company.com" value={contactEmail} onChange={e=>setContactEmail(e.target.value)} /></div>
              </div>
            </div>

            {/* Section 2 */}
            <div className="border-bottom pb-4 mb-4">
              <h5 className="fw-bold mb-3"><span className="badge bg-primary rounded-circle me-2" style={{width:28,height:28,display:'inline-flex',alignItems:'center',justifyContent:'center'}}>2</span>Event Details</h5>
              <div className="row g-3">
                <div className="col-12 col-md-6"><label className="form-label fw-semibold">Event Name</label>
                  <input className="form-control" placeholder="e.g. Annual Team Offsite" value={eventName} onChange={e=>setEventName(e.target.value)} /></div>
                <div className="col-6 col-md-3"><label className="form-label fw-semibold">Date <span className="text-danger">*</span></label>
                  <input type="date" className="form-control" required value={eventDate} onChange={e=>setEventDate(e.target.value)} /></div>
                <div className="col-6 col-md-3"><label className="form-label fw-semibold">Time <span className="text-danger">*</span></label>
                  <input type="time" className="form-control" required value={eventTime} onChange={e=>setEventTime(e.target.value)} /></div>
                <div className="col-12"><label className="form-label fw-semibold">Venue / Delivery Address <span className="text-danger">*</span></label>
                  <textarea className="form-control" rows="2" required placeholder="Full address with building, floor, drop-off instructions..." value={venueAddress} onChange={e=>setVenueAddress(e.target.value)}></textarea></div>
              </div>
            </div>

            {/* Section 3 */}
            <div className="border-bottom pb-4 mb-4">
              <h5 className="fw-bold mb-3"><span className="badge bg-primary rounded-circle me-2" style={{width:28,height:28,display:'inline-flex',alignItems:'center',justifyContent:'center'}}>3</span>Package & Headcount</h5>
              <div className="row g-3 mb-3">
                {TIERS.map(t => (
                  <div className="col-12 col-md-4" key={t.key}>
                    <div className={`card h-100 p-3 rounded-3 text-center border-2 ${tier===t.key?'border-primary bg-primary bg-opacity-10':'border-light-subtle'}`}
                      style={{ cursor:'pointer' }} onClick={() => setTier(t.key)}>
                      <div className="fw-bold">{t.name}</div>
                      <div className="fs-4 fw-bold" style={{color:t.color}}>${t.price}<span className="fs-6 text-muted fw-normal"> /guest</span></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="row g-3">
                <div className="col-12 col-md-4"><label className="form-label fw-semibold">Guest Count <span className="text-danger">*</span></label>
                  <input type="number" className="form-control" min="10" max="2000" required value={headcount} onChange={e=>setHeadcount(Math.max(10,parseInt(e.target.value)||10))} /></div>
                <div className="col-12 col-md-8"><label className="form-label fw-semibold">Dietary Notes & Special Instructions</label>
                  <input className="form-control" placeholder="e.g. 10 Jain meals, 5 Vegan, No peanuts" value={dietaryNotes} onChange={e=>setDietaryNotes(e.target.value)} /></div>
              </div>
            </div>

            {/* Section 4 */}
            <div className="mb-4">
              <h5 className="fw-bold mb-3"><span className="badge bg-primary rounded-circle me-2" style={{width:28,height:28,display:'inline-flex',alignItems:'center',justifyContent:'center'}}>4</span>Payment & Quote</h5>
              <div className="row g-3 mb-3">
                {[['Installments','25% Deposit + 2 Installments',`Pay $${depositAmt.toFixed(2)} now, rest in 2 easy installments`],
                  ['Full Payment','Full Payment (5% Discount)',`Pay $${total.toFixed(2)} upfront and save $${discount.toFixed(2)}`]].map(([val,label,desc]) => (
                  <div className="col-12 col-md-6" key={val}>
                    <div className={`card p-3 rounded-3 border-2 ${paymentPlan===val?'border-success bg-success bg-opacity-10':'border-light-subtle'}`}
                      style={{cursor:'pointer'}} onClick={() => setPaymentPlan(val)}>
                      <div className="form-check"><input className="form-check-input" type="radio" checked={paymentPlan===val} onChange={() => setPaymentPlan(val)} />
                        <label className="form-check-label fw-bold">{label}</label></div>
                      <p className="small text-muted mb-0 mt-1">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-light rounded-3 border">
                <div className="d-flex justify-content-between mb-1"><span className="text-muted">{headcount} guests × ${tierObj.price}</span><span className="fw-semibold">${rawTotal.toFixed(2)}</span></div>
                {discount > 0 && <div className="d-flex justify-content-between mb-1 text-success"><span>5% Discount</span><span>-${discount.toFixed(2)}</span></div>}
                <div className="d-flex justify-content-between pt-2 border-top"><span className="fw-bold fs-5">Total Quote</span><span className="fw-bold fs-4">${total.toFixed(2)}</span></div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-100 py-3 fw-bold fs-5 rounded-pill" disabled={submitting}>
              {submitting ? <><span className="spinner-border spinner-border-sm me-2"></span>Submitting...</> : <><i className="bi bi-send-fill me-2"></i>Submit Catering Request</>}
            </button>
            <p className="text-center text-muted small mt-2">Your inquiry will be reviewed by the restaurant. You'll receive a confirmation once accepted.</p>
          </form>
        </div>
      )}

      {/* ──────── SUCCESS ──────── */}
      {tab === 'book' && success && (
        <div className="card border-0 shadow-sm rounded-4 mx-auto p-4 p-md-5 text-center" style={{ maxWidth: 620 }}>
          <i className="bi bi-patch-check-fill text-success display-3 mb-3"></i>
          <h2 className="fw-bold mb-2">Catering Request Submitted!</h2>
          <p className="text-muted">Your inquiry has been sent to <strong>{success.restaurant_name || 'the restaurant'}</strong>. They will review and confirm shortly.</p>
          <div className="bg-light p-3 rounded-3 text-start mb-4 border">
            <div className="d-flex justify-content-between mb-2"><span className="text-muted small">Booking ID</span><span className="fw-bold text-primary font-monospace">#CAT-{String(success.id).padStart(4,'0')}</span></div>
            <div className="d-flex justify-content-between mb-2"><span className="text-muted small">Company</span><span className="fw-semibold small">{success.company_name}</span></div>
            <div className="d-flex justify-content-between mb-2"><span className="text-muted small">Event</span><span className="fw-semibold small">{success.event_date} at {success.event_time}</span></div>
            <div className="d-flex justify-content-between mb-2"><span className="text-muted small">Guests</span><span className="fw-semibold small">{success.headcount} ({success.package_tier})</span></div>
            <div className="d-flex justify-content-between mb-2"><span className="text-muted small">Status</span><span className="badge bg-warning text-dark">New Inquiry</span></div>
            <div className="d-flex justify-content-between pt-2 border-top"><span className="text-muted small">Quote</span><span className="fw-bold">${parseFloat(success.total_amount).toFixed(2)}</span></div>
          </div>
          <p className="small text-muted mb-3">Track your order anytime using your email: <strong>{success.contact_email}</strong></p>
          <div className="d-flex flex-wrap gap-2 justify-content-center">
            <button className="btn btn-primary rounded-pill px-4" onClick={() => { setTrackEmail(success.contact_email); setTab('track'); }}>Track My Orders</button>
            <button className="btn btn-outline-secondary rounded-pill px-4" onClick={resetForm}>Book Another</button>
          </div>
        </div>
      )}

      {/* ──────── TAB: TRACK ──────── */}
      {tab === 'track' && (
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <div className="card border-0 shadow-sm rounded-3 p-4 mb-4">
            <h5 className="fw-bold mb-3"><i className="bi bi-search me-2 text-primary"></i>Track Your Catering Orders</h5>
            <div className="input-group">
              <input type="email" className="form-control" placeholder="Enter your email address..." value={trackEmail} onChange={e=>setTrackEmail(e.target.value)}
                onKeyDown={e => { if(e.key==='Enter'){e.preventDefault();handleTrack();} }} />
              <button className="btn btn-primary px-4" onClick={handleTrack} disabled={loadingTrack}>
                {loadingTrack ? <span className="spinner-border spinner-border-sm"></span> : 'Search'}
              </button>
            </div>
          </div>

          {loadingTrack ? (
            <div className="text-center py-5"><div className="spinner-border text-primary mb-3"></div><p className="text-muted">Searching...</p></div>
          ) : trackedOnce && myOrders.length === 0 ? (
            <div className="card border-0 shadow-sm rounded-3 text-center p-5">
              <i className="bi bi-inbox text-muted display-4 mb-3"></i>
              <h5 className="fw-bold">No Orders Found</h5>
              <p className="text-muted">No catering bookings found for <strong>{trackEmail}</strong>.</p>
              <button className="btn btn-primary rounded-pill px-4" onClick={() => setTab('book')}>Book Catering Now</button>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {myOrders.map(o => (
                <div key={o.id} className="card border-0 shadow-sm rounded-3 p-4">
                  <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-3 pb-3 border-bottom gap-2">
                    <div>
                      <span className="badge bg-dark bg-opacity-10 text-dark font-monospace mb-1">#CAT-{String(o.id).padStart(4,'0')}</span>
                      <h5 className="fw-bold mb-0">{o.company_name}</h5>
                      <span className="text-muted small">{o.restaurant_name} • {new Date(o.created_at).toLocaleDateString()}</span>
                    </div>
                    <span className={`badge bg-${STATUS_COLORS[o.status]||'secondary'} bg-opacity-10 text-${STATUS_COLORS[o.status]||'secondary'} border border-${STATUS_COLORS[o.status]||'secondary'} border-opacity-25 px-3 py-2`}>
                      {o.status}
                    </span>
                  </div>
                  <div className="row g-3">
                    <div className="col-12 col-md-6"><div className="small text-muted">Contact</div><div className="fw-semibold">{o.contact_person} • {o.contact_phone}</div></div>
                    <div className="col-12 col-md-6"><div className="small text-muted">Event</div><div className="fw-semibold">{o.event_date} at {o.event_time}</div><div className="small text-muted text-truncate">{o.venue_address}</div></div>
                    <div className="col-12 col-md-6"><div className="small text-muted">Package</div><div className="fw-semibold">{o.headcount} Guests • {o.package_tier}</div></div>
                    <div className="col-12 col-md-6"><div className="small text-muted">Payment ({o.payment_plan})</div><div className="fw-bold">Total: ${parseFloat(o.total_amount).toFixed(2)}</div><div className="small text-success">Paid: ${parseFloat(o.paid_amount).toFixed(2)}</div></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GuestCateringPage;
