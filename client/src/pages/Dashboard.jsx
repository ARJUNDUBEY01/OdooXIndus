import { useEffect, useState } from 'react';
import api from '../services/api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#6c63ff', '#10d98a', '#f59e0b', '#ef4444', '#38bdf8'];

export default function Dashboard() {
  const [stats, setStats] = useState({ subscriptions: [], invoices: [], payments: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [subRes, invRes, payRes] = await Promise.all([
          api.get('/subscriptions?limit=5'),
          api.get('/invoices?limit=5'),
          api.get('/payments?limit=5'),
        ]);
        setStats({
          subscriptions: subRes.data,
          invoices: invRes.data,
          payments: payRes.data,
        });
      } catch (e) { /* ignore */ }
      setLoading(false);
    };
    loadAll();
  }, []);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  const subTotal = stats.subscriptions.total || 0;
  const invTotal = stats.invoices.total || 0;
  const payTotal = stats.payments.total || 0;

  const subStatuses = (stats.subscriptions.subscriptions || []).reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1; return acc;
  }, {});
  const pieData = Object.entries(subStatuses).map(([name, value]) => ({ name, value }));

  // Mock revenue trend
  const revData = [
    { month: 'Jan', revenue: 12000 }, { month: 'Feb', revenue: 18500 },
    { month: 'Mar', revenue: 15200 }, { month: 'Apr', revenue: 22800 },
    { month: 'May', revenue: 19400 }, { month: 'Jun', revenue: 28100 },
    { month: 'Jul', revenue: 32500 },
  ];

  const recentSubs = stats.subscriptions.subscriptions?.slice(0, 5) || [];
  const recentInvoices = stats.invoices.invoices?.slice(0, 5) || [];

  return (
    <div className="fade-in">
      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card accent">
          <div className="stat-header">
            <div className="stat-icon">🔄</div>
            <span className="stat-badge up">↑ Active</span>
          </div>
          <div className="stat-value">{subTotal}</div>
          <div className="stat-label">Total Subscriptions</div>
        </div>
        <div className="stat-card success">
          <div className="stat-header">
            <div className="stat-icon">🧾</div>
            <span className="stat-badge up">↑ New</span>
          </div>
          <div className="stat-value">{invTotal}</div>
          <div className="stat-label">Total Invoices</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-header">
            <div className="stat-icon">💳</div>
            <span className="stat-badge up">↑ This month</span>
          </div>
          <div className="stat-value">{payTotal}</div>
          <div className="stat-label">Payments Recorded</div>
        </div>
        <div className="stat-card info">
          <div className="stat-header">
            <div className="stat-icon">💰</div>
            <span className="stat-badge up">↑ 18%</span>
          </div>
          <div className="stat-value">₹ 2.84L</div>
          <div className="stat-label">Monthly Revenue</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-grid" style={{ marginBottom: 24 }}>
        <div className="chart-wrapper">
          <div className="chart-title">Revenue Trend</div>
          <div className="chart-subtitle">Monthly revenue over last 7 months</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6c63ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6c63ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: '#555568', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#555568', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#16161f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#f0f0f8' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#6c63ff" strokeWidth={2} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-wrapper">
          <div className="chart-title">Subscription Status</div>
          <div className="chart-subtitle">Distribution by current state</div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#16161f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div>No subscription data yet</div>
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {pieData.map((d, i) => (
              <span key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-secondary)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length], display: 'inline-block' }} />
                {d.name} ({d.value})
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Data */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Recent Subscriptions */}
        <div className="table-wrapper">
          <div className="table-header">
            <div>
              <div className="table-title">Recent Subscriptions</div>
              <div className="table-subtitle">Latest subscription activity</div>
            </div>
          </div>
          {recentSubs.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">🔄</div><div className="empty-title">No subscriptions yet</div></div>
          ) : (
            <table>
              <thead><tr>
                <th>Number</th><th>Customer</th><th>Status</th>
              </tr></thead>
              <tbody>
                {recentSubs.map(s => (
                  <tr key={s._id}>
                    <td style={{ fontWeight: 600, color: 'var(--accent-light)', fontSize: 12 }}>{s.subscriptionNumber}</td>
                    <td>{s.customer?.name || '—'}</td>
                    <td><span className={`badge ${s.status}`}>{s.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent Invoices */}
        <div className="table-wrapper">
          <div className="table-header">
            <div>
              <div className="table-title">Recent Invoices</div>
              <div className="table-subtitle">Latest billing records</div>
            </div>
          </div>
          {recentInvoices.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">🧾</div><div className="empty-title">No invoices yet</div></div>
          ) : (
            <table>
              <thead><tr>
                <th>Invoice #</th><th>Amount</th><th>Status</th>
              </tr></thead>
              <tbody>
                {recentInvoices.map(i => (
                  <tr key={i._id}>
                    <td style={{ fontWeight: 600, color: 'var(--accent-light)', fontSize: 12 }}>{i.invoiceNumber}</td>
                    <td style={{ fontWeight: 600 }}>₹{i.totalAmount?.toFixed(2)}</td>
                    <td><span className={`badge ${i.status}`}>{i.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
