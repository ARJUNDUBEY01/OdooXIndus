'use server';
// app/actions/auth.ts
// RevFlow — Server actions for auth-related DB operations

import { createClient } from '@/lib/supabase/server';

export async function insertUserProfile(
  id: string,
  name: string,
  email: string
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.rpc('get_user_role').then(async () => {
      // Use raw SQL insert via the Supabase SQL editor workaround:
      // Since RLS may block insert from the client, we do it server-side
      return await supabase.from('users').upsert(
        [{ id, name, email, role: 'customer' }],
        { onConflict: 'id' }
      );
    });

    if (error) {
      return { error: error.message };
    }
    return { error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { error: message };
  }
}
