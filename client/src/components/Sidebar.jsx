import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { section: 'Overview', items: [
    { path: '/', label: 'Dashboard', icon: '📊' },
  ]},
  { section: 'Management', items: [
    { path: '/subscriptions', label: 'Subscriptions', icon: '🔄' },
    { path: '/invoices', label: 'Invoices', icon: '🧾' },
    { path: '/payments', label: 'Payments', icon: '💳' },
  ]},
  { section: 'Catalog', items: [
    { path: '/products', label: 'Products', icon: '📦' },
    { path: '/plans', label: 'Plans', icon: '🔁' },
  ]},
  { section: 'Finance', items: [
    { path: '/discounts', label: 'Discounts', icon: '🎯' },
    { path: '/tax', label: 'Tax Rates', icon: '🧮' },
  ]},
  { section: 'Analytics', items: [
    { path: '/reports', label: 'Reports', icon: '📈' },
  ]},
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">⚡</div>
        <div className="logo-text">Sub<span>Flow</span></div>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(group => (
          <div key={group.section}>
            <div className="nav-section-label">{group.section}</div>
            {group.items.map(item => (
              <button
                key={item.path}
                className={`nav-item ${pathname === item.path ? 'active' : ''}`}
                onClick={() => nav(item.path)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{initials}</div>
          <div className="user-details">
            <div className="user-name">{user?.name || 'User'}</div>
            <div className="user-role">{user?.role || 'Customer'}</div>
          </div>
          <button className="logout-btn" onClick={logout} title="Logout">⬡</button>
        </div>
      </div>
    </aside>
  );
}
