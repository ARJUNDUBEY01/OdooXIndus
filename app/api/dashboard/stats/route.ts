// app/api/dashboard/stats/route.ts
// GET /api/dashboard/stats — Admin only
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    if (userProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: admin access required' },
        { status: 403 }
      );
    }

    const currentYear = new Date().getFullYear();

    // Run all reporting RPCs in parallel
    const [totalRevenueResult, activeSubsResult, pendingInvoicesResult, monthlyRevenueResult] =
      await Promise.all([
        supabase.rpc('get_total_revenue'),
        supabase.rpc('get_active_subscriptions_count'),
        supabase.rpc('get_pending_invoices'),
        supabase.rpc('get_monthly_revenue', { p_year: currentYear }),
      ]);

    // Check for errors
    if (totalRevenueResult.error) {
      console.error('[get_total_revenue error]', totalRevenueResult.error);
    }
    if (activeSubsResult.error) {
      console.error('[get_active_subscriptions_count error]', activeSubsResult.error);
    }
    if (pendingInvoicesResult.error) {
      console.error('[get_pending_invoices error]', pendingInvoicesResult.error);
    }
    if (monthlyRevenueResult.error) {
      console.error('[get_monthly_revenue error]', monthlyRevenueResult.error);
    }

    return NextResponse.json(
      {
        total_revenue: totalRevenueResult.data ?? 0,
        active_subscriptions: activeSubsResult.data ?? 0,
        pending_invoices: pendingInvoicesResult.data ?? [],
        monthly_revenue: monthlyRevenueResult.data ?? [],
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[GET /api/dashboard/stats] unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
