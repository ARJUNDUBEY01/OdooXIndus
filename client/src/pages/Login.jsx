import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    }
    setLoading(false);
  };

  const setDemo = (e, u, p) => {
    e.preventDefault();
    setEmail(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,rgba(108,99,255,0.05),transparent)]">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-accent rounded-2xl mx-auto mb-6 flex items-center justify-center text-white shadow-2xl shadow-accent/40 animate-bounce">
            <span className="text-3xl font-black">SF</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">Welcome Back</h1>
          <p className="text-text-secondary font-medium">Subscription Management Platform</p>
        </div>

        <div className="card border-white/5 bg-secondary/50 backdrop-blur-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-text-muted px-1">Email Address</label>
              <input className="form-input" type="email" placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-text-muted px-1">Password</label>
              <input className="form-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>

            <button type="submit" className="btn btn-primary w-full py-4 text-sm tracking-wide" disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
            </button>

            <div className="flex gap-3 pt-2">
              <button onClick={(e) => setDemo(e, 'admin@saas.com', 'Admin@1234')}
                className="flex-1 py-3 px-2 border border-accent/20 bg-accent/5 hover:bg-accent/10 rounded-xl text-accent text-[10px] font-bold uppercase tracking-tighter text-center transition-all">
                🔑 Admin Demo
              </button>
              <button onClick={(e) => setDemo(e, 'alice@example.com', 'Alice@1234')}
                className="flex-1 py-3 px-2 border border-success/20 bg-success/5 hover:bg-success/10 rounded-xl text-success text-[10px] font-bold uppercase tracking-tighter text-center transition-all">
                👤 Customer Demo
              </button>
            </div>
          </form>
        </div>
        
        <p className="mt-8 text-center text-text-muted text-xs">
          Built for high-performance SaaS operations &copy; 2026 SubFlow
        </p>
      </div>
    </div>
  );
}
