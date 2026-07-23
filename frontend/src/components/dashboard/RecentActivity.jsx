function RecentActivity({ activities }) {
  const hasActivities = Array.isArray(activities) && activities.length > 0;

  return (
    <div className="card border-0 owner-card h-100">
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h2 className="h5 mb-1" id="recent-activity-heading">
              Recent Activity
            </h2>
            <p className="text-secondary small mb-0">Latest operational updates across this location.</p>
          </div>
          <span className="badge text-bg-light border">{hasActivities ? `${activities.length} updates` : '0 updates'}</span>
        </div>

        {hasActivities ? (
          <div className="vstack gap-3">
            {activities.map((activity) => (
              <article className="owner-activity-item" key={activity.id}>
                <span className="owner-activity-icon" aria-hidden="true">
                  <i className={`bi ${activity.icon}`} />
                </span>
                <div className="flex-grow-1">
                  <div className="d-flex flex-column flex-sm-row justify-content-between gap-1">
                    <h3 className="h6 mb-0">{activity.title}</h3>
                    <span className="text-secondary small">{activity.time}</span>
                  </div>
                  <p className="text-secondary small mb-0">{activity.description}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-secondary">No recent activity available.</div>
        )}
      </div>
    </div>
  );
}

export default RecentActivity;
