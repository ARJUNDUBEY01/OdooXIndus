'use client';
// components/AdminDashboard.tsx
// RevFlow — Admin stats dashboard with bar chart (no lib)

import { useEffect, useState } from 'react';
import type { Invoice } from '@/types/database';

interface MonthlyRevenue {
  month: number;
  revenue: number;
}

interface DashboardStats {
  total_revenue: number;
  active_subscriptions: number;
  pending_invoices: Invoice[];
  monthly_revenue: MonthlyRevenue[];
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function AdminDashboard() {
  const [stats, setStats]     = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/dashboard/stats');
        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? 'Failed to load stats');
          return;
        }
        const data = await res.json();
        setStats(data);
      } catch {
        setError('Network error — could not load dashboard stats');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="spinner" style={{ width: '32px', height: '32px', borderWidth: '3px' }} />
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  const maxRevenue = Math.max(...(stats?.monthly_revenue.map(m => m.revenue) ?? [1]));

  // Build a full 12-month array (fill missing months with 0)
  const fullMonths: MonthlyRevenue[] = Array.from({ length: 12 }, (_, i) => {
    const found = stats?.monthly_revenue.find(m => m.month === i + 1);
    return { month: i + 1, revenue: found?.revenue ?? 0 };
  });

  const pendingCount = stats?.pending_invoices.length ?? 0;
  const mrr = fullMonths.find(m => m.month === new Date().getMonth() + 1)?.revenue ?? 0;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem', fontFamily: "'Manrope', sans-serif" }}>
          Admin Dashboard
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Business overview for RevFlow
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Total Revenue
            </p>
            <span style={{ fontSize: '1.25rem' }}>💰</span>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Manrope', sans-serif" }}>
            ₹{(stats?.total_revenue ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.25rem' }}>All time</p>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Active Subscriptions
            </p>
            <span style={{ fontSize: '1.25rem' }}>🔄</span>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Manrope', sans-serif" }}>
            {stats?.active_subscriptions ?? 0}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Currently active</p>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Pending Invoices
            </p>
            <span style={{ fontSize: '1.25rem' }}>🧾</span>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 800, color: pendingCount > 0 ? 'var(--warning)' : 'var(--text-primary)', fontFamily: "'Manrope', sans-serif" }}>
            {pendingCount}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Draft + Confirmed</p>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              MRR (This Month)
            </p>
            <span style={{ fontSize: '1.25rem' }}>📈</span>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Manrope', sans-serif" }}>
            ₹{mrr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{MONTH_NAMES[new Date().getMonth()]}</p>
        </div>
      </div>

      {/* Monthly Revenue Bar Chart */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.5rem' }}>
          Monthly Revenue ({new Date().getFullYear()})
        </h2>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '0.5rem',
            height: '180px',
            padding: '0 0.5rem',
          }}
        >
          {fullMonths.map(({ month, revenue }) => {
            const heightPct = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;
            const isCurrentMonth = month === new Date().getMonth() + 1;
            return (
              <div
                key={month}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.4rem',
                  height: '100%',
                  justifyContent: 'flex-end',
                }}
              >
                <div
                  title={`₹${revenue.toFixed(2)}`}
                  style={{
                    width: '100%',
                    height: `${Math.max(heightPct, 2)}%`,
                    background: isCurrentMonth
                      ? 'var(--gradient-1)'
                      : 'rgba(0, 90, 194, 0.15)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                />
                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  {MONTH_NAMES[month - 1]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending Invoices Table */}
      {pendingCount > 0 && (
        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem' }}>
            Pending Invoices
          </h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Status</th>
                <th>Total</th>
                <th>Tax</th>
                <th>Final</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {stats?.pending_invoices.map(inv => (
                <tr key={inv.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {inv.id.slice(0, 8)}…
                  </td>
                  <td>
                    <span className={`badge badge-${inv.status}`}>{inv.status}</span>
                  </td>
                  <td>₹{(inv.total_amount ?? 0).toFixed(2)}</td>
                  <td>₹{(inv.tax_amount ?? 0).toFixed(2)}</td>
                  <td style={{ fontWeight: 600 }}>₹{(inv.final_amount ?? 0).toFixed(2)}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    {new Date(inv.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
