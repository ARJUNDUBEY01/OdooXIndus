import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Subscriptions() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedSub, setSelectedSub] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  const STATUSES = ['draft', 'quotation', 'confirmed', 'active', 'paused', 'closed'];

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const res = await api.get(`/subscriptions${params}`);
      setData(res.data.subscriptions || []);
    } catch (e) {
      toast.error('Failed to load subscriptions');
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [statusFilter]);

  const handleStatusUpdate = async () => {
    if (!newStatus) return toast.error('Select a status');
    setUpdating(true);
    try {
      await api.put(`/subscriptions/${selectedSub._id}/status`, { status: newStatus });
      toast.success(`Status updated to "${newStatus}"`);
      setSelectedSub(null);
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Update failed');
    }
    setUpdating(false);
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Subscriptions</h1>
          <p>Manage all subscription lifecycles and transitions</p>
        </div>
      </div>

      <div className="filter-bar">
        <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ minWidth: 160 }}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="btn btn-secondary btn-sm" onClick={fetchData}>🔄 Refresh</button>
      </div>

      <div className="table-wrapper">
        <div className="table-header">
          <div>
            <div className="table-title">All Subscriptions</div>
            <div className="table-subtitle">{data.length} records found</div>
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : data.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔄</div>
            <div className="empty-title">No subscriptions found</div>
            <div className="empty-text">Create subscriptions via the API or Postman</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Sub #</th>
                <th>Customer</th>
                <th>Plan</th>
                <th>Start</th>
                <th>Expiry</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map(sub => (
                <tr key={sub._id}>
                  <td style={{ fontWeight: 700, color: 'var(--accent-light)', fontSize: 12 }}>
                    {sub.subscriptionNumber}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>
                      {sub.customer?.name || '—'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub.customer?.email}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{sub.plan?.name || '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>₹{sub.plan?.price}/{sub.plan?.billingPeriod}</div>
                  </td>
                  <td style={{ fontSize: 12 }}>{sub.startDate ? new Date(sub.startDate).toLocaleDateString() : '—'}</td>
                  <td style={{ fontSize: 12 }}>{sub.expirationDate ? new Date(sub.expirationDate).toLocaleDateString() : '—'}</td>
                  <td><span className={`badge ${sub.status}`}>{sub.status}</span></td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => { setSelectedSub(sub); setNewStatus(''); }}
                    >
                      Change Status
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Status Update Modal */}
      {selectedSub && (
        <div className="modal-overlay" onClick={() => setSelectedSub(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Update Subscription Status</div>
            <div className="modal-subtitle">
              {selectedSub.subscriptionNumber} · Current: <span className={`badge ${selectedSub.status}`}>{selectedSub.status}</span>
            </div>

            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: 16,
              marginBottom: 20,
              fontSize: 13
            }}>
              <div style={{ color: 'var(--text-muted)', marginBottom: 8, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Lifecycle</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                {['draft','quotation','confirmed','active','closed'].map((s, i, arr) => (
                  <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: s === selectedSub.status ? 'var(--accent-light)' : 'var(--text-muted)', fontWeight: s === selectedSub.status ? 700 : 400 }}>{s}</span>
                    {i < arr.length - 1 && <span style={{ color: 'var(--text-muted)' }}>→</span>}
                  </span>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Select New Status</label>
              <select className="form-select" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                <option value="">-- Choose --</option>
                {STATUSES.filter(s => s !== selectedSub.status).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedSub(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleStatusUpdate} disabled={updating}>
                {updating ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
