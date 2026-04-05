'use client';
// app/(dashboard)/checkout/[invoiceId]/page.tsx
// RevFlow — Checkout page with coupon + Razorpay payment

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { InvoiceItem } from '@/types/database';

/* MOCK MODE */
import { isRazorpayReady } from '@/lib/razorpay-mode';
import { MockPaymentModal } from '@/components/MockPaymentModal';

interface InvoiceDetail {
  id: string;
  subscription_id: string | null;
  total_amount: number | null;
  tax_amount: number | null;
  discount_amount: number;
  final_amount: number | null;
  status: string;
  created_at: string;
  invoice_items: InvoiceItem[];
}

interface DiscountRow {
  id: string;
  name: string;
  type: string | null;
  value: number;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: { email?: string; contact?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
}

export default function CheckoutPage() {
  const params   = useParams();
  const router   = useRouter();
  const supabase = createClient();

  const invoiceId = params.invoiceId as string;

  const [invoice, setInvoice]         = useState<InvoiceDetail | null>(null);
  const [loading, setLoading]         = useState(true);
  const [coupon, setCoupon]           = useState('');
  const [applyingCoupon, setApplying] = useState(false);
  const [couponMsg, setCouponMsg]     = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [paying, setPaying]           = useState(false);
  const [paymentMsg, setPaymentMsg]   = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [userEmail, setUserEmail]     = useState('');
  const rzpScriptLoaded               = useRef(false);

  /* MOCK MODE */
  const [showMockModal, setShowMockModal] = useState(false);
  const [mockOrderDetails, setMockOrderDetails] = useState<{ amount: number; orderId: string; paymentId: string } | null>(null);

  /* MOCK MODE */
  async function handleMockVerify(mockResponse: any) {
    try {
      const verifyRes = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...mockResponse,
          payment_id: mockOrderDetails?.paymentId,
        }),
      });
      const verifyData = await verifyRes.json();
      if (verifyData.success) {
        setPaymentMsg({ type: 'success', msg: '🎉 Mock payment successful! Subscription active.' });
        setTimeout(() => router.push('/subscriptions'), 2500);
      } else {
        setPaymentMsg({ type: 'error', msg: verifyData.error ?? 'Payment verification failed' });
      }
    } catch {
      setPaymentMsg({ type: 'error', msg: 'Verification network error' });
    } finally {
      setShowMockModal(false);
      setPaying(false);
    }
  }

  /* MOCK MODE */
  function handleMockFailure(errorMsg: string) {
    setPaymentMsg({ type: 'error', msg: errorMsg });
    setShowMockModal(false);
    setPaying(false);
  }

  /* MOCK MODE */
  function handleMockCancel() {
    setPaymentMsg({ type: 'error', msg: 'Mock payment cancelled' });
    setShowMockModal(false);
    setPaying(false);
  }

  // Load Razorpay checkout.js
  useEffect(() => {
    if (rzpScriptLoaded.current) return;
    const script = document.createElement('script');
    script.src   = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    rzpScriptLoaded.current = true;
  }, []);

  useEffect(() => {
    async function loadInvoice() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) setUserEmail(user.email);

      const res = await fetch(`/api/invoices/${invoiceId}`);
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = await res.json();
      setInvoice(data.invoice);
      setLoading(false);
    }
    loadInvoice();
  }, [invoiceId]);

  async function handleApplyCoupon() {
    if (!coupon.trim()) return;
    setApplying(true);
    setCouponMsg(null);

    // Find discount by name
    const { data: discounts, error } = await supabase
      .from('discounts')
      .select('id, name, type, value')
      .ilike('name', coupon.trim())
      .limit(1);

    if (error || !discounts || discounts.length === 0) {
      setCouponMsg({ type: 'error', msg: 'Invalid or expired coupon code' });
      setApplying(false);
      return;
    }

    const discount = discounts[0] as DiscountRow;

    // Call apply_discount_to_invoice RPC
    const { data: newFinal, error: rpcErr } = await supabase.rpc(
      'apply_discount_to_invoice',
      { p_invoice_id: invoiceId, p_discount_id: discount.id }
    );

    if (rpcErr) {
      setCouponMsg({ type: 'error', msg: rpcErr.message ?? 'Failed to apply coupon' });
      setApplying(false);
      return;
    }

    // Reload invoice
    const res = await fetch(`/api/invoices/${invoiceId}`);
    const updated = await res.json();
    setInvoice(updated.invoice);
    setCouponMsg({
      type: 'success',
      msg: `Coupon "${discount.name}" applied! Saved ${discount.type === 'percentage' ? discount.value + '%' : '₹' + discount.value}`,
    });
    setApplying(false);
  }

  async function handlePayNow() {
    if (!invoice) return;
    setPaying(true);
    setPaymentMsg(null);

    // Confirm invoice first
    await supabase.rpc('confirm_invoice', { p_invoice_id: invoiceId });

    // Create Razorpay order
    let orderData: { order_id: string; payment_id: string; amount: number; currency: string; key: string };
    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_id: invoiceId }),
      });
      if (!res.ok) {
        const d = await res.json();
        setPaymentMsg({ type: 'error', msg: d.error ?? 'Could not create payment order' });
        setPaying(false);
        return;
      }
      orderData = await res.json();
    } catch {
      setPaymentMsg({ type: 'error', msg: 'Network error — please try again' });
      setPaying(false);
      return;
    }

    /* MOCK MODE */
    if (!isRazorpayReady()) {
      setMockOrderDetails({
        amount: orderData.amount / 100, // convert paise to main currency unit
        orderId: orderData.order_id,
        paymentId: orderData.payment_id,
      });
      setShowMockModal(true);
      return;
    }

    // Open Razorpay modal
    if (typeof window.Razorpay === 'undefined') {
      setPaymentMsg({ type: 'error', msg: 'Payment gateway not loaded. Please refresh.' });
      setPaying(false);
      return;
    }

    const rzp = new window.Razorpay({
      key: orderData.key,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'RevFlow',
      description: `Invoice #${invoiceId.slice(0, 8)}`,
      order_id: orderData.order_id,
      prefill: { email: userEmail },
      theme: { color: '#6c63ff' },
      modal: {
        ondismiss: () => {
          setPaying(false);
          setPaymentMsg({ type: 'error', msg: 'Payment cancelled' });
        },
      },
      handler: async (response: RazorpayResponse) => {
        // Verify & activate
        try {
          const verifyRes = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_signature:  response.razorpay_signature,
              payment_id:          orderData.payment_id,
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            setPaymentMsg({ type: 'success', msg: '🎉 Payment successful! Your subscription is now active.' });
            setTimeout(() => router.push('/subscriptions'), 2500);
          } else {
            setPaymentMsg({ type: 'error', msg: verifyData.error ?? 'Payment verification failed' });
          }
        } catch {
          setPaymentMsg({ type: 'error', msg: 'Verification network error' });
        } finally {
          setPaying(false);
        }
      },
    });
    rzp.open();
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="spinner" style={{ width: '32px', height: '32px', borderWidth: '3px' }} />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="alert alert-error">
        Invoice not found or you don&apos;t have permission to view it.
      </div>
    );
  }

  const alreadyPaid = invoice.status === 'paid';

  return (
    <div className="animate-fade-in" style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem', fontFamily: "'Space Grotesk', sans-serif" }}>
          Checkout
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Invoice #{invoice.id.slice(0, 8)}
        </p>
      </div>

      {alreadyPaid && (
        <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
          ✅ This invoice has already been paid.
        </div>
      )}

      {/* Invoice Items */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Order Summary</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Item</th>
              <th style={{ textAlign: 'center' }}>Qty</th>
              <th style={{ textAlign: 'right' }}>Unit Price</th>
              <th style={{ textAlign: 'right' }}>Tax</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.invoice_items.map(item => (
              <tr key={item.id}>
                <td style={{ fontWeight: 500 }}>{item.product_name}</td>
                <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ textAlign: 'right' }}>₹{item.unit_price.toFixed(2)}</td>
                <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{item.tax}%</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{(item.amount ?? 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div
          style={{
            borderTop: '1px solid var(--border)',
            marginTop: '1rem',
            paddingTop: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <span>Subtotal</span>
            <span>₹{(invoice.total_amount ?? 0).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <span>Tax</span>
            <span>₹{(invoice.tax_amount ?? 0).toFixed(2)}</span>
          </div>
          {invoice.discount_amount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--success)' }}>
              <span>Discount</span>
              <span>−₹{invoice.discount_amount.toFixed(2)}</span>
            </div>
          )}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: 700,
              fontSize: '1.1rem',
              borderTop: '1px solid var(--border)',
              paddingTop: '0.5rem',
              marginTop: '0.25rem',
            }}
          >
            <span>Total</span>
            <span style={{ background: 'var(--gradient-1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              ₹{(invoice.final_amount ?? 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Coupon Code */}
      {!alreadyPaid && (
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Have a Coupon?</h2>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              id="coupon-input"
              type="text"
              className="input-field"
              placeholder="e.g. WELCOME10"
              value={coupon}
              onChange={e => setCoupon(e.target.value.toUpperCase())}
              style={{ flex: 1 }}
            />
            <button
              id="apply-coupon-btn"
              className="btn-secondary"
              onClick={handleApplyCoupon}
              disabled={applyingCoupon || !coupon.trim()}
              style={{ flexShrink: 0 }}
            >
              {applyingCoupon ? <span className="spinner" /> : 'Apply'}
            </button>
          </div>
          {couponMsg && (
            <div
              className={`alert alert-${couponMsg.type}`}
              style={{ marginTop: '0.75rem' }}
            >
              {couponMsg.msg}
            </div>
          )}
        </div>
      )}

      {/* Pay Now */}
      {!alreadyPaid && (
        <div className="card">
          {paymentMsg && (
            <div className={`alert alert-${paymentMsg.type}`} style={{ marginBottom: '1rem' }}>
              {paymentMsg.msg}
            </div>
          )}
          <button
            id="pay-now-btn"
            className="btn-primary"
            onClick={handlePayNow}
            disabled={paying}
            style={{ width: '100%', padding: '0.875rem', fontSize: '1rem' }}
          >
            {paying ? (
              <>
                <span className="spinner" />
                Processing…
              </>
            ) : (
              <>
                🔒 Pay ₹{(invoice.final_amount ?? 0).toFixed(2)} Securely
              </>
            )}
          </button>
          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
            Secured by Razorpay • 256-bit SSL encryption
          </p>
        </div>
      )}

      {/* MOCK MODE */}
      {showMockModal && mockOrderDetails && (
        <MockPaymentModal
          amount={mockOrderDetails.amount}
          orderId={mockOrderDetails.orderId}
          paymentId={mockOrderDetails.paymentId}
          invoiceId={invoiceId}
          onSuccess={handleMockVerify}
          onFailure={handleMockFailure}
          onCancel={handleMockCancel}
        />
      )}
    </div>
  );
}
