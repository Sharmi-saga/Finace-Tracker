'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Scale,
  PlusCircle,
  MinusCircle,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  ChevronRight,
  Building2,
  User as UserIcon,
  Briefcase,
  Store,
} from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import MobileNav from '../../components/layout/MobileNav';
import Header from '../../components/layout/Header';
import MetricCard from '../../components/ui/MetricCard';
import AchievementRing from '../../components/ui/AchievementRing';
import AddTransactionModal from '../../components/modals/AddTransactionModal';
import AddAccountModal from '../../components/modals/AddAccountModal';
import api from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { Account, Transaction, ReportSummary, ExpenseBreakdownItem } from '../../types';

export default function DashboardPage() {
  const router = useRouter();
  const { selectedMonth, dateFilter } = useAuth();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [breakdown, setBreakdown] = useState<ExpenseBreakdownItem[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txDefaultType, setTxDefaultType] = useState<'Income' | 'Expense'>('Expense');
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedMonth, dateFilter]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFilter?.startDate && dateFilter?.endDate) {
        params.append('startDate', dateFilter.startDate);
        params.append('endDate', dateFilter.endDate);
      }
      params.append('month', dateFilter?.month || selectedMonth);

      const [sumRes, accRes, breakRes, txRes] = await Promise.all([
        api.get(`/reports/summary?${params.toString()}`),
        api.get(`/accounts`),
        api.get(`/reports/expense-breakdown?${params.toString()}`),
        api.get(`/transactions?${params.toString()}&limit=6`),
      ]);

      setSummary(sumRes.data);
      setAccounts(accRes.data);
      setBreakdown(breakRes.data.breakdown || []);
      setRecentTransactions(txRes.data.data || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const openAddTransaction = (type: 'Income' | 'Expense') => {
    setTxDefaultType(type);
    setIsTxModalOpen(true);
  };

  const getAccountIcon = (iconName: string) => {
    switch (iconName) {
      case 'Building2':
        return Building2;
      case 'Briefcase':
        return Briefcase;
      case 'Store':
        return Store;
      default:
        return UserIcon;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      {/* Desktop Sidebar */}
      <Sidebar onAddAccount={() => setIsAccountModalOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-10">
        <MobileNav />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Header */}
          <Header
            title="Dashboard"
            subtitle="Track your money clearly and simply."
            rightAction={
              <button
                onClick={() => openAddTransaction('Expense')}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-200 transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Transaction</span>
              </button>
            }
          />

          {/* Quick Action Buttons Bar */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <button
              onClick={() => openAddTransaction('Income')}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 text-emerald-700 font-bold text-xs sm:text-sm rounded-2xl shadow-sm transition"
            >
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              <span>Add Income</span>
            </button>
            <button
              onClick={() => openAddTransaction('Expense')}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/80 text-rose-700 font-bold text-xs sm:text-sm rounded-2xl shadow-sm transition"
            >
              <MinusCircle className="w-4 h-4 text-rose-600" />
              <span>Add Expense</span>
            </button>
            <Link
              href="/reports"
              className="flex items-center justify-center gap-2 py-3 px-4 bg-blue-50 hover:bg-blue-100/80 border border-blue-200/80 text-blue-700 font-bold text-xs sm:text-sm rounded-2xl shadow-sm transition"
            >
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>View Reports</span>
            </Link>
          </div>

          {/* KPI Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard
              title="Total Income"
              amount={summary?.totalIncome || 0}
              variant="income"
              icon={TrendingUp}
              subtitle="All accounts combined"
            />
            <MetricCard
              title="Total Expenses"
              amount={summary?.totalExpenses || 0}
              variant="expense"
              icon={TrendingDown}
              subtitle="Recorded this month"
            />
            <MetricCard
              title="Current Balance"
              amount={summary?.netRemaining || 0}
              variant="balance"
              icon={Wallet}
              subtitle="Income minus expenses"
            />
            <MetricCard
              title="Net Remaining"
              amount={summary?.netRemaining || 0}
              variant="neutral"
              icon={Scale}
              subtitle="Net available capital"
            />
          </div>

          {/* Section: Account Overview & This Month Review */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Account Overview (2 cols on lg) */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base lg:text-lg font-bold text-slate-900">
                    Account Overview
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Balances and cashflow across active entities
                  </p>
                </div>
                <Link
                  href="/account-settings"
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 transition shadow-sm"
                >
                  <span>↗ View All Accounts</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {accounts.map((acc) => {
                  const AccIcon = getAccountIcon(acc.icon);
                  return (
                    <div
                      key={acc._id}
                      onClick={() => router.push(`/accounts/${acc._id}`)}
                      className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-purple-50/40 hover:border-purple-200 transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                              acc.type === 'Business'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}
                          >
                            <AccIcon className="w-4 h-4 stroke-[2.2]" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm group-hover:text-purple-700 transition">
                              {acc.name}
                            </h3>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {acc.currency}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs px-2 py-0.5 bg-white border border-slate-200 rounded-full font-semibold text-slate-500">
                          {acc.type}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">
                            Income
                          </span>
                          <span className="font-bold text-emerald-600">
                            {(acc.income || 0).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">
                            Expenses
                          </span>
                          <span className="font-bold text-rose-600">
                            {(acc.expenses || 0).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">
                            Balance
                          </span>
                          <span className="font-extrabold text-slate-900">
                            {(acc.balance || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* This Month Review Achievement Card */}
            {/* <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] flex flex-col justify-between">
              <div> */}
                {/* <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base lg:text-lg font-bold text-slate-900">
                      {dateFilter?.mode === 'day' ? 'Today' : dateFilter?.mode === 'week' ? 'This Week' : dateFilter?.mode === 'year' ? 'Year' : dateFilter?.mode === 'custom' ? 'Selected Period' : 'This Month'} Review
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">{dateFilter?.label || selectedMonth} Target</p>
                  </div>
                </div> */}

                {/* Achievement Ring Center */}
                {/* <div className="flex justify-center my-4">
                  <AchievementRing
                    percentage={summary?.targetAchieved || 0}
                    size={150}
                    strokeWidth={14}
                    label="Achieved"
                    sublabel={`Target: LKR ${(summary?.monthlyTarget || 0).toLocaleString()}`}
                    color="#7C3AED"
                    trackColor="#EDE9FE"
                  />
                </div> */}

                {/* <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center mb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Achieved
                    </span>
                    <span className="text-sm font-bold text-purple-700">
                      LKR {(summary?.totalIncome || 0).toLocaleString()}
                    </span>
                    <span className="text-[11px] font-semibold text-purple-500 block">
                      {summary?.targetAchieved || 0}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Remaining
                    </span>
                    <span className="text-sm font-bold text-slate-700">
                      LKR {(summary?.targetRemaining || 0).toLocaleString()}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400 block">
                      {summary?.monthlyTarget ? Math.max(0, 100 - (summary.targetAchieved || 0)) : 0}%
                    </span>
                  </div>
                </div> */}

                {/* <div className="text-center text-xs text-slate-500 font-medium px-2">
                  <p>
                    {summary?.monthlyTarget
                      ? <>You&apos;re <strong className="text-purple-700 font-bold">{summary.targetAchieved}%</strong> towards your monthly target of LKR {summary.monthlyTarget.toLocaleString()}.</>
                      : <>Set your monthly income target in Settings to track progress.</>}
                  </p>
                  <p className="mt-2">
                    {summary?.yearlyTarget
                      ? `Yearly target: LKR ${summary.yearlyTarget.toLocaleString()} · ${summary.yearlyTargetAchieved}% achieved`
                      : 'Set a yearly income target in Settings to track annual progress.'}
                  </p>
                </div> */}
              {/* </div>
            </div> */}
          </div>

          {/* Section: Expenses by Category & Recent Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Expenses by Category (1 col) */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base lg:text-lg font-bold text-slate-900">
                    Expenses by Category
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Top spending categories</p>
                </div>
              </div>

              {breakdown.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No expense records for this month.
                </div>
              ) : (
                <div className="space-y-4">
                  {breakdown.slice(0, 6).map((item) => (
                    <div key={item.categoryId} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="font-semibold text-slate-700">
                            {item.categoryName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">
                            LKR {item.amount.toLocaleString()}
                          </span>
                          <span className="text-slate-400 font-medium text-[11px] w-8 text-right">
                            {item.percentage}%
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${item.percentage}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Transactions (2 cols) */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base lg:text-lg font-bold text-slate-900">
                    Recent Transactions
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Latest financial operations for {dateFilter?.label || selectedMonth}
                  </p>
                </div>
                <Link
                  href="/transactions"
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 transition shadow-sm"
                >
                  <span>↗ View All Transactions</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {recentTransactions.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400">
                  No transactions found.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentTransactions.map((tx: any) => {
                    const isIncome = tx.type === 'Income';
                    const isTransfer = tx.type === 'Transfer';
                    const accountName = tx.accountId?.name || 'Account';
                    const categoryName = tx.categoryId?.name || (isTransfer ? 'Transfer' : 'General');
                    const formattedDate = tx.date
                      ? new Date(tx.date).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '';

                    return (
                      <div
                        key={tx._id}
                        className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 px-2 rounded-xl transition"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
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
                            <div className="font-bold text-slate-900 text-sm leading-tight">
                              {tx.description}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                              <span>{formattedDate}</span>
                              <span>•</span>
                              <span className="font-medium text-slate-600">{accountName}</span>
                              <span>•</span>
                              <span className="text-purple-600 font-semibold">{categoryName}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div
                            className={`text-sm font-bold ${
                              isIncome
                                ? 'text-emerald-600'
                                : isTransfer
                                ? 'text-blue-600'
                                : 'text-rose-600'
                            }`}
                          >
                            {isIncome ? '+' : isTransfer ? '' : '-'}LKR{' '}
                            {tx.amount.toLocaleString()}
                          </div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                            {tx.type}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Transaction Modal */}
      <AddTransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSuccess={fetchDashboardData}
        defaultType={txDefaultType}
      />

      {/* Add Account Modal */}
      <AddAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
}
