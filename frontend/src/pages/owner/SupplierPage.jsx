import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supplierService } from '../../services/supplierService.js';

function SupplierPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formValues, setFormValues] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    category: '',
    delivery_days: 'Monday, Thursday',
    status: 'Active'
  });

  const fetchSuppliers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await supplierService.getSuppliers();
      setSuppliers(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch suppliers.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const summary = useMemo(() => {
    const categories = new Set(suppliers.map((supplier) => supplier.category));
    return {
      totalSuppliers: suppliers.length,
      active: suppliers.filter((supplier) => supplier.status === 'Active').length,
      inactive: suppliers.filter((supplier) => supplier.status === 'Inactive').length,
      categories: categories.size
    };
  }, [suppliers]);

  const filteredSuppliers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return suppliers.filter((supplier) => {
      return (
        supplier.name.toLowerCase().includes(normalizedSearch) ||
        supplier.contact_person.toLowerCase().includes(normalizedSearch) ||
        supplier.phone.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [suppliers, searchTerm]);

  function handleChange(event) {
    const { name, value } = event.target;
    let finalVal = value;
    if (name === 'phone') {
      finalVal = value.replace(/\D/g, '').slice(0, 10);
    }
    setFormValues((current) => ({
      ...current,
      [name]: finalVal
    }));
  }

  async function handleAddSupplier() {
    try {
      await supplierService.createSupplier(formValues);
      await fetchSuppliers();
      setShowModal(false);
      setFormValues({
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        category: '',
        delivery_days: 'Monday, Thursday',
        status: 'Active'
      });
    } catch (err) {
      console.error(err);
      alert('Failed to add supplier');
    }
  }

  return (
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div>
          <p className="text-uppercase text-secondary small fw-semibold mb-2">Supplier Management</p>
          <h1 className="h3 mb-1">Suppliers</h1>
          <p className="text-secondary mb-0">Track supply partners and contacts.</p>
        </div>
        <Link className="btn btn-outline-secondary btn-sm" to="/owner">
          Back to Owner Home
        </Link>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6 col-xl-3">
          <div className="card border-0 guest-info-card h-100">
            <div className="card-body">
              <p className="text-secondary small mb-1">Total Suppliers</p>
              <h2 className="h4 mb-0">{summary.totalSuppliers}</h2>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <div className="card border-0 guest-info-card h-100">
            <div className="card-body">
              <p className="text-secondary small mb-1">Active</p>
              <h2 className="h4 mb-0">{summary.active}</h2>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <div className="card border-0 guest-info-card h-100">
            <div className="card-body">
              <p className="text-secondary small mb-1">Inactive</p>
              <h2 className="h4 mb-0">{summary.inactive}</h2>
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
        <div className="col-12 col-lg-9">
          <label className="form-label" htmlFor="supplierSearch">
            Search supplier
          </label>
          <input
            className="form-control"
            id="supplierSearch"
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by supplier name, contact person, or phone..."
            value={searchTerm}
          />
        </div>
        <div className="col-12 col-lg-3 d-flex align-items-end">
          <button className="btn btn-primary w-100" onClick={() => setShowModal(true)} type="button">
            Add Supplier
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center p-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : filteredSuppliers.length ? (
        <div className="row g-3">
          {filteredSuppliers.map((supplier) => (
            <div className="col-12 col-md-6 col-xxl-4" key={supplier.id}>
              <article className="card border-0 guest-cart-item h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between gap-3 mb-3">
                    <div>
                      <h2 className="h6 mb-1">{supplier.name}</h2>
                      <p className="text-secondary small mb-0">{supplier.category}</p>
                    </div>
                    <span className={`badge ${supplier.status === 'Active' ? 'text-bg-success' : 'text-bg-secondary'}`}>
                      {supplier.status}
                    </span>
                  </div>

                  <div className="vstack gap-2">
                    <div className="d-flex justify-content-between gap-3">
                      <span className="text-secondary">Contact Person</span>
                      <span className="text-end">{supplier.contact_person}</span>
                    </div>
                    <div className="d-flex justify-content-between gap-3">
                      <span className="text-secondary">Phone</span>
                      <span>{supplier.phone}</span>
                    </div>
                    <div className="d-flex justify-content-between gap-3">
                      <span className="text-secondary">Email</span>
                      <span className="text-end">{supplier.email}</span>
                    </div>
                    <div className="d-flex justify-content-between gap-3">
                      <span className="text-secondary">Delivery Days</span>
                      <span>{supplier.delivery_days}</span>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          ))}
        </div>
      ) : (
        <div className="alert alert-light border mb-0">No suppliers found.</div>
      )}

      {showModal ? (
        <>
          <div className="modal fade show d-block" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h2 className="modal-title h5 mb-0">Add Supplier</h2>
                  <button className="btn-close" onClick={() => setShowModal(false)} type="button" />
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label" htmlFor="supplierName">
                      Name
                    </label>
                    <input className="form-control" id="supplierName" name="name" onChange={handleChange} value={formValues.name} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="supplierContact">
                      Contact Person
                    </label>
                    <input
                      className="form-control"
                      id="supplierContact"
                      name="contact_person"
                      onChange={handleChange}
                      value={formValues.contact_person}
                    />
                  </div>
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="supplierPhone">
                        Phone Number (Digits only)
                      </label>
                      <input
                        type="tel"
                        className="form-control"
                        id="supplierPhone"
                        name="phone"
                        maxLength={10}
                        placeholder="e.g. 9876543210"
                        onChange={handleChange}
                        value={formValues.phone}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="supplierEmail">
                        Email
                      </label>
                      <input className="form-control" id="supplierEmail" name="email" onChange={handleChange} value={formValues.email} />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="supplierCategory">
                        Category
                      </label>
                      <input
                        className="form-control"
                        id="supplierCategory"
                        name="category"
                        onChange={handleChange}
                        value={formValues.category}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label" htmlFor="supplierStatus">
                        Status
                      </label>
                      <select className="form-select" id="supplierStatus" name="status" onChange={handleChange} value={formValues.status}>
                        <option>Active</option>
                        <option>Inactive</option>
                      </select>
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
                      !formValues.name ||
                      !formValues.contact_person ||
                      !formValues.phone ||
                      !formValues.email ||
                      !formValues.category
                    }
                    onClick={handleAddSupplier}
                    type="button"
                  >
                    Add Supplier
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

export default SupplierPage;
