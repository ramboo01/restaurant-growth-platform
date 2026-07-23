import { useContext, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import { AuthContext } from '../../context/AuthContext.jsx';

function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useContext(AuthContext);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Owner',
    restaurantId: ''
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await register({
        ...form,
        restaurantId: Number(form.restaurantId)
      });
      navigate('/login', { replace: true, state: { from: location } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container py-5">
      <PageHeader
        eyebrow="Authentication"
        title="Register"
        description="Create your owner account to continue."
      />
      <form className="row g-3 mt-2" onSubmit={handleSubmit}>
        <div className="col-12 col-md-6">
          <label className="form-label" htmlFor="name">Name</label>
          <input className="form-control" id="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </div>
        <div className="col-12 col-md-6">
          <label className="form-label" htmlFor="email">Email</label>
          <input className="form-control" id="email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        </div>
        <div className="col-12 col-md-6">
          <label className="form-label" htmlFor="password">Password</label>
          <input className="form-control" id="password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        </div>
        <div className="col-12 col-md-3">
          <label className="form-label" htmlFor="role">Role</label>
          <select className="form-select" id="role" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
            <option>Owner</option>
            <option>Admin</option>
            <option>Manager</option>
            <option>Staff</option>
            <option>Driver</option>
          </select>
        </div>
        <div className="col-12 col-md-3">
          <label className="form-label" htmlFor="restaurantId">Restaurant ID</label>
          <input className="form-control" id="restaurantId" type="number" value={form.restaurantId} onChange={(event) => setForm({ ...form, restaurantId: event.target.value })} />
        </div>
        {error ? <div className="col-12"><div className="alert alert-danger mb-0">{error}</div></div> : null}
        <div className="col-12 d-flex align-items-center gap-3">
          <button className="btn btn-primary" disabled={submitting} type="submit">
            {submitting ? 'Creating...' : 'Register'}
          </button>
          <Link className="btn btn-link px-0" to="/login">
            Back to login
          </Link>
        </div>
      </form>
    </div>
  );
}

export default RegisterPage;
