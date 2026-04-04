import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FileText, Plus, Search, Filter, Download, MoreVertical, CheckCircle2, XCircle, Clock } from 'lucide-react';

const INV_STATUS = {
  Draft: { bg: 'bg-text-muted/10', text: 'text-text-muted', icon: Clock },
  Confirmed: { bg: 'bg-info/10', text: 'text-info', icon: Plus },
  Posted: { bg: 'bg-accent/10', text: 'text-accent', icon: FileText },
  Paid: { bg: 'bg-success/10', text: 'text-success', icon: CheckCircle2 },
  Cancelled: { bg: 'bg-danger/10', text: 'text-danger', icon: XCircle },
};

export default function Invoices() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/invoices');
      setData(res.data.invoices || []);
    } catch (err) {
      toast.error('Failed to load invoices');
    }
    setLoading(false);
  };

  useEffect(() => { fetchInvoices(); }, []);

  if (loading) return <div className="flex items-center justify-center h-96"><div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Billing & Invoices</h1>
          <p className="text-text-secondary font-medium">Tracking and automated financial records</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary text-xs uppercase tracking-widest font-black"><Filter size={16} /> Filter</button>
          <button className="btn btn-primary text-xs uppercase tracking-widest font-black shadow-none border border-accent/20"><Plus size={16} /> Create Invoice</button>
        </div>
      </div>

      <div className="card !p-0">
        <div className="p-6 border-b border-border bg-secondary/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input className="w-full bg-background border border-border rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all font-bold placeholder:font-medium tracking-tight" 
              placeholder="Search invoice number..." />
          </div>
          <div className="flex items-center gap-4">
             <div className="flex -space-x-2">
                {[0,1,2].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-secondary bg-text-muted/10"></div>)}
             </div>
             <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest select-none">Recently accessed by team</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border text-[9px] font-black uppercase tracking-[0.2em] text-text-muted bg-secondary/10">
                <th className="px-6 py-5">Number</th>
                <th className="px-6 py-5">Customer</th>
                <th className="px-6 py-5">Summary</th>
                <th className="px-6 py-5">Totals (₹)</th>
                <th className="px-6 py-5">Payment Status</th>
                <th className="px-6 py-5">Due Date</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {data.map((inv) => {
                const s = INV_STATUS[inv.status] || INV_STATUS.Draft;
                return (
                  <tr key={inv._id} className="hover:bg-accent/[0.02] transition-colors group">
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-lg ${s.bg} ${s.text}`}><s.icon size={16}/></div>
                         <div>
                            <div className="text-sm font-black text-white tracking-widest">{inv.number}</div>
                            <div className="text-[9px] font-bold text-text-muted uppercase tracking-wider">{new Date(inv.date).toLocaleDateString()}</div>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="text-sm font-bold text-text-primary capitalize">{inv.partner?.name || 'Unknown'}</div>
                      <div className="text-[10px] font-bold text-text-muted/60 tracking-wider">REF: {inv.reference || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="text-xs font-bold text-text-secondary whitespace-nowrap overflow-hidden text-ellipsis max-w-xs">{inv.note || 'Regular billing cycle invoice'}</div>
                    </td>
                    <td className="px-6 py-6">
                        <div className="text-sm font-black text-white">₹{inv.totalAmount?.toLocaleString()}</div>
                        <div className="text-[10px] font-bold text-success/60">Includes tax: ₹{inv.taxAmount?.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-6">
                       <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-current/10 ${s.bg} ${s.text}`}>
                          <span className="w-1 h-1 rounded-full bg-current"></span>
                          {s.label || inv.status}
                       </span>
                    </td>
                    <td className="px-6 py-6">
                       <div className="text-xs font-bold text-text-muted uppercase">{new Date(inv.dueDate).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-6 text-right">
                       <div className="flex items-center justify-end gap-2">
                          <button className="p-2 hover:bg-secondary rounded-lg text-text-muted group-hover:text-accent transition-colors"><Download size={18}/></button>
                          <button className="p-2 hover:bg-secondary rounded-lg text-text-muted transition-colors"><MoreVertical size={18}/></button>
                       </div>
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
