// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Expose Razorpay public key to client-side code via NEXT_PUBLIC_ prefix
  // All NEXT_PUBLIC_ env vars are automatically available in the browser
  experimental: {
    // Required for @supabase/ssr cookie handling in server actions
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
