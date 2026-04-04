import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Package, Plus, Search, Layers, Edit, Trash2, Filter } from 'lucide-react';

export default function Products() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setData(res.data.products || []);
    } catch (err) {
      toast.error('Failed to load products');
    }
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  if (loading) return <div className="flex items-center justify-center h-96"><div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">Product Catalog</h1>
          <p className="text-text-secondary font-medium">Define recurring items and inventory services</p>
        </div>
        <div className="flex gap-4">
           <button className="btn btn-secondary border-white/5 bg-secondary/50 h-14 px-6 text-xs font-black uppercase tracking-[0.2em] shadow-inner"><Filter size={18}/></button>
           <button className="btn btn-primary h-14 px-8 text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-accent/40">+ Add New Product</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {data.map((p) => (
          <div key={p._id} className="card group relative flex flex-col p-0 overflow-hidden border-white/[0.03] transition-all bg-gradient-to-br from-secondary/80 to-secondary/40">
             <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                <div className="flex gap-1.5 p-1 bg-background/80 backdrop-blur rounded-lg border border-border shadow-2xl">
                   <button className="p-2 hover:bg-accent/10 text-text-muted hover:text-accent rounded-md transition-colors"><Edit size={14}/></button>
                   <button className="p-2 hover:bg-danger/10 text-text-muted hover:text-danger rounded-md transition-colors"><Trash2 size={14}/></button>
                </div>
             </div>

             <div className="p-8 pb-4">
                <div className="w-14 h-14 bg-background rounded-2xl border border-border flex items-center justify-center text-accent mb-6 shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                   <Package size={28} strokeWidth={1.5} />
                </div>
                <div className="space-y-2">
                   <div className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">{p.category || 'Subscription Component'}</div>
                   <h3 className="text-xl font-black text-white leading-tight">{p.name}</h3>
                </div>
             </div>

             <div className="px-8 py-6 space-y-5">
                <div className="flex items-center justify-between p-4 bg-background/50 border border-border rounded-2xl">
                   <div>
                      <div className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Standard Rate</div>
                      <div className="text-2xl font-black text-white leading-none">₹{p.price?.toLocaleString()}</div>
                   </div>
                   <div className="text-right">
                      <div className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-1">Type</div>
                      <div className="text-xs font-bold text-text-primary uppercase tracking-wider">{p.type}</div>
                   </div>
                </div>

                <div className="flex items-center justify-between text-center gap-3">
                   <div className="flex-1 p-2 bg-text-muted/5 rounded-xl border border-white/[0.02]">
                      <div className="text-[8px] font-black text-text-muted uppercase mb-1">Margin</div>
                      <div className="text-xs font-black text-success">22.4%</div>
                   </div>
                   <div className="flex-1 p-2 bg-text-muted/5 rounded-xl border border-white/[0.02]">
                      <div className="text-[8px] font-black text-text-muted uppercase mb-1">Active Subs</div>
                      <div className="text-xs font-black text-info">142</div>
                   </div>
                </div>
             </div>

             <div className="mt-auto border-t border-border p-4 flex items-center justify-center">
                <button className="w-full flex items-center justify-center gap-2 py-3 text-[10px] font-black text-text-muted hover:text-white uppercase tracking-[0.25em] transition-all group-hover:gap-4">
                   View Performance Metrics <Layers size={14}/>
                </button>
             </div>
          </div>
        ))}
      </div>
      
      {data.length === 0 && (
         <div className="flex flex-col items-center justify-center p-24 bg-secondary/20 rounded-3xl border-2 border-dashed border-border text-center">
            <div className="w-20 h-20 bg-secondary rounded-2xl flex items-center justify-center text-text-muted/40 mb-6 border border-border animate-bounce">
               <Package size={32} />
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Your Catalog is Empty</h2>
            <p className="text-text-muted max-w-sm font-medium mt-3 text-sm">Add your recurring items, software licenses or services to start billing customers.</p>
            <button className="btn btn-primary mt-8 scale-110 shadow-xl shadow-accent/40">+ Create First Product</button>
         </div>
      )}
    </div>
  );
}
