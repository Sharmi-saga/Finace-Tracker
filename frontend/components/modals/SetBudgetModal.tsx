'use client';

import React, { useEffect, useState } from 'react';
import { X, Target, Bell } from 'lucide-react';
import api from '../../lib/api';
import { Account, Category, Budget } from '../../types';
import MonthYearPicker from '../ui/MonthYearPicker';
import { DateFilter } from '../../lib/auth-context';

interface SetBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  budgetToEdit?: Budget | null;
  defaultPeriod?: string;
}

function getPeriodFilter(period: string): DateFilter {
  const parts = period.split('|');
  const mode = parts[0] as DateFilter['mode'];
  const isRange = parts.length === 3 && ['day', 'week', 'year', 'custom'].includes(mode);
  const date = isRange ? new Date(`${parts[1]}T00:00:00`) : new Date(`${period} 1`);
  const validDate = Number.isNaN(date.getTime()) ? new Date() : date;
  const start = isRange ? new Date(`${parts[1]}T00:00:00`) : new Date(validDate.getFullYear(), validDate.getMonth(), 1);
  const end = isRange ? new Date(`${parts[2]}T00:00:00`) : new Date(validDate.getFullYear(), validDate.getMonth() + 1, 0);
  const toInput = (value: Date) =>
    `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  const month = `${validDate.toLocaleString('en-US', { month: 'long' })} ${validDate.getFullYear()}`;
  const label = mode === 'year' && isRange
    ? String(start.getFullYear())
    : isRange
    ? `${start.toLocaleDateString('en-US')} - ${end.toLocaleDateString('en-US')}`
    : month;

  return {
    mode: isRange ? mode : 'month',
    label,
    month,
    startDate: toInput(start),
    endDate: toInput(end),
  };
}

function periodFromFilter(filter: DateFilter): string {
  return filter.mode === 'month'
    ? filter.month
    : `${filter.mode}|${filter.startDate}|${filter.endDate}`;
}

export default function SetBudgetModal({
  isOpen,
  onClose,
  onSuccess,
  budgetToEdit,
  defaultPeriod = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
}: SetBudgetModalProps) {
  const [type, setType] = useState<'Category' | 'Account'>('Category');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [period, setPeriod] = useState(defaultPeriod);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [alertEnabled, setAlertEnabled] = useState(true);
  const [alertThreshold, setAlertThreshold] = useState(80);

  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadDependencies();
    }
  }, [isOpen]);

  useEffect(() => {
    if (budgetToEdit) {
      setType(budgetToEdit.type);
      setPeriod(budgetToEdit.period);
      setAmount(String(budgetToEdit.amount));
      setNotes(budgetToEdit.notes || '');
      setAlertEnabled(budgetToEdit.alertEnabled !== false);
      setAlertThreshold(budgetToEdit.alertThreshold || 80);

      if (budgetToEdit.categoryId) {
        setCategoryId(
          typeof budgetToEdit.categoryId === 'object'
            ? budgetToEdit.categoryId._id
            : budgetToEdit.categoryId,
        );
      }
      if (budgetToEdit.accountId) {
        setAccountId(
          typeof budgetToEdit.accountId === 'object'
            ? budgetToEdit.accountId._id
            : budgetToEdit.accountId,
        );
      }
    } else {
      setType('Category');
      setPeriod(defaultPeriod);
      setAmount('');
      setNotes('');
      setAlertEnabled(true);
      setAlertThreshold(80);
    }
    setError('');
  }, [budgetToEdit, isOpen, defaultPeriod]);

  const loadDependencies = async () => {
    try {
      const [catsRes, accsRes] = await Promise.all([
        api.get('/categories'),
        api.get('/accounts'),
      ]);
      setCategories(catsRes.data.filter((c: Category) => c.type !== 'Income'));
      setAccounts(accsRes.data);

      if (!budgetToEdit) {
        if (catsRes.data.length > 0) setCategoryId(catsRes.data[0]._id);
        if (accsRes.data.length > 0) setAccountId(accsRes.data[0]._id);
      }
    } catch (err) {
      console.error('Error fetching budget dependencies:', err);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid positive budget amount');
      return;
    }

    if (type === 'Category' && !categoryId) {
      setError('Please select a category');
      return;
    }

    if (type === 'Account' && !accountId) {
      setError('Please select an account');
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        type,
        period,
        amount: parseFloat(amount),
        notes: notes.trim(),
        alertEnabled,
        alertThreshold,
      };

      if (type === 'Category') {
        payload.categoryId = categoryId;
      } else {
        payload.accountId = accountId;
      }

      if (budgetToEdit) {
        await api.patch(`/budgets/${budgetToEdit._id}`, payload);
      } else {
        await api.post('/budgets', payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save budget');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {budgetToEdit ? 'Edit Budget' : 'Set Budget'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Set spending limits for a month, year, or selected date range.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close set budget modal"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Budget Type Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Budget Type
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setType('Category')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  type === 'Category'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Category Budget
              </button>
              <button
                type="button"
                onClick={() => setType('Account')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  type === 'Account'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Account Budget
              </button>
            </div>
          </div>

          {/* Target Period & Target Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Target Period *
              </label>
              <MonthYearPicker
                value={period}
                dateFilter={getPeriodFilter(period)}
                onDateFilterChange={(filter) => setPeriod(periodFromFilter(filter))}
                className="w-full"
                popoverFixed
              />
            </div>

            {type === 'Category' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Select Category *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-500 bg-white"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Select Account *
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-500 bg-white"
                >
                  <option value="">Select Account</option>
                  {accounts.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.name} ({a.currency})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Budget Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Budget Amount (LKR) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                LKR
              </span>
              <input
                type="number"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="500,000"
                className="w-full pl-14 pr-4 py-2.5 rounded-xl border border-slate-200 text-base font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Notes / Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Notes / Description
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Spending guidelines or notes..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Alert Threshold Checkbox */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-start gap-3">
            <input
              type="checkbox"
              id="alertEnabled"
              checked={alertEnabled}
              onChange={(e) => setAlertEnabled(e.target.checked)}
              className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
            />
            <label htmlFor="alertEnabled" className="text-xs text-slate-700 cursor-pointer">
              <span className="font-bold flex items-center gap-1 text-blue-900">
                <Bell className="w-3.5 h-3.5 text-blue-600 inline" />
                Alert when spending reaches {alertThreshold}% of budget
              </span>
              <span className="text-slate-500 block mt-0.5">
                Displays warning badges and alerts when threshold is approached or exceeded.
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-200 transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : budgetToEdit ? 'Save Changes' : 'Save Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
