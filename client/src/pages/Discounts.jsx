import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const EMPTY = { name: '', type: 'percentage', value: '', minPurchase: 0, minQuantity: 1, startDate: '', endDate: '', usageLimit: '' };

export default function Discounts() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try { const res = await api.get('/discounts'); setData(res.data.discounts || []); }
    catch { toast.error('Failed to load discounts'); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/discounts', { ...form, value: Number(form.value), minPurchase: Number(form.minPurchase), minQuantity: Number(form.minQuantity), usageLimit: form.usageLimit ? Number(form.usageLimit) : null });
      toast.success('Discount created!');
      setShowModal(false);
      setForm(EMPTY);
      fetchData();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this discount?')) return;
    try { await api.delete(`/discounts/${id}`); toast.success('Deleted'); fetchData(); }
    catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-left"><h1>Discounts</h1><p>Manage promotional codes and discount rules</p></div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => { setForm(EMPTY); setShowModal(true); }}>+ Create Discount</button>
        </div>
      </div>

      <div className="table-wrapper">
        <div className="table-header"><div><div className="table-title">Discount Codes</div><div className="table-subtitle">{data.length} discounts</div></div></div>
        {loading ? <div className="loading-spinner"><div className="spinner" /></div> :
         data.length === 0 ? <div className="empty-state"><div className="empty-icon">🎯</div><div className="empty-title">No discounts yet</div></div> :
        <table>
          <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Min Purchase</th><th>Usage</th><th>Valid Until</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {data.map(d => {
              const now = new Date();
              const valid = d.isActive && new Date(d.startDate) <= now && new Date(d.endDate) >= now;
              return (
                <tr key={d._id}>
                  <td style={{ fontWeight: 800, color: 'var(--accent-light)', letterSpacing: 1, fontSize: 13 }}>{d.name}</td>
                  <td>
                    <span style={{ background: d.type === 'percentage' ? 'var(--info-bg)' : 'var(--success-bg)', color: d.type === 'percentage' ? 'var(--info)' : 'var(--success)', padding: '3px 8px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
                      {d.type === 'percentage' ? '%' : 'Fixed'} {d.type}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--success)', fontSize: 15 }}>
                    {d.type === 'percentage' ? `${d.value}%` : `₹${d.value}`}
                  </td>
                  <td>₹{d.minPurchase || 0}</td>
                  <td style={{ fontSize: 12 }}>{d.usedCount}/{d.usageLimit ?? '∞'}</td>
                  <td style={{ fontSize: 12 }}>{new Date(d.endDate).toLocaleDateString()}</td>
                  <td><span className={`badge ${valid ? 'active' : 'closed'}`}>{valid ? 'Valid' : 'Expired'}</span></td>
                  <td><button className="btn btn-danger btn-sm" onClick={() => handleDelete(d._id)}>🗑️</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Create Discount</div>
            <div className="modal-subtitle">Set up a promotional discount code</div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Code Name *</label>
                <input className="form-input" placeholder="e.g. SAVE20" style={{ textTransform: 'uppercase' }} value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value.toUpperCase()}))} />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Type *</label>
                  <select className="form-select" value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Value *</label>
                  <input className="form-input" type="number" placeholder={form.type === 'percentage' ? '0-100' : '0'} value={form.value} onChange={e => setForm(f => ({...f, value: e.target.value}))} />
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Min Purchase (₹)</label>
                  <input className="form-input" type="number" value={form.minPurchase} onChange={e => setForm(f => ({...f, minPurchase: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Usage Limit</label>
                  <input className="form-input" type="number" placeholder="Unlimited" value={form.usageLimit} onChange={e => setForm(f => ({...f, usageLimit: e.target.value}))} />
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
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Creating...' : 'Create Discount'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
