import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const EMPTY = { name: '', price: '', billingPeriod: 'monthly', minQuantity: 1, startDate: '', endDate: '', options: { autoClose: false, closable: true, pausable: false, renewable: true } };

export default function Plans() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/plans');
      setData(res.data.plans || []);
    } catch { toast.error('Failed to load plans'); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setShowModal(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name, price: p.price, billingPeriod: p.billingPeriod, minQuantity: p.minQuantity,
      startDate: p.startDate?.slice(0, 10), endDate: p.endDate?.slice(0, 10), options: p.options || EMPTY.options,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, price: Number(form.price), minQuantity: Number(form.minQuantity) };
      if (editing) {
        await api.put(`/plans/${editing._id}`, payload);
        toast.success('Plan updated!');
      } else {
        await api.post('/plans', payload);
        toast.success('Plan created!');
      }
      setShowModal(false);
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Operation failed');
    }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this plan?')) return;
    try {
      await api.delete(`/plans/${id}`);
      toast.success('Plan deleted');
      fetchData();
    } catch (e) { toast.error(e.response?.data?.message || 'Delete failed'); }
  };

  const periodColors = { daily: 'var(--info)', weekly: 'var(--accent-light)', monthly: 'var(--success)', yearly: 'var(--warning)' };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-left"><h1>Plans</h1><p>Configure subscription plans and billing periods</p></div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={openCreate}>+ Create Plan</button>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : data.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">🔁</div><div className="empty-title">No plans yet</div></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {data.map(p => {
            const now = new Date();
            const isActive = new Date(p.startDate) <= now && new Date(p.endDate) >= now;
            return (
              <div key={p._id} className="card" style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: 16, right: 16 }}>
                  <span className={`badge ${isActive ? 'active' : 'closed'}`}>{isActive ? 'Active' : 'Expired'}</span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 6 }}>
                    Subscription Plan
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>{p.name}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 16 }}>
                  <span style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)' }}>₹{p.price?.toLocaleString()}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/ {p.billingPeriod}</span>
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                  {['autoClose', 'closable', 'pausable', 'renewable'].map(opt => (
                    p.options?.[opt] && (
                      <span key={opt} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: 'var(--bg-secondary)', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {opt}
                      </span>
                    )
                  ))}
                </div>

                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>
                  Min qty: {p.minQuantity} · {new Date(p.startDate).toLocaleDateString()} – {new Date(p.endDate).toLocaleDateString()}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => openEdit(p)}>✏️ Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p._id)}>🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">{editing ? 'Edit Plan' : 'New Plan'}</div>
            <div className="modal-subtitle">Configure billing details and options</div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Plan Name *</label>
                <input className="form-input" placeholder="e.g. Pro Monthly" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Price (₹) *</label>
                  <input className="form-input" type="number" value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Billing Period *</label>
                  <select className="form-select" value={form.billingPeriod} onChange={e => setForm(f => ({...f, billingPeriod: e.target.value}))}>
                    {['daily','weekly','monthly','yearly'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Start Date *</label>
                  <input className="form-input" type="date" value={form.startDate} onChange={e => setForm(f => ({...f, startDate: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date *</label>
                  <input className="form-input" type="date" value={form.endDate} onChange={e => setForm(f => ({...f, endDate: e.target.value}))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Options</label>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {['autoClose', 'closable', 'pausable', 'renewable'].map(opt => (
                    <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: 'var(--text-secondary)' }}>
                      <input type="checkbox" checked={!!form.options?.[opt]}
                        onChange={e => setForm(f => ({...f, options: {...f.options, [opt]: e.target.checked}}))} />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editing ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
