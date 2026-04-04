import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  CreditCard, 
  Package, 
  Layers, 
  Percent, 
  BarChart3, 
  LogOut,
  Calculator
} from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  if (!user) return <Navigate to="/login" replace />;

  const menu = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { label: 'Subscriptions', icon: Layers, path: '/subscriptions' },
    { label: 'Invoices', icon: FileText, path: '/invoices' },
    { label: 'Payments', icon: CreditCard, path: '/payments' },
    { label: 'Products', icon: Package, path: '/products' },
    { label: 'Plans', icon: Package, path: '/plans' },
    { label: 'Discounts', icon: Percent, path: '/discounts' },
    { label: 'Tax Rates', icon: Calculator, path: '/tax' },
    { label: 'Reports', icon: BarChart3, path: '/reports' },
  ];

  return (
    <div className="flex min-h-screen bg-background font-sans text-text-primary">
      {/* Sidebar */}
      <aside className="w-64 bg-secondary border-r border-border min-h-screen sticky top-0 hidden lg:flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white shadow-lg shadow-accent/20">
              <span className="text-xl font-black">SF</span>
            </div>
            <span className="text-xl font-black tracking-tight">SubFlow</span>
          </div>

          <nav className="space-y-1">
            {menu.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              
              return (
                <Link key={item.path} to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                    ${isActive 
                      ? 'bg-accent/10 text-accent' 
                      : 'text-text-secondary hover:bg-text-muted/10 hover:text-text-primary'
                    }`}>
                  <Icon size={20} className={isActive ? 'text-accent' : 'text-text-muted group-hover:text-text-primary'} />
                  <span className="font-semibold text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-border">
          <div className="flex items-center gap-3 mb-4 p-2 bg-text-muted/5 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">
              {user?.name?.[0] || 'A'}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold truncate">{user?.name}</div>
              <div className="text-[10px] text-text-muted truncate capitalize">{user?.role}</div>
            </div>
          </div>
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-danger hover:bg-danger/10 transition-all font-semibold text-sm">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        <div className="max-w-7xl mx-auto p-4 md:p-8 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
