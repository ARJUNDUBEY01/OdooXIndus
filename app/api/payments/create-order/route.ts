// app/api/payments/create-order/route.ts
// POST /api/payments/create-order
// Force dynamic rendering — this route requires runtime env vars (Razorpay keys)


export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';


function getRazorpayInstance() {

  const RazorpayLib = require('razorpay') as any;
  const RazorpayClass = RazorpayLib.default ?? RazorpayLib;
  return new RazorpayClass({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
}

export async function POST(request: NextRequest) {
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

    // Parse body
    let body: { invoice_id: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { invoice_id } = body;
    if (!invoice_id || typeof invoice_id !== 'string') {
      return NextResponse.json({ error: 'invoice_id is required' }, { status: 400 });
    }

    // Fetch invoice to get final_amount
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, final_amount, status')
      .eq('id', invoice_id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: 'Invoice not found or access denied' },
        { status: 404 }
      );
    }

    const invoiceData = invoice as { id: string; final_amount: number | null; status: string };

    if (invoiceData.status === 'paid') {
      return NextResponse.json(
        { error: 'Invoice is already paid' },
        { status: 400 }
      );
    }

    const finalAmount = invoiceData.final_amount ?? 0;
    const amountInPaise = Math.round(finalAmount * 100); // Convert INR → paise

    // Ensure Razorpay keys are configured at runtime
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('[create-order] Razorpay keys not configured');
      return NextResponse.json(
        { error: 'Payment gateway not configured. Please contact support.' },
        { status: 503 }
      );
    }

    // Create Razorpay order
    interface RazorpayOrderResult {
      id: string;
      amount: number;
      currency: string;
      receipt?: string;
    }

    let razorpayOrder: RazorpayOrderResult;
    try {
      const razorpay = getRazorpayInstance();
      const orderResult = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: invoice_id,
        notes: {
          invoice_id,
          user_id: user.id,
        },
      });
      razorpayOrder = orderResult as unknown as RazorpayOrderResult;
    } catch (rzpErr) {
      console.error('[Razorpay order creation error]', rzpErr);
      return NextResponse.json(
        { error: 'Failed to create Razorpay order. Please try again.' },
        { status: 502 }
      );
    }

    // Call create_razorpay_order RPC to persist pending payment row
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'create_razorpay_order',
      { p_invoice_id: invoice_id }
    );

    if (rpcError) {
      console.error('[create_razorpay_order RPC error]', rpcError);
      return NextResponse.json(
        { error: 'Failed to record payment. Please contact support.' },
        { status: 500 }
      );
    }

    // Update payment row with the Razorpay order ID
    const rpcData = rpcResult as { payment_id: string; amount_in_paise: number; invoice_id: string };
    await supabase
      .from('payments')
      .update({ razorpay_order_id: razorpayOrder.id })
      .eq('id', rpcData.payment_id);

    return NextResponse.json(
      {
        order_id: razorpayOrder.id,
        payment_id: rpcData.payment_id,
        amount: amountInPaise,
        currency: 'INR',
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[POST /api/payments/create-order] unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
