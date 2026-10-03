'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { TrendingUp, Lock, KeyRound, ArrowRight, CheckCircle2 } from 'lucide-react';
import api from '../../lib/api';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', {
        token: token.trim(),
        password,
      });
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. Invalid or expired token.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 sm:rounded-3xl border border-slate-100 sm:px-10">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Reset Password</h2>
        <p className="text-xs text-slate-500 mt-1">
          Create a new secure password for your account.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
          {error}
        </div>
      )}

      {success ? (
        <div className="text-center py-6">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Password Reset Successfully!</h3>
          <p className="text-xs text-slate-500 mt-1">Redirecting to login page...</p>
          <Link
            href="/login"
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-700"
          >
            <span>Click here to login now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reset Token *
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter reset token"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-medium text-slate-900 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              New Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Confirm New Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold shadow-md shadow-purple-200 transition disabled:opacity-50"
          >
            <span>{loading ? 'Resetting Password...' : 'Reset Password'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="text-xs font-bold text-slate-600 hover:text-purple-600"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">FinScope</h1>
        <p className="text-sm font-semibold text-purple-600 mt-1">Plan. Track. Grow.</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Suspense fallback={<div className="bg-white p-8 rounded-3xl text-center text-xs text-slate-400">Loading form...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
