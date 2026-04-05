// app/api/payments/verify/route.ts
// POST /api/payments/verify
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';

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
    let body: {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
      payment_id: string;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      payment_id,
    } = body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !payment_id) {
      return NextResponse.json(
        { error: 'Missing required payment verification fields' },
        { status: 400 }
      );
    }

    // HMAC-SHA256 signature verification
    /* MOCK MODE */
    if (razorpay_payment_id.startsWith('mock_pay_')) {
      console.log('[verify] Mock payment detected. Skipping HMAC validation.');
    } else {
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!keySecret) {
        console.error('[verify] RAZORPAY_KEY_SECRET is not set');
        return NextResponse.json(
          { error: 'Payment configuration error' },
          { status: 500 }
        );
      }

      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        console.warn('[verify] Signature mismatch!', {
          payment_id,
          razorpay_order_id,
        });
        await supabase
          .from('payments')
          .update({ status: 'failed' })
          .eq('id', payment_id);

        return NextResponse.json(
          { success: false, error: 'Payment signature verification failed' },
          { status: 400 }
        );
      }
    }

    // Call verify_and_activate RPC
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'verify_and_activate',
      {
        p_payment_id: payment_id,
        p_razorpay_payment_id: razorpay_payment_id,
        p_razorpay_order_id: razorpay_order_id,
        p_razorpay_signature: razorpay_signature,
      }
    );

    if (rpcError) {
      console.error('[verify_and_activate RPC error]', rpcError);
      return NextResponse.json(
        { success: false, error: 'Failed to activate subscription after payment' },
        { status: 500 }
      );
    }

    const result = rpcResult as { subscription_id: string; status: string; end_date: string };

    return NextResponse.json(
      {
        success: true,
        subscription_id: result.subscription_id,
        status: result.status,
        end_date: result.end_date,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[POST /api/payments/verify] unexpected error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
