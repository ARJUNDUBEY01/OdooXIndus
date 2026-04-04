import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Invoices() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedInv, setSelectedInv] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const res = await api.get(`/invoices${params}`);
      setData(res.data.invoices || []);
    } catch (e) { toast.error('Failed to load invoices'); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [statusFilter]);

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    setUpdating(true);
    try {
      await api.put(`/invoices/${selectedInv._id}/status`, { status: newStatus });
      toast.success('Invoice status updated');
      setSelectedInv(null);
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Update failed');
    }
    setUpdating(false);
  };

  const statusColor = { draft: '—', confirmed: 'info', paid: 'success' };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Invoices</h1>
          <p>View and manage all billing records</p>
        </div>
      </div>

      <div className="filter-bar">
        <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All</option>
          <option value="draft">Draft</option>
          <option value="confirmed">Confirmed</option>
          <option value="paid">Paid</option>
        </select>
        <button className="btn btn-secondary btn-sm" onClick={fetchData}>🔄 Refresh</button>
      </div>

      <div className="table-wrapper">
        <div className="table-header">
          <div>
            <div className="table-title">All Invoices</div>
            <div className="table-subtitle">{data.length} records</div>
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : data.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🧾</div>
            <div className="empty-title">No invoices found</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr><th>Invoice #</th><th>Customer</th><th>Subscription</th><th>Subtotal</th><th>Tax %</th><th>Discount</th><th>Total</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {data.map(inv => (
                <tr key={inv._id}>
                  <td style={{ fontWeight: 700, color: 'var(--accent-light)', fontSize: 12 }}>{inv.invoiceNumber}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{inv.customer?.name || '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{inv.customer?.email}</div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {inv.subscription?.subscriptionNumber || '—'}
                  </td>
                  <td style={{ fontWeight: 600 }}>₹{inv.subtotal?.toFixed(2)}</td>
                  <td>{inv.tax}%</td>
                  <td style={{ color: 'var(--success)', fontWeight: 600 }}>-₹{inv.discount?.toFixed(2)}</td>
                  <td style={{ fontWeight: 800, color: 'var(--text-primary)' }}>₹{inv.totalAmount?.toFixed(2)}</td>
                  <td><span className={`badge ${inv.status}`}>{inv.status}</span></td>
                  <td>
                    {inv.status !== 'paid' && (
                      <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedInv(inv); setNewStatus(''); }}>
                        Update
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedInv && (
        <div className="modal-overlay" onClick={() => setSelectedInv(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Update Invoice Status</div>
            <div className="modal-subtitle">{selectedInv.invoiceNumber} · ₹{selectedInv.totalAmount?.toFixed(2)}</div>

            <div className="form-group">
              <label className="form-label">New Status</label>
              <select className="form-select" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                <option value="">-- Choose --</option>
                {['draft', 'confirmed', 'paid'].filter(s => s !== selectedInv.status).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedInv(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleStatusUpdate} disabled={updating || !newStatus}>
                {updating ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
