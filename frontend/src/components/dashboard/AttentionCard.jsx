import { Link } from 'react-router-dom';

const severityConfig = {
  critical: {
    icon: 'bi-exclamation-octagon-fill',
    className: 'owner-attention-critical',
    label: 'Critical'
  },
  warning: {
    icon: 'bi-exclamation-triangle-fill',
    className: 'owner-attention-warning',
    label: 'Warning'
  },
  info: {
    icon: 'bi-info-circle-fill',
    className: 'owner-attention-info',
    label: 'Info'
  }
};

function AttentionCard({ item }) {
  const severity = severityConfig[item.severity] ?? severityConfig.info;

  return (
    <article className={`card border-0 owner-card owner-attention-card ${severity.className}`}>
      <div className="card-body">
        <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
          <span className="owner-attention-icon" aria-label={severity.label} role="img">
            <i className={`bi ${severity.icon}`} aria-hidden="true" />
          </span>
          <span className="badge rounded-pill text-bg-light border">{severity.label}</span>
        </div>
        <h3 className="h6 mb-1">{item.title}</h3>
        <p className="text-secondary small mb-3">{item.description}</p>
        <Link className="btn btn-sm btn-outline-primary" to={item.to}>
          {item.actionLabel}
        </Link>
      </div>
    </article>
  );
}

export default AttentionCard;
