'use client';
// app/(dashboard)/products/page.tsx
// RevFlow — Products: List view + Form view (with Recurring Prices & Variants tabs)

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Product, Plan, ProductVariant } from '@/types/database';

interface ProductWithData extends Product {
  plans: Plan[];
  product_variants: ProductVariant[];
}

type ViewMode = 'list' | 'form';
type FormTab = 'recurring' | 'variants';

const PRODUCT_TYPES = ['Software', 'SaaS', 'Service', 'Physical', 'Digital', 'Subscription'];
const BILLING_PERIODS = ['monthly', 'yearly', 'quarterly', 'weekly', 'daily'] as const;

// ─── Status badge ───────────────────────────────────────────────────────────
function TypeBadge({ type }: { type: string | null }) {
  const colors: Record<string, { bg: string; color: string }> = {
    SaaS:         { bg: '#dbeafe', color: '#1d4ed8' },
    Software:     { bg: '#ede9fe', color: '#6d28d9' },
    Service:      { bg: '#dcfce7', color: '#15803d' },
    Physical:     { bg: '#fef9c3', color: '#854d0e' },
    Digital:      { bg: '#fce7f3', color: '#9d174d' },
    Subscription: { bg: '#e0f2fe', color: '#0369a1' },
  };
  const c = colors[type ?? ''] ?? { bg: '#f3f4f6', color: '#6b7280' };
  return (
    <span style={{ background: c.bg, color: c.color, padding: '2px 10px', borderRadius: '99px', fontSize: '0.72rem', fontWeight: 700 }}>
      {type || 'Product'}
    </span>
  );
}

