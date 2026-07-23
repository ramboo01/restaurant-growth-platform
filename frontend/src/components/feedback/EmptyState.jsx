function EmptyState({
  icon = 'bi-inbox',
  title = 'Nothing to show yet',
  message = 'Content will appear here when it is available.'
}) {
  return (
    <div className="border rounded-3 bg-white p-4 text-center">
      <i className={`bi ${icon} fs-2 text-secondary`} aria-hidden="true" />
      <h2 className="h5 mt-3 mb-2">{title}</h2>
      <p className="text-secondary mb-0">{message}</p>
    </div>
  );
}

export default EmptyState;
