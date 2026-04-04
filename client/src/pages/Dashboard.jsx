import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';
import { Layers, FileText, CreditCard, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const COLORS = ['#6c63ff', '#10d98a', '#f59e0b', '#38bdf8'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/reports/revenue');
        setStats(res.data);
      } catch (err) {
        toast.error('Failed to load dashboard data');
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-96"><div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div></div>;

  const data = [
    { label: 'Total Subscriptions', value: stats?.activeCount || 0, icon: Layers, color: 'text-accent', bg: 'bg-accent/10', change: '+12%' },
    { label: 'Active Revenue', value: `₹${stats?.totalRevenue?.toLocaleString() || 0}`, icon: TrendingUp, color: 'text-success', bg: 'bg-success/10', change: '+8%' },
    { label: 'Pending Invoices', value: stats?.pendingInvoices || 0, icon: FileText, color: 'text-warning', bg: 'bg-warning/10', change: '-4%' },
    { label: 'Collection Rate', value: '94%', icon: CreditCard, color: 'text-info', bg: 'bg-info/10', change: '+2%' },
  ];

  const chartData = [
    { name: 'Jan', revenue: 4000 }, { name: 'Feb', revenue: 3000 }, { name: 'Mar', revenue: 5000 },
    { name: 'Apr', revenue: 4500 }, { name: 'May', revenue: 6000 }, { name: 'Jun', revenue: 7500 },
  ];

  const pieData = stats ? Object.entries(stats.revenueByStatus || {}).map(([name, value]) => ({ name, value })) : [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Dashboard Overview</h1>
          <p className="text-text-secondary font-medium">Welcome back, administrator.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded-xl text-xs font-bold text-text-muted">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
          LIVE SYSTEM STATUS: OPTIMAL
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {data.map((item, i) => (
          <div key={i} className="card group relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-24 h-24 ${item.bg} blur-3xl opacity-20 group-hover:opacity-40 transition-opacity`}></div>
            <div className="flex items-start justify-between relative">
              <div className="space-y-4">
                <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center`}>
                  <item.icon size={24} />
                </div>
                <div>
                  <div className="text-sm font-bold text-text-muted uppercase tracking-wider">{item.label}</div>
                  <div className="text-3xl font-black text-white mt-1">{item.value}</div>
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold ${item.change.startsWith('+') ? 'text-success' : 'text-danger'}`}>
                  {item.change.startsWith('+') ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {item.change} <span className="text-text-muted font-normal ml-1">vs last month</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-black text-white">Revenue Analytics</h2>
              <p className="text-sm text-text-muted">Monthly financial performance</p>
            </div>
            <select className="bg-background border border-border rounded-lg text-xs font-bold px-3 py-2 outline-none">
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6c63ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6c63ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#16161f" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#555568', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#555568', fontSize: 12}} />
                <Tooltip contentStyle={{background: '#16161f', border: '1px solid #222', borderRadius: '12px', fontSize: '13px'}} />
                <Area type="monotone" dataKey="revenue" stroke="#6c63ff" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card flex flex-col">
          <div className="mb-8 font-black">
            <h2 className="text-xl text-white">Invoice Distribution</h2>
            <p className="text-sm text-text-muted font-medium">Spread across collection states</p>
          </div>
          <div className="flex-1 flex flex-col md:flex-row items-center justify-around gap-8">
            <div className="h-64 w-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} innerRadius={60} outerRadius={85} paddingAngle={8} dataKey="value" stroke="none">
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{background: '#16161f', border: '1px solid #222', borderRadius: '12px', fontSize: '12px'}} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4 w-full max-w-[200px]">
              {pieData.map((d, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-text-muted">
                    <span>{d.name}</span>
                    <span className="text-white">{Math.round((d.value/stats?.totalRevenue)*100 || 0)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                    <div className="h-full transition-all duration-1000" style={{ width: `${(d.value/stats?.totalRevenue)*100 || 0}%`, backgroundColor: COLORS[i % COLORS.length] }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
