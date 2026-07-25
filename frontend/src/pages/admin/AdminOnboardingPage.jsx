import { useState } from 'react';

function AdminOnboardingPage() {
  const [locations, setLocations] = useState([
    {
      id: 1,
      name: 'Taco Express',
      location: 'Lincoln Park',
      specialist: 'Jane Doe',
      steps: {
        profileSetup: true,
        menuImport: true,
        paymentVerify: true,
        seoConnect: false,
      },
    },
    {
      id: 2,
      name: 'Sushiko Sushi',
      location: 'Loop Flagship',
      specialist: 'John Smith',
      steps: {
        profileSetup: true,
        menuImport: true,
        paymentVerify: false,
        seoConnect: false,
      },
    },
    {
      id: 3,
      name: 'The Burger Barn',
      location: 'South End',
      specialist: 'Sarah Jenkins',
      steps: {
        profileSetup: true,
        menuImport: false,
        paymentVerify: false,
        seoConnect: false,
      },
    },
  ]);

  const [toast, setToast] = useState('');

  const toggleStep = (locId, stepKey) => {
    setLocations(prev => prev.map(loc => {
      if (loc.id === locId) {
        const nextSteps = { ...loc.steps, [stepKey]: !loc.steps[stepKey] };
        return { ...loc, steps: nextSteps };
      }
      return loc;
    }));
    setToast('Onboarding checklist updated.');
    setTimeout(() => setToast(''), 2000);
  };

  const getProgress = (steps) => {
    const total = Object.keys(steps).length;
    const completed = Object.values(steps).filter(Boolean).length;
    return Math.round((completed / total) * 100);
  };

  return (
    <div className="container-fluid py-4">
      <div className="mb-4">
        <h2 className="fw-bold mb-1">
          <i className="bi bi-box-arrow-in-right text-success me-2"></i> Onboarding Specialist Console
        </h2>
        <p className="text-muted mb-0">Track and manage onboarding status, menu imports, and Stripe integrations for new merchant locations.</p>
      </div>

      {toast && (
        <div className="alert alert-success shadow-sm mb-4" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i> {toast}
        </div>
      )}

      <div className="row g-4">
        {locations.map(loc => {
          const progress = getProgress(loc.steps);
          return (
            <div className="col-12 col-md-6 col-lg-4" key={loc.id}>
              <div className="card border-0 shadow-sm rounded-3 h-100">
                <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="fw-bold mb-0 text-dark">{loc.name}</h6>
                    <span className="text-muted small">{loc.location}</span>
                  </div>
                  <span className={`badge bg-${progress === 100 ? 'success' : 'warning'} bg-opacity-10 text-${progress === 100 ? 'success' : 'warning'} px-2 py-1`}>
                    {progress}% Done
                  </span>
                </div>
                <div className="card-body">
                  <div className="progress mb-3" style={{ height: '6px' }}>
                    <div className="progress-bar bg-success" style={{ width: `${progress}%` }}></div>
                  </div>

                  <div className="text-muted small mb-3">
                    <i className="bi bi-person-badge me-2"></i>Specialist: <strong>{loc.specialist}</strong>
                  </div>

                  {/* Checklist */}
                  <div className="d-flex flex-column gap-2 border-top pt-3">
                    {[
                      { key: 'profileSetup', label: '1. Basic Profile Setup' },
                      { key: 'menuImport', label: '2. Menu & Modifiers Import' },
                      { key: 'paymentVerify', label: '3. Stripe Payment Setup' },
                      { key: 'seoConnect', label: '4. SEO Meta & Sitemap Connect' },
                    ].map(step => (
                      <div 
                        key={step.key} 
                        className="d-flex justify-content-between align-items-center cursor-pointer p-2 rounded hover-bg-light"
                        onClick={() => toggleStep(loc.id, step.key)}
                      >
                        <span className={`small ${loc.steps[step.key] ? 'text-decoration-line-through text-muted' : 'text-dark'}`}>
                          {step.label}
                        </span>
                        {loc.steps[step.key] ? (
                          <i className="bi bi-check-circle-fill text-success fs-5"></i>
                        ) : (
                          <i className="bi bi-circle text-muted fs-5"></i>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AdminOnboardingPage;
