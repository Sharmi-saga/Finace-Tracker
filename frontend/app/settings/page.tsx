'use client';

import React, { useEffect, useState } from 'react';
import { User, Mail, Shield, Calendar, DollarSign, Layout, Save, CheckCircle2, Plus, Tag, Trash2 } from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import MobileNav from '../../components/layout/MobileNav';
import Header from '../../components/layout/Header';
import AddCategoryModal from '../../components/modals/AddCategoryModal';
import api from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { Category } from '../../types';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [dateFormat, setDateFormat] = useState('DD MMM YYYY');
  const [defaultCurrency, setDefaultCurrency] = useState('LKR');
  const [dashboardStartPage, setDashboardStartPage] = useState('Dashboard');
  const [monthlyTarget, setMonthlyTarget] = useState(0);
  const [yearlyTarget, setYearlyTarget] = useState(0);

  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setRole(user.role || 'Founder / CEO');
      setMonthlyTarget(user.monthlyTarget || 0);
      setYearlyTarget(user.yearlyTarget || 0);
    }

    api
      .get('/settings')
      .then((res) => {
        if (res.data) {
          setDateFormat(res.data.dateFormat || 'DD MMM YYYY');
          setDefaultCurrency(res.data.defaultCurrency || 'LKR');
          setDashboardStartPage(res.data.dashboardStartPage || 'Dashboard');
        }
      })
    fetchCategories();
  }, [user]);

  const fetchCategories = () => {
    api.get('/categories').then((res) => setCategories(res.data)).catch(console.error);
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;
    try {
      await api.delete(`/categories/${id}`);
      fetchCategories();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Could not delete category');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      // 1. Update user profile
      const userRes = await api.patch('/users/me', {
        name: name.trim(),
        role: role.trim(),
        monthlyTarget,
        yearlyTarget,
      });
      updateUser(userRes.data);

      // 2. Update settings
      await api.patch('/settings', {
        dateFormat,
        defaultCurrency,
        dashboardStartPage,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-10">
        <MobileNav />

        <main className="flex-1 p-4 lg:p-8 max-w-4xl w-full mx-auto">
          {/* Header */}
          <Header
            title="General Settings"
            subtitle="Manage your preferences for a better experience."
            showDatePicker={false}
          />

          <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)]">
            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl font-medium">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Settings and profile updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
              {/* Profile Section */}
              <div>
                <h2 className="text-base font-bold text-slate-900 mb-1">User Profile</h2>
                <p className="text-xs text-slate-400 mb-4">
                  Account holder credentials and role
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        disabled
                        value={email}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-500 bg-slate-50 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Role / Title
                    </label>
                    <div className="relative">
                      <Shield className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="Founder / CEO"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Preferences Section */}
              {/* <div className="pt-6 border-t border-slate-100">
                <h2 className="text-base font-bold text-slate-900 mb-1">Financial Targets</h2>
                <p className="text-xs text-slate-400 mb-4">
                  Set income goals used by the dashboard. Leave a target at 0 to hide its progress.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Monthly Income Target (LKR)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={monthlyTarget}
                      onChange={(e) => setMonthlyTarget(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Yearly Income Target (LKR)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={yearlyTarget}
                      onChange={(e) => setYearlyTarget(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div> */}

              {/* Preferences Section */}
              <div className="pt-6 border-t border-slate-100">
                <h2 className="text-base font-bold text-slate-900 mb-1">General Preferences</h2>
                <p className="text-xs text-slate-400 mb-4">
                  Configure default date formats, currencies, and start view
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Date Format
                    </label>
                    <select
                      value={dateFormat}
                      onChange={(e) => setDateFormat(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:border-purple-500 bg-white"
                    >
                      <option value="DD MMM YYYY">DD MMM YYYY (e.g. 22 Sep 2026)</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-09-22)</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 09/22/2026)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Default Currency
                    </label>
                    <select
                      value={defaultCurrency}
                      onChange={(e) => setDefaultCurrency(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:border-purple-500 bg-white"
                    >
                      <option value="LKR">LKR - Sri Lankan Rupee</option>
                      <option value="USD">USD ($) - US Dollar</option>
                      <option value="EUR">EUR (€) - Euro</option>
                      <option value="GBP">GBP (£) - British Pound</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Dashboard Start Page
                    </label>
                    <select
                      value={dashboardStartPage}
                      onChange={(e) => setDashboardStartPage(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:border-purple-500 bg-white"
                    >
                      <option value="Dashboard">Dashboard</option>
                      <option value="Transactions">Transactions</option>
                      <option value="Budget">Budget</option>
                      <option value="Reports">Reports</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold shadow-md shadow-purple-200 transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'Saving...' : 'Save Settings'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Categories Management Section */}
          <div className="mt-8 bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-purple-600" />
                  <span>Categories Management</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  View, customize and add categories for tracking income and expenses.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddCategoryOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-purple-200 transition shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Category</span>
              </button>
            </div>

            {categories.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No categories found. Click &quot;+ Add New Category&quot; to create your first one.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {categories.map((cat) => (
                  <div
                    key={cat._id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between group hover:border-purple-200 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                        style={{ backgroundColor: cat.color || '#7C3AED' }}
                      >
                        <Tag className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{cat.name}</div>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md inline-block mt-0.5 ${
                            cat.type === 'Income'
                              ? 'bg-emerald-50 text-emerald-700'
                              : cat.type === 'Both'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {cat.type || 'Expense'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat._id, cat.name)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Category Modal */}
      <AddCategoryModal
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        onSuccess={() => fetchCategories()}
      />
    </div>
  );
}
