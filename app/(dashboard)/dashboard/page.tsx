// app/(dashboard)/dashboard/page.tsx
// RevFlow — Dashboard home (admin stats vs customer overview)

import { createClient } from '@/lib/supabase/server';
import AdminDashboard from '@/components/AdminDashboard';
import CustomerDashboard from '@/components/CustomerDashboard';
import type { User } from '@/types/database';

export const metadata = {
  title: 'Dashboard — RevFlow',
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const profileResult = await supabase
    .from('users')
    .select('id, name, email, role')
    .eq('id', user.id)
    .single();

  const profile = profileResult.data as Pick<User, 'id' | 'name' | 'email' | 'role'> | null;

  if (!profile) return null;

  if (profile.role === 'admin') {
    return <AdminDashboard />;
  }

  return <CustomerDashboard userId={profile.id} />;
}
