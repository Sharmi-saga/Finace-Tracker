'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TrendingUp, Lock, Mail, Heart, ArrowRight } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail('demo@financetracker.com');
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Logo */}
        {/* <div className="mx-auto w-14 h-14 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-200 mb-4">
          <TrendingUp className="w-8 h-8 stroke-[2.5]" />
        </div> */}
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">FinScope</h1>
        <p className="text-sm font-semibold text-purple-600 mt-1">Plan. Track. Grow.</p>

        <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-slate-500 font-medium">
          <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
          <span>&ldquo;Discipline today. A bigger tomorrow.&rdquo;</span>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 sm:rounded-3xl border border-slate-100 sm:px-10">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">Welcome Back</h2>
            <p className="text-xs text-slate-500 mt-1">
              Sign in to manage your finances, budgets, and accounts.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
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
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Password</label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-purple-600 hover:text-purple-700"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold shadow-md shadow-purple-200 transition-all duration-200 disabled:opacity-50"
            >
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Demo account quick login box */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <button
              type="button"
              onClick={handleDemoFill}
              className="w-full py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
            >
              <span>⚡ Click to Fill Demo Account (A. S. Sharmitha)</span>
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              Don&apos;t have an account yet?{' '}
              <Link href="/register" className="font-bold text-purple-600 hover:text-purple-700">
                Register now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
