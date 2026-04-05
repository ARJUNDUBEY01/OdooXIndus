'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Mail, Lock, User, ArrowRight, Loader2, Sparkles } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signUp } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    const { error: signUpError } = await signUp(email, password, name);
    
    if (signUpError) {
      setError(signUpError || 'Failed to create account');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[700px] flex items-center justify-center p-4 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg relative"
      >
        <div className="glass rounded-[32px] p-8 md:p-10 shadow-3xl relative overflow-hidden">
          {/* Logo Area */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg mb-4 transform -rotate-3">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-1 text-center">
              Create Your Account
            </h1>
            <p className="text-gray-500 font-medium">Start your journey with RevFlow</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-full">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1 transition-all group-focus-within:text-indigo-600">
                  Full Name
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm transition-all focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                    placeholder="Jane Smith"
                  />
                </div>
              </div>

              <div className="col-span-full">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-purple-600 transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm transition-all focus:bg-white focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm transition-all focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none"
                    placeholder="Min 8 chars"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                  Confirm
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="block w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm transition-all focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none"
                    placeholder="Repeat"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-purple-200 transition-all flex items-center justify-center gap-2 group active:scale-95 disabled:opacity-70 disabled:active:scale-100"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500 font-medium">
              Already have an account?{' '}
              <Link href="/login" className="text-indigo-600 font-bold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
