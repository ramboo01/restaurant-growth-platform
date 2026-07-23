import { useEffect, useState } from 'react';

function AddItemModal({ categories, item, show, onClose, onSubmit, submitting }) {
  const [form, setForm] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    imageUrl: '',
    isAvailable: true
  });
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    if (show) {
      setForm({
        name: item?.name ?? '',
        category: item?.category ?? categories[0] ?? '',
        price: item?.price ?? '',
        description: item?.description ?? '',
        imageUrl: item?.imageUrl ?? '',
        isAvailable: item?.isAvailable ?? true
      });
      setSelectedFile(null);
      setError('');
    }
  }, [categories, item, show]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const price = Number(form.price);

    if (!form.name.trim()) {
      setError('Item name is required.');
      return;
    }
    if (!form.category.trim()) {
      setError('Category is required.');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setError('Price must be greater than 0.');
      return;
    }

    try {
      await onSubmit({
        id: item?.id,
        name: form.name.trim(),
        category: form.category.trim(),
        price,
        description: form.description.trim(),
        imageUrl: form.imageUrl,
        isAvailable: form.isAvailable,
        file: selectedFile
      });
      setError('');
    } catch (submitError) {
      setError(submitError.message || 'Unable to save menu item.');
    }
  }

  if (!show) {
    return null;
  }

  return (
    <div className="modal d-block menu-modal" role="dialog" aria-modal="true" aria-labelledby="addItemTitle">
      <div className="modal-dialog modal-dialog-centered">
        <form className="modal-content" onSubmit={handleSubmit}>
          <div className="modal-header">
            <h2 className="modal-title h5" id="addItemTitle">
              {item ? 'Edit item' : 'Add item'}
            </h2>
            <button aria-label="Close" className="btn-close" onClick={onClose} type="button" />
          </div>
          <div className="modal-body">
            {error ? <div className="alert alert-danger py-2">{error}</div> : null}
            <div className="mb-3">
              <label className="form-label" htmlFor="itemName">
                Item name
              </label>
              <input
                className="form-control"
                id="itemName"
                onChange={(event) => updateField('name', event.target.value)}
                value={form.name}
              />
            </div>
            <div className="row g-3">
              <div className="col-12 col-md-7">
                <label className="form-label" htmlFor="itemCategory">
                  Category
                </label>
                <input
                  className="form-control"
                  id="itemCategory"
                  list="menuCategorySuggestions"
                  onChange={(event) => updateField('category', event.target.value)}
                  value={form.category}
                />
                <datalist id="menuCategorySuggestions">
                  {categories.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              </div>
              <div className="col-12 col-md-5">
                <label className="form-label" htmlFor="itemPrice">
                  Base price
                </label>
                <input
                  className="form-control"
                  id="itemPrice"
                  min="0"
                  onChange={(event) => updateField('price', event.target.value)}
                  step="0.01"
                  type="number"
                  value={form.price}
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="form-label" htmlFor="itemDescription">
                Description
              </label>
              <textarea
                className="form-control"
                id="itemDescription"
                onChange={(event) => updateField('description', event.target.value)}
                rows="3"
                value={form.description}
              />
            </div>
            <div className="mt-3">
              <label className="form-label" htmlFor="itemImage">
                Image
              </label>
              <input
                className="form-control"
                id="itemImage"
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                type="file"
                accept="image/*"
              />
              <div className="form-text">Upload an image before saving to attach a live image path.</div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline-secondary" onClick={onClose} type="button">
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : item ? 'Update item' : 'Add item'}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop show" />
    </div>
  );
}

export default AddItemModal;
