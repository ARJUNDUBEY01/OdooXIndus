'use client';
// app/(dashboard)/subscriptions/page.tsx
// RevFlow — Subscriptions: List view → Detail view + New Subscription Modal

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ERPActionBar from '@/components/ERPActionBar';
import type { Subscription, Plan, User as DBUser } from '@/types/database';

interface PlanWithProduct extends Plan {
  product: { name: string; description: string | null } | null;
}

interface SubscriptionWithDetails extends Subscription {
  plan: PlanWithProduct | null;
  user: { name: string; email: string } | null;
  invoices: { id: string }[];
}

type ViewMode = 'list' | 'detail';

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    active:   { bg: '#dcf8e8', color: '#15803d', label: 'Active' },
    draft:    { bg: '#fef9c3', color: '#854d0e', label: 'In Progress' },
    paused:   { bg: '#fee2e2', color: '#991b1b', label: 'Churned' },
    closed:   { bg: '#e5e7eb', color: '#374151', label: 'Closed' },
  };
  const s = map[status] ?? { bg: '#f3f4f6', color: '#6b7280', label: status };
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '2px 10px', borderRadius: '99px',
      fontSize: '0.75rem', fontWeight: 700, display: 'inline-block',
    }}>{s.label}</span>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function SubscriptionsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [subs, setSubs]             = useState<SubscriptionWithDetails[]>([]);
  const [loading, setLoading]       = useState(true);
  const [view, setView]             = useState<ViewMode>('list');
  const [selectedSub, setSelected]  = useState<SubscriptionWithDetails | null>(null);
  const [search, setSearch]         = useState('');
  const [selected, setChecked]      = useState<Set<string>>(new Set());
  const [toast, setToast]           = useState('');
  const [showNewModal, setNewModal] = useState(false);

  // ── Dropdown data for the New form ──
  const [plans, setPlans]     = useState<PlanWithProduct[]>([]);
  const [users, setUsers]     = useState<Pick<DBUser, 'id' | 'name' | 'email'>[]>([]);
  const [newForm, setNewForm] = useState({
    user_id: '', plan_id: '', status: 'draft' as Subscription['status'],
    start_date: new Date().toISOString().slice(0, 10),
    end_date: '', payment_terms: 'Monthly',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const loadSubs = useCallback(async () => {
    const { data } = await supabase
      .from('subscriptions')
      .select(`*, plan:plans(id,name,price,billing_period,product:products(name,description)), user:users(name,email), invoices(id)`)
      .order('created_at', { ascending: false });
    setSubs((data ?? []) as SubscriptionWithDetails[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadSubs(); }, [loadSubs]);

  // Load dropdown data when modal opens
  useEffect(() => {
    if (!showNewModal) return;
    Promise.all([
      supabase.from('plans').select('id,name,price,billing_period,product:products(name,description)'),
      supabase.from('users').select('id,name,email').eq('role', 'customer'),
    ]).then(([plansRes, usersRes]) => {
      setPlans((plansRes.data ?? []) as unknown as PlanWithProduct[]);
      setUsers((usersRes.data ?? []) as Pick<DBUser, 'id' | 'name' | 'email'>[]);
    });
  }, [showNewModal, supabase]);

  // ── Create new subscription ──
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newForm.user_id || !newForm.plan_id) {
      setFormError('Customer and Plan are required.'); return;
    }
    setSaving(true); setFormError('');
    const { error } = await supabase.from('subscriptions').insert({
      user_id:       newForm.user_id,
      plan_id:       newForm.plan_id,
      status:        newForm.status,
      start_date:    newForm.start_date || null,
      end_date:      newForm.end_date   || null,
      payment_terms: newForm.payment_terms || null,
    });
    setSaving(false);
    if (error) { setFormError(error.message); return; }
    setNewModal(false);
    setNewForm({ user_id:'', plan_id:'', status:'draft', start_date: new Date().toISOString().slice(0,10), end_date:'', payment_terms:'Monthly' });
    showToast('✓ Subscription created successfully');
    loadSubs();
  }

  // ── Delete selected subscriptions ──
  async function handleDeleteSelected() {
    if (selected.size === 0) return;
    const confirmed = window.confirm(`Delete ${selected.size} subscription(s)? This cannot be undone.`);
    if (!confirmed) return;
    for (const id of selected) {
      await supabase.from('subscriptions').delete().eq('id', id);
    }
    setChecked(new Set());
    showToast(`✓ ${selected.size} subscription(s) deleted`);
    loadSubs();
  }

  // ── Send a subscription (update status to hint 'sent') ──
  async function handleSendSub(subId: string) {
    const { error } = await supabase
      .from('subscriptions')
      .update({ payment_terms: 'Quotation Sent' })
      .eq('id', subId);
    if (error) { showToast('Error: ' + error.message); return; }
    showToast('✓ Quotation sent successfully');
    loadSubs();
  }

  // ── Confirm: create invoice then redirect to checkout ──
  async function handleConfirmSub(sub: SubscriptionWithDetails) {
    showToast('Creating invoice…');
    // Try to use existing invoice first
    const existingInvoiceId = sub.invoices?.[0]?.id;
    if (existingInvoiceId) {
      router.push(`/checkout/${existingInvoiceId}`);
      return;
    }
    // Create invoice via RPC
    const { data, error } = await supabase.rpc('create_invoice_for_subscription', {
      p_subscription_id: sub.id,
    });
    if (error) { showToast('Error creating invoice: ' + error.message); return; }
    router.push(`/checkout/${data}`);
  }

  const filtered = subs.filter(s =>
    !search ||
    (s.user?.name?.toLowerCase().includes(search.toLowerCase())) ||
    (s.user?.email?.toLowerCase().includes(search.toLowerCase())) ||
    (s.plan?.name?.toLowerCase().includes(search.toLowerCase())) ||
    s.id.slice(0,8).toLowerCase().includes(search.toLowerCase())
  );


  // ─── DETAIL VIEW ──────────────────────────────────────────────────────────
  if (view === 'detail' && selectedSub) {
    const sub = selectedSub;
    const states = ['Quotation', 'Quotation Sent', 'Confirmed'];
    let currentState = 'Quotation';
    if (sub.status === 'active') currentState = 'Confirmed';
    if (sub.status === 'paused' || sub.status === 'closed') currentState = 'Confirmed';

    return (
      <div style={{ display:'flex', flexDirection:'column', gap:'2rem' }}>
        {toast && (
          <div style={{ position:'sticky', top:'1rem', zIndex:50, background:'var(--success)', color:'white', padding:'0.75rem 1rem', borderRadius:'8px', fontWeight:600 }}>
            {toast}
          </div>
        )}
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'12px', overflow:'hidden' }}>
          {/* Back btn inside action bar area */}
          <div style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'0.6rem 1rem', borderBottom:'1px solid var(--border)', background:'var(--bg-secondary)' }}>
            <button
              onClick={() => { setView('list'); setSelected(null); }}
              style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:'0.4rem', color:'var(--accent)', fontSize:'0.875rem', fontWeight:600 }}
            >
              ← Subscriptions
            </button>
            <span style={{ color:'var(--border)' }}>|</span>
            <span style={{ fontSize:'0.85rem', color:'var(--text-secondary)' }}>
              {sub.id.slice(0,8).toUpperCase()}
            </span>
          </div>

          <ERPActionBar
            states={states}
            currentState={currentState}
            primaryActionText="New"
            secondaryActions={[{ label:'Send', action:'send' }, { label:'Confirm', action:'confirm' }]}
            onAction={(action) => {
              if (action === 'primary') { setView('list'); setNewModal(true); }
              else if (action === 'send') handleSendSub(sub.id);
              else if (action === 'confirm') handleConfirmSub(sub);
              else if (action === 'delete') {
                if (window.confirm('Delete this subscription? This cannot be undone.')) {
                  supabase.from('subscriptions').delete().eq('id', sub.id).then(() => {
                    showToast('✓ Subscription deleted');
                    setView('list');
                    loadSubs();
                  });
                }
              } else if (action === 'print') window.print();
            }}
          />

          <div style={{ padding:'2rem' }}>
            <h1 style={{ fontSize:'1.5rem', fontWeight:800, marginBottom:'2rem', fontFamily:"'Manrope', sans-serif", color:'var(--text-primary)' }}>
              Subscription {sub.id.slice(0,8).toUpperCase()}
              <span style={{ marginLeft:'1rem' }}><StatusBadge status={sub.status} /></span>
            </h1>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'3rem', marginBottom:'3rem' }}>
              <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
                <FormRow label="Customer"         value={sub.user?.name || sub.user?.email || '—'} />
                <FormRow label="Quotation / Plan" value={sub.plan?.name || '—'} />
                <FormRow label="Product"          value={sub.plan?.product?.name || '—'} />
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
                <FormRow label="Start Date"    value={sub.start_date ? new Date(sub.start_date).toLocaleDateString() : '—'} />
                <FormRow label="Expiration"    value={sub.end_date   ? new Date(sub.end_date).toLocaleDateString()   : '—'} />
                <FormRow label="Billing"       value={sub.plan?.billing_period || '—'} />
                <FormRow label="Payment Terms" value={sub.payment_terms || '—'} />
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display:'flex', gap:'1rem', borderBottom:'2px solid var(--border)', marginBottom:'1.5rem' }}>
              <div style={{ padding:'0.5rem 1rem', borderBottom:'2px solid var(--accent)', color:'var(--accent)', fontWeight:700, marginBottom:'-2px', fontSize:'0.875rem' }}>
                Order Lines
              </div>
              <div style={{ padding:'0.5rem 1rem', color:'var(--text-secondary)', fontSize:'0.875rem', cursor:'pointer' }}>
                Other info
              </div>
            </div>

            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.875rem' }}>
              <thead>
                <tr style={{ borderBottom:'2px solid var(--border)', color:'var(--text-secondary)', textAlign:'left' }}>
                  <th style={{ padding:'0.75rem 0.5rem', fontWeight:600 }}>Product</th>
                  <th style={{ padding:'0.75rem 0.5rem', fontWeight:600 }}>Quantity</th>
                  <th style={{ padding:'0.75rem 0.5rem', fontWeight:600 }}>Unit Price</th>
                  <th style={{ padding:'0.75rem 0.5rem', fontWeight:600 }}>Discount</th>
                  <th style={{ padding:'0.75rem 0.5rem', fontWeight:600 }}>Taxes</th>
                  <th style={{ padding:'0.75rem 0.5rem', fontWeight:600 }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom:'1px solid var(--border)' }}>
                  <td style={{ padding:'0.9rem 0.5rem' }}>{sub.plan?.product?.name || 'Item'} — {sub.plan?.name}</td>
                  <td style={{ padding:'0.9rem 0.5rem' }}>1</td>
                  <td style={{ padding:'0.9rem 0.5rem' }}>₹{sub.plan?.price ?? 0}</td>
                  <td style={{ padding:'0.9rem 0.5rem' }}>0%</td>
                  <td style={{ padding:'0.9rem 0.5rem' }}>₹0.00</td>
                  <td style={{ padding:'0.9rem 0.5rem', fontWeight:700 }}>₹{sub.plan?.price ?? 0}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:'1.5rem', paddingTop:'1rem', borderTop:'1px solid var(--border)' }}>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem', textAlign:'right', fontSize:'0.875rem' }}>
                <div style={{ display:'flex', gap:'3rem', justifyContent:'space-between' }}>
                  <span style={{ color:'var(--text-secondary)' }}>Subtotal</span>
                  <span>₹{sub.plan?.price ?? 0}</span>
                </div>
                <div style={{ display:'flex', gap:'3rem', justifyContent:'space-between' }}>
                  <span style={{ color:'var(--text-secondary)' }}>Tax</span>
                  <span>₹0.00</span>
                </div>
                <div style={{ display:'flex', gap:'3rem', justifyContent:'space-between', fontWeight:800, fontSize:'1rem', marginTop:'0.5rem', paddingTop:'0.5rem', borderTop:'2px solid var(--border)' }}>
                  <span>Total</span>
                  <span style={{ color:'var(--accent)' }}>₹{sub.plan?.price ?? 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── LIST VIEW ────────────────────────────────────────────────────────────
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
      {toast && (
        <div style={{ position:'sticky', top:'1rem', zIndex:50, background:'var(--success)', color:'white', padding:'0.75rem 1rem', borderRadius:'8px', fontWeight:600 }}>
          {toast}
        </div>
      )}

      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'12px', overflow:'hidden' }}>
        {/* ── Top action bar ── */}
        <div style={{
          display:'flex', alignItems:'center', gap:'0.75rem',
          padding:'0.75rem 1rem', borderBottom:'1px solid var(--border)',
          background:'var(--bg-secondary)',
        }}>
          {/* New button */}
          <button
            id="new-subscription-btn"
            className="btn-primary"
            style={{ padding:'0.4rem 1.1rem', fontSize:'0.875rem', fontWeight:700 }}
            onClick={() => { setNewModal(true); }}
          >
            + New
          </button>

          {/* Icon actions */}
          <div style={{ display:'flex', gap:'4px', paddingLeft:'0.5rem', borderLeft:'1px solid var(--border)' }}>
            <button
              title={selected.size > 0 ? `Delete ${selected.size} selected` : 'Select rows to delete'}
              style={{ ...iconBtn, opacity: selected.size > 0 ? 1 : 0.4 }}
              onClick={handleDeleteSelected}
            >🗑️</button>
            <button
              title="Print"
              style={iconBtn}
              onClick={() => window.print()}
            >🖨️</button>
          </div>

          {/* Search */}
          <div style={{ flex:1, display:'flex', justifyContent:'flex-end' }}>
            <div style={{ position:'relative', width:'280px' }}>
              <span style={{ position:'absolute', left:'0.75rem', top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', fontSize:'0.9rem' }}>🔍</span>
              <input
                id="subscription-search"
                placeholder="Search customer, plan, ID…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width:'100%', paddingLeft:'2rem', paddingRight:'1rem',
                  height:'34px', borderRadius:'8px', border:'1px solid var(--border)',
                  background:'var(--bg-primary)', color:'var(--text-primary)',
                  fontSize:'0.85rem', outline:'none',
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Table ── */}
        {loading ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'200px' }}>
            <div className="spinner" style={{ width:'28px', height:'28px', borderWidth:'3px' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:'3rem', textAlign:'center', color:'var(--text-secondary)' }}>
            <div style={{ fontSize:'2rem', marginBottom:'0.75rem' }}>📋</div>
            <p style={{ fontWeight:600, marginBottom:'0.5rem' }}>No subscriptions yet</p>
            <p style={{ fontSize:'0.875rem' }}>Click <strong>+ New</strong> to create one manually, or go to Shop.</p>
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.875rem' }}>
            <thead>
              <tr style={{ background:'var(--bg-secondary)', borderBottom:'2px solid var(--border)' }}>
                <th style={{ padding:'0.75rem 0.5rem 0.75rem 1rem', width:'40px' }}>
                  <input
                    type="checkbox"
                    onChange={e => setChecked(e.target.checked ? new Set(filtered.map(s=>s.id)) : new Set())}
                    checked={selected.size === filtered.length && filtered.length > 0}
                    style={{ cursor:'pointer' }}
                  />
                </th>
                {['Number','Customer','Next Invoice','Recurring','Plan','Status'].map(h => (
                  <th key={h} style={{ padding:'0.75rem 0.75rem', textAlign:'left', fontWeight:700, color:'var(--text-secondary)', fontSize:'0.8rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((sub, i) => {
                const isChecked = selected.has(sub.id);
                const nextInvoice = sub.start_date ? new Date(new Date(sub.start_date).getTime() + 30*24*60*60*1000).toLocaleDateString('en-IN',{day:'numeric',month:'short'}) : '—';
                return (
                  <tr
                    key={sub.id}
                    onClick={() => { setSelected(sub); setView('detail'); }}
                    style={{
                      borderBottom:'1px solid var(--border)',
                      cursor:'pointer',
                      background: isChecked ? 'rgba(0,90,194,0.04)' : i%2===0 ? 'transparent' : 'rgba(0,0,0,0.01)',
                      transition:'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,90,194,0.06)')}
                    onMouseLeave={e => (e.currentTarget.style.background = isChecked ? 'rgba(0,90,194,0.04)' : i%2===0 ? 'transparent' : 'rgba(0,0,0,0.01)')}
                  >
                    <td style={{ padding:'0.75rem 0.5rem 0.75rem 1rem' }} onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={e => {
                          const next = new Set(selected);
                          e.target.checked ? next.add(sub.id) : next.delete(sub.id);
                          setChecked(next);
                        }}
                        style={{ cursor:'pointer' }}
                      />
                    </td>
                    <td style={{ padding:'0.75rem', fontFamily:'monospace', fontWeight:700, color:'var(--accent)', fontSize:'0.8rem' }}>
                      S{String(i+1).padStart(4,'0')}
                    </td>
                    <td style={{ padding:'0.75rem' }}>
                      <div style={{ fontWeight:600, color:'var(--text-primary)' }}>{sub.user?.name || '—'}</div>
                      <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)' }}>{sub.user?.email || ''}</div>
                    </td>
                    <td style={{ padding:'0.75rem', color:'var(--text-secondary)' }}>{nextInvoice}</td>
                    <td style={{ padding:'0.75rem', color:'var(--text-secondary)' }}>
                      {sub.plan?.billing_period ? sub.plan.billing_period.charAt(0).toUpperCase() + sub.plan.billing_period.slice(1) : '—'}
                    </td>
                    <td style={{ padding:'0.75rem' }}>
                      <div style={{ color:'var(--text-primary)', fontWeight:500 }}>{sub.plan?.product?.name || '—'}</div>
                      <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)' }}>{sub.plan?.name}</div>
                    </td>
                    <td style={{ padding:'0.75rem' }}><StatusBadge status={sub.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Footer count */}
        {!loading && filtered.length > 0 && (
          <div style={{ padding:'0.6rem 1rem', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'0.8rem', color:'var(--text-secondary)', background:'var(--bg-secondary)' }}>
            <span>{selected.size > 0 ? `${selected.size} selected · ` : ''}{filtered.length} subscription{filtered.length !== 1 ? 's' : ''}</span>
            <span>Click a row to view details</span>
          </div>
        )}
      </div>

      {/* ── NEW SUBSCRIPTION MODAL ── */}
      {showNewModal && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:1000,
          display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem',
        }}
          onClick={() => setNewModal(false)}
        >
          <div
            style={{ background:'var(--bg-card)', borderRadius:'16px', width:'100%', maxWidth:'560px', boxShadow:'0 24px 80px rgba(0,0,0,0.18)', overflow:'hidden' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1.25rem 1.5rem', borderBottom:'1px solid var(--border)', background:'var(--bg-secondary)' }}>
              <div>
                <h2 style={{ fontFamily:"'Manrope',sans-serif", fontWeight:800, fontSize:'1.15rem', color:'var(--text-primary)', margin:0 }}>New Subscription</h2>
                <p style={{ fontSize:'0.8rem', color:'var(--text-secondary)', margin:'2px 0 0' }}>Fill in the details to create a subscription manually.</p>
              </div>
              <button onClick={() => setNewModal(false)} style={{ background:'none', border:'none', fontSize:'1.25rem', cursor:'pointer', color:'var(--text-secondary)', lineHeight:1 }}>✕</button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleCreate}>
              <div style={{ padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1.1rem' }}>
                {formError && <div className="alert alert-error">{formError}</div>}

                {/* Customer */}
                <div>
                  <label style={lbl}>Customer *</label>
                  <select
                    id="new-customer"
                    value={newForm.user_id}
                    onChange={e => setNewForm(f=>({...f, user_id:e.target.value}))}
                    style={sel}
                    required
                  >
                    <option value="">— Select customer —</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                  </select>
                </div>

                {/* Plan */}
                <div>
                  <label style={lbl}>Plan *</label>
                  <select
                    id="new-plan"
                    value={newForm.plan_id}
                    onChange={e => setNewForm(f=>({...f, plan_id:e.target.value}))}
                    style={sel}
                    required
                  >
                    <option value="">— Select plan —</option>
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.product?.name} · {p.name} — ₹{p.price}/{p.billing_period}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label style={lbl}>Initial Status</label>
                  <select
                    id="new-status"
                    value={newForm.status}
                    onChange={e => setNewForm(f=>({...f, status:e.target.value as Subscription['status']}))}
                    style={sel}
                  >
                    <option value="draft">Draft / In Progress</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>

                {/* Dates in a row */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                  <div>
                    <label style={lbl}>Start Date</label>
                    <input type="date" value={newForm.start_date} onChange={e => setNewForm(f=>({...f,start_date:e.target.value}))} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>End Date (optional)</label>
                    <input type="date" value={newForm.end_date} onChange={e => setNewForm(f=>({...f,end_date:e.target.value}))} style={inp} />
                  </div>
                </div>

                {/* Payment Terms */}
                <div>
                  <label style={lbl}>Payment Terms</label>
                  <select
                    id="new-payment-terms"
                    value={newForm.payment_terms}
                    onChange={e => setNewForm(f=>({...f,payment_terms:e.target.value}))}
                    style={sel}
                  >
                    {['Monthly','Quarterly','Yearly','Immediate Payment'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{ padding:'1rem 1.5rem', borderTop:'1px solid var(--border)', display:'flex', gap:'0.75rem', justifyContent:'flex-end', background:'var(--bg-secondary)' }}>
                <button type="button" className="btn-secondary" onClick={() => setNewModal(false)} style={{ padding:'0.55rem 1.25rem' }}>
                  Cancel
                </button>
                <button
                  id="save-subscription-btn"
                  type="submit"
                  className="btn-primary"
                  disabled={saving}
                  style={{ padding:'0.55rem 1.5rem', minWidth:'120px' }}
                >
                  {saving ? <span className="spinner" /> : '✓ Save Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function FormRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display:'flex', alignItems:'baseline', gap:'1rem' }}>
      <label style={{ width:'150px', fontWeight:600, color:'var(--text-secondary)', fontSize:'0.875rem', flexShrink:0 }}>{label}</label>
      <div style={{ flex:1, borderBottom:'1px solid var(--border)', paddingBottom:'3px', color:'var(--text-primary)', minHeight:'1.5rem', fontSize:'0.9rem' }}>{value}</div>
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  background:'transparent', border:'1px solid var(--border)', color:'var(--text-secondary)',
  height:'32px', width:'32px', borderRadius:'6px', cursor:'pointer', fontSize:'0.9rem',
  display:'flex', alignItems:'center', justifyContent:'center',
};
const lbl: React.CSSProperties = {
  display:'block', fontSize:'0.8rem', fontWeight:600, color:'var(--text-secondary)',
  marginBottom:'0.35rem', fontFamily:"'Inter', sans-serif",
};
const sel: React.CSSProperties = {
  width:'100%', padding:'0.55rem 0.75rem', borderRadius:'8px',
  border:'1px solid var(--border)', background:'var(--bg-primary)',
  color:'var(--text-primary)', fontSize:'0.875rem', outline:'none', cursor:'pointer',
};
const inp: React.CSSProperties = {
  width:'100%', padding:'0.55rem 0.75rem', borderRadius:'8px',
  border:'1px solid var(--border)', background:'var(--bg-primary)',
  color:'var(--text-primary)', fontSize:'0.875rem', outline:'none',
};
