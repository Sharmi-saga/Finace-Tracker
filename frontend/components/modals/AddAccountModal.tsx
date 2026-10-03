'use client';

import React, { useEffect, useState } from 'react';
import { X, User, Building2, Briefcase, Store, Wallet } from 'lucide-react';
import api from '../../lib/api';
import { Account } from '../../types';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accountToEdit?: Account | null;
}

export default function AddAccountModal({
  isOpen,
  onClose,
  onSuccess,
  accountToEdit,
}: AddAccountModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'Personal' | 'Business'>('Personal');
  const [currency, setCurrency] = useState('LKR');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('User');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const icons = [
    { name: 'User', label: 'Personal', icon: User },
    { name: 'Building2', label: 'Company', icon: Building2 },
    { name: 'Briefcase', label: 'Business', icon: Briefcase },
    { name: 'Store', label: 'Store', icon: Store },
    { name: 'Wallet', label: 'Wallet', icon: Wallet },
  ];

  useEffect(() => {
    if (accountToEdit) {
      setName(accountToEdit.name);
      setType(accountToEdit.type);
      setCurrency(accountToEdit.currency || 'LKR');
      setDescription(accountToEdit.description || '');
      setIcon(accountToEdit.icon || 'User');
      setStatus(accountToEdit.status || 'Active');
    } else {
      setName('');
      setType('Personal');
      setCurrency('LKR');
      setDescription('');
      setIcon('User');
      setStatus('Active');
    }
    setError('');
  }, [accountToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter an account name');
      return;
    }

    if (description.length > 100) {
      setError('Description must be 100 characters or fewer');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        type,
        currency,
        description: description.trim(),
        icon,
        status,
      };

      if (accountToEdit) {
        await api.patch(`/accounts/${accountToEdit._id}`, payload);
      } else {
        await api.post('/accounts', payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {accountToEdit ? 'Edit Account' : 'Add New Account'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure account details, currency and icon
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close add account modal"
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
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Account Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Personal, Company 1"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Account Type *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:border-purple-500 bg-white"
              >
                <option value="Personal">Personal</option>
                <option value="Business">Business</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Currency *
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:border-purple-500 bg-white"
              >
                <option value="LKR">LKR (Sri Lankan Rupee)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-600">
                Description (Max 100 characters)
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {description.length}/100
              </span>
            </div>
            <textarea
              rows={2}
              maxLength={100}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Your personal income and expenses"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          {/* Account Icon Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              Account Icon
            </label>
            <div className="flex items-center gap-2">
              {icons.map((item) => {
                const IconComponent = item.icon;
                const isSelected = icon === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setIcon(item.name)}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </button>
                );
              })}
            </div>
          </div>

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
              {loading ? 'Saving...' : accountToEdit ? 'Save Changes' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
