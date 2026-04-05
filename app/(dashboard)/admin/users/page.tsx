'use client';
// app/(dashboard)/admin/users/page.tsx
// RevFlow — Admin-only user management with phone, address, city, country

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { UserRole } from '@/types/database';

interface UserFull {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  created_at: string;
}

const ROLE_BADGE: Record<UserRole, { bg: string; color: string }> = {
  admin:    { bg: '#fee2e2', color: '#991b1b' },
  internal: { bg: '#e0f2fe', color: '#0369a1' },
  customer: { bg: '#dcfce7', color: '#15803d' },
};

type DrawerMode = null | 'create' | 'view';

export default function AdminUsersPage() {
  const supabase = createClient();
  const [users, setUsers]       = useState<UserFull[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [drawer, setDrawer]     = useState<DrawerMode>(null);
  const [selected, setSelected] = useState<UserFull | null>(null);
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState('');
  const [form, setForm]         = useState({
    name: '', email: '', role: 'customer' as UserRole,
    phone: '', address: '', city: '', country: 'India',
  });
  const [formError, setFormError] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const loadUsers = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') { setError('Access denied. Admin only.'); setLoading(false); return; }
    const { data, error: dbErr } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (dbErr) setError('Failed to load users');
    else setUsers((data ?? []) as UserFull[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { setFormError('Name and email are required'); return; }
    setSaving(true); setFormError('');
    const { error: insertErr } = await supabase.from('users').insert({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      role: form.role,
      phone: form.phone || null,
      address: form.address || null,
      city: form.city || null,
      country: form.country || 'India',
    });
    setSaving(false);
    if (insertErr) { setFormError(insertErr.message); return; }
    setDrawer(null);
    setForm({ name: '', email: '', role: 'customer', phone: '', address: '', city: '', country: 'India' });
    showToast('✓ User created successfully');
    loadUsers();
  }

  async function handleUpdateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSaving(true); setFormError('');
    const { error: updErr } = await supabase.from('users').update({
      name: form.name.trim(),
      phone: form.phone || null,
      address: form.address || null,
      city: form.city || null,
      country: form.country || 'India',
      role: form.role,
    }).eq('id', selected.id);
    setSaving(false);
    if (updErr) { setFormError(updErr.message); return; }
    setDrawer(null);
    showToast('✓ User updated successfully');
    loadUsers();
  }

  function openView(user: UserFull) {
    setSelected(user);
    setForm({ name: user.name, email: user.email, role: user.role, phone: user.phone ?? '', address: user.address ?? '', city: user.city ?? '', country: user.country ?? 'India' });
    setFormError('');
    setDrawer('view');
  }

  function openCreate() {
    setSelected(null);
    setForm({ name: '', email: '', role: 'customer', phone: '', address: '', city: '', country: 'India' });
    setFormError('');
    setDrawer('create');
  }

  const filtered = users.filter(u =>
    !search ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.phone ?? '').includes(search) ||
    (u.city ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const roleCounts = { admin: 0, internal: 0, customer: 0 };
  users.forEach(u => { roleCounts[u.role] = (roleCounts[u.role] ?? 0) + 1; });

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="spinner" style={{ width: '32px', height: '32px', borderWidth: '3px' }} />
      </div>
    );
  }

  if (error && users.length === 0) {
    return <div className="alert alert-error">{error}</div>;
  }

  return (
    <div className="animate-fade-in">
      {toast && (
        <div style={{ position: 'fixed', top: '5rem', right: '1.5rem', zIndex: 1000, background: 'var(--success)', color: 'white', padding: '0.75rem 1.25rem', borderRadius: '10px', fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.2rem', fontFamily: "'Manrope', sans-serif", color: 'var(--text-primary)' }}>
            Users / Contacts
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{users.length} registered users</p>
        </div>
        <button id="create-user-btn" className="btn-primary" style={{ padding: '0.55rem 1.25rem' }} onClick={openCreate}>
          + New User
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {(['admin', 'internal', 'customer'] as UserRole[]).map(role => {
          const rb = ROLE_BADGE[role];
          return (
            <div key={role} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: rb.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                {role === 'admin' ? '🛡️' : role === 'internal' ? '👔' : '👤'}
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{role}</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: rb.color, fontFamily: "'Manrope', sans-serif" }}>{roleCounts[role]}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table card */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        {/* Search bar */}
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
            <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</span>
            <input
              placeholder="Search name, email, phone, city…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: '2rem', paddingRight: '1rem', height: '34px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none' }}
            />
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>{filtered.length} of {users.length} users</span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border)' }}>
              {['User', 'Email', 'Phone', 'City', 'Role', 'Joined', ''].map(h => (
                <th key={h} style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((user, i) => {
              const rb = ROLE_BADGE[user.role as UserRole] ?? { bg: '#f3f4f6', color: '#6b7280' };
              return (
                <tr
                  key={user.id}
                  style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,90,194,0.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)')}
                  onClick={() => openView(user)}
                >
                  <td style={{ padding: '0.9rem 0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--gradient-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '0.9rem 0.75rem', color: 'var(--text-secondary)' }}>{user.email}</td>
                  <td style={{ padding: '0.9rem 0.75rem', color: user.phone ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '0.85rem' }}>{user.phone || '—'}</td>
                  <td style={{ padding: '0.9rem 0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{user.city || '—'}</td>
                  <td style={{ padding: '0.9rem 0.75rem' }}>
                    <span style={{ background: rb.bg, color: rb.color, padding: '2px 10px', borderRadius: '99px', fontSize: '0.72rem', fontWeight: 700 }}>{user.role}</span>
                  </td>
                  <td style={{ padding: '0.9rem 0.75rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    {new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '0.9rem 0.75rem', textAlign: 'right' }}>
                    <button
                      style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.78rem', color: 'var(--text-secondary)' }}
                      onClick={e => { e.stopPropagation(); openView(user); }}
                    >Edit</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && !loading && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>👥</div>
            <p style={{ fontWeight: 600 }}>No users found</p>
          </div>
        )}
      </div>

      {/* ── SLIDE-IN DRAWER ── */}
      {drawer && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 900 }}
            onClick={() => setDrawer(null)}
          />
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: '480px', maxWidth: '95vw',
            background: 'var(--bg-card)', zIndex: 1000, boxShadow: '-8px 0 40px rgba(0,0,0,0.15)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            {/* Drawer header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
              <div>
                <h2 style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)' }}>
                  {drawer === 'create' ? '+ New User' : selected?.name}
                </h2>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                  {drawer === 'create' ? 'Fill in user details to create an account record' : 'Edit user profile and contact info'}
                </p>
              </div>
              <button onClick={() => setDrawer(null)} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>✕</button>
            </div>

            {/* Drawer body */}
            <form onSubmit={drawer === 'create' ? handleCreate : handleUpdateUser} style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {formError && <div className="alert alert-error">{formError}</div>}

              {/* Avatar (view mode) */}
              {drawer === 'view' && selected && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '12px', marginBottom: '0.5rem' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'var(--gradient-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 800, color: 'white', flexShrink: 0 }}>
                    {selected.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>{selected.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{selected.email}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Joined {new Date(selected.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  </div>
                </div>
              )}

              <DrawerField label="Full Name *">
                <input type="text" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required style={drawerInp} placeholder="e.g. Rakshanraj K" />
              </DrawerField>

              {drawer === 'create' && (
                <DrawerField label="Email Address *">
                  <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} required style={drawerInp} placeholder="user@company.com" />
                </DrawerField>
              )}

              <DrawerField label="Phone Number">
                <input type="tel" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} style={drawerInp} placeholder="+91 98765 43210" />
              </DrawerField>

              <DrawerField label="Role">
                <select value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value as UserRole}))} style={drawerSel}>
                  <option value="customer">Customer</option>
                  <option value="internal">Internal</option>
                  <option value="admin">Admin</option>
                </select>
              </DrawerField>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.1rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>📍 Address</p>

                <DrawerField label="Street Address">
                  <textarea value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} style={{ ...drawerInp, resize: 'none', minHeight: '60px' }} placeholder="123 MG Road, Flat 4B" rows={2} />
                </DrawerField>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <DrawerField label="City">
                    <input type="text" value={form.city} onChange={e => setForm(f => ({...f, city: e.target.value}))} style={drawerInp} placeholder="Bangalore" />
                  </DrawerField>
                  <DrawerField label="Country">
                    <input type="text" value={form.country} onChange={e => setForm(f => ({...f, country: e.target.value}))} style={drawerInp} placeholder="India" />
                  </DrawerField>
                </div>
              </div>

              {drawer === 'create' && (
                <div style={{ padding: '0.75rem', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '0.8rem', color: '#78350f' }}>
                  ⚠️ This creates a <strong>profile record only</strong>. To enable login, create the auth account in <strong>Supabase Dashboard → Authentication → Users</strong> using the same email.
                </div>
              )}
            </form>

            {/* Drawer footer */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', background: 'var(--bg-secondary)' }}>
              <button type="button" className="btn-secondary" onClick={() => setDrawer(null)} style={{ padding: '0.55rem 1.25rem' }}>Cancel</button>
              <button
                type="submit"
                form="user-drawer-form"
                className="btn-primary"
                disabled={saving}
                style={{ padding: '0.55rem 1.5rem', minWidth: '120px' }}
                onClick={drawer === 'create' ? handleCreate : handleUpdateUser}
              >
                {saving ? <span className="spinner" /> : drawer === 'create' ? '✓ Create User' : '✓ Save Changes'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DrawerField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem', letterSpacing: '0.03em' }}>{label}</label>
      {children}
    </div>
  );
}

const drawerInp: React.CSSProperties = {
  width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px',
  border: '1px solid var(--border)', background: 'var(--bg-primary)',
  color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
};
const drawerSel: React.CSSProperties = { ...drawerInp, cursor: 'pointer' };
