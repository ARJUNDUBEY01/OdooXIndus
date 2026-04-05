'use client';
// app/(dashboard)/admin/configuration/recurring-plans/page.tsx
// RevFlow — Configuration: Recurring Plan templates and specifics

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Plan, Product, ProductVariant } from '@/types/database';

interface PlanWithProduct extends Plan {
  product: Product & { product_variants?: ProductVariant[] };
}

type ViewMode = 'list' | 'form';

export default function RecurringPlansPage() {
  const supabase = createClient();
  const [plans, setPlans] = useState<PlanWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('list');
  const [selected, setSelected] = useState<PlanWithProduct | null>(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  
  // Notice we don't necessarily 'create' standalone plans here easily since plans need a product_id.
  // The UI will primarily act as an advanced editor for all recurring plans to configure options
  // like billing_interval_count, closable, pausable, renew - per the user's sketch.
  
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const loadPlans = useCallback(async () => {
    // We join product to see which product this plan is attached to
    const { data, error } = await supabase
      .from('plans')
      .select('*, product:products(*, product_variants(*))')
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setPlans(data as any as PlanWithProduct[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadPlans(); }, [loadPlans]);

  // Form state for editing
  const [form, setForm] = useState({
    name: '',
    billing_period: 'monthly',
    billing_interval_count: 1,
    closable: true,
    pausable: true,
    renew: true
  });

  function selectPlan(plan: PlanWithProduct) {
    setSelected(plan);
    const opts = (plan.options as Record<string, any>) || {};
    setForm({
      name: plan.name,
      billing_period: plan.billing_period || 'monthly',
      billing_interval_count: opts.billing_interval_count || 1,
      closable: plan.closable !== false,
      pausable: plan.pausable !== false,
      renew: plan.renew !== false
    });
    setView('form');
  }

  async function handleSavePlan(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSaving(true); setFormError('');
    
    const currentOptions = (selected.options as Record<string, any>) || {};
    const updatedOptions = { ...currentOptions, billing_interval_count: form.billing_interval_count };
    
    const { data, error } = await supabase.from('plans').update({
      name: form.name.trim(),
      billing_period: form.billing_period as any,
      options: updatedOptions,
      closable: form.closable,
      pausable: form.pausable,
      renew: form.renew
    }).eq('id', selected.id).select('*, product:products(*, product_variants(*))').single();

    setSaving(false);
    if (error) { setFormError(error.message); return; }
    
    setPlans(prev => prev.map(p => p.id === selected.id ? (data as any) : p));
    setSelected(data as any);
    showToast('✓ Plan updated successfully');
  }

  async function deletePlan(id: string) {
    if (!confirm('Warning: Deleting this plan removes it from its attached product forever.')) return;
    await supabase.from('plans').delete().eq('id', id);
    setView('list'); setSelected(null);
    await loadPlans();
    showToast('Plan Deleted');
  }

  const filtered = plans.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.product?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  if (view === 'form') {
    const plan = selected;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
        {toast && <div style={{ position: 'sticky', top: '1rem', zIndex: 50, background: 'var(--success)', color: 'white', padding: '0.75rem 1rem', borderRadius: '8px', fontWeight: 600 }}>{toast}</div>}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 1rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button onClick={() => { setView('list'); setSelected(null); setFormError(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                ← Recurring Plans
              </button>
              <span style={{ color: 'var(--border)' }}>|</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{plan?.name || ''}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => deletePlan(plan!.id)} className="btn-primary" style={{ background: 'var(--error)', borderColor: 'var(--error)' }}>🗑️ Delete</button>
              <button form="plan-form" type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : '✓ Save'}
              </button>
            </div>
          </div>

          <div style={{ padding: '2rem 2.5rem' }}>
            {formError && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{formError}</div>}
            
            <form id="plan-form" onSubmit={handleSavePlan}>
              <div style={{ marginBottom: '2.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Recurring Name</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                  style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: "'Manrope', sans-serif", border: 'none', borderBottom: '2px solid var(--accent)', outline: 'none', background: 'transparent', color: 'var(--text-primary)', width: '100%', paddingBottom: '4px', marginBottom: '1.5rem' }}
                />

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
                  <div style={{ flex: '0 0 120px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Interval Count</label>
                    <input type="number" min="1" value={form.billing_interval_count} onChange={e => setForm(f => ({ ...f, billing_interval_count: parseInt(e.target.value) || 1 }))} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }} />
                  </div>
                  <div style={{ flex: '0 0 200px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Billing Period</label>
                    <select value={form.billing_period} onChange={e => setForm(f => ({ ...f, billing_period: e.target.value }))} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}>
                      <option value="daily">Days</option>
                      <option value="weekly">Weeks</option>
                      <option value="monthly">Months</option>
                      <option value="yearly">Years</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.closable} onChange={e => setForm(f => ({ ...f, closable: e.target.checked }))} style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }} />
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Closable <span style={{ fontWeight: 400, color: 'var(--text-secondary)', fontSize: '0.8rem', marginLeft: '8px' }}>(determines if subscription can be closed)</span></span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.pausable} onChange={e => setForm(f => ({ ...f, pausable: e.target.checked }))} style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }} />
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Pausable</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.renew} onChange={e => setForm(f => ({ ...f, renew: e.target.checked }))} style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }} />
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Renew <span style={{ fontWeight: 400, color: 'var(--text-secondary)', fontSize: '0.8rem', marginLeft: '8px' }}>(auto-renew active subscription)</span></span>
                  </label>
                </div>
              </div>
            </form>

            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem' }}>Attached Product Pricing</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border)' }}>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Product</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Variant</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Price</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Min Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {(plan?.product?.product_variants && plan.product.product_variants.length > 0) ? plan.product.product_variants.map((v, i) => (
                    <tr key={v.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{plan.product.name}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{v.attribute}: {v.value}</td>
                      <td style={{ padding: '0.75rem', fontWeight: 700, color: 'var(--accent)' }}>₹{plan.price + v.extra_price} per {plan.billing_period}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{plan.min_quantity}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{plan?.product?.name || 'Unknown Product'}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>No variants</td>
                      <td style={{ padding: '0.75rem', fontWeight: 700, color: 'var(--accent)' }}>₹{plan?.price} per {plan?.billing_period}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{plan?.min_quantity}</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>* Any eligible variant pricing dynamically combines the plan base price and variant extra price as depicted.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      {toast && <div style={{ position: 'sticky', top: '1rem', zIndex: 50, background: 'var(--success)', color: 'white', padding: '0.75rem 1rem', borderRadius: '8px', fontWeight: 600 }}>{toast}</div>}
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Configuration / Recurring Plans</h2>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Manage billing configurations and flags for all recurring plans natively linked to products.</p>
      
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ position: 'relative', width: '280px' }}>
              <input placeholder="Search plans or products…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '0.4rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }} />
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>Loading plans...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p>No recurring plans found.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Plan Name</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Attached To Product</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Period</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Config Flags</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((plan, i) => {
                 const opts = (plan.options as Record<string, any>) || {};
                 return (
                  <tr
                    key={plan.id}
                    onClick={() => selectPlan(plan)}
                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,90,194,0.06)')}
                    onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)')}
                  >
                    <td style={{ padding: '0.9rem 0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{plan.name}</td>
                    <td style={{ padding: '0.9rem 0.75rem', color: 'var(--text-primary)' }}>{plan.product?.name || '—'}</td>
                    <td style={{ padding: '0.9rem 0.75rem', color: 'var(--text-secondary)' }}>
                      Every {opts.billing_interval_count || 1} {plan.billing_period}(s)
                    </td>
                    <td style={{ padding: '0.9rem 0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {plan.closable !== false && <span style={{ padding: '2px 6px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>CLOSABLE</span>}
                        {plan.pausable !== false && <span style={{ padding: '2px 6px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>PAUSABLE</span>}
                        {plan.renew !== false && <span style={{ padding: '2px 6px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>RENEW</span>}
                      </div>
                    </td>
                  </tr>
                 );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
