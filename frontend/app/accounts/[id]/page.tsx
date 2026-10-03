'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Heart,
  TrendingUp,
  TrendingDown,
  Scale,
  CreditCard,
  PlusCircle,
  MinusCircle,
  Pencil,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  Building2,
  User as UserIcon,
  Briefcase,
  Store,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import Sidebar from '../../../components/layout/Sidebar';
import MobileNav from '../../../components/layout/MobileNav';
import Header from '../../../components/layout/Header';
import MetricCard from '../../../components/ui/MetricCard';
import AchievementRing from '../../../components/ui/AchievementRing';
import StatusBadge from '../../../components/ui/StatusBadge';
import AddTransactionModal from '../../../components/modals/AddTransactionModal';
import AddAccountModal from '../../../components/modals/AddAccountModal';
import MonthYearPicker from '../../../components/ui/MonthYearPicker';
import api from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import { Account, Transaction, ExpenseBreakdownItem } from '../../../types';

export default function AccountDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const accountId = params?.id as string;
  const { selectedMonth, dateFilter, setDateFilter } = useAuth();

  const [allAccounts, setAllAccounts] = useState<Account[]>([]);
  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categorySpending, setCategorySpending] = useState<ExpenseBreakdownItem[]>([]);
  const [metrics, setMetrics] = useState({
    income: 0,
    expenses: 0,
    netRemaining: 0,
    averageSpend: 0,
    budgetAmount: 0,
    spent: 0,
    remaining: 0,
    utilization: 0,
  });
  const [loading, setLoading] = useState(true);

  // Modals
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txType, setTxType] = useState<'Income' | 'Expense'>('Expense');
  const [isEditAccountOpen, setIsEditAccountOpen] = useState(false);

  useEffect(() => {
    api.get('/accounts').then((res) => setAllAccounts(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (accountId) {
      fetchAccountDetails();
    }
  }, [accountId, selectedMonth, dateFilter]);

  const fetchAccountDetails = async () => {
    setLoading(true);
    try {
      const qParams = new URLSearchParams();
      if (dateFilter?.startDate && dateFilter?.endDate) {
        qParams.append('startDate', dateFilter.startDate);
        qParams.append('endDate', dateFilter.endDate);
      }
      qParams.append('month', dateFilter?.month || selectedMonth);

      const [accRes, txRes, catRes] = await Promise.all([
        api.get(`/accounts/${accountId}?${qParams.toString()}`),
        api.get(`/transactions?accountId=${accountId}&${qParams.toString()}&limit=8`),
        api.get(`/reports/expense-breakdown?accountId=${accountId}&${qParams.toString()}`),
      ]);

      const accData = accRes.data;
      setAccount(accData);
      setTransactions(txRes.data.data || []);
      setCategorySpending(catRes.data.breakdown || []);

      const inc = accData.income ?? txRes.data.metrics?.totalIncome ?? 0;
      const exp = accData.expenses ?? txRes.data.metrics?.totalExpenses ?? 0;
      const net = accData.netRemaining ?? (inc - exp);
      const budgetAmt = accData.budgetAmount || inc || 0;
      const spentAmt = accData.spent ?? exp;
      const remainingAmt = accData.remaining ?? (budgetAmt > 0 ? budgetAmt - spentAmt : inc - exp);
      const utilPct =
        accData.utilization !== undefined
          ? accData.utilization
          : budgetAmt > 0
          ? Math.round((spentAmt / budgetAmt) * 100)
          : inc > 0
          ? Math.round((spentAmt / inc) * 100)
          : 0;

      const avg = exp > 0 ? Math.round(exp / 30) : 0;

      setMetrics({
        income: inc,
        expenses: exp,
        netRemaining: net,
        averageSpend: avg,
        budgetAmount: budgetAmt,
        spent: spentAmt,
        remaining: remainingAmt,
        utilization: utilPct,
      });
    } catch (err) {
      console.error('Error fetching account details:', err);
    } finally {
      setLoading(false);
    }
  };

  const openTxModal = (type: 'Income' | 'Expense') => {
    setTxType(type);
    setIsTxModalOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-10">
        <MobileNav />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Custom Header with Motivational Quote */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
                {account?.name || 'Account'} Account
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Track your {account?.name?.toLowerCase() || 'account'} income, expenses and spending habits.
              </p>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-rose-600 font-bold bg-rose-50/70 py-1 px-3 rounded-full border border-rose-200/60 inline-flex">
                <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                <span>&ldquo;Better Money Habits, A Brighter Tomorrow&rdquo;</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <MonthYearPicker
                value={dateFilter?.label || selectedMonth}
                dateFilter={dateFilter}
                onDateFilterChange={setDateFilter}
                compact
              />
              <button
                onClick={() => openTxModal('Income')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs sm:text-sm font-bold shadow-sm hover:bg-emerald-100 transition"
              >
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                <span>Add Income</span>
              </button>
              <button
                onClick={() => openTxModal('Expense')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs sm:text-sm font-bold shadow-sm hover:bg-rose-100 transition"
              >
                <MinusCircle className="w-4 h-4 text-rose-600" />
                <span>Add Expense</span>
              </button>
            </div>
          </div>

          {/* Account Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6">
            {allAccounts.map((acc) => {
              const isCurrent = acc._id === accountId;
              return (
                <button
                  key={acc._id}
                  onClick={() => router.push(`/accounts/${acc._id}`)}
                  className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all shadow-sm ${
                    isCurrent
                      ? 'bg-purple-600 text-white shadow-purple-200'
                      : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {acc.name}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="p-16 text-center text-slate-400 flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
              <span className="text-sm font-medium">Loading account data...</span>
            </div>
          ) : (
            <>
              {/* Account Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <MetricCard
                  title={`${account?.name} Income`}
                  amount={metrics.income}
                  variant="income"
                  icon={TrendingUp}
                  subtitle={dateFilter?.label || selectedMonth}
                />
                <MetricCard
                  title={`${account?.name} Expenses`}
                  amount={metrics.expenses}
                  variant="expense"
                  icon={TrendingDown}
                  subtitle={dateFilter?.label || selectedMonth}
                />
                <MetricCard
                  title="Net Remaining"
                  amount={metrics.netRemaining}
                  variant="balance"
                  icon={Scale}
                  subtitle="Income - Expenses"
                />
                <MetricCard
                  title="Average Spend"
                  amount={metrics.averageSpend}
                  variant="neutral"
                  icon={CreditCard}
                  subtitle="Per active day"
                />
              </div>

              {/* Account Overview Card & This Month Review */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Account Overview (2 cols) */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-base lg:text-lg font-bold text-slate-900">
                          {account?.name} Overview
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">Account details and settings.</p>
                      </div>
                      <button
                        onClick={() => setIsEditAccountOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-blue-600 hover:bg-blue-50 transition shadow-sm"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>✎ Edit Account</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Account Name
                        </span>
                        <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                          {account?.name}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Currency
                        </span>
                        <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                          {account?.currency} - Sri Lankan Rupee
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 sm:col-span-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Description
                        </span>
                        <span className="text-xs font-medium text-slate-700 mt-0.5 block">
                          {account?.description || 'Your primary personal income and expenses.'}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Created On
                        </span>
                        <span className="text-xs font-bold text-slate-800 mt-0.5 block">
                          12 Jan 2025
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Status
                          </span>
                          <span className="text-xs font-bold text-slate-800 mt-0.5 block">
                            {account?.status}
                          </span>
                        </div>
                        <StatusBadge status={account?.status || 'Active'} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account This Month Review Ring (1 col) */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                  <div>
                    <div className="mb-4">
                      <h2 className="text-base lg:text-lg font-bold text-slate-900">
                        Account {dateFilter?.mode === 'day' ? 'Today' : dateFilter?.mode === 'week' ? 'This Week' : dateFilter?.mode === 'year' ? 'Year' : dateFilter?.mode === 'custom' ? 'Selected Period' : 'This Month'} Review
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">{dateFilter?.label || selectedMonth} Utilization</p>
                    </div>

                    <div className="flex justify-center my-3">
                      <AchievementRing
                        percentage={metrics.utilization}
                        size={150}
                        strokeWidth={14}
                        label="Utilized"
                        color="#7C3AED"
                        trackColor="#EDE9FE"
                      />
                    </div>

                    <p className="text-center text-xs font-bold text-slate-700 mb-4">
                      {metrics.utilization}% of LKR {(metrics.budgetAmount || metrics.income).toLocaleString()} {metrics.budgetAmount > 0 ? 'Budget' : 'Income'} utilized
                    </p>

                    <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center mb-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">
                          SPENT
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-slate-900">
                          LKR {metrics.spent.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
                          REMAINING
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-slate-900">
                          LKR {metrics.remaining.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="text-center text-xs font-medium">
                      {metrics.utilization <= 80 ? (
                        <span className="text-emerald-600">You&apos;re on track! Keep up the good work.</span>
                      ) : metrics.utilization <= 100 ? (
                        <span className="text-amber-600">Caution: approaching budget limit.</span>
                      ) : (
                        <span className="text-rose-600">Budget limit exceeded for this month.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Spending by Category & Account Recent Transactions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Spending by Category (1 col) */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)]">
                  <div className="mb-4">
                    <h2 className="text-base lg:text-lg font-bold text-slate-900">
                      Spending by Category
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Top expenses for this account</p>
                  </div>

                  {categorySpending.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      No categorized spending recorded.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {categorySpending.map((cat) => (
                        <div key={cat.categoryId} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-700">{cat.categoryName}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">
                                LKR {cat.amount.toLocaleString()}
                              </span>
                              <span className="text-[11px] text-slate-400 font-medium">
                                {cat.percentage}%
                              </span>
                            </div>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Account Recent Transactions (2 cols) */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base lg:text-lg font-bold text-slate-900">
                        Account Transactions
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Latest activity strictly under {account?.name}
                      </p>
                    </div>
                    <Link
                      href={`/transactions?accountId=${accountId}`}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 transition shadow-sm"
                    >
                      <span>↗ View All Transactions</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {transactions.length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-400">
                      No transactions recorded for this account.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {transactions.map((tx: any) => {
                        const isIncome = tx.type === 'Income';
                        const isTransfer = tx.type === 'Transfer';
                        const categoryName = tx.categoryId?.name || (isTransfer ? 'Transfer' : 'General');
                        const formattedDate = tx.date
                          ? new Date(tx.date).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                            })
                          : '';

                        return (
                          <div
                            key={tx._id}
                            className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 px-2 rounded-xl transition"
                          >
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
                                <div className="font-bold text-slate-900 text-xs sm:text-sm">
                                  {tx.description}
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                                  <span>{formattedDate}</span>
                                  <span>•</span>
                                  <span className="text-purple-600 font-semibold">{categoryName}</span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <span
                                className={`font-bold text-xs sm:text-sm ${
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
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Transaction Modal */}
      <AddTransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSuccess={fetchAccountDetails}
        defaultType={txType}
        defaultAccountId={accountId}
      />

      {/* Edit Account Modal */}
      <AddAccountModal
        isOpen={isEditAccountOpen}
        onClose={() => setIsEditAccountOpen(false)}
        onSuccess={fetchAccountDetails}
        accountToEdit={account}
      />
    </div>
  );
}
