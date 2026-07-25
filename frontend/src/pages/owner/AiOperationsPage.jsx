import { useState } from 'react';

function AiOperationsPage() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello Alex! I am your AI Operations Copilot. Ask me anything about restaurant sales trends, forecasting, labor allocation, or weather adjustments.',
      stats: null
    }
  ]);
  const [loading, setLoading] = useState(false);

  const sampleQueries = [
    { text: "Will it rain this Friday and how will it affect our sales?", value: "Will it rain this Friday and how will it affect our sales?" },
    { text: "Predict next week's staffing requirements", value: "Recommend next week's staffing levels based on historical averages and forecasted weather." },
    { text: "Analyze inventory stockouts for this month", value: "Analyze what items had the highest 86 rate this month and how to improve ordering." }
  ];

  const handleSend = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userQuery = query;
    setMessages(prev => [...prev, { role: 'user', content: userQuery }]);
    setQuery('');
    setLoading(true);

    // Simulate AI Operations response logic
    await new Promise(resolve => setTimeout(resolve, 1500));

    let assistantResponse = "";
    let stats = null;

    if (userQuery.toLowerCase().includes('rain') || userQuery.toLowerCase().includes('friday')) {
      assistantResponse = "Rain is forecasted this Friday in Chicago (80% precipitation). Based on similar historic events, expect delivery orders to surge by +24% while dine-in/pickup will decrease by -15%.";
      stats = [
        { label: 'Delivery Shift Delta', value: '+24%', color: 'text-success' },
        { label: 'Dine-In Delta', value: '-15%', color: 'text-danger' },
        { label: 'Recommended Driver Count', value: '6 Drivers (Normally 4)', color: 'text-primary' }
      ];
    } else if (userQuery.toLowerCase().includes('staff') || userQuery.toLowerCase().includes('week')) {
      assistantResponse = "Based on historical averages and the upcoming high-temperature index next week, sales are projected to reach $28,500 (+15% higher than this week). I recommend allocating 45 total shift hours for kitchen staff and 35 hours for FOH.";
      stats = [
        { label: 'Projected Weekly Sales', value: '$28,500', color: 'text-success' },
        { label: 'Kitchen Hours Required', value: '45 hrs', color: 'text-primary' },
        { label: 'FOH Hours Required', value: '35 hrs', color: 'text-primary' }
      ];
    } else {
      assistantResponse = "Spicy Rigatoni Pasta had the highest stockout rate this month, being 86'd 4 times, primarily on Friday evenings. I suggest increasing the standard prep-batch count by +25% on Thursday morning to meet weekend demand.";
      stats = [
        { label: 'Pasta Stockouts', value: '4 occurrences', color: 'text-danger' },
        { label: 'Suggested Prep Delta', value: '+25%', color: 'text-success' }
      ];
    }

    setMessages(prev => [...prev, { role: 'assistant', content: assistantResponse, stats }]);
    setLoading(false);
  };

  return (
    <div className="container-fluid py-4">
      <div className="mb-4">
        <h2 className="fw-bold mb-1">
          <i className="bi bi-cpu text-primary me-2"></i>
          AI Operations Copilot
        </h2>
        <p className="text-muted mb-0">
          Query the AI to forecast staffing configurations, plan purchase volumes, or predict delivery surge requirements.
        </p>
      </div>

      <div className="row g-4">
        {/* Chat window */}
        <div className="col-12 col-lg-8">
          <div className="card border-0 shadow-sm rounded-3 d-flex flex-column" style={{ height: '550px' }}>
            <div className="card-header bg-white border-0 py-3 border-bottom">
              <h6 className="fw-bold mb-0"><i className="bi bi-chat-dots-fill text-primary me-2"></i> Live Operations Q&A</h6>
            </div>
            
            <div className="card-body overflow-auto p-4 flex-grow-1" style={{ backgroundColor: '#fdfdfd' }}>
              {messages.map((msg, index) => (
                <div key={index} className={`d-flex mb-4 ${msg.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
                  <div className={`p-3 rounded-3 shadow-sm ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-white border text-dark'}`} style={{ maxWidth: '80%' }}>
                    <div className="small fw-bold mb-1">{msg.role === 'user' ? 'You' : 'Operations Copilot'}</div>
                    <div className="small">{msg.content}</div>

                    {msg.stats && (
                      <div className="row g-2 mt-3 pt-2 border-top border-opacity-25">
                        {msg.stats.map((s, idx) => (
                          <div key={idx} className="col-6 col-md-4">
                            <div className="text-muted small" style={{ fontSize: '0.75rem' }}>{s.label}</div>
                            <div className={`fw-bold ${s.color}`}>{s.value}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="d-flex justify-content-start mb-4">
                  <div className="p-3 rounded-3 bg-white border text-dark shadow-sm">
                    <span className="spinner-grow spinner-grow-sm text-primary me-2" role="status"></span>
                    <span className="small text-muted">Synthesizing sales, shift logs, and weather indices...</span>
                  </div>
                </div>
              )}
            </div>

            <div className="card-footer bg-white border-0 p-3 border-top">
              <form onSubmit={handleSend} className="d-flex gap-2">
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Ask a question (e.g. recommend staffing for next weekend...)"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  disabled={loading}
                />
                <button type="submit" className="btn btn-primary px-4" disabled={loading || !query.trim()}>
                  <i className="bi bi-send-fill"></i>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Templates and tips */}
        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm rounded-3 mb-4 bg-primary bg-opacity-10 border border-primary border-opacity-25">
            <div className="card-body">
              <h6 className="fw-bold text-primary mb-3">Suggested Operations Queries</h6>
              <div className="d-flex flex-column gap-2">
                {sampleQueries.map((q, idx) => (
                  <button 
                    key={idx} 
                    className="btn btn-white text-start shadow-sm border py-2 px-3 small rounded-3"
                    onClick={() => setQuery(q.value)}
                    disabled={loading}
                  >
                    <i className="bi bi-lightning text-warning me-2"></i> {q.text}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm rounded-3">
            <div className="card-header bg-white border-0 py-3">
              <h6 className="fw-bold mb-0"><i className="bi bi-graph-up text-success me-2"></i> Predictive Capabilities</h6>
            </div>
            <div className="card-body">
              <ul className="list-unstyled mb-0">
                <li className="d-flex align-items-start gap-2 mb-3">
                  <i className="bi bi-check-circle-fill text-success mt-1 small"></i>
                  <div>
                    <div className="fw-bold small">Weather Integration</div>
                    <span className="text-muted small">Auto-adjusts delivery & logistics forecast based on hourly precipitation.</span>
                  </div>
                </li>
                <li className="d-flex align-items-start gap-2 mb-3">
                  <i className="bi bi-check-circle-fill text-success mt-1 small"></i>
                  <div>
                    <div className="fw-bold small">Staff Capacity Forecasting</div>
                    <span className="text-muted small">Suggests shift counts matching anticipated sales load to minimize labor waste.</span>
                  </div>
                </li>
                <li className="d-flex align-items-start gap-2">
                  <i className="bi bi-check-circle-fill text-success mt-1 small"></i>
                  <div>
                    <div className="fw-bold small">Inventory Stockout Prevention</div>
                    <span className="text-muted small">Deduce peak usage intervals to optimize prep schedules.</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AiOperationsPage;
