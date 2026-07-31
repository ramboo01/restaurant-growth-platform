import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { reportsService } from '../../services/reportsService.js';

const PERIOD_MAP = {
  'Today': 'day',
  'This Week': 'week',
  'This Month': 'month'
};

function AnalyticsPage() {
  const [dateFilter, setDateFilter] = useState('This Week');
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Custom interactive chart states and helpers
  const [hoveredRevIndex, setHoveredRevIndex] = useState(null);
  const [hoveredOrdIndex, setHoveredOrdIndex] = useState(null);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(Number(value) || 0);
  };

  const getChartLabel = (index, totalLength, isFullFormat = false) => {
    if (dateFilter === 'Today') {
      const hour = index;
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      const ampm = hour < 12 ? 'AM' : 'PM';
      if (isFullFormat) {
        return `Today, ${displayHour} ${ampm}`;
      }
      return index % 3 === 0 ? `${displayHour} ${ampm}` : '';
    }
    if (dateFilter === 'This Month') {
      const d = new Date();
      d.setDate(d.getDate() - (totalLength - 1 - index));
      if (isFullFormat) {
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      }
      return index % 5 === 0 || index === totalLength - 1 
        ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
        : '';
    }
    // This Week
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const d = new Date();
    d.setDate(d.getDate() - (totalLength - 1 - index));
    if (isFullFormat) {
      return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    }
    return days[d.getDay()];
  };

  const fetchReports = async (filter) => {
    const period = PERIOD_MAP[filter] || 'week';
    try {
      setIsLoading(true);
      setError(null);
      const [summary, revenue, orders, topItems, recovery] = await Promise.all([
        reportsService.getReportsSummary(period),
        reportsService.getRevenueTrend(period),
        reportsService.getOrdersTrend(period),
        reportsService.getTopItems(period),
        reportsService.getRevenueRecovery(period)
      ]);
      setReportData({ summary, revenue, orders, topItems, recovery });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch reports.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(dateFilter);
  }, [dateFilter]);

  const summary = reportData?.summary || {};
  const revenueBars = useMemo(() => Array.isArray(reportData?.revenue) ? reportData.revenue : [], [reportData]);
  const orderBars = useMemo(() => Array.isArray(reportData?.orders) ? reportData.orders : [], [reportData]);
  const topItems = useMemo(() => Array.isArray(reportData?.topItems) ? reportData.topItems : [], [reportData]);
  const topSellingMenuItems = useMemo(() => Array.isArray(reportData?.topItems) ? reportData.topItems : [], [reportData]);
  const recovery = reportData?.recovery;

  const maxRevenue = useMemo(() => Math.max(...revenueBars, 1), [revenueBars]);
  const maxOrders = useMemo(() => Math.max(...orderBars, 1), [orderBars]);

  return (
    <div className="container-fluid px-0">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <p className="text-uppercase text-secondary small fw-semibold mb-2">Analytics & Reports</p>
          <h1 className="h3 mb-1">Analytics</h1>
          <p className="text-secondary mb-0">Sales, item performance, and platform ROI from live data.</p>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="d-flex align-items-center gap-2">
            <label className="form-label mb-0 text-secondary small fw-semibold" htmlFor="analyticsDateFilter">
              Period:
            </label>
            <select
              className="form-select form-select-sm"
              id="analyticsDateFilter"
              onChange={(event) => setDateFilter(event.target.value)}
              value={dateFilter}
              style={{ width: '130px' }}
            >
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
            </select>
          </div>
          <Link className="btn btn-outline-secondary btn-sm" to="/owner">
            Back to Owner Home
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : error ? (
        <div className="alert alert-danger mb-4">{error}</div>
      ) : (
        <>
          <div className="row g-3 mb-4">
            {[
              { label: "Today's Sales", value: summary.todaysSales ?? summary.todaySales ?? '—' },
              { label: 'Weekly Sales', value: summary.weeklySales ?? '—' },
              { label: 'Monthly Sales', value: summary.monthlySales ?? '—' },
              { label: 'Total Orders', value: summary.totalOrders ?? '—' }
            ].map((card) => (
              <div className="col-12 col-md-6 col-xl-3" key={card.label}>
                <div className="card border-0 guest-info-card h-100">
                  <div className="card-body">
                    <p className="text-secondary small mb-1">{card.label}</p>
                    <h2 className="h4 mb-0">{card.value}</h2>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Revenue Recovery & ROI card */}
          {recovery && (
            <div className="card border-0 bg-gradient-recovery mb-4 shadow-sm">
              <div className="card-body p-4 text-white">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <i className="bi bi-shield-check h4 mb-0 text-warning"></i>
                  <h3 className="h5 mb-0 fw-bold">Revenue Recovery & Net Platform ROI</h3>
                </div>
                <div className="row g-3 mb-3">
                  <div className="col-12 col-md-4">
                    <p className="text-white-50 small mb-1">Commission Avoided (30% Marketplace)</p>
                    <h4 className="fw-bold text-warning mb-0">
                      +${Number(recovery.commissionAvoided || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h4>
                  </div>
                  <div className="col-12 col-md-4">
                    <p className="text-white-50 small mb-1">Platform Fee (2.5%)</p>
                    <h4 className="fw-bold text-danger mb-0">
                      -${Number(recovery.platformFee || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h4>
                  </div>
                  <div className="col-12 col-md-4">
                    <p className="text-white-50 small mb-1">Net Direct Savings</p>
                    <h4 className="fw-bold mb-0" style={{ color: '#2ecc71', textShadow: '0 0 10px rgba(46, 204, 113, 0.2)' }}>
                      +${Number(recovery.netSavings || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h4>
                  </div>
                </div>
                <div className="p-3 rounded bg-white bg-opacity-10 d-flex gap-2 align-items-start">
                  <i className="bi bi-cpu text-info mt-1"></i>
                  <div>
                    <p className="small mb-1 fw-semibold text-info">AI Operational Insight</p>
                    <p className="small mb-0 text-white-50" style={{ fontStyle: 'italic' }}>{recovery.aiSummary}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Interactive Custom Charts */}
      <div className="row g-4 mb-4">
        {/* Revenue Trend Chart */}
        <div className="col-12 col-xl-6">
          <div className="card border-0 guest-info-card h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="h5 mb-0">Revenue Trend</h2>
                <span className="badge bg-light text-secondary border">Completed Sales</span>
              </div>
              {!isLoading && !error && (
                revenueBars.length ? (
                  <div className="position-relative mt-4">
                    {/* Y-axis and Grid lines */}
                    <div className="position-absolute w-100 h-100 d-flex flex-column justify-content-between pointer-events-none" style={{ height: '180px', zIndex: 0 }}>
                      {[1, 0.75, 0.5, 0.25, 0].map((ratio) => (
                        <div className="d-flex align-items-center w-100" key={ratio} style={{ height: '0' }}>
                          <span className="text-secondary small fw-semibold pe-2" style={{ width: '60px', fontSize: '0.75rem', textAlign: 'right' }}>
                            {formatCurrency(maxRevenue * ratio)}
                          </span>
                          <div className="flex-grow-1 border-bottom border-secondary border-opacity-10" style={{ borderStyle: 'dashed' }}></div>
                        </div>
                      ))}
                    </div>

                    {/* Chart Bars Area */}
                    <div className="d-flex align-items-end gap-1 position-relative" style={{ height: '180px', marginLeft: '60px', zIndex: 1 }}>
                      {revenueBars.map((value, index) => {
                        const isHovered = hoveredRevIndex === index;
                        return (
                          <div 
                            className="flex-fill text-center position-relative h-100 d-flex align-items-end" 
                            key={`rev-${index}`}
                            onMouseEnter={() => setHoveredRevIndex(index)}
                            onMouseLeave={() => setHoveredRevIndex(null)}
                          >
                            <div
                              className={`rounded-top mx-auto ${isHovered ? 'bg-primary shadow-sm' : 'bg-primary bg-opacity-75'}`}
                              style={{ 
                                height: `${(value / maxRevenue) * 100}%`, 
                                width: dateFilter === 'This Month' ? '70%' : '24px', 
                                minWidth: '4px',
                                transition: 'all 0.15s ease-in-out',
                                cursor: 'pointer'
                              }}
                            />
                            {/* Hover Tooltip */}
                            {isHovered && (
                              <div 
                                className="position-absolute bg-dark text-white rounded px-2 py-1 text-center shadow-lg pointer-events-none"
                                style={{ 
                                  bottom: `${((value / maxRevenue) * 100) + 5}%`, 
                                  left: '50%', 
                                  transform: 'translateX(-50%)', 
                                  zIndex: 100,
                                  fontSize: '0.75rem',
                                  whiteSpace: 'nowrap',
                                  animation: 'fadeIn 0.1s ease-out'
                                }}
                              >
                                <div className="fw-semibold">{formatCurrency(value)}</div>
                                <div className="text-white-50" style={{ fontSize: '0.65rem' }}>
                                  {getChartLabel(index, revenueBars.length, true)}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* X-axis Labels */}
                    <div className="d-flex align-items-start mt-2" style={{ marginLeft: '60px' }}>
                      {revenueBars.map((_, index) => {
                        const label = getChartLabel(index, revenueBars.length, false);
                        return (
                          <div 
                            className="flex-fill text-center text-secondary small fw-medium" 
                            key={`rev-lbl-${index}`}
                            style={{ 
                              fontSize: dateFilter === 'This Month' ? '0.65rem' : '0.75rem',
                              lineHeight: '1.2'
                            }}
                          >
                            {label}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-secondary text-center py-5">No revenue data available.</div>
                )
              )}
            </div>
          </div>
        </div>

        {/* Orders Trend Chart */}
        <div className="col-12 col-xl-6">
          <div className="card border-0 guest-info-card h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="h5 mb-0">Orders Trend</h2>
                <span className="badge bg-light text-secondary border">Completed Orders</span>
              </div>
              {!isLoading && !error && (
                orderBars.length ? (
                  <div className="position-relative mt-4">
                    {/* Y-axis and Grid lines */}
                    <div className="position-absolute w-100 h-100 d-flex flex-column justify-content-between pointer-events-none" style={{ height: '180px', zIndex: 0 }}>
                      {[1, 0.75, 0.5, 0.25, 0].map((ratio) => {
                        const val = Math.round(maxOrders * ratio);
                        return (
                          <div className="d-flex align-items-center w-100" key={ratio} style={{ height: '0' }}>
                            <span className="text-secondary small fw-semibold pe-2" style={{ width: '50px', fontSize: '0.75rem', textAlign: 'right' }}>
                              {val}
                            </span>
                            <div className="flex-grow-1 border-bottom border-secondary border-opacity-10" style={{ borderStyle: 'dashed' }}></div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Chart Bars Area */}
                    <div className="d-flex align-items-end gap-1 position-relative" style={{ height: '180px', marginLeft: '50px', zIndex: 1 }}>
                      {orderBars.map((value, index) => {
                        const isHovered = hoveredOrdIndex === index;
                        return (
                          <div 
                            className="flex-fill text-center position-relative h-100 d-flex align-items-end" 
                            key={`ord-${index}`}
                            onMouseEnter={() => setHoveredOrdIndex(index)}
                            onMouseLeave={() => setHoveredOrdIndex(null)}
                          >
                            <div
                              className={`rounded-top mx-auto ${isHovered ? 'bg-success shadow-sm' : 'bg-success bg-opacity-75'}`}
                              style={{ 
                                height: `${(value / maxOrders) * 100}%`, 
                                width: dateFilter === 'This Month' ? '70%' : '24px', 
                                minWidth: '4px',
                                transition: 'all 0.15s ease-in-out',
                                cursor: 'pointer'
                              }}
                            />
                            {/* Hover Tooltip */}
                            {isHovered && (
                              <div 
                                className="position-absolute bg-dark text-white rounded px-2 py-1 text-center shadow-lg pointer-events-none"
                                style={{ 
                                  bottom: `${((value / maxOrders) * 100) + 5}%`, 
                                  left: '50%', 
                                  transform: 'translateX(-50%)', 
                                  zIndex: 100,
                                  fontSize: '0.75rem',
                                  whiteSpace: 'nowrap',
                                  animation: 'fadeIn 0.1s ease-out'
                                }}
                              >
                                <div className="fw-semibold">{value} order{value !== 1 ? 's' : ''}</div>
                                <div className="text-white-50" style={{ fontSize: '0.65rem' }}>
                                  {getChartLabel(index, orderBars.length, true)}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* X-axis Labels */}
                    <div className="d-flex align-items-start mt-2" style={{ marginLeft: '50px' }}>
                      {orderBars.map((_, index) => {
                        const label = getChartLabel(index, orderBars.length, false);
                        return (
                          <div 
                            className="flex-fill text-center text-secondary small fw-medium" 
                            key={`ord-lbl-${index}`}
                            style={{ 
                              fontSize: dateFilter === 'This Month' ? '0.65rem' : '0.75rem',
                              lineHeight: '1.2'
                            }}
                          >
                            {label}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-secondary text-center py-5">No orders data available.</div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12 col-xl-6">
          <div className="card border-0 guest-info-card h-100">
            <div className="card-body p-4">
              <h2 className="h5 mb-3">Top Selling Items</h2>
              {!isLoading && !error && (
                topItems.length ? (
                  <div className="vstack gap-2">
                    {topItems.map((item) => (
                      <div className="d-flex justify-content-between align-items-center gap-3" key={item.name}>
                        <span>{item.name}</span>
                        <span className="fw-semibold">{item.value ?? item.orders}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-secondary">No top items data available.</div>
                )
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-6">
          <div className="card border-0 guest-info-card h-100">
            <div className="card-body p-4">
              <h2 className="h5 mb-3">Top 5 Selling Menu Items</h2>
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Orders</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr><td colSpan="3" className="text-center py-4"><div className="spinner-border spinner-border-sm text-primary" role="status"><span className="visually-hidden">Loading...</span></div></td></tr>
                    ) : error ? (
                      <tr><td colSpan="3" className="text-center text-danger py-4">{error}</td></tr>
                    ) : topSellingMenuItems.length ? (
                      topSellingMenuItems.map((item) => (
                        <tr key={item.name}>
                          <td>{item.name}</td>
                          <td>{item.orders}</td>
                          <td>{item.revenue}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="3" className="text-center text-secondary py-4">No data available.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPage;
