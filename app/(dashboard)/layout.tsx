// app/(dashboard)/layout.tsx
// RevFlow — ERP Dashboard shell

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ERPTopNavbar from '@/components/ERPTopNavbar';
import type { User } from '@/types/database';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const profileResult = await supabase
    .from('users')
    .select('id, name, email, role, created_at')
    .eq('id', user.id)
    .single();

  const profile = profileResult.data as User | null;

  const navUser: Pick<User, 'id' | 'name' | 'email' | 'role'> = {
    id:    profile?.id    ?? user.id,
    name:  profile?.name  ?? (user.email ?? ''),
    email: profile?.email ?? (user.email ?? ''),
    role:  profile?.role  ?? 'customer',
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: 'var(--bg-primary)',
      }}
    >
      <ERPTopNavbar user={navUser} />
      <main className="pt-20"
        style={{
          flex: 1,
          paddingLeft: '1.5rem',
          paddingRight: '1.5rem',
          paddingBottom: '1.5rem',
          overflowY: 'auto',
          maxWidth: '100vw',
        }}
      >
        {children}
      </main>
    </div>
  );
}
