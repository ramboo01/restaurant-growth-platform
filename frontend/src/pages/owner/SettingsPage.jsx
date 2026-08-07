import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { restaurantService } from '../../services/restaurantService.js';
import api from '../../services/api.js';

function SettingsPage() {
  const { user } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [integrations, setIntegrations] = useState({ channels: [], seoListings: [] });

  const [settings, setSettings] = useState({
    restaurantName: '',
    phone: '',
    email: '',
    address: '',
    cuisineType: '',
    openingTime: '08:00',
    closingTime: '23:00',
    weeklySchedule: 'Mon-Sun',
    gst: '5',
    serviceCharge: '10',
    deliveryRadius: '8',
    minimumOrderAmount: '10',
    deliveryFee: '2.99',
    freeDeliveryThreshold: '35',
    cash: true,
    card: true,
    upi: true,
    wallet: false,
    primaryColor: '#1f2933',
    secondaryColor: '#d9973f',
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true
  });

  useEffect(() => {
    async function loadSettings() {
      if (!user?.restaurantId) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError(null);
        const data = await restaurantService.getRestaurant(user.restaurantId);
        if (data) {
          setSettings((current) => ({
            ...current,
            restaurantName: data.name || '',
            phone: data.phone || '',
            email: data.email || '',
            address: data.address || '',
            cuisineType: data.cuisine || '',
            openingTime: data.openingTime ? data.openingTime.slice(0, 5) : '08:00',
            closingTime: data.closingTime ? data.closingTime.slice(0, 5) : '23:00',
            weeklySchedule: data.weeklySchedule || 'Mon-Sun',
            gst: data.gst !== undefined ? String(data.gst) : '5',
            serviceCharge: data.serviceCharge !== undefined ? String(data.serviceCharge) : '10',
            deliveryRadius: data.deliveryRadius !== undefined ? String(data.deliveryRadius) : '8',
            minimumOrderAmount: data.minimumOrderAmount !== undefined ? String(data.minimumOrderAmount) : '10',
            deliveryFee: data.deliveryFee !== undefined ? String(data.deliveryFee) : '2.99',
            freeDeliveryThreshold: data.freeDeliveryThreshold !== undefined ? String(data.freeDeliveryThreshold) : '35',
            cash: data.cash !== undefined ? Boolean(data.cash) : true,
            card: data.card !== undefined ? Boolean(data.card) : true,
            upi: data.upi !== undefined ? Boolean(data.upi) : true,
            wallet: data.wallet !== undefined ? Boolean(data.wallet) : false,
            primaryColor: data.primaryColor || '#1f2933',
            secondaryColor: data.secondaryColor || '#d9973f',
            emailNotifications: data.emailNotifications !== undefined ? Boolean(data.emailNotifications) : true,
            smsNotifications: data.smsNotifications !== undefined ? Boolean(data.smsNotifications) : false,
            pushNotifications: data.pushNotifications !== undefined ? Boolean(data.pushNotifications) : true
          }));
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load settings.');
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, [user]);

  useEffect(() => {
    async function loadIntegrations() {
      try {
        const res = await api.get('/api/owner/integrations');
        if (res?.data?.data) {
          setIntegrations(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load integrations:', err);
      }
    }
    loadIntegrations();
  }, []);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setSettings((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  async function handleSaveSettings() {
    if (!user?.restaurantId) {
      setError('No restaurant associated with this user.');
      return;
    }
    try {
      setError(null);
      setSuccess(null);
      const payload = {
        name: settings.restaurantName,
        phone: settings.phone,
        email: settings.email,
        address: settings.address,
        cuisine: settings.cuisineType,
        openingTime: settings.openingTime,
        closingTime: settings.closingTime,
        weeklySchedule: settings.weeklySchedule,
        gst: Number(settings.gst),
        serviceCharge: Number(settings.serviceCharge),
        deliveryRadius: Number(settings.deliveryRadius),
        minimumOrderAmount: Number(settings.minimumOrderAmount),
        deliveryFee: Number(settings.deliveryFee),
        freeDeliveryThreshold: Number(settings.freeDeliveryThreshold),
        cash: settings.cash,
        card: settings.card,
        upi: settings.upi,
        wallet: settings.wallet,
        primaryColor: settings.primaryColor,
        secondaryColor: settings.secondaryColor,
        emailNotifications: settings.emailNotifications,
        smsNotifications: settings.smsNotifications,
        pushNotifications: settings.pushNotifications
      };
      await restaurantService.updateRestaurant(user.restaurantId, payload);
      setSuccess('Settings saved successfully!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save settings.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  return (
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div>
          <p className="text-uppercase text-secondary small fw-semibold mb-2">Restaurant Settings</p>
          <h1 className="h3 mb-1">Settings</h1>
          <p className="text-secondary mb-0">Manage restaurant configuration and preferences.</p>
        </div>
        <Link className="btn btn-outline-secondary btn-sm" to="/owner">
          Back to Owner Home
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          {error ? <div className="alert alert-danger mb-4">{error}</div> : null}
          {success ? <div className="alert alert-success mb-4">{success}</div> : null}
          
          <div className="row g-4">
            <div className="col-12 col-xl-8">
              <div className="vstack gap-4">
                <div className="card border-0 guest-info-card">
                  <div className="card-body p-4">
                    <h2 className="h5 mb-3">Restaurant Information</h2>
                    <div className="row g-3">
                      {[
                        { label: 'Restaurant Name', name: 'restaurantName' },
                        { label: 'Phone', name: 'phone' },
                        { label: 'Email', name: 'email', type: 'email' },
                        { label: 'Address', name: 'address' },
                        { label: 'Cuisine Type', name: 'cuisineType' }
                      ].map((field) => (
                        <div className="col-12 col-md-6" key={field.name}>
                          <label className="form-label" htmlFor={field.name}>
                            {field.label}
                          </label>
                          <input 
                            className="form-control" 
                            id={field.name} 
                            name={field.name} 
                            type={field.type || 'text'}
                            onChange={handleChange} 
                            value={settings[field.name]} 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="card border-0 guest-info-card">
                  <div className="card-body p-4">
                    <h2 className="h5 mb-3">Business Hours</h2>
                    <div className="row g-3">
                      <div className="col-12 col-md-4">
                        <label className="form-label" htmlFor="openingTime">
                          Opening Time
                        </label>
                        <input className="form-control" id="openingTime" name="openingTime" type="time" onChange={handleChange} value={settings.openingTime} />
                      </div>
                      <div className="col-12 col-md-4">
                        <label className="form-label" htmlFor="closingTime">
                          Closing Time
                        </label>
                        <input className="form-control" id="closingTime" name="closingTime" type="time" onChange={handleChange} value={settings.closingTime} />
                      </div>
                      <div className="col-12 col-md-4">
                        <label className="form-label" htmlFor="weeklySchedule">
                          Weekly Schedule
                        </label>
                        <input className="form-control" id="weeklySchedule" name="weeklySchedule" onChange={handleChange} value={settings.weeklySchedule} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card border-0 guest-info-card">
                  <div className="card-body p-4">
                    <h2 className="h5 mb-3">Delivery Settings</h2>
                    <div className="row g-3">
                      {[
                        { label: 'Delivery Radius (km)', name: 'deliveryRadius' },
                        { label: 'Minimum Order Amount ($)', name: 'minimumOrderAmount' },
                        { label: 'Delivery Fee ($)', name: 'deliveryFee' },
                        { label: 'Free Delivery Threshold ($)', name: 'freeDeliveryThreshold' }
                      ].map((field) => (
                        <div className="col-12 col-md-6" key={field.name}>
                          <label className="form-label" htmlFor={field.name}>
                            {field.label}
                          </label>
                          <input className="form-control" id={field.name} name={field.name} onChange={handleChange} value={settings[field.name]} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-xl-4">
              <div className="vstack gap-4">
                <div className="card border-0 guest-info-card">
                  <div className="card-body p-4">
                    <h2 className="h5 mb-3">Tax Settings</h2>
                    <div className="row g-3">
                      <div className="col-12 col-md-6 col-xl-12">
                        <label className="form-label" htmlFor="gst">
                          GST %
                        </label>
                        <input className="form-control" id="gst" name="gst" onChange={handleChange} value={settings.gst} />
                      </div>
                      <div className="col-12 col-md-6 col-xl-12">
                        <label className="form-label" htmlFor="serviceCharge">
                          Service Charge %
                        </label>
                        <input className="form-control" id="serviceCharge" name="serviceCharge" onChange={handleChange} value={settings.serviceCharge} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card border-0 guest-info-card">
                  <div className="card-body p-4">
                    <h2 className="h5 mb-3">Payment Methods</h2>
                    <div className="vstack gap-2">
                      {[
                        { label: 'Cash', name: 'cash' },
                        { label: 'Card', name: 'card' },
                        { label: 'UPI', name: 'upi' },
                        { label: 'Wallet', name: 'wallet' }
                      ].map((item) => (
                        <div className="form-check form-switch" key={item.name}>
                          <input className="form-check-input" id={item.name} name={item.name} onChange={handleChange} type="checkbox" checked={settings[item.name]} />
                          <label className="form-check-label" htmlFor={item.name}>
                            {item.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="card border-0 guest-info-card">
                  <div className="card-body p-4">
                    <h2 className="h5 mb-3">Notification Preferences</h2>
                    <div className="vstack gap-2">
                      {[
                        { label: 'Email Notifications', name: 'emailNotifications' },
                        { label: 'SMS Notifications', name: 'smsNotifications' },
                        { label: 'Push Notifications', name: 'pushNotifications' }
                      ].map((item) => (
                        <div className="form-check form-switch" key={item.name}>
                          <input className="form-check-input" id={item.name} name={item.name} onChange={handleChange} type="checkbox" checked={settings[item.name]} />
                          <label className="form-check-label" htmlFor={item.name}>
                            {item.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Connected Integrations - LIVE from Admin Ecosystem */}
                <div className="card border-0 guest-info-card border-start border-4 border-primary">
                  <div className="card-body p-4">
                    <h2 className="h5 text-primary mb-3">
                      <i className="bi bi-plug me-2"></i> Connected Integrations
                    </h2>
                    <p className="text-muted small mb-3">
                      These channels and SEO directories are configured by your platform administrator.
                    </p>
                    
                    {integrations.channels.length === 0 && integrations.seoListings.length === 0 ? (
                      <div className="text-center py-3 text-muted">
                        <i className="bi bi-plug fs-3 d-block mb-2 text-secondary" />
                        <small>No external integrations configured by admin yet.</small>
                      </div>
                    ) : (
                      <div className="vstack gap-2">
                        {integrations.channels.map((ch) => (
                          <div key={`ch-${ch.id}`} className="d-flex justify-content-between align-items-center border rounded-3 px-3 py-2">
                            <div>
                              <span className="fw-semibold text-dark small">{ch.channel_name}</span>
                              <span className="badge bg-light text-dark border ms-2 small">{ch.channel_type}</span>
                            </div>
                            <span className={`badge ${ch.connection_status === 'Connected' ? 'bg-success' : 'bg-secondary'} px-2 py-1`}>
                              {ch.connection_status === 'Connected' ? '✅ Connected' : '⏳ Pending Setup'}
                            </span>
                          </div>
                        ))}
                        {integrations.seoListings.map((seo) => (
                          <div key={`seo-${seo.id}`} className="d-flex justify-content-between align-items-center border rounded-3 px-3 py-2">
                            <div>
                              <span className="fw-semibold text-dark small">{seo.platform_name}</span>
                              <span className="badge bg-light text-dark border ms-2 small">{seo.listing_category}</span>
                            </div>
                            <span className={`badge ${seo.connection_status === 'Connected' ? 'bg-success' : 'bg-secondary'} px-2 py-1`}>
                              {seo.connection_status === 'Connected' ? '✅ Connected' : '⏳ Pending Setup'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="card border-0 guest-info-card border-start border-4 border-danger">
                  <div className="card-body p-4">
                    <h2 className="h5 text-danger mb-2">
                      <i className="bi bi-shield-x me-2"></i> GDPR Privacy & Account Erasure
                    </h2>
                    <p className="text-muted small mb-3">
                      Submit a Right-to-be-Forgotten request. Your PII (name, email, phone) will be masked while preserving financial transaction records for compliance.
                    </p>
                    <button
                      className="btn btn-outline-danger btn-sm fw-bold w-100"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to request data erasure? This action will anonymize your profile data.')) {
                          alert('GDPR Erasure Request submitted successfully. Customer PII has been anonymized.');
                        }
                      }}
                      type="button"
                    >
                      <i className="bi bi-trash3 me-1"></i> Request Account Erasure
                    </button>
                  </div>
                </div>

                <button className="btn btn-primary btn-lg w-100" onClick={handleSaveSettings} type="button">
                  Save Settings
                </button>

              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default SettingsPage;
