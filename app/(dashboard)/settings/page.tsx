'use client';
// app/(dashboard)/settings/page.tsx

import { useState } from 'react';

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setToast('Configuration saved successfully');
      setTimeout(() => setToast(''), 3000);
    }, 800);
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem', fontFamily: "'Space Grotesk', sans-serif" }}>
            Configuration
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Manage your company details and system integrations.
          </p>
        </div>
        <div>
          <button 
            className="btn-primary" 
            onClick={handleSave} 
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {saving ? <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}/> : '💾'}
            Save Settings
          </button>
        </div>
      </div>

      {toast && (
        <div style={{ background: 'var(--success)', color: 'white', padding: '0.75rem 1rem', borderRadius: '8px', fontWeight: 600 }}>
          ✓ {toast}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1.5rem' }}>
        
        {/* Company Settings */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Company Details</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Information used on your invoices and customer-facing documents.</p>
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem' }}>Company Name</label>
            <input type="text" className="input-field" defaultValue="Acme Corporation" />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem' }}>Tax ID / VAT</label>
            <input type="text" className="input-field" defaultValue="GSTIN-1234QA99" />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem' }}>Billing Address</label>
            <textarea className="input-field" rows={3} defaultValue={"123 Business Rd.\nTech Park, City 400001"}></textarea>
          </div>
        </div>

        {/* Integration Settings */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
           <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Payment Gateway</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Configure Razorpay API credentials.</p>
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem' }}>Razorpay Key ID</label>
            <input type="text" className="input-field" placeholder="rzp_test_..." defaultValue={process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || ''} disabled />
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Loaded from environment variables.</p>
          </div>

           <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '1.5rem', marginBottom: '0.25rem' }}>Notifications</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Email alerts and webhooks.</p>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked style={{ width: '16px', height: '16px' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Email on successful payment</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked style={{ width: '16px', height: '16px' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Email on subscription cancellation</span>
          </label>
        </div>

      </div>
    </div>
  );
}
