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

  const fetchReports = async (filter) => {
    const period = PERIOD_MAP[filter] || 'week';
    try {
      setIsLoading(true);
      setError(null);
      const [summary, revenue, orders, topItems] = await Promise.all([
        reportsService.getReportsSummary(period),
        reportsService.getRevenueTrend(period),
        reportsService.getOrdersTrend(period),
        reportsService.getTopItems(period)
      ]);
      setReportData({ summary, revenue, orders, topItems });
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

  const maxRevenue = useMemo(() => Math.max(...revenueBars, 1), [revenueBars]);
  const maxOrders = useMemo(() => Math.max(...orderBars, 1), [orderBars]);

  return (
    <div className="container-fluid px-0">
      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div>
          <p className="text-uppercase text-secondary small fw-semibold mb-2">Analytics & Reports</p>
          <h1 className="h3 mb-1">Analytics</h1>
          <p className="text-secondary mb-0">Sales and item performance from live data.</p>
        </div>
        <Link className="btn btn-outline-secondary btn-sm" to="/owner">
          Back to Owner Home
        </Link>
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
        </>
      )}

      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-4">
          <label className="form-label" htmlFor="analyticsDateFilter">
            Date filter
          </label>
          <select
            className="form-select"
            id="analyticsDateFilter"
            onChange={(event) => setDateFilter(event.target.value)}
            value={dateFilter}
          >
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
          </select>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-12 col-xl-6">
          <div className="card border-0 guest-info-card h-100">
            <div className="card-body p-4">
              <h2 className="h5 mb-3">Revenue Trend</h2>
              {!isLoading && !error && (
                revenueBars.length ? (
                  <div className="d-flex align-items-end gap-2" style={{ minHeight: '180px' }}>
                    {revenueBars.map((value, index) => (
                      <div className="flex-fill text-center" key={`rev-${index}`}>
                        <div
                          className="rounded-top bg-primary mx-auto"
                          style={{ height: `${(value / maxRevenue) * 160}px`, maxWidth: '28px' }}
                          title={`Revenue ${value}`}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-secondary">No revenue data available.</div>
                )
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-6">
          <div className="card border-0 guest-info-card h-100">
            <div className="card-body p-4">
              <h2 className="h5 mb-3">Orders Trend</h2>
              {!isLoading && !error && (
                orderBars.length ? (
                  <div className="d-flex align-items-end gap-2" style={{ minHeight: '180px' }}>
                    {orderBars.map((value, index) => (
                      <div className="flex-fill text-center" key={`ord-${index}`}>
                        <div
                          className="rounded-top bg-success mx-auto"
                          style={{ height: `${(value / maxOrders) * 160}px`, maxWidth: '28px' }}
                          title={`Orders ${value}`}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-secondary">No orders data available.</div>
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
