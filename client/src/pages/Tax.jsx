import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Tax() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', percentage: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try { const res = await api.get('/tax'); setData(res.data.taxes || []); }
    catch { toast.error('Failed to load taxes'); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.percentage) return toast.error('All fields required');
    setSubmitting(true);
    try {
      await api.post('/tax', { name: form.name, percentage: Number(form.percentage) });
      toast.success('Tax rate created!');
      setShowModal(false);
      setForm({ name: '', percentage: '' });
      fetchData();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    try { await api.delete(`/tax/${id}`); toast.success('Tax deactivated'); fetchData(); }
    catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const gaugeColor = (p) => {
    if (p <= 5) return 'var(--success)';
    if (p <= 18) return 'var(--warning)';
    return 'var(--danger)';
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-left"><h1>Tax Rates</h1><p>Configure tax rates applied to invoices</p></div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Tax Rate</button>
        </div>
      </div>

      {loading ? <div className="loading-spinner"><div className="spinner" /></div> :
       data.length === 0 ? (
         <div className="empty-state"><div className="empty-icon">🧮</div><div className="empty-title">No tax rates defined</div></div>
       ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {data.map(t => (
            <div key={t._id} className="card" style={{ textAlign: 'center', position: 'relative' }}>
              <div style={{ fontSize: 48, fontWeight: 900, color: gaugeColor(t.percentage), marginBottom: 8 }}>
                {t.percentage}%
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{t.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>Applied to invoices automatically</div>
              <div style={{
                height: 6, background: 'var(--bg-secondary)', borderRadius: 99, marginBottom: 16, overflow: 'hidden'
              }}>
                <div style={{ width: `${t.percentage}%`, height: '100%', background: gaugeColor(t.percentage), borderRadius: 99, transition: '0.6s' }} />
              </div>
              <button className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={() => handleDelete(t._id)}>
                Deactivate
              </button>
            </div>
          ))}
        </div>
       )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Add Tax Rate</div>
            <div className="modal-subtitle">Define a new tax rate for invoice calculation</div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Tax Name *</label>
                <input className="form-input" placeholder="e.g. GST 18%" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Percentage (%) *</label>
                <input className="form-input" type="number" min="0" max="100" placeholder="0–100" value={form.percentage} onChange={e => setForm(f => ({...f, percentage: e.target.value}))} />
                {form.percentage && (
                  <div style={{ marginTop: 8, height: 6, background: 'var(--bg-secondary)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(form.percentage, 100)}%`, height: '100%', background: 'var(--accent)', borderRadius: 99 }} />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Create Tax Rate'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
