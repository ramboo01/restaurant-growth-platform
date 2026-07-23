import { Link } from 'react-router-dom';
import EmptyState from '../../components/feedback/EmptyState.jsx';

function NotFoundPage() {
  return (
    <div className="container py-5">
      <EmptyState
        icon="bi-signpost-split"
        title="Page not found"
        message="This route is not part of the current frontend foundation."
      />
      <div className="text-center mt-3">
        <Link className="btn btn-primary" to="/">
          Return home
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
