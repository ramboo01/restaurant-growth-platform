import { useEffect, useState } from 'react';
import LoadingState from '../../components/feedback/LoadingState.jsx';
import EmptyState from '../../components/feedback/EmptyState.jsx';
import { fetchReviews, updateReview, generateAiReply } from '../../services/reviewService.js';
import { useSocket } from '../../context/SocketContext.jsx';

function isHealthSafetyRisk(content) {
  if (!content) return false;
  const keywords = [
    'poison', 'sick', 'vomit', 'ill', 'allergic', 'allergy', 'hair', 'bug', 'roach',
    'dirt', 'clean', 'hygiene', 'rat', 'mouse', 'fly', 'spider', 'bacteria', 'infection',
    'hospital', 'stomach ache', 'food poisoning', 'undercooked', 'raw'
  ];
  const lowercaseContent = content.toLowerCase();
  return keywords.some(keyword => lowercaseContent.includes(keyword));
}

function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generatingId, setGeneratingId] = useState(null);
  const [toast, setToast] = useState('');
  
  const { socket } = useSocket();

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetchReviews();
      setReviews(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();

    if (!socket) return;

    const handleNewReview = (newReview) => {
      setReviews((prev) => [newReview, ...prev]);
      showToast('New customer feedback received!');
    };

    socket.on('newReview', handleNewReview);

    return () => {
      socket.off('newReview', handleNewReview);
    };
  }, [socket]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleGenerateReply = async (id) => {
    try {
      setGeneratingId(id);
      await generateAiReply(id);
      showToast('AI draft generated successfully!');
      loadReviews();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate AI reply.');
    } finally {
      setGeneratingId(null);
    }
  };

  const handlePublishReply = async (id, currentDraft) => {
    if (!currentDraft) return;
    try {
      await updateReview(id, { replyStatus: 'Replied', aiReplyDraft: currentDraft });
      showToast('Reply published successfully!');
      loadReviews();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to publish reply.');
    }
  };

  const getPlatformIcon = (platform) => {
    switch(platform) {
      case 'Google': return <i className="bi bi-google text-danger me-2"></i>;
      case 'Yelp': return <i className="bi bi-yelp text-danger me-2"></i>;
      default: return <i className="bi bi-star-fill text-warning me-2"></i>;
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(<i key={i} className={`bi bi-star-fill ${i <= rating ? 'text-warning' : 'text-secondary opacity-25'} me-1`}></i>);
    }
    return stars;
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold mb-1">
            <i className="bi bi-chat-right-quote text-primary me-2"></i>
            Review Engine & AI Replies
          </h2>
          <p className="text-muted mb-0">
            Manage your reputation across platforms and auto-draft professional replies.
          </p>
        </div>
      </div>

      {toast && (
        <div className="alert alert-success shadow-sm" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i> {toast}
        </div>
      )}

      {loading ? (
        <div className="p-5"><LoadingState message="Loading review data..." /></div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : reviews.length === 0 ? (
        <EmptyState title="No reviews yet" message="When customers leave reviews, they'll appear here." />
      ) : (
        <div className="row g-4">
          {reviews.map((r) => {
            const hasSafetyFlag = isHealthSafetyRisk(r.content);
            return (
              <div className="col-12" key={r.id}>
                <div className={`card border-0 shadow-sm rounded-4 ${hasSafetyFlag ? 'border-start border-5 border-danger bg-danger bg-opacity-10' : ''}`}>
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <div className="d-flex align-items-center gap-2">
                          <h5 className="fw-bold mb-1">{r.customerName}</h5>
                          {hasSafetyFlag && (
                            <span className="badge bg-danger text-white px-3 py-1 rounded-pill animate-pulse">
                              <i className="bi bi-exclamation-octagon-fill me-1"></i> URGENT HEALTH & SAFETY ESCALATION
                            </span>
                          )}
                        </div>
                        <div className="d-flex align-items-center mb-2">
                          {renderStars(r.rating)}
                          <span className="ms-3 text-muted small">{new Date(r.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div>
                          <span className="badge bg-light text-dark border me-2">
                            {getPlatformIcon(r.platform)} {r.platform}
                          </span>
                          {r.replyStatus === 'Replied' ? (
                            <span className="badge bg-success"><i className="bi bi-check me-1"></i>Resolved / Replied</span>
                          ) : (
                            <span className="badge bg-warning text-dark"><i className="bi bi-hourglass me-1"></i>Pending Review</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <p className={`fs-5 mb-4 ${hasSafetyFlag ? 'text-danger fw-bold' : 'text-dark'}`}>"{r.content}"</p>

                    {hasSafetyFlag && r.replyStatus !== 'Replied' && (
                      <div className="alert alert-danger bg-white border-danger mb-4 p-3 rounded-3">
                        <h6 className="fw-bold text-danger mb-1">
                          <i className="bi bi-shield-exclamation me-1"></i> Owner Resolution Note Required
                        </h6>
                        <p className="small text-muted mb-2">
                          This review contains health & safety keywords. Spec Section 4 Screen 13 requires a formal resolution note prior to marking resolved.
                        </p>
                        <textarea 
                          id={`res-note-${r.id}`}
                          className="form-control form-control-sm mb-2" 
                          rows="2" 
                          placeholder="Enter investigation / action resolution note (e.g. Inspected batch, refunded customer, contacted store manager)..."
                        />
                        <button 
                          className="btn btn-danger btn-sm px-4 fw-bold"
                          onClick={() => {
                            const noteEl = document.getElementById(`res-note-${r.id}`);
                            if (!noteEl?.value.trim()) {
                              alert('Resolution note is required for health & safety flags.');
                              return;
                            }
                            handlePublishReply(r.id, `RESOLVED BY OWNER: ${noteEl.value}`);
                          }}
                        >
                          <i className="bi bi-check-circle me-1"></i> Confirm Resolution & Close
                        </button>
                      </div>
                    )}

                    {!hasSafetyFlag && r.replyStatus === 'Pending' && !r.aiReplyDraft && (
                      <button 
                        className="btn btn-outline-primary shadow-sm"
                        onClick={() => handleGenerateReply(r.id)}
                        disabled={generatingId === r.id}
                      >
                        {generatingId === r.id ? 'Drafting...' : <><i className="bi bi-magic me-2"></i> Draft AI Reply</>}
                      </button>
                    )}

                    {!hasSafetyFlag && r.aiReplyDraft && r.replyStatus === 'Pending' && (
                      <div className="bg-primary bg-opacity-10 rounded-3 p-3 mt-3 border border-primary border-opacity-25">
                        <div className="d-flex align-items-center mb-2">
                          <i className="bi bi-robot text-primary me-2"></i>
                          <span className="fw-bold text-primary small text-uppercase">AI Drafted Reply</span>
                        </div>
                        <textarea 
                          className="form-control mb-3" 
                          rows="4" 
                          defaultValue={r.aiReplyDraft} 
                        />
                        <div className="d-flex gap-2">
                          <button 
                            className="btn btn-primary"
                            onClick={() => handlePublishReply(r.id, r.aiReplyDraft)}
                          >
                            <i className="bi bi-send-fill me-2"></i> Publish Reply
                          </button>
                          <button 
                            className="btn btn-outline-secondary"
                            onClick={() => handleGenerateReply(r.id)}
                            disabled={generatingId === r.id}
                          >
                            <i className="bi bi-arrow-clockwise me-1"></i> Regenerate
                          </button>
                        </div>
                      </div>
                    )}

                    {r.replyStatus === 'Replied' && r.aiReplyDraft && (
                      <div className="bg-light rounded-3 p-3 mt-3 border">
                        <div className="d-flex align-items-center mb-2">
                          <i className="bi bi-check-circle-fill text-success me-2"></i>
                          <span className="fw-bold text-success small text-uppercase">Resolution / Published Reply</span>
                        </div>
                        <p className="text-muted mb-0" style={{ whiteSpace: 'pre-wrap' }}>{r.aiReplyDraft}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ReviewsPage;
