import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { inventoryService } from '../../services/inventoryService.js';

function getStatus(item) {
  if (item.currentStock <= 0) {
    return 'Out of Stock';
  }
  if (item.currentStock <= item.minimumStock) {
    return 'Low Stock';
  }
  return 'In Stock';
}

function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formValues, setFormValues] = useState({
    name: '',
    category: '',
    currentStock: '',
    unit: '',
    minimumStock: ''
  });

  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await inventoryService.getInventory();
      setInventory(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch inventory.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const summary = useMemo(() => {
    const categories = new Set(inventory.map((item) => item.category));
    return {
      totalItems: inventory.length,
      lowStock: inventory.filter((item) => getStatus(item) === 'Low Stock').length,
      outOfStock: inventory.filter((item) => getStatus(item) === 'Out of Stock').length,
      categories: categories.size
    };
  }, [inventory]);

  const filteredInventory = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return inventory.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.category.toLowerCase().includes(normalizedSearch);
      const itemStatus = getStatus(item);
      const matchesFilter = statusFilter === 'All' || itemStatus === statusFilter;
      return matchesSearch && matchesFilter;
    });
  }, [inventory, searchTerm, statusFilter]);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
  }

  const handleSaveInventoryItem = async () => {
    try {
      const payload = {
        name: formValues.name,
        category: formValues.category,
        currentStock: Number(formValues.currentStock),
        unit: formValues.unit,
        minimumStock: Number(formValues.minimumStock)
      };

      if (editingId) {
        await inventoryService.updateInventoryItem(editingId, payload);
      } else {
        await inventoryService.createInventoryItem(payload);
      }

      await fetchInventory();
      setShowModal(false);
      setEditingId(null);
      setFormValues({
        name: '',
        category: '',
        currentStock: '',
        unit: '',
        minimumStock: ''
      });
    } catch (err) {
      alert('Failed to save inventory item');
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id || item.id);
    setFormValues({
      name: item.name,
      category: item.category,
      currentStock: item.currentStock,
      unit: item.unit,
      minimumStock: item.minimumStock
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await inventoryService.deleteInventoryItem(id);
        await fetchInventory();
      } catch (err) {
        alert('Failed to delete item');
      }
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormValues({
      name: '',
      category: '',
      currentStock: '',
      unit: '',
      minimumStock: ''
    });
    setShowModal(true);
  };

  return (
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div>
          <p className="text-uppercase text-secondary small fw-semibold mb-2">Inventory Management</p>
          <h1 className="h3 mb-1">Inventory</h1>
          <p className="text-secondary mb-0">Track ingredient stock levels.</p>
        </div>
        <Link className="btn btn-outline-secondary btn-sm" to="/owner">
          Back to Owner Home
        </Link>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6 col-xl-3">
          <div className="card border-0 guest-info-card h-100">
            <div className="card-body">
              <p className="text-secondary small mb-1">Total Items</p>
              <h2 className="h4 mb-0">{summary.totalItems}</h2>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <div className="card border-0 guest-info-card h-100">
            <div className="card-body">
              <p className="text-secondary small mb-1">Low Stock</p>
              <h2 className="h4 mb-0">{summary.lowStock}</h2>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <div className="card border-0 guest-info-card h-100">
            <div className="card-body">
              <p className="text-secondary small mb-1">Out Of Stock</p>
              <h2 className="h4 mb-0">{summary.outOfStock}</h2>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <div className="card border-0 guest-info-card h-100">
            <div className="card-body">
              <p className="text-secondary small mb-1">Categories</p>
              <h2 className="h4 mb-0">{summary.categories}</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-6">
          <label className="form-label" htmlFor="inventorySearch">
            Search inventory
          </label>
          <input
            className="form-control"
            id="inventorySearch"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by ingredient or category..."
            value={searchTerm}
          />
        </div>
        <div className="col-12 col-lg-4">
          <label className="form-label" htmlFor="inventoryFilter">
            Filter
          </label>
          <select
            className="form-select"
            id="inventoryFilter"
            onChange={(event) => setStatusFilter(event.target.value)}
            value={statusFilter}
          >
            <option>All</option>
            <option>Low Stock</option>
            <option>Out of Stock</option>
          </select>
        </div>
        <div className="col-12 col-lg-2 d-flex align-items-end">
          <button className="btn btn-primary w-100" onClick={openAddModal} type="button">
            Add Item
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : filteredInventory.length ? (
        <div className="row g-3">
          {filteredInventory.map((item) => {
            const status = getStatus(item);
            return (
              <div className="col-12 col-md-6 col-xxl-4" key={item._id || item.id}>
                <article className="card border-0 guest-cart-item h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between gap-3 mb-3">
                      <div>
                        <h2 className="h6 mb-1">{item.name}</h2>
                        <p className="text-secondary small mb-0">{item.category}</p>
                      </div>
                      <span
                        className={`badge ${
                          status === 'In Stock'
                            ? 'text-bg-success'
                            : status === 'Low Stock'
                              ? 'text-bg-warning'
                              : 'text-bg-danger'
                        }`}
                      >
                        {status}
                      </span>
                    </div>

                    <div className="vstack gap-2">
                      <div className="d-flex justify-content-between gap-3">
                        <span className="text-secondary">Current Stock</span>
                        <span>{item.currentStock}</span>
                      </div>
                      <div className="d-flex justify-content-between gap-3">
                        <span className="text-secondary">Unit</span>
                        <span>{item.unit}</span>
                      </div>
                      <div className="d-flex justify-content-between gap-3">
                        <span className="text-secondary">Minimum Stock</span>
                        <span>{item.minimumStock}</span>
                      </div>
                    </div>

                    <div className="d-flex gap-2 mt-3 pt-3 border-top">
                      <button className="btn btn-sm btn-outline-primary flex-grow-1" onClick={() => handleEdit(item)}>Edit</button>
                      <button className="btn btn-sm btn-outline-danger flex-grow-1" onClick={() => handleDelete(item._id || item.id)}>Delete</button>
                    </div>
                  </div>
                </article>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="alert alert-light border mb-0">No inventory found.</div>
      )}

      {showModal ? (
        <>
          <div className="modal fade show d-block" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h2 className="modal-title h5 mb-0">{editingId ? 'Edit Inventory Item' : 'Add Inventory Item'}</h2>
                  <button className="btn-close" onClick={() => setShowModal(false)} type="button" />
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label" htmlFor="inventoryName">
                      Ingredient Name
                    </label>
                    <input className="form-control" id="inventoryName" name="name" onChange={handleChange} value={formValues.name} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="inventoryCategory">
                      Category
                    </label>
                    <input
                      className="form-control"
                      id="inventoryCategory"
                      name="category"
                      onChange={handleChange}
                      value={formValues.category}
                    />
                  </div>
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="inventoryStock">
                        Current Stock
                      </label>
                      <input
                        className="form-control"
                        id="inventoryStock"
                        name="currentStock"
                        onChange={handleChange}
                        type="number"
                        value={formValues.currentStock}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="inventoryUnit">
                        Unit
                      </label>
                      <input className="form-control" id="inventoryUnit" name="unit" onChange={handleChange} value={formValues.unit} />
                    </div>
                    <div className="col-12">
                      <label className="form-label" htmlFor="inventoryMinimum">
                        Minimum Stock
                      </label>
                      <input
                        className="form-control"
                        id="inventoryMinimum"
                        name="minimumStock"
                        onChange={handleChange}
                        type="number"
                        value={formValues.minimumStock}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-outline-secondary" onClick={() => setShowModal(false)} type="button">
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    disabled={
                      !formValues.name || !formValues.category || !formValues.currentStock || !formValues.unit || !formValues.minimumStock
                    }
                    onClick={handleSaveInventoryItem}
                    type="button"
                  >
                    {editingId ? 'Save Changes' : 'Add Item'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      ) : null}
    </div>
  );
}

export default InventoryPage;
