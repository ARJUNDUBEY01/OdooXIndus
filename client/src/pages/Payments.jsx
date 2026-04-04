import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ invoice: '', method: 'card', amount: '', note: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, iRes] = await Promise.all([
        api.get('/payments'),
        api.get('/invoices?status=confirmed'),
      ]);
      setPayments(pRes.data.payments || []);
      setInvoices(iRes.data.invoices || []);
    } catch (e) { toast.error('Failed to load'); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.invoice || !form.amount) return toast.error('Invoice and amount required');
    setSubmitting(true);
    try {
      const res = await api.post('/payments', {
        invoice: form.invoice,
        method: form.method,
        amount: Number(form.amount),
        note: form.note,
      });
      toast.success(res.data.message || 'Payment recorded!');
      setShowModal(false);
      setForm({ invoice: '', method: 'card', amount: '', note: '' });
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Payment failed');
    }
    setSubmitting(false);
  };

  const METHODS = ['cash', 'card', 'bank_transfer', 'upi', 'cheque', 'online'];
  const methodEmoji = { cash: '💵', card: '💳', bank_transfer: '🏦', upi: '📱', cheque: '📄', online: '🌐' };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Payments</h1>
          <p>Record and track all payment transactions</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Record Payment
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <div className="table-header">
          <div>
            <div className="table-title">Payment History</div>
            <div className="table-subtitle">{payments.length} transactions</div>
          </div>
        </div>
        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : payments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💳</div>
            <div className="empty-title">No payments yet</div>
            <div className="empty-text">Record your first payment above</div>
          </div>
        ) : (
          <table>
            <thead><tr><th>Invoice</th><th>Customer</th><th>Method</th><th>Amount</th><th>Date</th><th>Invoice Status</th></tr></thead>
            <tbody>
              {payments.map(p => (
                <tr key={p._id}>
                  <td style={{ fontWeight: 600, color: 'var(--accent-light)', fontSize: 12 }}>
                    {p.invoice?.invoiceNumber || '—'}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{p.invoice?.customer?.name || '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.invoice?.customer?.email}</div>
                  </td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{methodEmoji[p.method] || '💳'}</span>
                      <span style={{ textTransform: 'capitalize' }}>{p.method?.replace('_', ' ')}</span>
                    </span>
                  </td>
                  <td style={{ fontWeight: 800, color: 'var(--success)', fontSize: 15 }}>₹{p.amount?.toFixed(2)}</td>
                  <td style={{ fontSize: 12 }}>{new Date(p.date).toLocaleDateString()}</td>
                  <td><span className={`badge ${p.invoice?.status}`}>{p.invoice?.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Record Payment</div>
            <div className="modal-subtitle">Link payment to a confirmed invoice</div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Invoice *</label>
                <select className="form-select" value={form.invoice} onChange={e => setForm(f => ({...f, invoice: e.target.value}))}>
                  <option value="">Select confirmed invoice</option>
                  {invoices.map(i => (
                    <option key={i._id} value={i._id}>
                      {i.invoiceNumber} — {i.customer?.name} — ₹{i.totalAmount?.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Amount (₹) *</label>
                  <input className="form-input" type="number" placeholder="0.00" value={form.amount}
                    onChange={e => setForm(f => ({...f, amount: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Method *</label>
                  <select className="form-select" value={form.method} onChange={e => setForm(f => ({...f, method: e.target.value}))}>
                    {METHODS.map(m => <option key={m} value={m}>{methodEmoji[m]} {m.replace('_', ' ')}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Note (optional)</label>
                <input className="form-input" placeholder="Payment note..." value={form.note}
                  onChange={e => setForm(f => ({...f, note: e.target.value}))} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Processing...' : '💳 Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
