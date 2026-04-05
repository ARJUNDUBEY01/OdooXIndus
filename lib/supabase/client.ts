// lib/supabase/client.ts
// RevFlow — Browser-side Supabase client
// We use createBrowserClient without the Database generic to avoid
// strict-mode 'never' inference from custom schema types. 
// All query results are explicitly cast at the usage site.

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
