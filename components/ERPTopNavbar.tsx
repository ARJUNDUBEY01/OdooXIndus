'use client';
// components/ERPTopNavbar.tsx
// RevFlow — ERP style Top Navigation

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@/types/database';

interface ERPTopNavbarProps {
  user: Pick<User, 'id' | 'name' | 'email' | 'role'>;
}

const navItems = [
  { href: '/subscriptions', label: 'Subscriptions', roles: ['admin', 'customer', 'internal'] },
  { href: '/products', label: 'Products', roles: ['admin', 'internal'] },
  { href: '/dashboard', label: 'Reporting', roles: ['admin', 'internal', 'customer'] },
  { href: '/admin/users', label: 'Users/contacts', roles: ['admin'] },
  { 
    href: '#', 
    label: 'Configuration', 
    roles: ['admin'],
    subItems: [
      { href: '/admin/configuration/attributes', label: 'Attribute' },
      { href: '/admin/configuration/recurring-plans', label: 'Recurring Plan' },
      { href: '/admin/configuration/quotation-templates', label: 'Quotation Template' },
      { href: '/admin/configuration/payment-terms', label: 'Payment Term' },
      { href: '/admin/configuration/discounts', label: 'Discount' },
      { href: '/admin/configuration/taxes', label: 'Taxes' }
    ]
  },
];

export default function ERPTopNavbar({ user }: ERPTopNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const visibleItems = navItems.filter(item => item.roles.includes(user.role));

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md flex justify-between items-center px-8 z-40 border-b border-outline-variant/15">
      <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <img src="/logo.png" alt="Logo" className="h-8 w-auto object-contain" />
        <span className="font-headline font-bold text-xl tracking-tight text-on-surface">RevFlow</span>
      </Link>
      <nav className="flex items-center gap-2 flex-1 ml-10 h-full">
        {visibleItems.map(item => {
          const isActive = pathname.startsWith(item.href) && item.href !== '#';
          
          if (item.subItems) {
            return (
              <div key={item.label} className="relative group h-full flex items-center">
                <button
                  className={`flex items-center h-full px-4 text-sm font-semibold transition-all border-b-2 text-on-surface-variant border-transparent hover:text-on-surface hover:bg-surface-container-low`}
                >
                  {item.label}
                  <span className="material-symbols-outlined text-[16px] ml-1">expand_more</span>
                </button>
                <div className="absolute top-[100%] left-0 min-w-[200px] bg-white border border-outline-variant/20 rounded-b-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col py-2">
                  {item.subItems.map(subItem => (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      className="px-4 py-2 text-sm text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-colors"
                    >
                      {subItem.label}
                    </Link>
                  ))}
                </div>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center h-full px-4 text-sm font-semibold transition-all border-b-2 
                ${isActive || (item.href === '/dashboard' && pathname === '/dashboard')
                  ? 'text-primary border-primary bg-primary/5' 
                  : 'text-on-surface-variant border-transparent hover:text-on-surface hover:bg-surface-container-low'}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-6">
        <button className="text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <div className="h-8 w-[1px] bg-outline-variant/30"></div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-on-surface leading-tight">{user.name || 'User'}</span>
            <span className="text-xs text-on-surface-variant capitalize">{user.role}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-surface-container-high border border-outline-variant/20 flex items-center justify-center text-primary font-bold shadow-sm">
            {user.name?.charAt(0).toUpperCase() ?? 'U'}
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="ml-2 text-on-surface-variant hover:text-error transition-colors flex items-center justify-center"
          title="Sign Out"
        >
          <span className="material-symbols-outlined">logout</span>
        </button>
      </div>
    </header>
  );
}
