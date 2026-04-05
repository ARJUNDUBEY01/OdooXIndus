'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  sendOTP: (email: string) => Promise<{ message?: string; error?: string }>;
  verifyOTP: (email: string, otp: string) => Promise<{ verifiedToken?: string; error?: string }>;
  resetPassword: (email: string, verifiedToken: string, newPassword: string) => Promise<{ message?: string; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  // Backend URL for OTP flow
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    };

    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) router.push('/dashboard');
    return { error };
  };

  const signUp = async (email: string, password: string, name: string) => {
    // We call our custom Edge Function to bypass email verification
    try {
      const response = await fetch(`/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const result = await response.json();
      if (!response.ok) return { error: result.error || 'Signup failed' };

      // After successful signup via Edge Function, the user can sign in
      return await signIn(email, password);
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    router.push('/login');
  };

  const sendOTP = async (email: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      return await response.json();
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const verifyOTP = async (email: string, otp: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      return await response.json();
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const resetPassword = async (email: string, verifiedToken: string, newPassword: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/otp/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, verifiedToken, newPassword }),
      });
      return await response.json();
    } catch (error: any) {
      return { error: error.message };
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut, sendOTP, verifyOTP, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
