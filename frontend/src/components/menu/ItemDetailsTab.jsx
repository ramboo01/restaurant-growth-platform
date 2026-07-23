import { useEffect, useState } from 'react';

function ItemDetailsTab({ categories, item, onSave }) {
  const [form, setForm] = useState({
    name: item.name,
    description: item.description,
    category: item.category ?? item.categoryId,
    allergenTags: item.allergenTags.join(', '),
    is86d: item.is86d
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm({
      name: item.name,
      description: item.description,
      category: item.category ?? item.categoryId,
      allergenTags: (item.allergenTags ?? []).join(', '),
      is86d: item.is86d
    });
  }, [item]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setSaved(false);
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (onSave) {
      onSave(form);
    }
    setSaved(true);
  }

  return (
    <form className="card border-0 owner-card" onSubmit={handleSubmit}>
      <div className="card-body">
        {saved ? <div className="alert alert-success py-2">Local changes saved for this session.</div> : null}
        <div className="row g-3">
          <div className="col-12 col-lg-6">
            <label className="form-label" htmlFor="editorItemName">
              Item name
            </label>
            <input
              className="form-control"
              id="editorItemName"
              onChange={(event) => updateField('name', event.target.value)}
              value={form.name}
            />
          </div>
          <div className="col-12 col-lg-6">
            <label className="form-label" htmlFor="editorCategory">
              Category
            </label>
            <select
              className="form-select"
              id="editorCategory"
              onChange={(event) => updateField('category', event.target.value)}
              value={form.category}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className="col-12">
            <label className="form-label" htmlFor="editorDescription">
              Description
            </label>
            <textarea
              className="form-control"
              id="editorDescription"
              onChange={(event) => updateField('description', event.target.value)}
              rows="4"
              value={form.description}
            />
          </div>
          <div className="col-12 col-lg-8">
            <label className="form-label" htmlFor="editorAllergens">
              Allergen tags
            </label>
            <input
              className="form-control"
              id="editorAllergens"
              onChange={(event) => updateField('allergenTags', event.target.value)}
              value={form.allergenTags}
            />
            <div className="form-text">Use comma-separated tags for this frontend-only editor.</div>
          </div>
          <div className="col-12 col-lg-4">
            <label className="form-label">Availability display</label>
            <div>
              <span className={`badge ${form.is86d ? 'text-bg-danger' : 'text-bg-success'}`}>
                {form.is86d ? "86'd" : 'Available'}
              </span>
              <p className="text-secondary small mb-0 mt-2">Fast availability toggles belong to the 86 Board.</p>
            </div>
          </div>
        </div>
      </div>
      <div className="card-footer bg-white border-0 pt-0">
        <button className="btn btn-primary" type="submit">
          Save changes
        </button>
      </div>
    </form>
  );
}

export default ItemDetailsTab;
