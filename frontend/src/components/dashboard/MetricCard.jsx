function MetricCard({ metric }) {
  return (
    <article className="card border-0 owner-card h-100">
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <span className="text-secondary small fw-semibold">{metric.label}</span>
          <span className="owner-metric-icon" aria-hidden="true">
            <i className={`bi ${metric.icon}`} />
          </span>
        </div>
        <div className="h3 mb-2">{metric.value}</div>
        <div className="d-flex align-items-center gap-2 small">
          <span className="text-success fw-semibold">
            <i className="bi bi-arrow-up-right me-1" aria-hidden="true" />
            {metric.trend}
          </span>
          <span className="text-secondary">{metric.comparison}</span>
        </div>
      </div>
    </article>
  );
}

export default MetricCard;
