// app/api/subscriptions/create/route.ts
// POST /api/subscriptions/create
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authenticated session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: please log in' },
        { status: 401 }
      );
    }

    // Parse request body
    let body: { plan_id: string; quantity: number };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const { plan_id, quantity } = body;

    if (!plan_id || typeof plan_id !== 'string') {
      return NextResponse.json(
        { error: 'plan_id is required' },
        { status: 400 }
      );
    }

    if (!quantity || typeof quantity !== 'number' || quantity < 1) {
      return NextResponse.json(
        { error: 'quantity must be a positive integer' },
        { status: 400 }
      );
    }

    // Fetch user profile row to get the public.users UUID
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found. Please complete registration.' },
        { status: 404 }
      );
    }

    // Call create_subscription RPC
    const { data: subscriptionId, error: rpcError } = await supabase.rpc(
      'create_subscription',
      {
        p_user_id: user.id,
        p_plan_id: plan_id,
        p_quantity: quantity,
        p_start_date: new Date().toISOString().split('T')[0],
      }
    );

    if (rpcError) {
      console.error('[create_subscription RPC error]', rpcError);
      return NextResponse.json(
        { error: rpcError.message || 'Failed to create subscription' },
        { status: 500 }
      );
    }

    // Fetch the invoice created for this subscription
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id')
      .eq('subscription_id', subscriptionId as string)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'Subscription created but could not retrieve invoice' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        subscription_id: subscriptionId,
        invoice_id: invoice.id,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /api/subscriptions/create] unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
