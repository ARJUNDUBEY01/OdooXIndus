import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#6c63ff', '#10d98a', '#f59e0b', '#38bdf8', '#ef4444'];

export default function Reports() {
  const [revenue, setRevenue] = useState(null);
  const [subs, setSubs] = useState(null);
  const [pays, setPays] = useState(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('2026-01-01');
  const [to, setTo] = useState('2026-12-31');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [rRes, sRes, pRes] = await Promise.all([
        api.get(`/reports/revenue?from=${from}&to=${to}`),
        api.get(`/reports/subscriptions?from=${from}&to=${to}`),
        api.get(`/reports/payments?from=${from}&to=${to}`),
      ]);
      setRevenue(rRes.data);
      setSubs(sRes.data);
      setPays(pRes.data);
    } catch (e) { toast.error('Failed to load reports'); }
    setLoading(false);
  };

  useEffect(() => { fetchReports(); }, []);

  const payMethodData = pays ? Object.entries(pays.byMethod || {}).map(([name, value]) => ({ name, value })) : [];
  const subStatusData = subs ? Object.entries(subs.byStatus || {}).map(([name, value]) => ({ name, value })) : [];
  const revByStatus = revenue ? Object.entries(revenue.revenueByStatus || {}).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) })) : [];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-left"><h1>Reports & Analytics</h1><p>Business intelligence and financial overview</p></div>
      </div>

      {/* Date Filter */}
      <div className="filter-bar" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>From:</div>
        <input className="form-input" type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ width: 160 }} />
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>To:</div>
        <input className="form-input" type="date" value={to} onChange={e => setTo(e.target.value)} style={{ width: 160 }} />
        <button className="btn btn-primary btn-sm" onClick={fetchReports}>Apply Filter</button>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="stats-grid" style={{ marginBottom: 28 }}>
            <div className="stat-card accent">
              <div className="stat-header"><div className="stat-icon">💰</div></div>
              <div className="stat-value">₹{revenue?.totalRevenue?.toLocaleString() || 0}</div>
              <div className="stat-label">Total Revenue</div>
            </div>
            <div className="stat-card success">
              <div className="stat-header"><div className="stat-icon">🧮</div></div>
              <div className="stat-value">₹{revenue?.totalTax?.toLocaleString() || 0}</div>
              <div className="stat-label">Total Tax Collected</div>
            </div>
            <div className="stat-card warning">
              <div className="stat-header"><div className="stat-icon">🎯</div></div>
              <div className="stat-value">₹{revenue?.totalDiscount?.toLocaleString() || 0}</div>
              <div className="stat-label">Total Discounts Given</div>
            </div>
            <div className="stat-card info">
              <div className="stat-header"><div className="stat-icon">💳</div></div>
              <div className="stat-value">₹{pays?.totalCollected?.toLocaleString() || 0}</div>
              <div className="stat-label">Payments Collected</div>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="charts-grid" style={{ marginBottom: 20 }}>
            <div className="chart-wrapper">
              <div className="chart-title">Revenue by Invoice Status</div>
              <div className="chart-subtitle">How revenue is spread across invoice states</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revByStatus} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: '#555568', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#555568', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#16161f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="value" fill="#6c63ff" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-wrapper">
              <div className="chart-title">Subscriptions by Status</div>
              <div className="chart-subtitle">{subs?.total || 0} subscriptions in period</div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={subStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                    {subStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#16161f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {subStatusData.map((d, i) => (
                  <span key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-secondary)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length], display: 'inline-block' }} />
                    {d.name} ({d.value})
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Payments by Method */}
          <div className="chart-wrapper">
            <div className="chart-title">Payments by Method</div>
            <div className="chart-subtitle">{pays?.total || 0} transactions · ₹{pays?.totalCollected?.toLocaleString() || 0} total</div>
            {payMethodData.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No payments in this period</div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 16 }}>
                {payMethodData.map((d, i) => (
                  <div key={d.name} style={{ flex: '1 1 160px', background: 'var(--bg-secondary)', borderRadius: 10, padding: 16, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'capitalize' }}>{d.name.replace('_', ' ')}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: COLORS[i % COLORS.length] }}>₹{d.value?.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
