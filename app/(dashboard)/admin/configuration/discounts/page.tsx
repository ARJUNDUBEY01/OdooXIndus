'use client';
// app/(dashboard)/admin/configuration/discounts/page.tsx
// RevFlow — Configuration: Discounts

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Database, Product } from '@/types/database';

type Discount = Database['public']['Tables']['discounts']['Row'];
interface DiscountWithProducts extends Discount {
  discount_products: { product_id: string; product?: Product }[];
}

type ViewMode = 'list' | 'form';

export default function DiscountsPage() {
  const supabase = createClient();
  const [discounts, setDiscounts] = useState<DiscountWithProducts[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [view, setView] = useState<ViewMode>('list');
  const [selected, setSelected] = useState<DiscountWithProducts | null>(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    amount: 0,
    valid_until: '',
    client_always: true,
    applies_to_all_products: true,
    conditionType: 'Quantity' as 'Quantity' | 'Amount',
    conditionValue: 0
  });

  // Track product selection when applies_to_all_products is false
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [addingProduct, setAddingProduct] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const loadData = useCallback(async () => {
    const [dRes, pRes] = await Promise.all([
      supabase.from('discounts').select('*, discount_products(product_id, product:products(*))').order('created_at', { ascending: false }),
      supabase.from('products').select('*')
    ]);
      
    if (dRes.data) setDiscounts(dRes.data as any[]);
    if (pRes.data) setAllProducts(pRes.data as Product[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setFormError('');
    
    // We store condition values inside minimum_quantity or minimum_amount depending on conditionType
    const payload = {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      amount: form.amount,
      valid_until: form.valid_until || null,
      client_always: form.client_always,
      applies_to_all_products: form.applies_to_all_products,
      minimum_quantity: form.conditionType === 'Quantity' ? form.conditionValue : null,
      minimum_amount: form.conditionType === 'Amount' ? form.conditionValue : null
    };

    let discountId = '';

    if (isNew) {
      const { data, error } = await supabase.from('discounts').insert(payload).select().single();
      if (error) { setFormError(error.message); setSaving(false); return; }
      discountId = data.id;
    } else {
      const { data, error } = await supabase.from('discounts').update(payload).eq('id', selected!.id).select().single();
      if (error) { setFormError(error.message); setSaving(false); return; }
      discountId = data.id;
    }

    if (!form.applies_to_all_products) {
      if (!isNew) {
        await supabase.from('discount_products').delete().eq('discount_id', discountId);
      }
      if (selectedProductIds.length > 0) {
        const dpPayload = selectedProductIds.map(pid => ({ discount_id: discountId, product_id: pid }));
        await supabase.from('discount_products').insert(dpPayload);
      }
    } else if (!isNew) {
      await supabase.from('discount_products').delete().eq('discount_id', discountId);
    }

    setSaving(false);
    setIsNew(false);
    await loadData();
    const updated = discounts.find(d => d.id === discountId);
    if (!updated && !isNew) {
      // Just re-fetch completely
      setTimeout(() => loadData(), 500); 
    }
    showToast(`✓ Discount ${isNew ? 'created' : 'updated'}`);
    setView('list');
  }

  async function deleteDiscount(id: string) {
    if (!confirm('Delete this discount?')) return;
    await supabase.from('discounts').delete().eq('id', id);
    setView('list'); setSelected(null);
    await loadData();
    showToast('Discount Deleted');
  }

  const filtered = discounts.filter(d => !search || (d.code || '').toLowerCase().includes(search.toLowerCase()));

  // UI mapping logic
  const handleSelectDiscount = (d: DiscountWithProducts) => {
    setSelected(d);
    setIsNew(false);
    
    // Parse condition
    let cType: 'Quantity'|'Amount' = 'Quantity';
    let cVal = 0;
    if (d.minimum_amount) { cType = 'Amount'; cVal = d.minimum_amount; }
    else if (d.minimum_quantity) { cType = 'Quantity'; cVal = d.minimum_quantity; }

    setForm({
      code: d.code,
      type: d.type as any,
      amount: d.amount,
      valid_until: d.valid_until ? new Date(d.valid_until).toISOString().split('T')[0] : '',
      client_always: d.client_always !== false,
      applies_to_all_products: d.applies_to_all_products !== false,
      conditionType: cType,
      conditionValue: cVal
    });

    if (d.discount_products) {
      setSelectedProductIds(d.discount_products.map(dp => dp.product_id));
    } else {
      setSelectedProductIds([]);
    }
    
    setView('form');
  };

  const handleAddProduct = () => {
    if (addingProduct && !selectedProductIds.includes(addingProduct)) {
      setSelectedProductIds([...selectedProductIds, addingProduct]);
      setAddingProduct('');
    }
  };

  if (view === 'form') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
        {toast && <div style={{ position: 'sticky', top: '1rem', zIndex: 50, background: 'var(--success)', color: 'white', padding: '0.75rem 1rem', borderRadius: '8px', fontWeight: 600 }}>{toast}</div>}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 1rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button onClick={() => { setView('list'); setSelected(null); setIsNew(false); setFormError(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                ← Discounts
              </button>
              <span style={{ color: 'var(--border)' }}>|</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{isNew ? 'New Discount' : form.code}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {!isNew && selected && <button onClick={() => deleteDiscount(selected.id)} className="btn-primary" style={{ background: 'var(--error)', borderColor: 'var(--error)' }}>🗑️ Delete</button>}
              <button form="disc-form" type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : '✓ Save'}
              </button>
            </div>
          </div>

          <div style={{ padding: '2rem 2.5rem' }}>
            {formError && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{formError}</div>}
            
            <form id="disc-form" onSubmit={handleSave}>
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Discount Code</label>
                <input
                  placeholder="e.g. SUMMER24, VIP_DISCOUNT"
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  required
                  style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: "'Manrope', sans-serif", border: 'none', borderBottom: '2px solid var(--accent)', outline: 'none', background: 'transparent', color: 'var(--text-primary)', width: '100%', paddingBottom: '4px', textTransform: 'uppercase' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
                {/* Condition row according to sketch */}
                <div style={{ flex: 1, padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-primary)' }}>Computation & Conditions</h3>
                  
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="radio" name="disc_type" checked={form.type === 'percentage'} onChange={() => setForm(f => ({...f, type: 'percentage'}))} style={{ cursor: 'pointer' }}/>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Percentage</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="radio" name="disc_type" checked={form.type === 'fixed'} onChange={() => setForm(f => ({...f, type: 'fixed'}))} style={{ cursor: 'pointer' }}/>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Fixed Amount</span>
                    </label>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', fontWeight: 700 }}>Apply Discount ({form.type === 'percentage' ? '%' : '₹'})</label>
                      <input type="number" min="0" step="any" required value={form.amount} onChange={e => setForm(f => ({...f, amount: parseFloat(e.target.value)||0}))} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', fontWeight: 700 }}>Apply On Minimum</label>
                      <select value={form.conditionType} onChange={e => setForm(f => ({...f, conditionType: e.target.value as any}))} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                        <option value="Quantity">Quantity</option>
                        <option value="Amount">Amount (₹)</option>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', fontWeight: 700 }}>Value</label>
                      <input type="number" min="0" value={form.conditionValue} onChange={e => setForm(f => ({...f, conditionValue: parseFloat(e.target.value)||0}))} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                    </div>
                  </div>
                </div>

                <div style={{ flex: 1, padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-primary)' }}>Target & Eligibility</h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.client_always} onChange={e => setForm(f => ({ ...f, client_always: e.target.checked }))} style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }} />
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>All Clients</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.applies_to_all_products} onChange={e => setForm(f => ({ ...f, applies_to_all_products: e.target.checked }))} style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }} />
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>All Products</span>
                    </label>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', fontWeight: 700 }}>Valid Until (Optional)</label>
                    <input type="date" value={form.valid_until} onChange={e => setForm(f => ({...f, valid_until: e.target.value}))} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                  </div>

                </div>
              </div>

              {!form.applies_to_all_products && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem' }}>Selected Products</h3>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <select value={addingProduct} onChange={e => setAddingProduct(e.target.value)} style={{ flex: 1, padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none' }}>
                      <option value="">-- Choose Product --</option>
                      {allProducts.filter(p => !selectedProductIds.includes(p.id)).map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <button type="button" onClick={handleAddProduct} className="btn-primary" style={{ padding: '0.4rem 1rem' }} disabled={!addingProduct}>Add</button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedProductIds.map(pid => {
                      const p = allProducts.find(x => x.id === pid);
                      return (
                        <div key={pid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '6px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p?.name || pid}</span>
                          <button type="button" onClick={() => setSelectedProductIds(selectedProductIds.filter(id => id !== pid))} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontWeight: 700 }}>✕</button>
                        </div>
                      )
                    })}
                    {selectedProductIds.length === 0 && (
                      <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.02)', borderRadius: '6px' }}>No products selected. Discount won't apply to anything.</div>
                    )}
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      {toast && <div style={{ position: 'sticky', top: '1rem', zIndex: 50, background: 'var(--success)', color: 'white', padding: '0.75rem 1rem', borderRadius: '8px', fontWeight: 600 }}>{toast}</div>}
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Configuration / Discounts</h2>
      
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
          <button className="btn-primary" onClick={() => { setIsNew(true); setSelected(null); setForm({ code: '', type: 'percentage', amount: 0, valid_until: '', client_always: true, applies_to_all_products: true, conditionType: 'Quantity', conditionValue: 0 }); setSelectedProductIds([]); setFormError(''); setView('form'); }}>
            + New
          </button>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ position: 'relative', width: '280px' }}>
              <input placeholder="Search discounts…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '0.4rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }} />
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p>No discounts configured.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Discount Code</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Discount Amount</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Scope</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => (
                <tr
                  key={d.id}
                  onClick={() => handleSelectDiscount(d)}
                  style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,90,194,0.06)')}
                  onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)')}
                >
                  <td style={{ padding: '0.9rem 0.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{d.code}</td>
                  <td style={{ padding: '0.9rem 0.75rem', color: 'var(--accent)', fontWeight: 700 }}>
                    {d.type === 'percentage' ? `${d.amount}%` : `₹${d.amount}`}
                  </td>
                  <td style={{ padding: '0.9rem 0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {d.client_always ? <span style={{ padding: '2px 6px', background: 'var(--bg-secondary)', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>All Clients</span> : null}
                      {d.applies_to_all_products ? <span style={{ padding: '2px 6px', background: 'var(--bg-secondary)', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>All Products</span> : <span style={{ padding: '2px 6px', background: 'rgba(255,100,0,0.1)', color: '#d97706', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>Specific Products</span>}
                    </div>
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
