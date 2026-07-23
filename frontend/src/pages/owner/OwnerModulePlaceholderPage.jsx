import { ownerModulePlaceholders } from '../../data/ownerDashboardData.js';

function OwnerModulePlaceholderPage({ moduleKey }) {
  const module = ownerModulePlaceholders[moduleKey] ?? {
    title: 'Owner Module',
    description: 'Frontend module scheduled for a later phase.'
  };

  return (
    <div className="card border-0 owner-card">
      <div className="card-body p-4 p-lg-5">
        <p className="text-uppercase text-secondary small fw-semibold mb-2">Owner Module</p>
        <h1 className="h4 mb-2">{module.title}</h1>
        <p className="text-secondary mb-0">{module.description}</p>
      </div>
    </div>
  );
}

export default OwnerModulePlaceholderPage;
