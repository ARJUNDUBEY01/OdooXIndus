// lib/supabase/server.ts
// RevFlow — Server-side Supabase client (uses cookies for session)
// We omit the Database generic to avoid strict-mode 'never' inference
// from custom schema types. Results are cast explicitly at call sites.

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll is called from a Server Component; ignore if cookies can't be set
          }
        },
      },
    }
  );
}
