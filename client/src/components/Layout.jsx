import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';

const TITLES = {
  '/': 'Dashboard',
  '/subscriptions': 'Subscriptions',
  '/invoices': 'Invoices',
  '/payments': 'Payments',
  '/products': 'Products',
  '/plans': 'Plans',
  '/discounts': 'Discounts',
  '/tax': 'Tax Rates',
  '/reports': 'Reports & Analytics',
};

export default function Layout() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <header className="topbar">
          <h2 className="topbar-title">{TITLES[pathname] || 'SubFlow'}</h2>
          <div className="topbar-search">
            <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>🔍</span>
            <input placeholder="Search anything..." />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              background: 'var(--accent)',
              width: 8, height: 8, borderRadius: '50%',
              boxShadow: '0 0 8px var(--accent)',
            }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Live</span>
          </div>
        </header>
        <main className="page-body fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
