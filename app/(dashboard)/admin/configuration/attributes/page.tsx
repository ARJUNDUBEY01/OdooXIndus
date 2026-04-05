'use client';
// app/(dashboard)/admin/configuration/attributes/page.tsx
// RevFlow — Configuration: Attributes (Global attribute catalog)

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Attribute, AttributeValue } from '@/types/database';

interface AttributeWithValues extends Attribute {
  attribute_values: AttributeValue[];
}

type ViewMode = 'list' | 'form';

export default function AttributesPage() {
  const supabase = createClient();
  const [attributes, setAttributes] = useState<AttributeWithValues[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('list');
  const [selected, setSelected] = useState<AttributeWithValues | null>(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  
  // New attribute form state
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState({ name: '' });
  
  // Values rows state
  const [newValue, setNewValue] = useState({ value: '', default_extra_price: '' });
  const [addingValue, setAddingValue] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const loadAttributes = useCallback(async () => {
    // In local postgres without strict configuration, relations might not instantly work for new tables using 'select *, attribute_values(*)' until rest API restarts or we use joins.
    // Assuming standard postgrest introspection works since it's an active dev server, we will query them directly.
    const { data, error } = await supabase
      .from('attributes')
      .select('*, attribute_values(*)')
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setAttributes(data as AttributeWithValues[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadAttributes(); }, [loadAttributes]);

  const refreshSelected = async (id: string) => {
    const { data } = await supabase
      .from('attributes')
      .select('*, attribute_values(*)')
      .eq('id', id)
      .single();
    if (data) setSelected(data as AttributeWithValues);
  };

  async function handleSaveAttribute(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setFormError('Attribute Name is required'); return; }
    setSaving(true); setFormError('');
    
    // Save master record
    const { data, error } = await supabase.from('attributes').insert({
      name: form.name.trim()
    }).select('*, attribute_values(*)').single();

    setSaving(false);
    if (error) { setFormError(error.message); return; }
    
    setAttributes(prev => [data as AttributeWithValues, ...prev]);
    setSelected(data as AttributeWithValues);
    setIsNew(false);
    showToast('✓ Attribute created');
  }

  async function handleAddValue(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !newValue.value.trim()) return;
    setAddingValue(true);
    
    const { error } = await supabase.from('attribute_values').insert({
      attribute_id: selected.id,
      value: newValue.value.trim(),
      default_extra_price: parseFloat(newValue.default_extra_price) || 0
    });
    
    setAddingValue(false);
    if (error) { showToast('Error: ' + error.message); return; }
    
    setNewValue({ value: '', default_extra_price: '' });
    await refreshSelected(selected.id);
    await loadAttributes();
    showToast('✓ Value added');
  }

  async function deleteValue(id: string) {
    await supabase.from('attribute_values').delete().eq('id', id);
    if (selected) await refreshSelected(selected.id);
    await loadAttributes();
  }

  async function deleteAttribute(id: string) {
    if (!confirm('Delete this attribute? This will delete all associated values globally.')) return;
    await supabase.from('attributes').delete().eq('id', id);
    setView('list'); setSelected(null);
    await loadAttributes();
    showToast('Attribute Deleted');
  }

  const filtered = attributes.filter(a =>
    !search || a.name.toLowerCase().includes(search.toLowerCase())
  );

  if (view === 'form') {
    const attr = selected;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
        {toast && <div style={{ position: 'sticky', top: '1rem', zIndex: 50, background: 'var(--success)', color: 'white', padding: '0.75rem 1rem', borderRadius: '8px', fontWeight: 600 }}>{toast}</div>}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 1rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button onClick={() => { setView('list'); setSelected(null); setIsNew(false); setFormError(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                ← Attributes
              </button>
              <span style={{ color: 'var(--border)' }}>|</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{isNew ? 'New Attribute' : (attr?.name || '')}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {!isNew && <button onClick={() => deleteAttribute(attr!.id)} className="btn-primary" style={{ background: 'var(--error)', borderColor: 'var(--error)' }}>🗑️ Delete</button>}
              {isNew && (
                <button form="attr-form" type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : '✓ Save'}
                </button>
              )}
            </div>
          </div>

          <div style={{ padding: '2rem 2.5rem' }}>
            {formError && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{formError}</div>}
            
            <div style={{ marginBottom: '2rem' }}>
              {isNew ? (
                <form id="attr-form" onSubmit={handleSaveAttribute}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Attribute Name</label>
                  <input
                    placeholder="e.g. Color, Brand"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                    style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: "'Manrope', sans-serif", border: 'none', borderBottom: '2px solid var(--accent)', outline: 'none', background: 'transparent', color: 'var(--text-primary)', width: '100%', paddingBottom: '4px' }}
                  />
                </form>
              ) : (
                <>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Attribute Name</label>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: "'Manrope', sans-serif", color: 'var(--text-primary)', margin: 0 }}>
                    {attr?.name}
                  </h1>
                </>
              )}
            </div>

            {!isNew && attr && (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '1rem' }}>Attribute Values</label>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border)' }}>
                      <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Value</th>
                      <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Default Extra Price (₹)</th>
                      <th style={{ width: '50px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(attr.attribute_values || []).map((val, i) => (
                      <tr key={val.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{val.value}</td>
                        <td style={{ padding: '0.75rem', color: val.default_extra_price ? 'var(--success)' : 'var(--text-secondary)' }}>
                          {val.default_extra_price ? `+₹${val.default_extra_price}` : '—'}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <button onClick={() => deleteValue(val.id)} title="Remove" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', fontSize: '1rem' }}>✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <form onSubmit={handleAddValue} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '0.5rem', marginTop: '0.75rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <input placeholder="Value (e.g. Red, Odoo)" value={newValue.value} onChange={e => setNewValue(v => ({...v, value: e.target.value}))} required style={{ padding: '0.4rem 0.5rem', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }} />
                  <input type="number" placeholder="Default Extra Price" value={newValue.default_extra_price} onChange={e => setNewValue(v => ({...v, default_extra_price: e.target.value}))} style={{ padding: '0.4rem 0.5rem', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }} />
                  <button type="submit" className="btn-primary" disabled={addingValue} style={{ padding: '0.4rem 1rem' }}>
                    {addingValue ? '...' : '+ Add'}
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
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Configuration / Attributes</h2>
      
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
          <button className="btn-primary" onClick={() => { setIsNew(true); setSelected(null); setForm({ name: '' }); setFormError(''); setView('form'); }}>
            + New
          </button>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ position: 'relative', width: '280px' }}>
              <input placeholder="Search attributes…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '0.4rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }} />
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p>No attributes configured.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Attribute Name</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Configured Values</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((attr, i) => (
                <tr
                  key={attr.id}
                  onClick={() => { setSelected(attr); setIsNew(false); setView('form'); }}
                  style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,90,194,0.06)')}
                  onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)')}
                >
                  <td style={{ padding: '0.9rem 0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{attr.name}</td>
                  <td style={{ padding: '0.9rem 0.75rem', color: 'var(--text-secondary)' }}>
                    {attr.attribute_values && attr.attribute_values.length > 0 ? (
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {attr.attribute_values.slice(0, 4).map(v => (
                          <span key={v.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>{v.value}</span>
                        ))}
                        {attr.attribute_values.length > 4 && <span>+{attr.attribute_values.length - 4}</span>}
                      </div>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '0.9rem 0.75rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    {new Date(attr.created_at).toLocaleDateString()}
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
