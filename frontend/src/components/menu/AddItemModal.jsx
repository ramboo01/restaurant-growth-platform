import { useEffect, useState } from 'react';

function AddItemModal({ categories = [], item, show, onClose, onSubmit, submitting }) {
  const [form, setForm] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    imageUrl: '',
    isAvailable: true
  });
  const [selectedCategoryOption, setSelectedCategoryOption] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (show) {
      const initialName = item?.name ?? '';
      const initialCategory = item?.category ?? (categories.length > 0 ? categories[0] : '');
      const initialPrice = item?.price ?? item?.basePrice ?? '';
      const initialDesc = item?.description ?? '';
      const initialImage = item?.imageUrl ?? item?.image_url ?? '';
      const initialAvail = item?.isAvailable ?? true;

      setForm({
        name: initialName,
        category: initialCategory,
        price: initialPrice,
        description: initialDesc,
        imageUrl: initialImage,
        isAvailable: initialAvail
      });

      if (initialCategory && categories.includes(initialCategory)) {
        setSelectedCategoryOption(initialCategory);
        setCustomCategory('');
      } else if (initialCategory) {
        setSelectedCategoryOption('__NEW__');
        setCustomCategory(initialCategory);
      } else if (categories.length > 0) {
        setSelectedCategoryOption(categories[0]);
        setCustomCategory('');
        setForm((prev) => ({ ...prev, category: categories[0] }));
      } else {
        setSelectedCategoryOption('__NEW__');
        setCustomCategory('');
      }

      setSelectedFile(null);
      setPreviewUrl('');
      setError('');
    }
  }, [categories, item, show]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleCategorySelect(event) {
    const value = event.target.value;
    setSelectedCategoryOption(value);
    if (value === '__NEW__') {
      updateField('category', customCategory);
    } else {
      updateField('category', value);
    }
  }

  function handleCustomCategoryChange(event) {
    const val = event.target.value;
    setCustomCategory(val);
    updateField('category', val);
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl('');
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const price = Number(form.price);

    if (!form.name.trim()) {
      setError('Item name is required.');
      return;
    }
    if (!form.category.trim()) {
      setError('Category is required. Select an existing category or create a new one.');
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

  const displayPreview = previewUrl || form.imageUrl;

  return (
    <div className="modal d-block menu-modal" role="dialog" aria-modal="true" aria-labelledby="addItemTitle">
      <div className="modal-dialog modal-dialog-centered">
        <form className="modal-content" onSubmit={handleSubmit}>
          <div className="modal-header">
            <h2 className="modal-title h5" id="addItemTitle">
              {item ? 'Edit Item' : 'Add New Item'}
            </h2>
            <button aria-label="Close" className="btn-close" onClick={onClose} type="button" />
          </div>
          <div className="modal-body">
            {error ? <div className="alert alert-danger py-2 mb-3">{error}</div> : null}
            
            <div className="mb-3">
              <label className="form-label fw-semibold" htmlFor="itemName">
                Item Name
              </label>
              <input
                className="form-control"
                id="itemName"
                onChange={(event) => updateField('name', event.target.value)}
                placeholder="e.g. Cheese Burger, Mango Lassi"
                value={form.name}
              />
            </div>

            <div className="row g-3 mb-3">
              <div className="col-12 col-md-7">
                <label className="form-label fw-semibold" htmlFor="itemCategory">
                  Category
                </label>
                <select
                  className="form-select mb-2"
                  id="itemCategory"
                  onChange={handleCategorySelect}
                  value={selectedCategoryOption}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="__NEW__">➕ Create New Category...</option>
                </select>

                {selectedCategoryOption === '__NEW__' ? (
                  <input
                    className="form-control mt-2"
                    onChange={handleCustomCategoryChange}
                    placeholder="Enter new category name (e.g. Desserts)"
                    value={customCategory}
                  />
                ) : null}
              </div>

              <div className="col-12 col-md-5">
                <label className="form-label fw-semibold" htmlFor="itemPrice">
                  Base Price ($)
                </label>
                <input
                  className="form-control"
                  id="itemPrice"
                  min="0"
                  onChange={(event) => updateField('price', event.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  type="number"
                  value={form.price}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold" htmlFor="itemDescription">
                Description
              </label>
              <textarea
                className="form-control"
                id="itemDescription"
                onChange={(event) => updateField('description', event.target.value)}
                rows="3"
                placeholder="Brief details or ingredients..."
                value={form.description}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold" htmlFor="itemImage">
                Item Image
              </label>
              <input
                className="form-control"
                id="itemImage"
                onChange={handleFileChange}
                type="file"
                accept="image/*"
              />
              {displayPreview ? (
                <div className="mt-2">
                  <img
                    src={previewUrl || (displayPreview.startsWith('http') ? displayPreview : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/${displayPreview.replace(/^\//, '')}`)}
                    alt="Preview"
                    style={{ maxHeight: 120, maxWidth: '100%', borderRadius: 8, objectFit: 'cover', border: '1px solid #dee2e6' }}
                  />
                </div>
              ) : (
                <div className="form-text text-secondary small">Upload an image file to display on customer menus.</div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn btn-outline-secondary" onClick={onClose} type="button">
              Cancel
            </button>
            <button className="btn btn-primary px-4" type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : item ? 'Update Item' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop show" />
    </div>
  );
}

export default AddItemModal;
