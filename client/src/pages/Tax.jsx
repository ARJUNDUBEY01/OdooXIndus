import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Calculator, Plus, Trash2, X, Archive } from 'lucide-react';

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
    if (p <= 5) return 'text-success';
    if (p <= 18) return 'text-warning';
    return 'text-danger';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">Tax Configurations</h1>
          <p className="text-text-secondary font-medium">Define regional tax logic for invoice automation</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary h-14 px-8 text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-accent/40">+ Global Tax Rule</button>
      </div>

      {loading ? <div className="flex items-center justify-center h-96"><div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div></div> :
       data.length === 0 ? (
         <div className="flex flex-col items-center justify-center p-32 bg-secondary/20 rounded-[2rem] border-2 border-dashed border-border text-center">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center text-text-muted/40 mb-6 border border-border animate-pulse shadow-inner">
               <Calculator size={32} />
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-tighter">No Tax Logic Defined</h2>
            <p className="text-text-muted max-w-xs font-medium mt-2 text-sm italic">Automated billing requires at least one regional tax rate.</p>
         </div>
       ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data.map(t => (
            <div key={t._id} className="card group relative flex flex-col items-center justify-center text-center p-10 hover:border-accent/40 transition-all bg-gradient-to-br from-secondary to-secondary/30">
               <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0">
                  <button onClick={() => handleDelete(t._id)} className="p-2.5 bg-danger/5 hover:bg-danger text-danger hover:text-white rounded-xl transition-all shadow-inner"><Archive size={16}/></button>
               </div>

               <div className={`text-6xl font-black tracking-tighter mb-4 ${gaugeColor(t.percentage)}`}>
                 {t.percentage}<span className="text-3xl">%</span>
               </div>
               
               <div className="space-y-1 mb-6">
                 <h3 className="text-xl font-black text-white tracking-tight">{t.name}</h3>
                 <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Regional Applied Rate</p>
               </div>

               <div className="w-full h-2 bg-background/50 rounded-full overflow-hidden border border-border shadow-inner">
                  <div className={`h-full transition-all duration-1000 bg-current ${gaugeColor(t.percentage)}`} style={{ width: `${t.percentage}%` }}></div>
               </div>
               
               <div className="mt-8 pt-6 border-t border-white/[0.03] w-full text-[9px] font-bold text-text-muted uppercase tracking-widest flex items-center justify-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-success"></div> Automated Calculation Active
               </div>
            </div>
          ))}
        </div>
       )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background/80 backdrop-blur-md animate-fade-in" onClick={() => setShowModal(false)}>
           <div className="card w-full max-w-md !shadow-3xl !border-white/10" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-8 px-2">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent"><Calculator size={24}/></div>
                    <div>
                       <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">Add Tax Rule</h2>
                       <p className="text-[10px] text-text-muted font-bold tracking-widest uppercase mt-1">Configure invoice surcharge</p>
                    </div>
                 </div>
                 <button onClick={() => setShowModal(false)} className="p-2 hover:bg-secondary rounded-xl text-text-muted transition-colors"><X size={24}/></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1">Rule Name</label>
                    <input className="form-input font-black uppercase tracking-widest" placeholder="e.g. VAT 18%" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value.toUpperCase()}))} />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted px-1 flex justify-between">
                       <span>Percentage (%)</span>
                       <span className="text-white">{form.percentage || 0}%</span>
                    </label>
                    <input className="form-input font-black text-center text-3xl h-20" type="number" min="0" max="100" placeholder="0" value={form.percentage} onChange={e => setForm(f => ({...f, percentage: e.target.value}))} />
                    {form.percentage && (
                      <div className="relative pt-4">
                        <div className="overflow-hidden h-2 bg-background border border-border rounded-full shadow-inner">
                           <div className="h-full bg-accent transition-all duration-300" style={{ width: `${Math.min(form.percentage, 100)}%` }}></div>
                        </div>
                      </div>
                    )}
                 </div>

                 <div className="modal-footer pt-6 flex gap-4">
                    <button type="button" className="flex-1 py-4 bg-background border border-border text-text-muted hover:text-white font-black text-[10px] uppercase rounded-2xl" onClick={() => setShowModal(false)}>Discard</button>
                    <button type="submit" className="flex-[2] btn btn-primary py-4 text-[10px] font-black uppercase tracking-widest" disabled={submitting}>{submitting ? 'Applying...' : 'Create Tax Rule'}</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
