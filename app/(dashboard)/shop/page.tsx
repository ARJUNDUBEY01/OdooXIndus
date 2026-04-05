'use client';
// app/(dashboard)/shop/page.tsx
// RevFlow — Shop with fully dynamic plans and features

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Plan, Product } from '@/types/database';

interface DynamicPlan extends Plan {
  options: {
    features?: string[];
  };
}

interface ProductWithPlans extends Product {
  plans: DynamicPlan[];
}

export default function ShopPage() {
  const router = useRouter();
  const supabase = createClient();

  const [products, setProducts]   = useState<ProductWithPlans[]>([]);
  const [billingCycle, setCycle]  = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading]     = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [error, setError]         = useState('');

  useEffect(() => {
    async function loadProducts() {
      const { data, error: dbErr } = await supabase
        .from('products')
        .select('*, plans(*)')
        .order('created_at', { ascending: true });

      if (dbErr) {
        setError('Failed to load products');
      } else {
        setProducts((data ?? []) as ProductWithPlans[]);
      }
      setLoading(false);
    }
    loadProducts();
  }, []);

  async function handleSubscribe(planId: string) {
    setSubscribing(planId);
    setError('');
    try {
      const res = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: planId, quantity: 1 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to create subscription');
        return;
      }
      router.push(`/checkout/${data.invoice_id}`);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubscribing(null);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
         <div className="spinner" style={{ width: '32px', height: '32px', borderWidth: '3px' }} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', fontFamily: "'Space Grotesk', sans-serif" }}>
          Choose Your Plan
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Select a product quotation to begin.
        </p>

        {/* Billing toggle */}
        <div
          style={{
            display: 'inline-flex',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '4px',
            gap: '4px',
          }}
        >
          {(['monthly', 'yearly'] as const).map(cycle => (
            <button
              key={cycle}
              id={`billing-${cycle}`}
              onClick={() => setCycle(cycle)}
              style={{
                padding: '0.4rem 1.1rem',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: billingCycle === cycle ? 'var(--gradient-1)' : 'transparent',
                color: billingCycle === cycle ? 'white' : 'var(--text-secondary)',
              }}
            >
              {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      {/* Product Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
        {products.map((product) => {
          // Find plan for selected cycle
          const plan = product.plans.find(p => p.billing_period === billingCycle);
          if (!plan) return null; // Wait for them to select correct cycle if this product doesn't have it

          const features = plan.options?.features || ['Standard features included'];
          const isEnterprise = product.name.includes('Enterprise');

          return (
            <div
              key={product.id}
              style={{
                background: 'var(--bg-card)',
                border: isEnterprise ? '2px solid rgba(108,99,255,0.6)' : '1px solid var(--border)',
                borderRadius: '20px',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: isEnterprise ? '0 0 40px rgba(108,99,255,0.15)' : 'none',
              }}
            >
              {isEnterprise && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--gradient-1)',
                    color: 'white',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '3px 12px',
                    borderRadius: '20px',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}
                >
                  ⭐ Popular for ERP
                </div>
              )}

              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  {product.name}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  {product.description}
                </p>
              </div>

              <div style={{ marginBottom: '1.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif" }}>
                    ${plan.price}
                  </span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    / {billingCycle === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>
              </div>

              <ul style={{ listStyle: 'none', marginBottom: '2rem', flex: 1 }}>
                {features.map(feature => (
                  <li
                    key={feature}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      fontSize: '0.875rem',
                      color: 'var(--text-secondary)',
                      padding: '0.3rem 0',
                    }}
                  >
                    <span style={{ color: 'var(--success)', fontWeight: 700, flexShrink: 0 }}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                id={`subscribe-${plan.id}`}
                className={isEnterprise ? 'btn-primary' : 'btn-secondary'}
                disabled={subscribing === plan.id}
                onClick={() => handleSubscribe(plan.id)}
                style={{ width: '100%' }}
              >
                {subscribing === plan.id ? (
                  <span className="spinner" />
                ) : (
                  `Select ${product.name.split(' ')[0]}`
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
