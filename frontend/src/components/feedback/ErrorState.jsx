function ErrorState({
  title = 'Something went wrong',
  message = 'Please try again in a moment.',
  action
}) {
  return (
    <div className="alert alert-danger d-flex flex-column flex-sm-row justify-content-between gap-3" role="alert">
      <div>
        <h2 className="h6 alert-heading mb-1">{title}</h2>
        <p className="mb-0">{message}</p>
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export default ErrorState;
