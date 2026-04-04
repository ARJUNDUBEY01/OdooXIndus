import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Tag, Plus, Trash2, X, Percent, Banknote } from 'lucide-react';

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
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">Deal & Discounts</h1>
          <p className="text-text-secondary font-medium">Promotional campaigns and logic handles</p>
        </div>
        <button onClick={() => { setForm(EMPTY); setShowModal(true); }} className="btn btn-primary h-14 px-8 text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-accent/40">+ New Campaign</button>
      </div>

      <div className="card !p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border text-[10px] font-black uppercase tracking-[0.2em] text-text-muted bg-secondary/20">
                <th className="px-8 py-5">Promo Code</th>
                <th className="px-8 py-5">Benefit Type</th>
                <th className="px-8 py-5">Incentive</th>
                <th className="px-8 py-5">Min Spend</th>
                <th className="px-8 py-5">Usage Index</th>
                <th className="px-8 py-5">Expiry</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {data.map(d => {
                const now = new Date();
                const valid = d.isActive && new Date(d.startDate) <= now && new Date(d.endDate) >= now;
                return (
                  <tr key={d._id} className="hover:bg-accent/[0.03] transition-colors group">
                    <td className="px-8 py-6">
                       <div className="font-mono font-black text-accent text-sm tracking-widest bg-accent/5 px-3 py-1 rounded inline-block border border-accent/10 select-all">{d.name}</div>
                    </td>
                    <td className="px-8 py-6 capitalize font-bold text-xs text-text-muted">{d.type}</td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-1.5 font-black text-lg text-success">
                          {d.type === 'percentage' ? <><Percent size={16}/> {d.value}%</> : <><Banknote size={16}/> ₹{d.value}</>}
                       </div>
                    </td>
                    <td className="px-8 py-6 font-bold text-xs text-text-muted">₹{d.minPurchase || 0}</td>
                    <td className="px-8 py-6">
                        <div className="flex flex-col gap-1 w-24">
                           <div className="flex justify-between text-[8px] font-black uppercase text-text-muted">
                              <span>Used</span>
                              <span>{d.usageLimit ? `${Math.round((d.usedCount/d.usageLimit)*100)}%` : 'Unlimited'}</span>
                           </div>
                           <div className="h-1 bg-background rounded-full overflow-hidden">
                              <div className="h-full bg-accent" style={{ width: d.usageLimit ? `${(d.usedCount/d.usageLimit)*100}%` : '50%' }}></div>
                           </div>
                        </div>
                    </td>
                    <td className="px-8 py-6 text-xs font-bold text-text-secondary uppercase">{new Date(d.endDate).toLocaleDateString()}</td>
                    <td className="px-8 py-6">
                       <span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${valid ? 'badge-active' : 'badge-closed'}`}>
                         {valid ? 'LIVE' : 'EXPIRED'}
                       </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <button className="p-2 hover:bg-danger/10 text-text-muted hover:text-danger transition-colors rounded-xl" onClick={() => handleDelete(d._id)}>
                          <Trash2 size={18}/>
                       </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/80 backdrop-blur-md animate-fade-in" onClick={() => setShowModal(false)}>
           <div className="card w-full max-w-lg !shadow-3xl !border-white/10" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-8 px-2">
                 <div>
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Set Deal Config</h2>
                    <p className="text-xs text-text-muted font-bold tracking-widest uppercase mt-1">Define promotional logic & constraints</p>
                 </div>
                 <button onClick={() => setShowModal(false)} className="p-2 hover:bg-secondary rounded-xl text-text-muted transition-colors"><X size={24}/></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted flex items-center gap-2 px-1"><Tag size={12}/> Promo Handle Code</label>
                    <input className="form-input !py-4 font-black tracking-widest" placeholder="e.g. FLASH20" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value.toUpperCase()}))} />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest px-1 text-text-muted">Calculated On</label>
                       <select className="form-select font-bold" value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))}>
                          <option value="percentage" className="bg-secondary">PERCENTAGE (%)</option>
                          <option value="fixed" className="bg-secondary">FIXED RATE (₹)</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest px-1 text-text-muted">Incentive Value</label>
                       <input className="form-input font-black" type="number" placeholder={form.type === 'percentage' ? '%' : '₹'} value={form.value} onChange={e => setForm(f => ({...f, value: e.target.value}))} />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest px-1 text-text-muted">Minimum Spend (₹)</label>
                       <input className="form-input font-black" type="number" value={form.minPurchase} onChange={e => setForm(f => ({...f, minPurchase: e.target.value}))} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest px-1 text-text-muted">Global Usage Limit</label>
                       <input className="form-input font-black" type="number" placeholder="INF" value={form.usageLimit} onChange={e => setForm(f => ({...f, usageLimit: e.target.value}))} />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest px-1 text-text-muted">Lifecycle Start</label>
                       <input className="form-input !py-2.5 font-bold" type="date" value={form.startDate} onChange={e => setForm(f => ({...f, startDate: e.target.value}))} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest px-1 text-text-muted">Expiry Deadline</label>
                       <input className="form-input !py-2.5 font-bold" type="date" value={form.endDate} onChange={e => setForm(f => ({...f, endDate: e.target.value}))} />
                    </div>
                 </div>

                 <div className="modal-footer pt-6 flex gap-4">
                    <button type="button" className="flex-1 py-4 bg-background border border-border text-text-muted hover:text-white font-black text-[10px] uppercase rounded-2xl transition-all" onClick={() => setShowModal(false)}>Cancel</button>
                    <button type="submit" className="flex-[2] btn btn-primary py-4 text-[10px] font-black uppercase tracking-widest" disabled={submitting}>{submitting ? 'Running...' : 'Save Promotion'}</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
