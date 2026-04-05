'use client';
// app/(dashboard)/invoices/page.tsx
// RevFlow — Invoice list with detail modal

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Invoice, InvoiceItem } from '@/types/database';

interface InvoiceWithItems extends Invoice {
  invoice_items: InvoiceItem[];
}

export default function InvoicesPage() {
  const supabase = createClient();
  const [invoices, setInvoices]       = useState<InvoiceWithItems[]>([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState<InvoiceWithItems | null>(null);
  const [error, setError]             = useState('');

  useEffect(() => {
    async function loadInvoices() {
      const { data, error: dbErr } = await supabase
        .from('invoices')
        .select('*, invoice_items(*)')
        .order('created_at', { ascending: false });

      if (dbErr) {
        setError('Failed to load invoices: ' + dbErr.message);
      } else {
        setInvoices((data ?? []) as InvoiceWithItems[]);
      }
      setLoading(false);
    }
    loadInvoices();
  }, []);

  function openModal(inv: InvoiceWithItems) {
    setSelected(inv);
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    setSelected(null);
    document.body.style.overflow = '';
  }

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
          Invoices
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          All your billing history in one place
        </p>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      {invoices.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '20px',
          }}
        >
          <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧾</p>
          <p style={{ color: 'var(--text-secondary)' }}>No invoices yet.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Status</th>
                <th>Subtotal</th>
                <th>Tax</th>
                <th>Discount</th>
                <th>Total</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      #{inv.id.slice(0, 8)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${inv.status}`}>{inv.status}</span>
                  </td>
                  <td>₹{(inv.total_amount ?? 0).toFixed(2)}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>₹{(inv.tax_amount ?? 0).toFixed(2)}</td>
                  <td style={{ color: 'var(--success)' }}>
                    {(inv.discount_amount ?? 0) > 0 ? `-₹${inv.discount_amount.toFixed(2)}` : '—'}
                  </td>
                  <td style={{ fontWeight: 700 }}>₹{(inv.final_amount ?? 0).toFixed(2)}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    {new Date(inv.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    <button
                      id={`view-invoice-${inv.id}`}
                      onClick={() => openModal(inv)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent-2)',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                        padding: '0.25rem 0.5rem',
                        borderRadius: '6px',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(108,99,255,0.1)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
                    >
                      View →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {selected && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.5rem',
          }}
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div
            className="animate-fade-in"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              padding: '2rem',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
          >
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                  Invoice #{selected.id.slice(0, 8)}
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {new Date(selected.created_at).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className={`badge badge-${selected.status}`}>{selected.status}</span>
                <button
                  id="close-invoice-modal"
                  onClick={closeModal}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Line items */}
            <table className="data-table" style={{ marginBottom: '1rem' }}>
              <thead>
                <tr>
                  <th>Item</th>
                  <th style={{ textAlign: 'center' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Price</th>
                  <th style={{ textAlign: 'right' }}>Tax</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {selected.invoice_items.map(item => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 500 }}>{item.product_name}</td>
                    <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right' }}>₹{item.unit_price.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{item.tax}%</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{(item.amount ?? 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Summary */}
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}
            >
              {[
                { label: 'Subtotal', value: `₹${(selected.total_amount ?? 0).toFixed(2)}`, color: 'var(--text-secondary)' },
                { label: 'Tax', value: `₹${(selected.tax_amount ?? 0).toFixed(2)}`, color: 'var(--text-secondary)' },
                ...(selected.discount_amount > 0
                  ? [{ label: 'Discount', value: `-₹${selected.discount_amount.toFixed(2)}`, color: 'var(--success)' }]
                  : []),
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: row.color }}>{row.label}</span>
                  <span style={{ color: row.color }}>{row.value}</span>
                </div>
              ))}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  borderTop: '1px solid var(--border)',
                  paddingTop: '0.5rem',
                  marginTop: '0.25rem',
                }}
              >
                <span>Amount Due</span>
                <span
                  style={{
                    background: 'var(--gradient-1)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  ₹{(selected.final_amount ?? 0).toFixed(2)}
                </span>
              </div>
            </div>

            {selected.status === 'draft' && (
              <a
                href={`/checkout/${selected.id}`}
                className="btn-primary"
                style={{ display: 'flex', marginTop: '1.25rem', textDecoration: 'none', justifyContent: 'center' }}
              >
                Pay Now →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
