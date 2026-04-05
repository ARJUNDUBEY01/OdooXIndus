// app/layout.tsx
// RevFlow — Root layout

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RevFlow — SaaS Subscription Management',
  description:
    'RevFlow is a modern SaaS subscription management platform. Manage plans, invoices, payments, and customers all in one place.',
  keywords: 'subscription management, SaaS, billing, invoicing, payments, Razorpay',
  authors: [{ name: 'RevFlow' }],
  openGraph: {
    title: 'RevFlow — SaaS Subscription Management',
    description:
      'Manage your SaaS subscriptions, plans, invoices, and payments with RevFlow.',
    type: 'website',
  },
};

import { AuthProvider } from '@/context/AuthContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