export default function ProductsPage() {
  const supabase = createClient();

  const [products, setProducts] = useState<ProductWithData[]>([]);
  const [loading, setLoading]   = useState(true);
  const [view, setView]         = useState<ViewMode>('list');
  const [selected, setSelected] = useState<ProductWithData | null>(null);
  const [search, setSearch]     = useState('');
  const [toast, setToast]       = useState('');
  const [tab, setTab]           = useState<FormTab>('recurring');
  const [saving, setSaving]     = useState(false);
  const [formError, setFormError] = useState('');

  // New product form state
  const [isNew, setIsNew]       = useState(false);
  const [form, setForm]         = useState({
    name: '', description: '', type: 'SaaS',
    sales_price: '', cost_price: '', tax: '18',
  });

  // New plan row state
  const [newPlan, setNewPlan] = useState({
    name: '', price: '', billing_period: 'monthly', min_quantity: '1',
    start_date: '', end_date: '',
  });
  const [addingPlan, setAddingPlan] = useState(false);

  // New variant row state
  const [newVariant, setNewVariant] = useState({ attribute: '', value: '', extra_price: '' });
  const [addingVariant, setAddingVariant] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const loadProducts = useCallback(async () => {
    const { data } = await supabase
      .from('products')
      .select('*, plans(*), product_variants(*)')
      .order('created_at', { ascending: false });
    setProducts((data ?? []) as ProductWithData[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  // ── Refresh selected after mutations ──
  const refreshSelected = async (id: string) => {
    const { data } = await supabase
      .from('products')
      .select('*, plans(*), product_variants(*)')
      .eq('id', id)
      .single();
    if (data) setSelected(data as ProductWithData);
  };

  // ── Save new product ──
  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setFormError('Product name is required'); return; }
    setSaving(true); setFormError('');
    const { data, error } = await supabase.from('products').insert({
      name: form.name.trim(),
      description: form.description || null,
      type: form.type || null,
    }).select('*, plans(*), product_variants(*)').single();

    setSaving(false);
    if (error) { setFormError(error.message); return; }
    setProducts(prev => [data as ProductWithData, ...prev]);
    setSelected(data as ProductWithData);
    setIsNew(false);
    showToast('✓ Product created successfully');
  }

  // ── Add plan row ──
  async function handleAddPlan(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !newPlan.name || !newPlan.price) return;
    setAddingPlan(true);
    const { error } = await supabase.from('plans').insert({
      product_id: selected.id,
      name: newPlan.name,
      price: parseFloat(newPlan.price),
      billing_period: newPlan.billing_period as Plan['billing_period'],
      min_quantity: parseInt(newPlan.min_quantity) || 1,
      start_date: newPlan.start_date || null,
      end_date: newPlan.end_date || null,
    });
    setAddingPlan(false);
    if (error) { showToast('Error: ' + error.message); return; }
    setNewPlan({ name: '', price: '', billing_period: 'monthly', min_quantity: '1', start_date: '', end_date: '' });
    await refreshSelected(selected.id);
    await loadProducts();
    showToast('✓ Plan added');
  }

  // ── Add variant row ──
  async function handleAddVariant(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !newVariant.attribute || !newVariant.value) return;
    setAddingVariant(true);
    const { error } = await supabase.from('product_variants').insert({
      product_id: selected.id,
      attribute: newVariant.attribute,
      value: newVariant.value,
      extra_price: parseFloat(newVariant.extra_price) || 0,
    });
    setAddingVariant(false);
    if (error) { showToast('Error: ' + error.message); return; }
    setNewVariant({ attribute: '', value: '', extra_price: '' });
    await refreshSelected(selected.id);
    showToast('✓ Variant added');
  }

  // ── Delete plan ──
  async function deletePlan(planId: string) {
    await supabase.from('plans').delete().eq('id', planId);
    if (selected) { await refreshSelected(selected.id); await loadProducts(); }
    showToast('Plan removed');
  }

  // ── Delete variant ──
  async function deleteVariant(variantId: string) {
    await supabase.from('product_variants').delete().eq('id', variantId);
    if (selected) await refreshSelected(selected.id);
    showToast('Variant removed');
  }

  const filtered = products.filter(p =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.type ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (p.description ?? '').toLowerCase().includes(search.toLowerCase())
  );

  // ─── FORM VIEW ────────────────────────────────────────────────────────────
  if (view === 'form') {
    const prod = selected;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {toast && <div style={{ position: 'sticky', top: '1rem', zIndex: 50, background: 'var(--success)', color: 'white', padding: '0.75rem 1rem', borderRadius: '8px', fontWeight: 600 }}>{toast}</div>}

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          {/* Breadcrumb + action bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 1rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button onClick={() => { setView('list'); setSelected(null); setIsNew(false); setFormError(''); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                ← Products
              </button>
              <span style={{ color: 'var(--border)' }}>|</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{isNew ? 'New Product' : (prod?.name || '')}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button style={iconBtn} title="Delete">🗑️</button>
              <button style={iconBtn} title="Print">🖨️</button>
              {isNew && (
                <button form="product-form" type="submit" className="btn-primary" style={{ padding: '0.4rem 1.1rem', fontSize: '0.875rem' }} disabled={saving}>
                  {saving ? <span className="spinner" /> : '✓ Save'}
                </button>
              )}
            </div>
          </div>

          <div style={{ padding: '2rem 2.5rem' }}>
            {formError && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{formError}</div>}

            {/* Product Name */}
            <div style={{ marginBottom: '2rem' }}>
              {isNew ? (
                <form id="product-form" onSubmit={handleSaveProduct}>
                  <input
                    id="product-name-input"
                    placeholder="Product Name"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                    style={{
                      fontSize: '1.6rem', fontWeight: 800, fontFamily: "'Manrope', sans-serif",
                      border: 'none', borderBottom: '2px solid var(--accent)', outline: 'none',
                      background: 'transparent', color: 'var(--text-primary)', width: '100%',
                      paddingBottom: '4px',
                    }}
                  />
                </form>
              ) : (
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: "'Manrope', sans-serif", color: 'var(--text-primary)', margin: 0 }}>
                  {prod?.name}
                  <span style={{ marginLeft: '1rem', verticalAlign: 'middle' }}>
                    <TypeBadge type={prod?.type ?? null} />
                  </span>
                </h1>
              )}
              {!isNew && prod?.description && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>{prod.description}</p>
              )}
            </div>

            {/* Fields grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem 4rem', marginBottom: '2.5rem' }}>
              {/* Left column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <FieldRow label="Product Type">
                  {isNew ? (
                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={inlineSel}>
                      {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  ) : (
                    <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{prod?.type || '—'}</span>
                  )}
                </FieldRow>
                <FieldRow label="Sales Price">
                  {isNew ? (
                    <input type="number" value={form.sales_price} onChange={e => setForm(f => ({ ...f, sales_price: e.target.value }))} placeholder="0.00" style={inlineInp} />
                  ) : (
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      {(prod?.plans?.length ?? 0) > 0 ? `₹${Math.min(...(prod?.plans || []).map(p => p.price))}` : '—'}
                    </span>
                  )}
                </FieldRow>
                <FieldRow label="Cost Price">
                  {isNew ? (
                    <input type="number" value={form.cost_price} onChange={e => setForm(f => ({ ...f, cost_price: e.target.value }))} placeholder="0.00" style={inlineInp} />
                  ) : (
                    <span style={{ color: 'var(--text-secondary)' }}>—</span>
                  )}
                </FieldRow>
              </div>
              {/* Right column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <FieldRow label="Tax (%)">
                  {isNew ? (
                    <input type="number" value={form.tax} onChange={e => setForm(f => ({ ...f, tax: e.target.value }))} placeholder="18" style={inlineInp} />
                  ) : (
                    <span style={{ color: 'var(--text-primary)' }}>18%</span>
                  )}
                </FieldRow>
                {!isNew && (
                  <>
                    <FieldRow label="Plans Count">
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{prod?.plans?.length ?? 0}</span>
                    </FieldRow>
                    <FieldRow label="Variants">
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{prod?.product_variants?.length ?? 0}</span>
                    </FieldRow>
                  </>
                )}
                {isNew && (
                  <FieldRow label="Description">
                    <textarea
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Optional product description"
                      rows={2}
                      style={{ ...inlineInp, resize: 'none', fontFamily: 'inherit' }}
                    />
                  </FieldRow>
                )}
              </div>
            </div>

            {/* Tabs — only show for existing products */}
            {!isNew && (
              <>
                <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid var(--border)', marginBottom: '1.5rem' }}>
                  {([['recurring', 'Recurring Prices'], ['variants', 'Variants']] as [FormTab, string][]).map(([t, label]) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      style={{
                        padding: '0.6rem 1.5rem', border: 'none', cursor: 'pointer',
                        background: 'transparent', fontSize: '0.875rem', fontWeight: tab === t ? 700 : 500,
                        color: tab === t ? 'var(--accent)' : 'var(--text-secondary)',
                        borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
                        marginBottom: '-2px', transition: 'all 0.15s',
                      }}
                    >{label}</button>
                  ))}
                </div>

                {/* ── Recurring Prices tab ── */}
                {tab === 'recurring' && (
                  <div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border)' }}>
                          {['Recurring Plan', 'Price (₹)', 'Min Qty', 'Billing', 'Start Date', 'End Date', ''].map(h => (
                            <th key={h} style={{ padding: '0.65rem 0.75rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(prod?.plans || []).map((plan, i) => (
                          <tr key={plan.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)' }}>
                            <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{plan.name}</td>
                            <td style={{ padding: '0.75rem', fontWeight: 700, color: 'var(--accent)' }}>₹{plan.price}</td>
                            <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{plan.min_quantity}</td>
                            <td style={{ padding: '0.75rem' }}>
                              <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '1px 8px', borderRadius: '99px', fontSize: '0.72rem', fontWeight: 700 }}>
                                {plan.billing_period}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{plan.start_date ? new Date(plan.start_date).toLocaleDateString() : '—'}</td>
                            <td style={{ padding: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{plan.end_date ? new Date(plan.end_date).toLocaleDateString() : '—'}</td>
                            <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                              <button onClick={() => deletePlan(plan.id)} title="Remove" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', fontSize: '1rem' }}>✕</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Add plan form */}
                    <form onSubmit={handleAddPlan} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.2fr 1.2fr auto', gap: '0.5rem', marginTop: '0.75rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                      <input placeholder="Plan name e.g. Pro Tier" value={newPlan.name} onChange={e => setNewPlan(p => ({...p, name: e.target.value}))} required style={tblInp} />
                      <input type="number" placeholder="Price" value={newPlan.price} onChange={e => setNewPlan(p => ({...p, price: e.target.value}))} required style={tblInp} />
                      <input type="number" placeholder="Min qty" value={newPlan.min_quantity} onChange={e => setNewPlan(p => ({...p, min_quantity: e.target.value}))} style={tblInp} />
                      <select value={newPlan.billing_period} onChange={e => setNewPlan(p => ({...p, billing_period: e.target.value}))} style={tblSel}>
                        {BILLING_PERIODS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                      <input type="date" value={newPlan.start_date} onChange={e => setNewPlan(p => ({...p, start_date: e.target.value}))} style={tblInp} />
                      <input type="date" value={newPlan.end_date} onChange={e => setNewPlan(p => ({...p, end_date: e.target.value}))} style={tblInp} />
                      <button type="submit" className="btn-primary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }} disabled={addingPlan}>
                        {addingPlan ? '…' : '+ Add'}
                      </button>
                    </form>
                  </div>
                )}

                {/* ── Variants tab ── */}
                {tab === 'variants' && (
                  <div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border)' }}>
                          {['Attribute', 'Values', 'Extra Price (₹)', ''].map(h => (
                            <th key={h} style={{ padding: '0.65rem 0.75rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(prod?.product_variants || []).map((v, i) => (
                          <tr key={v.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)' }}>
                            <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{v.attribute}</td>
                            <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>
                              <span style={{ background: '#ede9fe', color: '#6d28d9', padding: '2px 10px', borderRadius: '99px', fontSize: '0.78rem', fontWeight: 600 }}>{v.value}</span>
                            </td>
                            <td style={{ padding: '0.75rem', fontWeight: 700, color: v.extra_price > 0 ? 'var(--success)' : 'var(--text-secondary)' }}>
                              {v.extra_price > 0 ? `+₹${v.extra_price}` : '—'}
                            </td>
                            <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                              <button onClick={() => deleteVariant(v.id)} title="Remove" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', fontSize: '1rem' }}>✕</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <form onSubmit={handleAddVariant} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.5rem', marginTop: '0.75rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                      <input placeholder="Attribute e.g. Storage" value={newVariant.attribute} onChange={e => setNewVariant(v => ({...v, attribute: e.target.value}))} required style={tblInp} />
                      <input placeholder="Value e.g. 100GB" value={newVariant.value} onChange={e => setNewVariant(v => ({...v, value: e.target.value}))} required style={tblInp} />
                      <input type="number" placeholder="Extra price" value={newVariant.extra_price} onChange={e => setNewVariant(v => ({...v, extra_price: e.target.value}))} style={tblInp} />
                      <button type="submit" className="btn-primary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }} disabled={addingVariant}>
                        {addingVariant ? '…' : '+ Add'}
                      </button>
                    </form>
                  </div>
                )}
              </>
            )}

            {/* Stats row for existing product */}
            {!isNew && prod && (prod.plans?.length ?? 0) > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                {[
                  { label: 'Starting Price', value: `₹${Math.min(...(prod.plans || []).map(p => p.price))}` },
                  { label: 'Total Plans', value: prod.plans?.length ?? 0 },
                  { label: 'Variants', value: prod.product_variants?.length ?? 0 },
                ].map(stat => (
                  <div key={stat.label} style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '10px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>{stat.label}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: "'Manrope', sans-serif", color: 'var(--text-primary)' }}>{stat.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── LIST VIEW ────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {toast && <div style={{ position: 'sticky', top: '1rem', zIndex: 50, background: 'var(--success)', color: 'white', padding: '0.75rem 1rem', borderRadius: '8px', fontWeight: 600 }}>{toast}</div>}

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        {/* Action bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
          <button
            id="new-product-btn"
            className="btn-primary"
            style={{ padding: '0.4rem 1.1rem', fontSize: '0.875rem', fontWeight: 700 }}
            onClick={() => { setIsNew(true); setSelected(null); setTab('recurring'); setForm({ name: '', description: '', type: 'SaaS', sales_price: '', cost_price: '', tax: '18' }); setFormError(''); setView('form'); }}
          >
            + New
          </button>
          <div style={{ display: 'flex', gap: '4px', paddingLeft: '0.5rem', borderLeft: '1px solid var(--border)' }}>
            <button style={iconBtn} title="Print">🖨️</button>
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ position: 'relative', width: '280px' }}>
              <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>🔍</span>
              <input
                id="product-search"
                placeholder="Search products…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', paddingLeft: '2rem', paddingRight: '1rem', height: '34px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
            <div className="spinner" style={{ width: '28px', height: '28px', borderWidth: '3px' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📦</div>
            <p style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>No products yet</p>
            <p style={{ fontSize: '0.875rem' }}>Click <strong>+ New</strong> to create your first product.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border)' }}>
                {['Product Name', 'Type', 'Plans', 'Price From', 'Variants', 'Created'].map(h => (
                  <th key={h} style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((prod, i) => (
                <tr
                  key={prod.id}
                  onClick={() => { setSelected(prod); setIsNew(false); setTab('recurring'); setView('form'); }}
                  style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,90,194,0.06)')}
                  onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)')}
                >
                  <td style={{ padding: '0.9rem 0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--gradient-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1rem', flexShrink: 0 }}>
                        📦
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{prod.name}</div>
                        {prod.description && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '1px' }}>{prod.description.slice(0, 50)}{prod.description.length > 50 ? '…' : ''}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '0.9rem 0.75rem' }}><TypeBadge type={prod.type} /></td>
                  <td style={{ padding: '0.9rem 0.75rem' }}>
                    <span style={{ fontWeight: 700, color: (prod.plans?.length ?? 0) > 0 ? 'var(--accent)' : 'var(--text-muted)' }}>{prod.plans?.length ?? 0}</span>
                  </td>
                  <td style={{ padding: '0.9rem 0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {(prod.plans?.length ?? 0) > 0 ? `₹${Math.min(...(prod.plans || []).map(p => p.price))}` : '—'}
                  </td>
                  <td style={{ padding: '0.9rem 0.75rem', color: 'var(--text-secondary)' }}>{prod.product_variants?.length ?? 0}</td>
                  <td style={{ padding: '0.9rem 0.75rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    {new Date(prod.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && filtered.length > 0 && (
          <div style={{ padding: '0.6rem 1rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)' }}>
            <span>{filtered.length} product{filtered.length !== 1 ? 's' : ''}</span>
            <span>Click a row to view & edit</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
      <label style={{ width: '120px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem', paddingTop: '4px', flexShrink: 0 }}>{label}</label>
      <div style={{ flex: 1, borderBottom: '1px solid var(--border)', paddingBottom: '4px', minHeight: '1.75rem' }}>{children}</div>
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)',
  height: '32px', width: '32px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem',
};
const inlineInp: React.CSSProperties = {
  width: '100%', border: 'none', outline: 'none', background: 'transparent',
  color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'inherit',
};
const inlineSel: React.CSSProperties = {
  border: '1px solid var(--border)', borderRadius: '6px', padding: '2px 8px',
  background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none',
};
const tblInp: React.CSSProperties = {
  padding: '0.4rem 0.5rem', border: '1px solid var(--border)', borderRadius: '6px',
  background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none', width: '100%',
};
const tblSel: React.CSSProperties = {
  ...tblInp, cursor: 'pointer',
};
