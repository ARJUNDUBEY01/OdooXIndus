'use client';
// components/MockPaymentModal.tsx
/* MOCK MODE */

import { useState } from 'react';

interface MockPaymentModalProps {
  amount: number;
  orderId: string;
  paymentId: string;
  invoiceId: string;
  onSuccess: (mockResponse: any) => void;
  onFailure: (errorMsg: string) => void;
  onCancel: () => void;
}

export function MockPaymentModal({
  amount,
  orderId,
  paymentId,
  onSuccess,
  onFailure,
  onCancel,
}: MockPaymentModalProps) {
  const [loadingAction, setLoadingAction] = useState<'success' | 'failure' | null>(null);

  const simulateSuccess = () => {
    setLoadingAction('success');
    setTimeout(() => {
      onSuccess({
        razorpay_payment_id: "mock_pay_" + Date.now(),
        razorpay_order_id: orderId,
        razorpay_signature: "mock_signature",
      });
    }, 2000); // Mimic real payment delay
  };

  const simulateFailure = () => {
    setLoadingAction('failure');
    setTimeout(() => {
      onFailure("Payment failed. Try again.");
      setLoadingAction(null);
    }, 2000);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50
    }}>
      <div style={{
        background: 'var(--bg-card)',
        padding: '2rem',
        borderRadius: '16px',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        border: '1px solid var(--border)'
      }}>
        <div style={{
          background: '#FEF3C7',
          color: '#92400E',
          padding: '0.75rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          fontSize: '0.875rem',
          fontWeight: 600,
          textAlign: 'center'
        }}>
          ⚠ Test Mode — Razorpay key not configured. Using mock payments.
        </div>
        
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', textAlign: 'center' }}>
          Simulated Checkout
        </h2>
        
        <div style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800, marginBottom: '2rem' }}>
          ₹{amount.toFixed(2)}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            onClick={simulateSuccess}
            disabled={loadingAction !== null}
            style={{
              padding: '0.75rem', borderRadius: '8px', fontWeight: 600,
              background: '#10B981', color: 'white', border: 'none', cursor: 'pointer',
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem'
            }}
          >
            {loadingAction === 'success' && <div className="spinner" style={{ width: '16px', height: '16px' }}/>}
            Simulate Success
          </button>
          
          <button
            onClick={simulateFailure}
            disabled={loadingAction !== null}
            style={{
              padding: '0.75rem', borderRadius: '8px', fontWeight: 600,
              background: '#EF4444', color: 'white', border: 'none', cursor: 'pointer',
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem'
            }}
          >
             {loadingAction === 'failure' && <div className="spinner" style={{ width: '16px', height: '16px' }}/>}
            Simulate Failure
          </button>
          
          <button
            onClick={onCancel}
            disabled={loadingAction !== null}
            style={{
              padding: '0.75rem', borderRadius: '8px', fontWeight: 600,
              background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)', cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
