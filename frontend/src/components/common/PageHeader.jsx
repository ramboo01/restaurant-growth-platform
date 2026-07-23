function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-4">
      <div>
        {eyebrow ? (
          <p className="text-uppercase text-secondary small fw-semibold mb-1">{eyebrow}</p>
        ) : null}
        <h1 className="h3 mb-2">{title}</h1>
        {description ? <p className="text-secondary mb-0">{description}</p> : null}
      </div>
      {actions ? <div className="d-flex align-items-start gap-2">{actions}</div> : null}
    </div>
  );
}

export default PageHeader;
