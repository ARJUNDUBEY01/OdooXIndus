'use client';
// components/CustomerDashboard.tsx
// RevFlow — Customer dashboard: active subscriptions + recent invoices

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Invoice, Subscription } from '@/types/database';

interface CustomerDashboardProps {
  userId: string;
}

interface SubscriptionWithPlan extends Subscription {
  plan?: {
    name: string;
    price: number;
    billing_period: string | null;
    product?: {
      name: string;
    } | null;
  } | null;
}

export default function CustomerDashboard({ userId }: CustomerDashboardProps) {
  const supabase = createClient();
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithPlan[]>([]);
  const [invoices, setInvoices]           = useState<Invoice[]>([]);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    async function loadData() {
      const [subsRes, invoicesRes] = await Promise.all([
        supabase
          .from('subscriptions')
          .select(`
            *,
            plan:plans (
              name, price, billing_period,
              product:products (name)
            )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('invoices')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      if (subsRes.data) setSubscriptions(subsRes.data as SubscriptionWithPlan[]);
      if (invoicesRes.data) setInvoices(invoicesRes.data);
      setLoading(false);
    }
    loadData();
  }, [userId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="spinner" style={{ width: '32px', height: '32px', borderWidth: '3px' }} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem', fontFamily: "'Space Grotesk', sans-serif" }}>
          My Dashboard
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Your subscriptions and recent activity
        </p>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="stat-card">
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
            Active Plans
          </p>
          <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success)' }}>
            {subscriptions.filter(s => s.status === 'active').length}
          </p>
        </div>
        <div className="stat-card">
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
            Invoices
          </p>
          <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {invoices.length}
          </p>
        </div>
        <div className="stat-card" style={{ gridColumn: 'auto' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
            Total Spent
          </p>
          <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            ₹{invoices
              .filter(i => i.status === 'paid')
              .reduce((sum, i) => sum + (i.final_amount ?? 0), 0)
              .toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Active Subscriptions */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>My Subscriptions</h2>
          <Link href="/shop" style={{ fontSize: '0.8rem', color: 'var(--accent-2)', textDecoration: 'none' }}>
            + Add Plan →
          </Link>
        </div>

        {subscriptions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛒</p>
            <p>No subscriptions yet.</p>
            <Link href="/shop" className="btn-primary" style={{ display: 'inline-flex', marginTop: '1rem', textDecoration: 'none' }}>
              Browse Plans
            </Link>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Status</th>
                <th>Started</th>
                <th>Renews</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map(sub => (
                <tr key={sub.id}>
                  <td>
                    <div>
                      <p style={{ fontWeight: 600 }}>{sub.plan?.name ?? 'Unknown Plan'}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {sub.plan?.product?.name}
                      </p>
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-${sub.status}`}>{sub.status}</span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    {sub.start_date ? new Date(sub.start_date).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    {sub.end_date ? new Date(sub.end_date).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Recent Invoices */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Recent Invoices</h2>
          <Link href="/invoices" style={{ fontSize: '0.8rem', color: 'var(--accent-2)', textDecoration: 'none' }}>
            View all →
          </Link>
        </div>

        {invoices.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem' }}>No invoices yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    #{inv.id.slice(0, 8)}
                  </td>
                  <td>
                    <span className={`badge badge-${inv.status}`}>{inv.status}</span>
                  </td>
                  <td style={{ fontWeight: 600 }}>₹{(inv.final_amount ?? 0).toFixed(2)}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    {new Date(inv.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
