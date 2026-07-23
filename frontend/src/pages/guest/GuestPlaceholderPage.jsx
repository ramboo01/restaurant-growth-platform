function GuestPlaceholderPage({ title }) {
  return (
    <div className="container py-5">
      <div className="card border-0 guest-info-card">
        <div className="card-body p-4 p-lg-5">
          <p className="text-uppercase text-secondary small fw-semibold mb-2">Guest Module</p>
          <h1 className="h4 mb-2">{title}</h1>
          <p className="text-secondary mb-0">Frontend module scheduled for a later phase.</p>
        </div>
      </div>
    </div>
  );
}

export default GuestPlaceholderPage;
