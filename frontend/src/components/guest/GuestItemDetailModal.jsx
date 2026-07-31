import { useEffect, useMemo, useState } from 'react';
import { getImageUrl } from '../../utils/imageUtils.js';

function formatCurrency(value) {
  return `$${value.toFixed(2)}`;
}

function buildInitialSelections(item) {
  return (item?.modifierGroups ?? []).reduce((groups, group) => {
    groups[group.id] = [];
    return groups;
  }, {});
}

function GuestItemDetailModal({ item, onAddToCart, onClose }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setQuantity(1);
    setSelectedModifiers(buildInitialSelections(item));
    setErrors({});
  }, [item]);

  const selectedOptions = useMemo(() => {
    return (item?.modifierGroups ?? []).flatMap((group) => selectedModifiers[group.id] ?? []);
  }, [item, selectedModifiers]);

  const modifierTotal = selectedOptions.reduce((total, option) => total + option.priceAdjustment, 0);
  const unitPrice = (item?.basePrice ?? 0) + modifierTotal;
  const total = unitPrice * quantity;

  if (!item) {
    return null;
  }

  function selectOption(group, option) {
    setErrors((current) => ({ ...current, [group.id]: '' }));
    setSelectedModifiers((current) => {
      const currentSelections = current[group.id] ?? [];
      const isSelected = currentSelections.some((entry) => entry.id === option.id);

      if (group.maxSelections === 1) {
        return {
          ...current,
          [group.id]: isSelected ? [] : [option]
        };
      }

      if (isSelected) {
        return {
          ...current,
          [group.id]: currentSelections.filter((entry) => entry.id !== option.id)
        };
      }

      if (currentSelections.length >= group.maxSelections) {
        return current;
      }

      return {
        ...current,
        [group.id]: [...currentSelections, option]
      };
    });
  }

  function validateSelections() {
    const nextErrors = {};

    item.modifierGroups.forEach((group) => {
      const selectedCount = selectedModifiers[group.id]?.length ?? 0;

      if (selectedCount < group.minSelections) {
        nextErrors[group.id] = `Choose at least ${group.minSelections}.`;
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleAddToCart() {
    if (!validateSelections()) {
      return;
    }

    const configuredItem = {
      itemId: item.id,
      itemName: item.name,
      basePrice: item.basePrice,
      selectedModifiers: item.modifierGroups.map((group) => ({
        groupId: group.id,
        groupName: group.name,
        options: selectedModifiers[group.id] ?? []
      })),
      quantity,
      unitPrice,
      total
    };

    onAddToCart?.(configuredItem);
  }

  return (
    <div className="modal fade show guest-item-modal" role="dialog" aria-modal="true" aria-labelledby="guestItemModalTitle">
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <div>
              <p className="text-secondary small mb-1">Customize item</p>
              <h2 className="modal-title h5" id="guestItemModalTitle">
                {item.name}
              </h2>
            </div>
            <button className="btn-close" onClick={onClose} type="button" aria-label="Close" />
          </div>

          <div className="modal-body">
            <div className="d-flex gap-3 mb-3">
              <div className="guest-item-visual guest-item-visual-lg overflow-hidden p-0" aria-hidden="true">
                {getImageUrl(item.imageUrl) ? (
                  <img src={getImageUrl(item.imageUrl)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  item.imagePlaceholder
                )}
              </div>
              <div>
                <p className="mb-2">{item.description}</p>
                <p className="fw-semibold mb-0">{formatCurrency(item.basePrice)}</p>
              </div>
            </div>

            <div className="d-flex flex-wrap gap-2 mb-4">
              {item.allergenTags.length ? (
                item.allergenTags.map((tag) => (
                  <span className="badge text-bg-light border" key={tag}>
                    {tag}
                  </span>
                ))
              ) : (
                <span className="badge text-bg-light border">No listed allergens</span>
              )}
            </div>

            <div className="vstack gap-4">
              {item.modifierGroups.length ? (
                item.modifierGroups.map((group) => {
                  const currentSelections = selectedModifiers[group.id] ?? [];
                  const isSingleSelect = group.maxSelections === 1;
                  const limitReached = !isSingleSelect && currentSelections.length >= group.maxSelections;

                  return (
                    <section key={group.id} aria-labelledby={`${group.id}-heading`}>
                      <div className="d-flex justify-content-between gap-3 mb-2">
                        <div>
                          <h3 className="h6 mb-1" id={`${group.id}-heading`}>
                            {group.name}
                          </h3>
                          <p className="text-secondary small mb-0">
                            {group.required ? 'Required' : 'Optional'} · Choose{' '}
                            {group.minSelections === group.maxSelections
                              ? group.maxSelections
                              : `${group.minSelections}-${group.maxSelections}`}
                          </p>
                        </div>
                        {errors[group.id] ? <span className="text-danger small">{errors[group.id]}</span> : null}
                      </div>

                      <div className="vstack gap-2">
                        {group.options.map((option) => {
                          const inputId = `${group.id}-${option.id}`;
                          const isSelected = currentSelections.some((entry) => entry.id === option.id);
                          const isDisabled = !isSelected && limitReached;

                          return (
                            <label className="guest-modifier-option" htmlFor={inputId} key={option.id}>
                              <div className="d-flex align-items-center gap-2">
                                <input
                                  checked={isSelected}
                                  className="form-check-input mt-0"
                                  disabled={isDisabled}
                                  id={inputId}
                                  name={group.id}
                                  onChange={() => selectOption(group, option)}
                                  type={isSingleSelect ? 'radio' : 'checkbox'}
                                />
                                <span>{option.name}</span>
                              </div>
                              <span className="text-secondary small">
                                {option.priceAdjustment > 0 ? `+${formatCurrency(option.priceAdjustment)}` : 'Included'}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </section>
                  );
                })
              ) : (
                <p className="text-secondary mb-0">No customizations available for this item.</p>
              )}
            </div>
          </div>

          <div className="modal-footer guest-item-modal-footer">
            <div className="w-100">
              <div className="d-flex align-items-center justify-content-between gap-3">
                <div className="btn-group" aria-label="Quantity">
                  <button
                    className="btn btn-outline-secondary"
                    disabled={quantity === 1}
                    onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                    type="button"
                  >
                    <i className="bi bi-dash-lg" aria-hidden="true" />
                  </button>
                  <span className="btn btn-outline-secondary disabled guest-quantity-display">{quantity}</span>
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => setQuantity((current) => current + 1)}
                    type="button"
                  >
                    <i className="bi bi-plus-lg" aria-hidden="true" />
                  </button>
                </div>
                <button className="btn btn-primary flex-grow-1" onClick={handleAddToCart} type="button">
                  Add to cart — {formatCurrency(total)}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <button className="modal-backdrop fade show guest-modal-backdrop" onClick={onClose} type="button" aria-label="Close item details" />
    </div>
  );
}

export default GuestItemDetailModal;
