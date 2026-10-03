'use client';

import React, { useEffect, useState } from 'react';
import { X, ArrowDownRight, ArrowUpRight, ArrowLeftRight } from 'lucide-react';
import api from '../../lib/api';
import { Account, Category, Transaction } from '../../types';
import AddCategoryModal from './AddCategoryModal';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transactionToEdit?: Transaction | null;
  defaultType?: 'Income' | 'Expense' | 'Transfer';
  defaultAccountId?: string;
}

export default function AddTransactionModal({
  isOpen,
  onClose,
  onSuccess,
  transactionToEdit,
  defaultType = 'Expense',
  defaultAccountId,
}: AddTransactionModalProps) {
  const [type, setType] = useState<'Income' | 'Expense' | 'Transfer'>(defaultType);
  const [accountId, setAccountId] = useState('');
  const [transferToAccountId, setTransferToAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadFormData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setAccountId(
        typeof transactionToEdit.accountId === 'object'
          ? transactionToEdit.accountId._id
          : transactionToEdit.accountId,
      );
      if (transactionToEdit.transferToAccountId) {
        setTransferToAccountId(
          typeof transactionToEdit.transferToAccountId === 'object'
            ? transactionToEdit.transferToAccountId._id
            : transactionToEdit.transferToAccountId,
        );
      }
      if (transactionToEdit.categoryId) {
        setCategoryId(
          typeof transactionToEdit.categoryId === 'object'
            ? transactionToEdit.categoryId._id
            : transactionToEdit.categoryId,
        );
      }
      setAmount(String(transactionToEdit.amount));
      setDescription(transactionToEdit.description);
      setDate(
        transactionToEdit.date
          ? new Date(transactionToEdit.date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
      );
      setNotes(transactionToEdit.notes || '');
    } else {
      setType(defaultType);
      if (defaultAccountId) {
        setAccountId(defaultAccountId);
      }
      setAmount('');
      setDescription('');
      setNotes('');
      setDate(new Date().toISOString().split('T')[0]);
    }
    setError('');
  }, [transactionToEdit, isOpen, defaultType, defaultAccountId]);

  const loadFormData = async () => {
    try {
      const [accRes, catRes] = await Promise.all([
        api.get('/accounts'),
        api.get('/categories'),
      ]);
      setAccounts(accRes.data);
      setCategories(catRes.data);

      if (!transactionToEdit) {
        if (!defaultAccountId && accRes.data.length > 0) {
          setAccountId(accRes.data[0]._id);
        }
        if (catRes.data.length > 0) {
          setCategoryId(catRes.data[0]._id);
        }
      }
    } catch (err: any) {
      console.error('Error loading accounts/categories:', err);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid positive amount');
      return;
    }

    if (!accountId) {
      setError('Please select an account');
      return;
    }

    if (type === 'Transfer' && (!transferToAccountId || transferToAccountId === accountId)) {
      setError('Please select a different destination account');
      return;
    }

    if (!description.trim()) {
      setError('Please enter a description');
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        type,
        accountId,
        amount: parseFloat(amount),
        description: description.trim(),
        date: new Date(date).toISOString(),
        notes: notes.trim(),
      };

      if (type === 'Transfer') {
        payload.transferToAccountId = transferToAccountId;
      } else {
        payload.categoryId = categoryId;
      }

      if (transactionToEdit) {
        await api.patch(`/transactions/${transactionToEdit._id}`, payload);
      } else {
        await api.post('/transactions', payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter((c) => {
    if (type === 'Income') return c.type === 'Income' || c.type === 'Both';
    if (type === 'Expense') return c.type === 'Expense' || c.type === 'Both';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {transactionToEdit ? 'Edit Transaction' : 'Add Transaction'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Record income, expense or account transfer
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close add transaction modal"
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
          {/* Type Selector Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Transaction Type
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-50 rounded-2xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setType('Expense')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  type === 'Expense'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowDownRight className="w-4 h-4" />
                <span>Expense</span>
              </button>
              <button
                type="button"
                onClick={() => setType('Income')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  type === 'Income'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Income</span>
              </button>
              <button
                type="button"
                onClick={() => setType('Transfer')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  type === 'Transfer'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>Transfer</span>
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Amount (LKR) *
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
                placeholder="0.00"
                className="w-full pl-14 pr-4 py-2.5 rounded-xl border border-slate-200 text-base font-bold text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              />
            </div>
          </div>

          {/* Account Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {type === 'Transfer' ? 'From Account *' : 'Account *'}
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:border-purple-500 bg-white"
              >
                <option value="">Select Account</option>
                {accounts.map((acc) => (
                  <option key={acc._id} value={acc._id}>
                    {acc.name} ({acc.currency})
                  </option>
                ))}
              </select>
            </div>

            {type === 'Transfer' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  To Account *
                </label>
                <select
                  value={transferToAccountId}
                  onChange={(e) => setTransferToAccountId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:border-purple-500 bg-white"
                >
                  <option value="">Select Destination</option>
                  {accounts
                    .filter((acc) => acc._id !== accountId)
                    .map((acc) => (
                      <option key={acc._id} value={acc._id}>
                        {acc.name} ({acc.currency})
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-600">
                    Category *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddCategoryOpen(true)}
                    className="text-[11px] font-bold text-purple-600 hover:text-purple-700 hover:underline"
                  >
                    Add Category
                  </button>
                </div>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:border-purple-500 bg-white"
                >
                  <option value="">Select Category</option>
                  {filteredCategories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Date & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Description *
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Team lunch, Client wire"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional memo or reference..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-purple-500 resize-none"
            />
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
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold shadow-md shadow-purple-200 transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : transactionToEdit ? 'Save Changes' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>

      {/* Add Category Modal */}
      <AddCategoryModal
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        defaultType={type === 'Income' ? 'Income' : 'Expense'}
        onSuccess={(newCategory) => {
          loadFormData();
          if (newCategory?._id) {
            setCategoryId(newCategory._id);
          }
        }}
      />
    </div>
  );
}
