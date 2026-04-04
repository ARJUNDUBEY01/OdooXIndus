import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Layers, Plus, Calendar, Clock, RotateCcw, X, Edit, Trash2 } from 'lucide-react';

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

  const statusStyle = (p) => {
    const now = new Date();
    const active = new Date(p.startDate) <= now && new Date(p.endDate) >= now;
    return active ? 'badge-active' : 'badge-closed';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">Billing Plans</h1>
          <p className="text-text-secondary font-medium">Recurring subscription models and pricing</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary h-14 px-8 text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-accent/40">+ Create Plan</button>
      </div>

      {loading ?<div className="flex items-center justify-center h-96"><div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map(p => (
            <div key={p._id} className="card group relative flex flex-col p-8 border-white/[0.03] transition-all bg-gradient-to-br from-secondary to-secondary/40 hover:-translate-y-2 ring-1 ring-white/5 hover:ring-accent/40 shadow-2xl">
              <div className="flex items-start justify-between mb-8">
                 <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                    <Layers size={24} />
                 </div>
                 <span className={`badge ${statusStyle(p)}`}>
                   {new Date(p.startDate) <= new Date() && new Date(p.endDate) >= new Date() ? 'Active' : 'Expired'}
                 </span>
              </div>

              <div className="space-y-1 mb-8">
                 <h3 className="text-2xl font-black text-white tracking-tight">{p.name}</h3>
                 <div className="flex items-baseline gap-1.5 pt-2">
                    <span className="text-4xl font-black text-white">₹{p.price?.toLocaleString()}</span>
                    <span className="text-sm font-bold text-text-muted uppercase italic tracking-widest">/ {p.billingPeriod}</span>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-8">
                 {['pausable', 'renewable', 'closable', 'autoClose'].map(opt => (
                   <div key={opt} className={`flex items-center gap-2 p-2 rounded-lg border border-white/[0.02] text-[9px] font-black uppercase tracking-widest transition-colors ${p.options?.[opt] ? 'text-success bg-success/5 border-success/10' : 'text-text-muted bg-text-muted/5'}`}>
                      {p.options?.[opt] ? <div className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_8px_currentColor]"></div> : <X size={10}/>}
                      {opt}
                   </div>
                 ))}
              </div>

              <div className="space-y-4 pt-4 border-t border-white/[0.03] mt-auto">
                 <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-text-muted">
                    <span className="flex items-center gap-1.5"><Calendar size={12}/> Effective Dates</span>
                 </div>
                 <div className="flex items-center justify-between text-xs font-bold text-text-secondary">
                    <span>{new Date(p.startDate).toLocaleDateString()}</span>
                    <ArrowRight size={14} className="text-text-muted"/>
                    <span>{new Date(p.endDate).toLocaleDateString()}</span>
                 </div>
              </div>

              <div className="flex gap-2 mt-8 pt-4 border-t border-white/[0.03] opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                 <button onClick={() => openEdit(p)} className="flex-1 py-3 bg-secondary hover:bg-secondary/80 text-text-primary rounded-xl text-[10px] font-black uppercase tracking-widest border border-border shadow-inner transition-all flex items-center justify-center gap-2">
                    <Edit size={14}/> Edit config
                 </button>
                 <button className="py-3 px-4 bg-danger/10 text-danger hover:bg-danger hover:text-white rounded-xl transition-all border border-danger/10 flex items-center justify-center">
                    <Trash2 size={16}/>
                 </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/80 backdrop-blur-md animate-fade-in" onClick={() => setShowModal(false)}>
           <div className="card w-full max-w-xl max-h-[90vh] overflow-y-auto !shadow-3xl !border-white/10" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-8 px-2">
                 <div>
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">{editing ? 'Edit Plan' : 'Create Plan'}</h2>
                    <p className="text-xs text-text-muted font-bold tracking-widest uppercase mt-1">Configure pricing & lifecycle options</p>
                 </div>
                 <button onClick={() => setShowModal(false)} className="p-2 hover:bg-secondary rounded-xl text-text-muted transition-colors"><X size={24}/></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 px-2">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest px-1 text-text-muted">Plan Display Name</label>
                    <input className="form-input !font-black" placeholder="e.g. ENTERPRISE PRO" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value.toUpperCase()}))} />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest px-1 text-text-muted">Standard Price</label>
                       <input className="form-input font-black text-lg" type="number" placeholder="0.00" value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest px-1 text-text-muted">Billing Cycle</label>
                       <select className="form-select font-bold" value={form.billingPeriod} onChange={e => setForm(f => ({...f, billingPeriod: e.target.value}))}>
                          {['daily','weekly','monthly','yearly'].map(p => <option key={p} value={p} className="bg-secondary">{p.toUpperCase()}</option>)}
                       </select>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest px-1 text-text-muted">Validity Start</label>
                       <input className="form-input !py-2.5 font-bold" type="date" value={form.startDate} onChange={e => setForm(f => ({...f, startDate: e.target.value}))} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest px-1 text-text-muted">Validity End</label>
                       <input className="form-input !py-2.5 font-bold" type="date" value={form.endDate} onChange={e => setForm(f => ({...f, endDate: e.target.value}))} />
                    </div>
                 </div>

                 <div className="space-y-4 pt-4 border-t border-border">
                    <label className="text-[10px] font-black uppercase tracking-widest px-1 text-text-muted block mb-4">Lifecycle Capabilities</label>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                       {['autoClose', 'closable', 'pausable', 'renewable'].map(opt => (
                         <label key={opt} className="flex items-center justify-between group cursor-pointer">
                            <span className="text-xs font-bold text-text-secondary group-hover:text-white transition-colors capitalize">{opt.replace(/([A-Z])/g, ' $1')}</span>
                            <div className="relative inline-flex items-center cursor-pointer">
                               <input type="checkbox" className="sr-only peer" checked={!!form.options?.[opt]} 
                                  onChange={e => setForm(f => ({...f, options: {...f.options, [opt]: e.target.checked}}))} />
                               <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent border border-white/[0.05]"></div>
                            </div>
                         </label>
                       ))}
                    </div>
                 </div>

                 <div className="modal-footer pt-8 flex gap-4">
                    <button type="button" className="flex-1 py-4 bg-background border border-border text-text-muted hover:text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all" onClick={() => setShowModal(false)}>Discard</button>
                    <button type="submit" className="flex-[2] btn btn-primary py-4 text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-accent/20" disabled={submitting}>
                       {submitting ? 'Processing...' : editing ? 'Update Plan Config' : 'Launch New Plan'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}

function ArrowRight({size, className}) { return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>; }
