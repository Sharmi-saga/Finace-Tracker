'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PlusCircle,
  MoreVertical,
  Pencil,
  Trash2,
  Power,
  Building2,
  User as UserIcon,
  Briefcase,
  Store,
  Wallet,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import MobileNav from '../../components/layout/MobileNav';
import Header from '../../components/layout/Header';
import StatusBadge from '../../components/ui/StatusBadge';
import AddAccountModal from '../../components/modals/AddAccountModal';
import ConfirmDialog from '../../components/modals/ConfirmDialog';
import api from '../../lib/api';
import { Account } from '../../types';

export default function AccountSettingsPage() {
  const router = useRouter();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Active dropdown menu for three dots
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/accounts');
      setAccounts(res.data);
    } catch (err) {
      console.error('Error fetching accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (account: Account) => {
    try {
      await api.patch(`/accounts/${account._id}/status`);
      setActiveMenuId(null);
      fetchAccounts();
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!accountToDelete) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/accounts/${accountToDelete._id}`);
      setAccountToDelete(null);
      fetchAccounts();
    } catch (err) {
      console.error('Error deleting account:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const getAccountIcon = (iconName: string) => {
    switch (iconName) {
      case 'Building2':
        return Building2;
      case 'Briefcase':
        return Briefcase;
      case 'Store':
        return Store;
      case 'Wallet':
        return Wallet;
      default:
        return UserIcon;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800" onClick={() => setActiveMenuId(null)}>
      <Sidebar onAddAccount={() => { setAccountToEdit(null); setIsModalOpen(true); }} />

      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-10">
        <MobileNav />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Header */}
          <Header
            title="Account Settings"
            subtitle="Manage your accounts, currencies and preferences."
            showDatePicker={false}
            rightAction={
              <button
                onClick={() => {
                  setAccountToEdit(null);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-200 transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add New Account</span>
              </button>
            }
          />

          {/* Section: Your Accounts */}
          <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Your Accounts</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Add, edit or delete your personal and company accounts.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="p-16 text-center text-slate-400 flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
                <span className="text-sm font-medium">Loading accounts...</span>
              </div>
            ) : accounts.length === 0 ? (
              <div className="p-12 text-center">
                <h3 className="text-base font-bold text-slate-700">No accounts yet.</h3>
                <p className="text-xs text-slate-400 mt-1">Add your first account to get started.</p>
                <button
                  onClick={() => {
                    setAccountToEdit(null);
                    setIsModalOpen(true);
                  }}
                  className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold"
                >
                  Add First Account
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {accounts.map((acc) => {
                  const AccIcon = getAccountIcon(acc.icon);
                  const isMenuOpen = activeMenuId === acc._id;

                  return (
                    <div
                      key={acc._id}
                      className="bg-slate-50/60 rounded-3xl p-5 border border-slate-200/70 hover:border-purple-200 transition-all flex flex-col justify-between relative group"
                    >
                      <div>
                        {/* Top row */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                                acc.type === 'Business'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-purple-100 text-purple-700'
                              }`}
                            >
                              <AccIcon className="w-5 h-5 stroke-[2.2]" />
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-900 text-base">{acc.name}</h3>
                              <span className="text-xs font-semibold text-purple-600">
                                {acc.currency}
                              </span>
                            </div>
                          </div>

                          {/* 3-dot dropdown menu */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(isMenuOpen ? null : acc._id);
                              }}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {isMenuOpen && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-9 w-36 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-20 animate-fade-in"
                              >
                                <button
                                  onClick={() => {
                                    setAccountToEdit(acc);
                                    setIsModalOpen(true);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => handleToggleStatus(acc)}
                                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2"
                                >
                                  <Power className="w-3.5 h-3.5" />
                                  <span>{acc.status === 'Active' ? 'Deactivate' : 'Activate'}</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setAccountToDelete(acc);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3.5 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-100 mt-1 pt-1.5"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-500 mb-4 min-h-[32px]">
                          {acc.description || 'General account for financial transactions.'}
                        </p>
                      </div>

                      {/* Bottom status & actions */}
                      <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                        <StatusBadge status={acc.status} />
                        <button
                          onClick={() => router.push(`/accounts/${acc._id}`)}
                          className="font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 transition shadow-sm text-xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add / Edit Account Modal */}
      <AddAccountModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setAccountToEdit(null);
        }}
        onSuccess={fetchAccounts}
        accountToEdit={accountToEdit}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!accountToDelete}
        title="Delete Account?"
        message={`Are you sure you want to delete "${accountToDelete?.name}"? All related transactions under this account will also be removed.`}
        confirmLabel="Delete Account"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setAccountToDelete(null)}
        loading={deleteLoading}
      />
    </div>
  );
}
