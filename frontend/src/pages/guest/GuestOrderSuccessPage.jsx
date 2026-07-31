import { useContext, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import api from '../../services/api.js';
import { AuthContext } from '../../context/AuthContext.jsx';

function GuestOrderSuccessPage() {
  const location = useLocation();
  const order = location.state?.order;
  const estimatedTime = location.state?.estimatedTime;
  const { user } = useContext(AuthContext);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState(null);

  if (!order) {
    return <Navigate replace to="/" />;
  }

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a star rating.');
      return;
    }
    if (!comment.trim()) {
      setError('Please tell us a bit about your experience.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await api.post('/api/public/reviews', {
        restaurantId: order.restaurantId || 1,
        customerName: order.customerName || user?.name || 'Valued Guest',
        rating,
        content: comment,
        userId: user?.id || null  // Link review to registered user for reply notifications
      });
      setIsSubmitted(true);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="card border-0 guest-info-card mx-auto shadow-sm" style={{ maxWidth: '720px' }}>
        <div className="card-body p-4 p-lg-5 text-center">
          <div className="display-4 text-success mb-3">
            <i className="bi bi-check-circle-fill"></i>
          </div>
          <p className="text-uppercase text-secondary small fw-bold tracking-wider mb-2">Order Received</p>
          <h1 className="h3 mb-3 fw-bold text-dark">Thanks, your order is confirmed!</h1>
          <p className="text-secondary mb-4">
            Order Number: <span className="badge bg-light text-dark border border-secondary border-opacity-25 px-2.5 py-1.5 fs-6 font-monospace">{order.orderNumber}</span>
          </p>

          <div className="row g-3 text-start mb-4">
            <div className="col-12 col-md-6">
              <div className="card border-0 guest-cart-item h-100 bg-light bg-opacity-50">
                <div className="card-body">
                  <p className="text-secondary small mb-1">Status</p>
                  <p className="fw-bold mb-0 text-success"><i className="bi bi-clock-history me-1"></i> Order Received</p>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-6">
              <div className="card border-0 guest-cart-item h-100 bg-light bg-opacity-50">
                <div className="card-body">
                  <p className="text-secondary small mb-1">Estimated Delivery/Pickup</p>
                  <p className="fw-bold mb-0 text-dark"><i className="bi bi-geo-alt-fill text-danger me-1"></i> {estimatedTime || '30-45 mins'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback & Star Rating Form */}
          <div className="card border-0 rounded-4 mb-4 p-4 text-start" style={{ backgroundColor: '#fcfbfa', border: '1px dashed #e5dec9' }}>
            <h3 className="h6 fw-bold mb-2 text-dark"><i className="bi bi-chat-heart text-warning me-1"></i> How was your ordering experience?</h3>
            
            {isSubmitted ? (
              <div className="alert alert-success border-0 shadow-sm d-flex align-items-center gap-3 py-3 mb-0" role="alert">
                <div className="fs-3 text-success"><i className="bi bi-patch-check-fill"></i></div>
                <div>
                  <h4 className="h6 fw-bold mb-0.5 text-success-emphasis">Thank you for your feedback!</h4>
                  <p className="small mb-0 text-success-emphasis">We appreciate you taking the time to share your experience with us.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitFeedback}>
                <p className="small text-secondary mb-3">Your ratings and reviews help us improve our restaurant service and platform features.</p>
                
                {/* Stars Selector */}
                <div className="d-flex gap-2 mb-3 align-items-center">
                  <span className="small fw-semibold text-secondary me-2">Select Stars:</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="btn p-0 border-0 star-btn"
                      style={{
                        fontSize: '1.75rem',
                        color: star <= (hoverRating || rating) ? '#ffc107' : '#e4e5e9',
                        transition: 'transform 0.15s, color 0.15s',
                        transform: star <= (hoverRating || rating) ? 'scale(1.2)' : 'scale(1)',
                        cursor: 'pointer'
                      }}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                    >
                      <i className={`bi ${star <= (hoverRating || rating) ? 'bi-star-fill' : 'bi-star'}`}></i>
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="badge bg-warning text-dark fw-bold ms-2 px-2 py-1 rounded">
                      {rating} Star{rating > 1 ? 's' : ''} {rating >= 4 ? '😊' : '😔'}
                    </span>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="comments" className="form-label small fw-semibold text-secondary">Share your feedback details:</label>
                  <textarea
                    id="comments"
                    className="form-control bg-white"
                    rows="3"
                    placeholder="Tell us what you liked, or how we can improve..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    style={{ resize: 'none' }}
                  ></textarea>
                </div>

                {error && (
                  <div className="text-danger small mb-3 fw-semibold">
                    <i className="bi bi-exclamation-triangle-fill me-1"></i> {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-warning btn-sm fw-bold px-3 text-dark d-inline-flex align-items-center gap-1.5"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-send-fill"></i> Submit Review
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          <div className="d-flex flex-column flex-sm-row justify-content-center gap-2 mt-4">
            <Link className="btn btn-primary px-4 py-2" state={{ estimatedTime, order }} to={`/orders/${order.orderNumber}`}>
              <i className="bi bi-compass me-1.5"></i> Track Order
            </Link>
            <Link className="btn btn-outline-secondary px-4 py-2" to="/">
              <i className="bi bi-house me-1.5"></i> Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GuestOrderSuccessPage;
