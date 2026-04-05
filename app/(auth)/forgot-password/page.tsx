'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Mail, ShieldCheck, KeyRound, ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verifiedToken, setVerifiedToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { sendOTP, verifyOTP, resetPassword } = useAuth();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await sendOTP(email);
    if (res.error) setError(res.error);
    else setStep(2);
    setLoading(false);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await verifyOTP(email, otp);
    if (res.error) setError(res.error);
    else {
      setVerifiedToken(res.verifiedToken || '');
      setStep(3);
    }
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    const res = await resetPassword(email, verifiedToken, newPassword);
    if (res.error) setError(res.error);
    else setStep(4); // Success state
    setLoading(false);
  };

  const stepVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <div className="relative min-h-[600px] flex items-center justify-center p-4">
      {/* Background blobs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute -bottom-8 right-20 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative"
      >
        <div className="glass rounded-[32px] p-8 md:p-10 shadow-2xl overflow-hidden min-h-[480px] flex flex-col">
          
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex-1 flex flex-col"
              >
                <div className="mb-8">
                  <Link href="/login" className="inline-flex items-center gap-1 text-sm font-bold text-gray-400 hover:text-blue-600 mb-6 transition-colors group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Login
                  </Link>
                  <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Forgot Password?</h1>
                  <p className="text-gray-500 font-medium leading-relaxed">
                    No worries, it happens. Enter your email and we&apos;ll send you a 6-digit verification code.
                  </p>
                </div>

                <form onSubmit={handleSendOTP} className="space-y-6 flex-1 flex flex-col">
                  {error && <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-bold leading-relaxed">{error}</div>}
                  
                  <div className="group">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none text-sm"
                        placeholder="you@company.com"
                      />
                    </div>
                  </div>

                  <div className="mt-auto">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 group active:scale-95 disabled:opacity-70 disabled:active:scale-100"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <>Send Verification Code <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex-1 flex flex-col"
              >
                <div className="mb-8">
                  <button onClick={() => setStep(1)} className="inline-flex items-center gap-1 text-sm font-bold text-gray-400 hover:text-blue-600 mb-6 transition-colors group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Change Email
                  </button>
                  <h1 className="text-3xl font-extrabold text-gray-900 mb-2 text-wrap">Verify OTP</h1>
                  <p className="text-gray-500 font-medium leading-relaxed">
                    We&apos;ve sent a code to <span className="text-gray-900 font-bold">{email}</span>. Enter it below to proceed.
                  </p>
                </div>

                <form onSubmit={handleVerifyOTP} className="space-y-6 flex-1 flex flex-col">
                  {error && <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-bold leading-relaxed">{error}</div>}
                  
                  <div className="group">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">6-Digit Code</label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none text-xl tracking-[0.5em] font-bold text-center pl-10"
                        placeholder="000000"
                      />
                    </div>
                  </div>

                  <div className="mt-auto">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 group active:scale-95 disabled:opacity-70"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <>Verify Code <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                      )}
                    </button>
                    <p className="text-center mt-4 text-xs font-bold text-gray-400">
                      Didn&apos;t get it? <button type="button" onClick={() => sendOTP(email)} className="text-blue-600 hover:underline">Resend</button>
                    </p>
                  </div>
                </form>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                variants={stepVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex-1 flex flex-col"
              >
                <div className="mb-8">
                  <h1 className="text-3xl font-extrabold text-gray-900 mb-2">New Password</h1>
                  <p className="text-gray-500 font-medium leading-relaxed">
                    Set a secure password for your account.
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-6 flex-1 flex flex-col">
                  {error && <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-bold shadow-sm">{error}</div>}
                  
                  <div className="space-y-4">
                    <div className="group">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">New Password</label>
                      <div className="relative">
                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none text-sm"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    <div className="group">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Confirm Password</label>
                      <div className="relative">
                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none text-sm"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 group active:scale-95 disabled:opacity-70"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <>Update Password <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 flex flex-col items-center justify-center text-center p-4"
              >
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
                <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Password Reset!</h1>
                <p className="text-gray-500 font-medium leading-relaxed mb-10">
                  Your password has been successfully updated. You can now log in with your new credentials.
                </p>
                <Link
                  href="/login"
                  className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  Return to Sign In
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
