import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Filter, Download, ArrowUpRight, TrendingUp, Info } from 'lucide-react';

const COLORS = ['#6c63ff', '#10d98a', '#f59e0b', '#38bdf8', '#ef4444'];

export default function Reports() {
  const [revenue, setRevenue] = useState(null);
  const [subs, setSubs] = useState(null);
  const [pays, setPays] = useState(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('2026-01-01');
  const [to, setTo] = useState('2026-12-31');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [rRes, sRes, pRes] = await Promise.all([
        api.get(`/reports/revenue?from=${from}&to=${to}`),
        api.get(`/reports/subscriptions?from=${from}&to=${to}`),
        api.get(`/reports/payments?from=${from}&to=${to}`),
      ]);
      setRevenue(rRes.data);
      setSubs(sRes.data);
      setPays(pRes.data);
    } catch (e) { toast.error('Failed to load reports'); }
    setLoading(false);
  };

  useEffect(() => { fetchReports(); }, []);

  const payMethodData = pays ? Object.entries(pays.byMethod || {}).map(([name, value]) => ({ name, value })) : [];
  const subStatusData = subs ? Object.entries(subs.byStatus || {}).map(([name, value]) => ({ name, value })) : [];
  const revByStatus = revenue ? Object.entries(revenue.revenueByStatus || {}).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) })) : [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">Intelligence Engine</h1>
          <p className="text-text-secondary font-medium mt-1">Cross-module performance & financial KPIs</p>
        </div>
        <div className="flex gap-4">
           <div className="flex bg-secondary/50 rounded-2xl border border-border p-1">
              <input className="bg-transparent text-[10px] font-black uppercase text-white px-4 py-2 border-none outline-none w-32 tracking-wider" 
                type="date" value={from} onChange={e => setFrom(e.target.value)} />
              <div className="flex items-center text-text-muted"><ArrowUpRight size={14}/></div>
              <input className="bg-transparent text-[10px] font-black uppercase text-white px-4 py-2 border-none outline-none w-32 tracking-wider" 
                type="date" value={to} onChange={e => setTo(e.target.value)} />
           </div>
           <button onClick={fetchReports} className="btn btn-primary h-14 px-8 text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-accent/40"><Filter size={18}/></button>
        </div>
      </div>

      {loading ?<div className="flex items-center justify-center h-96"><div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div></div> : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
               { l: 'Profitability Index', v: revenue?.totalRevenue, i: '💰', c: 'text-success', b: 'bg-success/10' },
               { l: 'Tax Inflow Trace', v: revenue?.totalTax, i: '🧮', c: 'text-accent', b: 'bg-accent/10' },
               { l: 'Marketing Burn', v: revenue?.totalDiscount, i: '🎯', c: 'text-warning', b: 'bg-warning/10' },
               { l: 'Cash Collection', v: pays?.totalCollected, i: '💳', c: 'text-info', b: 'bg-info/10' },
            ].map((kpi, idx) => (
              <div key={idx} className="card group hover:scale-[1.03] transition-all bg-gradient-to-br from-secondary/80 to-secondary/40 border-white/[0.03]">
                 <div className="flex justify-between items-start mb-6">
                    <div className={`p-4 rounded-2xl ${kpi.b} ${kpi.c} transition-transform group-hover:rotate-12`}>
                       <span className="text-2xl">{kpi.i}</span>
                    </div>
                    <div className="p-2 hover:bg-background rounded-lg border border-transparent hover:border-border transition-all cursor-help"><Info size={14} className="text-text-muted"/></div>
                 </div>
                 <div className="text-[9px] font-black uppercase tracking-[0.25em] text-text-muted mb-2">{kpi.l}</div>
                 <div className="text-3xl font-black text-white tracking-tighter leading-none">₹{kpi.v?.toLocaleString() || 0}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-2 card">
                <div className="flex justify-between items-center mb-10">
                   <div>
                      <h2 className="text-xl font-black text-white">Consolidated Revenue Stream</h2>
                      <p className="text-xs text-text-muted font-bold tracking-widest uppercase mt-1">Cross-status distribution cycle</p>
                   </div>
                   <button className="p-2.5 rounded-xl bg-background border border-border text-text-muted hover:text-white transition-all"><Download size={18}/></button>
                </div>
                <div className="h-80 w-full">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revByStatus}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#16161f" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#555568', fontSize: 11, fontWeight: '700'}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#555568', fontSize: 11, fontWeight: '700'}} />
                        <Tooltip contentStyle={{background: '#16161f', border: '1px solid #222', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold'}} />
                        <Bar dataKey="value" fill="#6c63ff" radius={[8, 8, 0, 0]} barSize={40} />
                      </BarChart>
                   </ResponsiveContainer>
                </div>
             </div>

             <div className="card flex flex-col items-center justify-between">
                <div className="w-full text-center">
                   <h2 className="text-xl font-black text-white italic">Asset Status Breakdown</h2>
                   <p className="text-[10px] text-text-muted font-black tracking-[0.2em] uppercase mt-1">Lifecycle segmentation</p>
                </div>
                <div className="w-full h-64 my-6">
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={subStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" stroke="none">
                           {subStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{background: '#16161f', border: 'none', borderRadius: '12px', fontSize: '10px'}} />
                      </PieChart>
                   </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 w-full gap-3">
                   {subStatusData.map((d, i) => (
                      <div key={d.name} className="p-3 bg-background/50 border border-border rounded-xl">
                         <div className="flex items-center gap-1.5 mb-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }}></div>
                            <span className="text-[9px] font-black uppercase text-text-muted tracking-widest truncate">{d.name}</span>
                         </div>
                         <div className="text-xl font-black text-white">{d.value}</div>
                      </div>
                   ))}
                </div>
             </div>
          </div>

          <div className="card">
             <div className="mb-10 text-center font-black italic">
                <h2 className="text-xl text-white py-2">Transaction Methodology</h2>
                <div className="w-24 h-1 bg-accent mx-auto rounded-full shadow-[0_0_12px_#6c63ff]"></div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {payMethodData.map((d, i) => (
                  <div key={d.name} className="relative group p-8 rounded-3xl bg-secondary/30 border border-border hover:border-accent/40 transition-all overflow-hidden">
                     <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-all"></div>
                     <div className="text-[9px] font-black text-text-muted uppercase tracking-[0.3em] mb-4">{d.name.replace('_', ' ')}</div>
                     <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-white">₹{d.value?.toFixed(0)}</span>
                        <TrendingUp size={16} className="text-success"/>
                     </div>
                     <div className="mt-6 flex flex-col gap-1.5">
                        <div className="h-1 bg-background rounded-full overflow-hidden">
                           <div className="h-full bg-accent transition-all duration-1000" style={{ width: `${Math.min((d.value/pays?.totalCollected)*200, 100)}%` }}></div>
                        </div>
                        <div className="text-[8px] font-black text-text-muted uppercase tracking-widest text-right">Volume Weight {(d.value/pays?.totalCollected*100).toFixed(1)}%</div>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </>
      )}
    </div>
  );
}
