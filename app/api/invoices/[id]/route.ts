// app/api/invoices/[id]/route.ts
// GET /api/invoices/[id] — Returns invoice with line items (RLS enforced)
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Verify session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    // Fetch invoice with its items — RLS ensures customers only see their own
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(
        `
        id,
        subscription_id,
        total_amount,
        tax_amount,
        discount_amount,
        final_amount,
        status,
        created_at,
        invoice_items (
          id,
          product_name,
          quantity,
          unit_price,
          tax,
          amount
        ),
        subscriptions (
          id,
          user_id,
          plan_id,
          status,
          start_date,
          end_date
        )
      `
      )
      .eq('id', id)
      .single();

    if (invoiceError) {
      console.error('[GET /api/invoices/[id]] invoice error:', invoiceError);
      return NextResponse.json(
        { error: 'Invoice not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({ invoice }, { status: 200 });
  } catch (err) {
    console.error('[GET /api/invoices/[id]] unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
