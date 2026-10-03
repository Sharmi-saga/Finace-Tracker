'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TrendingUp, Mail, Heart, ArrowLeft, ArrowRight, KeyRound } from 'lucide-react';
import api from '../../lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setMessage(res.data.message);
      if (res.data.resetToken) {
        setResetToken(res.data.resetToken);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to process request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">FinScope</h1>
        <p className="text-sm font-semibold text-purple-600 mt-1">Plan. Track. Grow.</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 sm:rounded-3xl border border-slate-100 sm:px-10">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">Forgot Password</h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter your registered email address to receive password reset instructions.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-medium">
              {message}
            </div>
          )}

          {resetToken ? (
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-900 mb-1">
                  <KeyRound className="w-4 h-4 text-purple-600" />
                  <span>Reset Token Generated</span>
                </div>
                <div className="text-xs font-mono bg-white p-2.5 rounded-xl border border-purple-200 text-purple-800 break-all select-all">
                  {resetToken}
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  Copy this token or click below to proceed directly to reset password.
                </p>
              </div>

              <Link
                href={`/reset-password?token=${resetToken}`}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold shadow-md shadow-purple-200 transition"
              >
                <span>Continue to Reset Password</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="demo@financetracker.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold shadow-md shadow-purple-200 transition disabled:opacity-50"
              >
                <span>{loading ? 'Submitting...' : 'Send Reset Link'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-purple-600"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
