import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { CreditCard, Plus, Search, Calendar, ChevronRight, MoreVertical, Wallet, Banknote, Landmark } from 'lucide-react';

const METHOD_ICONS = {
  card: { icon: CreditCard, color: 'text-accent', bg: 'bg-accent/10' },
  bank_transfer: { icon: Landmark, color: 'text-info', bg: 'bg-info/10' },
  upi: { icon: Wallet, color: 'text-success', bg: 'bg-success/10' },
  cash: { icon: Banknote, color: 'text-warning', bg: 'bg-warning/10' },
};

export default function Payments() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    try {
      const res = await api.get('/payments');
      setData(res.data.payments || []);
    } catch (err) {
      toast.error('Failed to load payments');
    }
    setLoading(false);
  };

  useEffect(() => { fetchPayments(); }, []);

  if (loading) return <div className="flex items-center justify-center h-96"><div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pointer-events-none">
        <div>
          <h1 className="text-3xl font-black text-white leading-tight">Payment Transactions</h1>
          <p className="text-text-secondary font-medium mt-1">Verified records of financial inflows</p>
        </div>
        <div className="flex gap-4 pointer-events-auto">
          <button className="btn btn-secondary border border-border shadow-sm group">
            <span className="text-text-muted transition-colors px-1"><Calendar size={18}/></span>
            <span className="text-xs font-black uppercase tracking-widest">History Log</span>
          </button>
          <button className="btn btn-primary shadow-xl shadow-accent/20 group">
            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
            <span className="text-xs font-black uppercase tracking-widest">Record Payment</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {Object.entries(METHOD_ICONS).map(([key, cfg]) => {
           const matches = data.filter(p => p.method === key);
           const total = matches.reduce((acc, p) => acc + (p.amount || 0), 0);
           return (
             <div key={key} className="card group hover:-translate-y-1 transition-all duration-300">
               <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${cfg.bg} ${cfg.color} group-hover:scale-110 transition-transform`}>
                     <cfg.icon size={28} />
                  </div>
                  <div>
                     <div className="text-[10px] font-black uppercase tracking-widest text-text-muted">{key.replace('_', ' ')}</div>
                     <div className="text-2xl font-black text-white mt-0.5">₹{total.toLocaleString()}</div>
                  </div>
               </div>
               <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-xs font-bold text-text-muted">{matches.length} Transactions</span>
                  <div className="flex items-center gap-1 text-xs font-bold text-accent">View all <ChevronRight size={14}/></div>
               </div>
             </div>
           );
         })}
      </div>

      <div className="card !p-0 border-white/5 backdrop-blur-xl">
        <div className="p-6 border-b border-border flex flex-col md:flex-row items-center justify-between gap-6 bg-secondary/10">
          <div className="relative w-full max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input className="w-full bg-background border border-border rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-accent/40 focus:border-accent/40 transition-all placeholder:text-text-muted/60" 
              placeholder="Search reference numbers or invoice IDs..." />
          </div>
          <div className="flex items-center gap-1">
             <button className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-text-primary bg-background border border-border hover:bg-secondary transition-colors">Export CSV</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-secondary/[0.05] text-[10px] font-black uppercase tracking-widest text-text-muted">
                <th className="px-8 py-5">TXN Reference</th>
                <th className="px-8 py-5">Method</th>
                <th className="px-8 py-5">Linked Invoice</th>
                <th className="px-8 py-5">Payment Date</th>
                <th className="px-8 py-5">Amount (₹)</th>
                <th className="px-8 py-5 text-right">More</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {data.map((pay) => {
                const m = METHOD_ICONS[pay.method] || METHOD_ICONS.card;
                return (
                  <tr key={pay._id} className="hover:bg-accent/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                       <div className="flex flex-col">
                          <div className="text-sm font-black text-white tracking-widest font-mono">{pay.transactionId || 'N/A'}</div>
                          <div className="text-[10px] font-bold text-text-muted/60 flex items-center gap-2 mt-1">
                            LOG ID: {pay._id.slice(-8).toUpperCase()}
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${m.bg} ${m.color}`}><m.icon size={16}/></div>
                          <span className="text-xs font-bold text-text-primary capitalize">{pay.method.replace('_', ' ')}</span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="text-xs font-black text-accent bg-accent/5 px-2 py-1 rounded inline-block border border-accent/10">{pay.invoice?.number || 'Manual Deposit'}</div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex flex-col">
                          <div className="text-sm font-bold text-text-primary">{new Date(pay.date).toLocaleDateString()}</div>
                          <div className="text-[9px] font-bold text-text-muted uppercase tracking-widest mt-0.5">{new Date(pay.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="text-lg font-black text-success">₹{pay.amount?.toLocaleString()}</div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <button className="p-2 hover:bg-secondary rounded-xl text-text-muted transition-all active:scale-90"><MoreVertical size={18}/></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
