import { useContext, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import { AuthContext } from '../../context/AuthContext.jsx';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useContext(AuthContext);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(form);
      const destination = location.state?.from?.pathname || '/owner';
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container py-5">
      <PageHeader
        eyebrow="Authentication"
        title="Login"
        description="Sign in to continue."
      />
      <form className="row g-3 mt-2" onSubmit={handleSubmit}>
        <div className="col-12 col-md-6">
          <label className="form-label" htmlFor="email">Email</label>
          <input className="form-control" id="email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        </div>
        <div className="col-12 col-md-6">
          <label className="form-label" htmlFor="password">Password</label>
          <input className="form-control" id="password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        </div>
        {error ? <div className="col-12"><div className="alert alert-danger mb-0">{error}</div></div> : null}
        <div className="col-12 d-flex align-items-center gap-3">
          <button className="btn btn-primary" disabled={submitting} type="submit">
            {submitting ? 'Signing in...' : 'Login'}
          </button>
          <Link className="btn btn-link px-0" to="/register">
            Create account
          </Link>
        </div>
      </form>
    </div>
  );
}

export default LoginPage;
