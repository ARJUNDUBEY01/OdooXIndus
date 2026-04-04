import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const EMPTY = { name: '', type: '', salesPrice: '', costPrice: '', variants: [] };

export default function Products() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products');
      setData(res.data.products || []);
    } catch { toast.error('Failed to load products'); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setShowModal(true); };
  const openEdit = (p) => { setEditing(p); setForm({ name: p.name, type: p.type, salesPrice: p.salesPrice, costPrice: p.costPrice }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.type || !form.salesPrice || !form.costPrice) return toast.error('All fields required');
    setSubmitting(true);
    try {
      const payload = { ...form, salesPrice: Number(form.salesPrice), costPrice: Number(form.costPrice) };
      if (editing) {
        await api.put(`/products/${editing._id}`, payload);
        toast.success('Product updated!');
      } else {
        await api.post('/products', payload);
        toast.success('Product created!');
      }
      setShowModal(false);
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Operation failed');
    }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Products</h1>
          <p>Manage your product catalog and pricing</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={openCreate}>+ Add Product</button>
        </div>
      </div>

      <div className="table-wrapper">
        <div className="table-header">
          <div><div className="table-title">Product Catalog</div><div className="table-subtitle">{data.length} products</div></div>
        </div>
        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : data.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <div className="empty-title">No products yet</div>
            <div className="empty-text">Click "Add Product" to get started</div>
          </div>
        ) : (
          <table>
            <thead><tr><th>Name</th><th>Type</th><th>Sales Price</th><th>Cost Price</th><th>Margin</th><th>Variants</th><th>Actions</th></tr></thead>
            <tbody>
              {data.map(p => {
                const margin = p.salesPrice > 0 ? (((p.salesPrice - p.costPrice) / p.salesPrice) * 100).toFixed(1) : 0;
                return (
                  <tr key={p._id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{p.name}</td>
                    <td>
                      <span style={{ background: 'var(--accent-glow)', color: 'var(--accent-light)', padding: '3px 8px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
                        {p.type}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--success)' }}>₹{p.salesPrice?.toLocaleString()}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>₹{p.costPrice?.toLocaleString()}</td>
                    <td>
                      <span style={{ color: Number(margin) > 30 ? 'var(--success)' : 'var(--warning)', fontWeight: 600 }}>{margin}%</span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{p.variants?.length || 0} variants</td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>✏️</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p._id)}>🗑️</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">{editing ? 'Edit Product' : 'New Product'}</div>
            <div className="modal-subtitle">{editing ? 'Update product details' : 'Add a new product to your catalog'}</div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input className="form-input" placeholder="e.g. Basic SaaS License" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Type *</label>
                <input className="form-input" placeholder="e.g. Software, Service" value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))} />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Sales Price (₹) *</label>
                  <input className="form-input" type="number" placeholder="0" value={form.salesPrice} onChange={e => setForm(f => ({...f, salesPrice: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Cost Price (₹) *</label>
                  <input className="form-input" type="number" placeholder="0" value={form.costPrice} onChange={e => setForm(f => ({...f, costPrice: e.target.value}))} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editing ? 'Update' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
