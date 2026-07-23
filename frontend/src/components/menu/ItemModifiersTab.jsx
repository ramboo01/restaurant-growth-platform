import { useState } from 'react';

function ItemModifiersTab({ item }) {
  const [groups, setGroups] = useState(item.modifierGroups);
  const [validationMessage, setValidationMessage] = useState('');
  const [feedback, setFeedback] = useState('');

  function updateGroup(groupId, field, value) {
    setGroups((currentGroups) =>
      currentGroups.map((group) => {
        if (group.id !== groupId) {
          return group;
        }

        const nextGroup = { ...group, [field]: value };
        if (Number(nextGroup.maxSelections) < Number(nextGroup.minSelections)) {
          setValidationMessage('Maximum selections cannot be lower than minimum selections.');
          return group;
        }

        setValidationMessage('');
        return nextGroup;
      })
    );
  }

  function addOption(groupId) {
    setGroups((currentGroups) =>
      currentGroups.map((group) => {
        if (group.id !== groupId) {
          return group;
        }

        return {
          ...group,
          options: [
            ...group.options,
            {
              id: `option-${Date.now()}`,
              name: 'New option',
              priceAdjustment: 0
            }
          ]
        };
      })
    );
    setFeedback('Option added locally for this session.');
  }

  if (!groups.length) {
    return (
      <div className="card border-0 owner-card">
        <div className="card-body">
          <h2 className="h5">Modifiers</h2>
          <p className="text-secondary mb-0">This item does not currently use modifier groups.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="vstack gap-3">
      {validationMessage ? <div className="alert alert-danger py-2 mb-0">{validationMessage}</div> : null}
      {feedback ? <div className="alert alert-success py-2 mb-0">{feedback}</div> : null}

      {groups.map((group) => (
        <article className="card border-0 owner-card" key={group.id}>
          <div className="card-body">
            <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-3">
              <div>
                <h2 className="h5 mb-1">{group.name}</h2>
                <span className={`badge ${group.required ? 'text-bg-primary' : 'text-bg-light border'}`}>
                  {group.required ? 'Required' : 'Optional'}
                </span>
              </div>
              <button className="btn btn-outline-secondary btn-sm align-self-start" type="button">
                <i className="bi bi-pencil-square me-2" aria-hidden="true" />
                Edit group
              </button>
            </div>

            <div className="row g-3 mb-3">
              <div className="col-6 col-md-3">
                <label className="form-label" htmlFor={`${group.id}-min`}>
                  Minimum selections
                </label>
                <input
                  className="form-control"
                  id={`${group.id}-min`}
                  min="0"
                  onChange={(event) => updateGroup(group.id, 'minSelections', Number(event.target.value))}
                  type="number"
                  value={group.minSelections}
                />
              </div>
              <div className="col-6 col-md-3">
                <label className="form-label" htmlFor={`${group.id}-max`}>
                  Maximum selections
                </label>
                <input
                  className="form-control"
                  id={`${group.id}-max`}
                  min="0"
                  onChange={(event) => updateGroup(group.id, 'maxSelections', Number(event.target.value))}
                  type="number"
                  value={group.maxSelections}
                />
              </div>
            </div>

            <div className="table-responsive">
              <table className="table align-middle mb-3">
                <thead>
                  <tr>
                    <th scope="col">Option</th>
                    <th className="text-end" scope="col">Price adjustment</th>
                  </tr>
                </thead>
                <tbody>
                  {group.options.map((option) => (
                    <tr key={option.id}>
                      <td>{option.name}</td>
                      <td className="text-end">${option.priceAdjustment.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button className="btn btn-outline-primary btn-sm" onClick={() => addOption(group.id)} type="button">
              <i className="bi bi-plus-lg me-2" aria-hidden="true" />
              Add option
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

export default ItemModifiersTab;
