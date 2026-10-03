'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  PlusCircle,
  Search,
  Filter,
  Pencil,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  RefreshCw,
} from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import MobileNav from '../../components/layout/MobileNav';
import Header from '../../components/layout/Header';
import MetricCard from '../../components/ui/MetricCard';
import AddTransactionModal from '../../components/modals/AddTransactionModal';
import ConfirmDialog from '../../components/modals/ConfirmDialog';
import api from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { Transaction, Account, Category, TransactionListResponse } from '../../types';

export default function TransactionsPage() {
  const { selectedMonth, dateFilter } = useAuth();

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Data States
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [txResponse, setTxResponse] = useState<TransactionListResponse>({
    data: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    metrics: {
      totalIncome: 0,
      totalExpenses: 0,
      totalTransfers: 0,
      currentBalance: 0,
    },
  });
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    // Load accounts and categories once
    Promise.all([api.get('/accounts'), api.get('/categories')])
      .then(([accRes, catRes]) => {
        setAccounts(accRes.data);
        setCategories(catRes.data);
      })
      .catch((err) => console.error(err));
  }, []);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (search.trim()) params.append('search', search.trim());
      if (selectedAccount !== 'all') params.append('accountId', selectedAccount);
      if (selectedType !== 'all') params.append('type', selectedType);
      if (selectedCategory !== 'all') params.append('categoryId', selectedCategory);

      if (startDate || endDate) {
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
      } else if (dateFilter?.startDate && dateFilter?.endDate) {
        params.append('startDate', dateFilter.startDate);
        params.append('endDate', dateFilter.endDate);
      } else if (selectedMonth && selectedMonth !== 'all') {
        params.append('month', selectedMonth);
      }

      const res = await api.get(`/transactions?${params.toString()}`);
      setTxResponse(res.data);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, selectedAccount, selectedType, selectedCategory, startDate, endDate, selectedMonth, dateFilter]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Reset page when filters change
  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<any>>, value: any) => {
    setter(value);
    setPage(1);
  };

  const handleEditClick = (tx: Transaction) => {
    setTransactionToEdit(tx);
    setIsAddModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!transactionToDelete) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/transactions/${transactionToDelete._id}`);
      setTransactionToDelete(null);
      fetchTransactions();
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const metrics = txResponse.metrics || {
    totalIncome: 0,
    totalExpenses: 0,
    totalTransfers: 0,
    currentBalance: 0,
  };

  const startRecord = (txResponse.page - 1) * txResponse.limit + 1;
  const endRecord = Math.min(txResponse.page * txResponse.limit, txResponse.total);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-10">
        <MobileNav />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Header */}
          <Header
            title="Transactions"
            subtitle="Track every income, expense and transfer. Keep your finances organized."
            showDatePicker={false}
            rightAction={
              <button
                onClick={() => {
                  setTransactionToEdit(null);
                  setIsAddModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl shadow-md shadow-purple-200 transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Transaction</span>
              </button>
            }
          />

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard
              title="Total Income"
              amount={metrics.totalIncome}
              variant="income"
              icon={TrendingUp}
              subtitle="Scope sum"
            />
            <MetricCard
              title="Total Expenses"
              amount={metrics.totalExpenses}
              variant="expense"
              icon={TrendingDown}
              subtitle="Scope sum"
            />
            <MetricCard
              title="Total Transfers"
              amount={metrics.totalTransfers}
              variant="transfer"
              icon={ArrowLeftRight}
              subtitle="Internal fund shifts"
            />
            <MetricCard
              title="Current Balance"
              amount={metrics.currentBalance}
              variant="balance"
              icon={Wallet}
              subtitle="Net scoped flow"
            />
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] mb-6 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5 text-purple-600" />
              <span>Filters & Search</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search */}
              <div className="relative lg:col-span-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => handleFilterChange(setSearch, e.target.value)}
                  placeholder="Search transactions..."
                  className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* All Accounts */}
              <div>
                <select
                  value={selectedAccount}
                  onChange={(e) => handleFilterChange(setSelectedAccount, e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 focus:outline-none focus:border-purple-500 bg-white"
                >
                  <option value="all">All Accounts</option>
                  {accounts.map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* All Types */}
              <div>
                <select
                  value={selectedType}
                  onChange={(e) => handleFilterChange(setSelectedType, e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 focus:outline-none focus:border-purple-500 bg-white"
                >
                  <option value="all">All Types</option>
                  <option value="Income">Income</option>
                  <option value="Expense">Expense</option>
                  <option value="Transfer">Transfer</option>
                </select>
              </div>

              {/* All Categories */}
              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => handleFilterChange(setSelectedCategory, e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 focus:outline-none focus:border-purple-500 bg-white"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date Range Row */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
              <span className="font-semibold text-slate-500">Custom Date Range:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleFilterChange(setStartDate, e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 font-medium text-slate-700 focus:outline-none focus:border-purple-500"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleFilterChange(setEndDate, e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 font-medium text-slate-700 focus:outline-none focus:border-purple-500"
              />
              {(startDate || endDate) && (
                <button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setPage(1);
                  }}
                  className="text-purple-600 font-bold hover:underline"
                >
                  Clear dates
                </button>
              )}
            </div>
          </div>

          {/* Transactions Table / Cards */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
                <span className="text-sm font-medium">Loading transactions...</span>
              </div>
            ) : txResponse.data.length === 0 ? (
              <div className="p-12 text-center">
                <h3 className="text-base font-bold text-slate-700">No transactions found.</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Start tracking your finances by adding your first transaction or adjust your filters.
                </p>
                <button
                  onClick={() => {
                    setTransactionToEdit(null);
                    setIsAddModalOpen(true);
                  }}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-200"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add Transaction</span>
                </button>
              </div>
            ) : (
              <>
                {/* Desktop View Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="py-3 px-5">Type / Date</th>
                        <th className="py-3 px-5">Description</th>
                        <th className="py-3 px-5">Account</th>
                        <th className="py-3 px-5">Category</th>
                        <th className="py-3 px-5 text-right">Amount</th>
                        <th className="py-3 px-5 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {txResponse.data.map((tx: any) => {
                        const isIncome = tx.type === 'Income';
                        const isTransfer = tx.type === 'Transfer';
                        const accountName = tx.accountId?.name || 'Account';
                        const destAccount = tx.transferToAccountId?.name;
                        const categoryName = tx.categoryId?.name || (isTransfer ? 'Transfer' : 'General');
                        const formattedDate = tx.date
                          ? new Date(tx.date).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '';

                        return (
                          <tr key={tx._id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3.5 px-5 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                    isIncome
                                      ? 'bg-emerald-50 text-emerald-600'
                                      : isTransfer
                                      ? 'bg-blue-50 text-blue-600'
                                      : 'bg-rose-50 text-rose-600'
                                  }`}
                                >
                                  {isIncome ? (
                                    <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                                  ) : isTransfer ? (
                                    <ArrowLeftRight className="w-4 h-4 stroke-[2.5]" />
                                  ) : (
                                    <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
                                  )}
                                </div>
                                <div>
                                  <span className="font-semibold text-slate-900 block text-xs">
                                    {tx.type}
                                  </span>
                                  <span className="text-[11px] text-slate-400 font-medium">
                                    {formattedDate}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-5">
                              <span className="font-bold text-slate-900 text-sm block">
                                {tx.description}
                              </span>
                              {tx.notes && (
                                <span className="text-[11px] text-slate-400 block truncate max-w-xs">
                                  {tx.notes}
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-5 whitespace-nowrap text-xs">
                              {isTransfer && destAccount ? (
                                <div className="font-medium text-slate-700 flex items-center gap-1">
                                  <span>{accountName}</span>
                                  <ArrowLeftRight className="w-3 h-3 text-slate-400" />
                                  <span>{destAccount}</span>
                                </div>
                              ) : (
                                <span className="font-semibold text-slate-700 px-2 py-0.5 rounded-lg bg-slate-100">
                                  {accountName}
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-5 whitespace-nowrap text-xs font-semibold text-purple-700">
                              {categoryName}
                            </td>

                            <td className="py-3.5 px-5 text-right whitespace-nowrap">
                              <span
                                className={`font-bold text-sm ${
                                  isIncome
                                    ? 'text-emerald-600'
                                    : isTransfer
                                    ? 'text-blue-600'
                                    : 'text-rose-600'
                                }`}
                              >
                                {isIncome ? '+' : isTransfer ? '' : '-'}LKR{' '}
                                {tx.amount.toLocaleString()}
                              </span>
                            </td>

                            <td className="py-3.5 px-5 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleEditClick(tx)}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 text-xs font-semibold transition"
                                  title="Edit Transaction"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => setTransactionToDelete(tx)}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition"
                                  title="Delete Transaction"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View Cards */}
                <div className="md:hidden divide-y divide-slate-100 p-2">
                  {txResponse.data.map((tx: any) => {
                    const isIncome = tx.type === 'Income';
                    const isTransfer = tx.type === 'Transfer';
                    const accountName = tx.accountId?.name || 'Account';
                    const categoryName = tx.categoryId?.name || (isTransfer ? 'Transfer' : 'General');
                    const formattedDate = tx.date
                      ? new Date(tx.date).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                        })
                      : '';

                    return (
                      <div key={tx._id} className="py-3 px-2 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              isIncome
                                ? 'bg-emerald-50 text-emerald-600'
                                : isTransfer
                                ? 'bg-blue-50 text-blue-600'
                                : 'bg-rose-50 text-rose-600'
                            }`}
                          >
                            {isIncome ? (
                              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                            ) : isTransfer ? (
                              <ArrowLeftRight className="w-4 h-4 stroke-[2.5]" />
                            ) : (
                              <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-xs block leading-tight">
                              {tx.description}
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                              <span>{formattedDate}</span>
                              <span>•</span>
                              <span>{accountName}</span>
                              <span>•</span>
                              <span className="text-purple-600 font-semibold">{categoryName}</span>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <span
                              className={`font-bold text-xs block ${
                                isIncome
                                  ? 'text-emerald-600'
                                  : isTransfer
                                  ? 'text-blue-600'
                                  : 'text-rose-600'
                              }`}
                            >
                              {isIncome ? '+' : isTransfer ? '' : '-'}LKR{' '}
                              {tx.amount.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 ml-2">
                            <button
                              onClick={() => handleEditClick(tx)}
                              className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-slate-600 hover:text-blue-600 bg-slate-50 border border-slate-200 rounded-lg transition"
                            >
                              <Pencil className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => setTransactionToDelete(tx)}
                              className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-rose-600 bg-rose-50/50 border border-rose-200 rounded-lg transition"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination Footer */}
                <div className="py-4 px-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                  <div>
                    Showing <span className="font-bold text-slate-800">{startRecord}</span> to{' '}
                    <span className="font-bold text-slate-800">{endRecord}</span> of{' '}
                    <span className="font-bold text-slate-800">{txResponse.total}</span> records
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {Array.from({ length: txResponse.totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-7 h-7 rounded-lg font-bold text-xs transition ${
                          page === p
                            ? 'bg-purple-600 text-white shadow-sm shadow-purple-200'
                            : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        {p}
                      </button>
                    ))}

                    <button
                      onClick={() => setPage((p) => Math.min(txResponse.totalPages, p + 1))}
                      disabled={page >= txResponse.totalPages}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Add / Edit Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setTransactionToEdit(null);
        }}
        onSuccess={fetchTransactions}
        transactionToEdit={transactionToEdit}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!transactionToDelete}
        title="Delete Transaction?"
        message="Are you sure you want to delete this transaction? This will recalculate all account balances, reports and budget usages."
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setTransactionToDelete(null)}
        loading={deleteLoading}
      />
    </div>
  );
}
