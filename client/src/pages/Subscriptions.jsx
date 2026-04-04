import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Layers, Plus, Search, MoreVertical, Filter, ArrowRight } from 'lucide-react';

const STATUS_MAP = {
  Draft: { bg: 'bg-text-muted/10', text: 'text-text-muted', label: 'Draft' },
  Quotation: { bg: 'bg-info/10', text: 'text-info', label: 'Quotation' },
  Confirmed: { bg: 'bg-accent/10', text: 'text-accent', label: 'Confirmed' },
  Active: { bg: 'bg-success/10', text: 'text-success', label: 'Active' },
  Closed: { bg: 'bg-danger/10', text: 'text-danger', label: 'Closed' },
};

export default function Subscriptions() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSubscriptions = async () => {
    try {
      const res = await api.get('/subscriptions');
      setData(res.data.subscriptions || []);
    } catch (err) {
      toast.error('Failed to load subscriptions');
    }
    setLoading(false);
  };

  useEffect(() => { fetchSubscriptions(); }, []);

  if (loading) return <div className="flex items-center justify-center h-96"><div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white">Subscriptions</h1>
          <p className="text-text-secondary font-medium">Manage customer recurring lifecycle</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary"><Filter size={18} /> Filters</button>
          <button className="btn btn-primary"><Plus size={18} /> New Subscription</button>
        </div>
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="p-6 border-b border-border flex flex-col md:flex-row items-center justify-between gap-4 bg-secondary/30">
          <div className="relative w-full max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent transition-colors" size={18} />
            <input className="w-full bg-background border border-border rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40 bg-background/50 transition-all font-medium" 
              placeholder="Search by ID, customer name or plan..." />
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-text-muted px-4 py-2 bg-background rounded-lg border border-border">
            Total Records: <span className="text-white ml-1">{data.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-secondary/40 border-b border-border text-[10px] font-black uppercase tracking-widest text-text-muted">
                <th className="px-6 py-5">Subscription ID</th>
                <th className="px-6 py-5">Customer</th>
                <th className="px-6 py-5">Plan Detail</th>
                <th className="px-6 py-5">Amount (₹)</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Created At</th>
                <th className="px-6 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {data.map((sub) => {
                const s = STATUS_MAP[sub.status] || STATUS_MAP.Draft;
                return (
                  <tr key={sub._id} className="hover:bg-accent/5 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="font-black text-white text-sm tracking-tight">{sub.number}</div>
                      <div className="text-[10px] text-text-muted font-bold uppercase">{sub.reference || 'REF-N/A'}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-xs font-bold text-text-secondary">
                          {sub.partner?.name?.[0]}
                        </div>
                        <div className="text-sm font-bold text-text-primary capitalize">{sub.partner?.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm font-bold text-white">{sub.plan?.name}</div>
                      <div className="text-xs text-text-muted flex items-center gap-1 font-medium">
                        Qty: {sub.quantity} · {sub.billingPeriod}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-black text-white">
                      ₹{sub.amount?.toLocaleString()}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${s.bg} ${s.text} border border-current/20`}>
                        {s.label}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-xs text-text-muted font-bold uppercase">
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 hover:bg-accent/10 rounded-lg text-accent transition-colors"><ArrowRight size={18}/></button>
                        <button className="p-2 hover:bg-secondary rounded-lg text-text-muted transition-colors"><MoreVertical size={18}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {data.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center text-text-muted mb-4 border border-border animate-pulse shadow-inner">
               <Layers size={32} />
            </div>
            <h3 className="text-xl font-bold text-white">No Subscriptions Found</h3>
            <p className="text-text-muted max-w-xs mt-2 text-sm font-medium">Launch your first subscription using the create button above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
