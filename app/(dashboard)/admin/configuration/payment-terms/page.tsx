'use client';
// app/(dashboard)/admin/configuration/payment-terms/page.tsx
// RevFlow — Configuration: Payment Terms

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type PaymentTerm = Database['public']['Tables']['payment_terms']['Row'];
type ViewMode = 'list' | 'form';

export default function PaymentTermsPage() {
  const supabase = createClient();
  const [terms, setTerms] = useState<PaymentTerm[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [view, setView] = useState<ViewMode>('list');
  const [selected, setSelected] = useState<PaymentTerm | null>(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    days: 0
  });

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const loadData = useCallback(async () => {
    const { data, error } = await supabase
      .from('payment_terms')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setTerms(data as PaymentTerm[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setFormError('');
    
    const payload = {
      name: form.name.trim(),
      description: form.description || null,
      days: form.days
    };

    let result;
    if (isNew) {
      result = await supabase.from('payment_terms').insert(payload).select().single();
    } else {
      result = await supabase.from('payment_terms').update(payload).eq('id', selected!.id).select().single();
    }

    setSaving(false);
    if (result.error) { setFormError(result.error.message); return; }
    
    setSelected(result.data as PaymentTerm);
    setIsNew(false);
    await loadData();
    showToast(`✓ term ${isNew ? 'created' : 'updated'}`);
  }

  async function deleteTerm(id: string) {
    if (!confirm('Delete this payment term?')) return;
    await supabase.from('payment_terms').delete().eq('id', id);
    setView('list'); setSelected(null);
    await loadData();
    showToast('Payment term deleted');
  }

  const filtered = terms.filter(t => !search || (t.name || '').toLowerCase().includes(search.toLowerCase()));

  if (view === 'form') {
    const term = selected;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
        {toast && <div style={{ position: 'sticky', top: '1rem', zIndex: 50, background: 'var(--success)', color: 'white', padding: '0.75rem 1rem', borderRadius: '8px', fontWeight: 600 }}>{toast}</div>}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 1rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button onClick={() => { setView('list'); setSelected(null); setIsNew(false); setFormError(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                ← Payment Terms
              </button>
              <span style={{ color: 'var(--border)' }}>|</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{isNew ? 'New Payment Term' : (term?.name || '')}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {!isNew && term && <button onClick={() => deleteTerm(term.id)} className="btn-primary" style={{ background: 'var(--error)', borderColor: 'var(--error)' }}>🗑️ Delete</button>}
              <button form="term-form" type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : '✓ Save'}
              </button>
            </div>
          </div>

          <div style={{ padding: '2rem 2.5rem' }}>
            {formError && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{formError}</div>}
            
            <form id="term-form" onSubmit={handleSave}>
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Term Name</label>
                <input
                  placeholder="e.g. Net 30, Due on Receipt"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                  style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: "'Manrope', sans-serif", border: 'none', borderBottom: '2px solid var(--accent)', outline: 'none', background: 'transparent', color: 'var(--text-primary)', width: '100%', paddingBottom: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <label style={{ width: '150px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Due In (Days)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                    <input type="number" min="0" value={form.days} onChange={e => setForm(f => ({...f, days: parseInt(e.target.value)||0}))} style={{ background: 'transparent', border: 'none', outline: 'none', width: '100px', color: 'var(--text-primary)' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <label style={{ width: '150px', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem', paddingTop: '4px' }}>Description</label>
                  <div style={{ flex: 1, borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                    <textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Optional instructions..." rows={3} style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', resize: 'none' }} />
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
      {toast && <div style={{ position: 'sticky', top: '1rem', zIndex: 50, background: 'var(--success)', color: 'white', padding: '0.75rem 1rem', borderRadius: '8px', fontWeight: 600 }}>{toast}</div>}
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Configuration / Payment Terms</h2>
      
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
          <button className="btn-primary" onClick={() => { setIsNew(true); setSelected(null); setForm({ name: '', description: '', days: 0 }); setFormError(''); setView('form'); }}>
            + New
          </button>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ position: 'relative', width: '280px' }}>
              <input placeholder="Search terms…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '0.4rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }} />
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p>No payment terms configured.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Term Name</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Due Days</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <tr
                  key={t.id}
                  onClick={() => { setSelected(t); setIsNew(false); setForm({ name: t.name, description: t.description||'', days: t.days }); setView('form'); }}
                  style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,90,194,0.06)')}
                  onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)')}
                >
                  <td style={{ padding: '0.9rem 0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t.name}</td>
                  <td style={{ padding: '0.9rem 0.75rem', color: 'var(--text-secondary)' }}>{t.days} Days</td>
                  <td style={{ padding: '0.9rem 0.75rem', color: 'var(--text-secondary)' }}>{t.description || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
