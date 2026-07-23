import { useState } from 'react';

function AddCategoryModal({ show, onClose, onAdd }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  if (!show) {
    return null;
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim()) {
      setError('Category name is required.');
      return;
    }

    onAdd({
      id: `category-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || 'New menu category.',
      itemCount: 0,
      icon: 'bi-folder'
    });
    setName('');
    setDescription('');
    setError('');
    onClose();
  }

  return (
    <div className="modal d-block menu-modal" role="dialog" aria-modal="true" aria-labelledby="addCategoryTitle">
      <div className="modal-dialog modal-dialog-centered">
        <form className="modal-content" onSubmit={handleSubmit}>
          <div className="modal-header">
            <h2 className="modal-title h5" id="addCategoryTitle">
              Add category
            </h2>
            <button aria-label="Close" className="btn-close" onClick={onClose} type="button" />
          </div>
          <div className="modal-body">
            {error ? <div className="alert alert-danger py-2">{error}</div> : null}
            <div className="mb-3">
              <label className="form-label" htmlFor="categoryName">
                Category name
              </label>
              <input
                className="form-control"
                id="categoryName"
                onChange={(event) => setName(event.target.value)}
                value={name}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="categoryDescription">
                Description
              </label>
              <textarea
                className="form-control"
                id="categoryDescription"
                onChange={(event) => setDescription(event.target.value)}
                rows="3"
                value={description}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline-secondary" onClick={onClose} type="button">
              Cancel
            </button>
            <button className="btn btn-primary" type="submit">
              Add category
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop show" />
    </div>
  );
}

export default AddCategoryModal;
