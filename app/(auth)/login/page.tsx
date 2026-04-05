'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Mail, Lock, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setError(signInError.message || 'Invalid credentials');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[600px] flex items-center justify-center p-4">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative"
      >
        <div className="glass rounded-[32px] p-8 md:p-10 shadow-2xl relative overflow-hidden">
          {/* Logo Area */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg mb-4 transform rotate-3">
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-1">
              Welcome Back
            </h1>
            <p className="text-gray-500 font-medium">Log in to your RevFlow portal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm font-medium flex items-center gap-2"
                >
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm transition-all focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2 ml-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Forgot?
                  </Link>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm transition-all focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 group active:scale-95 disabled:opacity-70 disabled:active:scale-100"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500 font-medium">
              New to RevFlow?{' '}
              <Link href="/register" className="text-blue-600 font-bold hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
