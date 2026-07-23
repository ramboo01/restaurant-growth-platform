import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { restaurantService } from '../../services/restaurantService.js';

function SettingsPage() {
  const { user } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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
            closingTime: data.closingTime ? data.closingTime.slice(0, 5) : '23:00'
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
        closingTime: settings.closingTime
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

                <div className="card border-0 guest-info-card">
                  <div className="card-body p-4">
                    <h2 className="h5 mb-3">Branding</h2>
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <div className="border rounded-3 p-4 text-center bg-light h-100">
                          <div className="fw-semibold mb-1">Logo Placeholder</div>
                          <div className="text-secondary small">Upload area</div>
                        </div>
                      </div>
                      <div className="col-12 col-md-6">
                        <div className="border rounded-3 p-4 text-center bg-light h-100">
                          <div className="fw-semibold mb-1">Restaurant Banner Placeholder</div>
                          <div className="text-secondary small">Upload area</div>
                        </div>
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label" htmlFor="primaryColor">
                          Primary Color
                        </label>
                        <input className="form-control form-control-color" id="primaryColor" name="primaryColor" onChange={handleChange} type="color" value={settings.primaryColor} />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label" htmlFor="secondaryColor">
                          Secondary Color
                        </label>
                        <input className="form-control form-control-color" id="secondaryColor" name="secondaryColor" onChange={handleChange} type="color" value={settings.secondaryColor} />
                      </div>
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
