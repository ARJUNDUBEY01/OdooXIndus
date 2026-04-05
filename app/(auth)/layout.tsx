// app/(auth)/layout.tsx
// Auth layout — centered card on MD3 light background

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: 'radial-gradient(ellipse at top right, rgba(0,90,194,0.08) 0%, transparent 60%), radial-gradient(ellipse at bottom left, rgba(0,79,171,0.05) 0%, transparent 60%), #f1f4f6',
      }}
    >
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '0.75rem',
            }}
          >
            <img src="/logo.png" alt="Logo" style={{ height: '48px', width: 'auto', objectFit: 'contain' }} />
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontFamily: "'Inter', sans-serif" }}>
            Subscription management, simplified.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
