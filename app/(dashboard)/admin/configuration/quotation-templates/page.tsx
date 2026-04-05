'use client';
// app/(dashboard)/admin/configuration/quotation-templates/page.tsx
// RevFlow — Configuration: Quotation Templates

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { QuotationTemplate, QuotationTemplateItem, Plan, Product } from '@/types/database';

interface QuotationTemplateWithItems extends QuotationTemplate {
  quotation_template_items: (QuotationTemplateItem & { product?: Product })[];
  plan?: Plan;
}

type ViewMode = 'list' | 'form';

export default function QuotationTemplatesPage() {
  const supabase = createClient();
  const [templates, setTemplates] = useState<QuotationTemplateWithItems[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [view, setView] = useState<ViewMode>('list');
  const [selected, setSelected] = useState<QuotationTemplateWithItems | null>(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState({
    name: '',
    quotation_validity: 30,
    recurring_plan_id: '',
    lead_persona: '',
    end_after_months: 12
  });
  
  const [newItem, setNewItem] = useState({ product_id: '', description: '', quantity: 1 });
  const [addingItem, setAddingItem] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const loadData = useCallback(async () => {
    const [tRes, pRes, prodRes] = await Promise.all([
      supabase.from('quotation_templates').select('*, plan:plans(*), quotation_template_items(*, product:products(*))').order('created_at', { ascending: false }),
      supabase.from('plans').select('*'),
      supabase.from('products').select('*')
    ]);
      
    if (tRes.data) setTemplates(tRes.data as any[]);
    if (pRes.data) setPlans(pRes.data as Plan[]);
    if (prodRes.data) setProducts(prodRes.data as Product[]);
    
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  const refreshSelected = async (id: string) => {
    const { data } = await supabase
      .from('quotation_templates')
      .select('*, plan:plans(*), quotation_template_items(*, product:products(*))')
      .eq('id', id)
      .single();
    if (data) setSelected(data as any);
  };

  async function handleSaveTemplate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setFormError('');
    
    const payload = {
      name: form.name.trim() || 'Untitled Template',
      quotation_validity: form.quotation_validity,
      recurring_plan_id: form.recurring_plan_id || null,
      lead_persona: form.lead_persona || null,
      end_after_months: form.end_after_months
    };

    let result;
    if (isNew) {
      result = await supabase.from('quotation_templates').insert(payload).select('*, plan:plans(*), quotation_template_items(*, product:products(*))').single();
    } else {
      result = await supabase.from('quotation_templates').update(payload).eq('id', selected!.id).select('*, plan:plans(*), quotation_template_items(*, product:products(*))').single();
    }

    setSaving(false);
    if (result.error) { setFormError(result.error.message); return; }
    
    setSelected(result.data as any);
    setIsNew(false);
    await loadData();
    showToast(`✓ Template ${isNew ? 'created' : 'updated'}`);
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !newItem.product_id) return;
    setAddingItem(true);
    
    const { error } = await supabase.from('quotation_template_items').insert({
      template_id: selected.id,
      product_id: newItem.product_id,
      description: newItem.description,
      quantity: newItem.quantity
    });
    
    setAddingItem(false);
    if (error) { showToast('Error: ' + error.message); return; }
    
    setNewItem({ product_id: '', description: '', quantity: 1 });
    await refreshSelected(selected.id);
    await loadData();
    showToast('✓ Product added');
  }

  async function deleteItem(id: string) {
    await supabase.from('quotation_template_items').delete().eq('id', id);
    if (selected) await refreshSelected(selected.id);
    await loadData();
  }

  async function deleteTemplate(id: string) {
    if (!confirm('Delete this quotation template?')) return;
    await supabase.from('quotation_templates').delete().eq('id', id);
    setView('list'); setSelected(null);
    await loadData();
    showToast('Template Deleted');
  }

  const filtered = templates.filter(t => !search || (t.name || '').toLowerCase().includes(search.toLowerCase()));

  if (view === 'form') {
    const tmpl = selected;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
        {toast && <div style={{ position: 'sticky', top: '1rem', zIndex: 50, background: 'var(--success)', color: 'white', padding: '0.75rem 1rem', borderRadius: '8px', fontWeight: 600 }}>{toast}</div>}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 1rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button onClick={() => { setView('list'); setSelected(null); setIsNew(false); setFormError(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                ← Quotation Templates
              </button>
              <span style={{ color: 'var(--border)' }}>|</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{isNew ? 'New Template' : (tmpl?.name || 'Untitled')}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {!isNew && tmpl && <button onClick={() => deleteTemplate(tmpl.id)} className="btn-primary" style={{ background: 'var(--error)', borderColor: 'var(--error)' }}>🗑️ Delete</button>}
              <button form="tmpl-form" type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : '✓ Save'}
              </button>
            </div>
          </div>

          <div style={{ padding: '2rem 2.5rem' }}>
            {formError && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{formError}</div>}
            
            <form id="tmpl-form" onSubmit={handleSaveTemplate}>
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Template Name</label>
                <input
                  placeholder="e.g. Enterprise Onboarding Quote"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                  style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: "'Manrope', sans-serif", border: 'none', borderBottom: '2px solid var(--accent)', outline: 'none', background: 'transparent', color: 'var(--text-primary)', width: '100%', paddingBottom: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2.5rem', maxWidth: '600px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <label style={{ width: '180px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Quotation Validity</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                    <input type="number" min="1" value={form.quotation_validity} onChange={e => setForm(f => ({...f, quotation_validity: parseInt(e.target.value)||0}))} style={{ background: 'transparent', border: 'none', outline: 'none', width: '60px', color: 'var(--text-primary)' }} />
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Days</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <label style={{ width: '180px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem', paddingTop: '4px' }}>Recurring Plan</label>
                  <div style={{ flex: 1, borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                    <select value={form.recurring_plan_id} onChange={e => setForm(f => ({...f, recurring_plan_id: e.target.value}))} style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', padding: 0 }}>
                      <option value="">(None)</option>
                      {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <label style={{ width: '180px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem', paddingTop: '4px' }}>Lead Persona</label>
                  <div style={{ flex: 1, borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                    <input value={form.lead_persona} onChange={e => setForm(f => ({...f, lead_persona: e.target.value}))} placeholder="e.g. CIO, VP of Sales" style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <label style={{ width: '180px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>End After</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                    <input type="number" min="1" value={form.end_after_months} onChange={e => setForm(f => ({...f, end_after_months: parseInt(e.target.value)||0}))} style={{ background: 'transparent', border: 'none', outline: 'none', width: '60px', color: 'var(--text-primary)' }} />
                    <select style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      <option>Months</option>
                      <option>Years</option>
                      <option>Weeks</option>
                    </select>
                  </div>
                </div>
              </div>
            </form>

            {!isNew && tmpl && (
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem' }}>Template Products</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border)' }}>
                      <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Product</th>
                      <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Description</th>
                      <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Quantity</th>
                      <th style={{ width: '50px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(tmpl.quotation_template_items || []).map((item, i) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.product?.name || 'Unknown'}</td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{item.description || '—'}</td>
                        <td style={{ padding: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.quantity}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <button onClick={() => deleteItem(item.id)} title="Remove" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', fontSize: '1rem' }}>✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <form onSubmit={handleAddItem} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr auto', gap: '0.5rem', marginTop: '0.75rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <select value={newItem.product_id} onChange={e => setNewItem(v => ({...v, product_id: e.target.value}))} required style={{ padding: '0.4rem 0.5rem', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}>
                    <option value="" disabled>Select Product</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input placeholder="Description snippet" value={newItem.description} onChange={e => setNewItem(v => ({...v, description: e.target.value}))} style={{ padding: '0.4rem 0.5rem', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }} />
                  <input type="number" min="1" placeholder="Quantity" value={newItem.quantity} onChange={e => setNewItem(v => ({...v, quantity: parseInt(e.target.value)||1}))} style={{ padding: '0.4rem 0.5rem', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }} />
                  <button type="submit" className="btn-primary" disabled={addingItem} style={{ padding: '0.4rem 1rem' }}>
                    {addingItem ? '...' : '+ Add'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      {toast && <div style={{ position: 'sticky', top: '1rem', zIndex: 50, background: 'var(--success)', color: 'white', padding: '0.75rem 1rem', borderRadius: '8px', fontWeight: 600 }}>{toast}</div>}
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Configuration / Quotation Templates</h2>
      
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
          <button className="btn-primary" onClick={() => { setIsNew(true); setSelected(null); setForm({ name: '', quotation_validity: 30, recurring_plan_id: '', lead_persona: '', end_after_months: 12 }); setFormError(''); setView('form'); }}>
            + New
          </button>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ position: 'relative', width: '280px' }}>
              <input placeholder="Search templates…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '0.4rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }} />
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p>No quotation templates configured.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Template Name</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Validity</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Line Items</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <tr
                  key={t.id}
                  onClick={() => { setSelected(t); setIsNew(false); setForm({ name: t.name||'', quotation_validity: t.quotation_validity||30, recurring_plan_id: t.recurring_plan_id||'', lead_persona: t.lead_persona||'', end_after_months: t.end_after_months||12 }); setView('form'); }}
                  style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,90,194,0.06)')}
                  onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)')}
                >
                  <td style={{ padding: '0.9rem 0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t.name || 'Untitled'}</td>
                  <td style={{ padding: '0.9rem 0.75rem', color: 'var(--text-secondary)' }}>{t.quotation_validity} Days</td>
                  <td style={{ padding: '0.9rem 0.75rem', color: 'var(--text-secondary)' }}>{t.quotation_template_items?.length || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
