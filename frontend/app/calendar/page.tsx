'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  Scale,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  RefreshCw,
  Clock,
  CheckCircle,
  Tag,
  Building2,
  Calendar as CalendarIcon,
} from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import MobileNav from '../../components/layout/MobileNav';
import MetricCard from '../../components/ui/MetricCard';
import AddTransactionModal from '../../components/modals/AddTransactionModal';
import ConfirmDialog from '../../components/modals/ConfirmDialog';
import api from '../../lib/api';
import { Transaction } from '../../types';

type CalendarViewMode = 'day' | 'week' | 'month' | 'year';

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('year');

  // Transactions & Metrics State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [yearTrends, setYearTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    income: 0,
    expenses: 0,
    net: 0,
    count: 0,
  });

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Helper date formatting
  const formatDateISO = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Calculate current view date ranges
  const dateRange = useMemo(() => {
    const curr = new Date(selectedDate);

    if (viewMode === 'day') {
      const dateStr = formatDateISO(curr);
      return { start: dateStr, end: dateStr };
    }

    if (viewMode === 'week') {
      // Find Monday of the current week (ISO week)
      const day = curr.getDay(); // 0 is Sunday, 1 is Monday
      const diffToMonday = curr.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(curr.setDate(diffToMonday));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return {
        start: formatDateISO(monday),
        end: formatDateISO(sunday),
        monday,
        sunday,
      };
    }

    if (viewMode === 'month') {
      const year = curr.getFullYear();
      const month = curr.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      return {
        start: formatDateISO(firstDay),
        end: formatDateISO(lastDay),
      };
    }

    // Year view: Jan 1 to Dec 31
    const year = curr.getFullYear();
    return {
      start: `${year}-01-01`,
      end: `${year}-12-31`,
    };
  }, [selectedDate, viewMode]);

  // Fetch transactions whenever the range changes
  const fetchCalendarData = useCallback(async () => {
    setLoading(true);
    try {
      if (viewMode === 'year') {
        const yearStr = String(selectedDate.getFullYear());
        const [txRes, trendsRes] = await Promise.all([
          api.get(`/transactions?startDate=${dateRange.start}&endDate=${dateRange.end}&limit=200`),
          api.get(`/reports/income-expenses?year=${yearStr}`),
        ]);
        const txs: Transaction[] = txRes.data.data || [];
        setTransactions(txs);
        setYearTrends(trendsRes.data || []);

        const inc = txRes.data.metrics?.totalIncome || 0;
        const exp = txRes.data.metrics?.totalExpenses || 0;
        setMetrics({
          income: inc,
          expenses: exp,
          net: inc - exp,
          count: txRes.data.total || txs.length,
        });
      } else {
        const res = await api.get(
          `/transactions?startDate=${dateRange.start}&endDate=${dateRange.end}&limit=100`
        );
        const txs: Transaction[] = res.data.data || [];
        setTransactions(txs);

        const inc = res.data.metrics?.totalIncome || 0;
        const exp = res.data.metrics?.totalExpenses || 0;
        setMetrics({
          income: inc,
          expenses: exp,
          net: inc - exp,
          count: res.data.total || txs.length,
        });
      }
    } catch (err) {
      console.error('Error fetching calendar transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange, viewMode, selectedDate]);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  // Calendar Navigation Handlers
  const handlePrev = () => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      if (viewMode === 'day') {
        next.setDate(next.getDate() - 1);
      } else if (viewMode === 'week') {
        next.setDate(next.getDate() - 7);
      } else if (viewMode === 'month') {
        next.setMonth(next.getMonth() - 1);
      } else if (viewMode === 'year') {
        next.setFullYear(next.getFullYear() - 1);
      }
      return next;
    });
  };

  const handleNext = () => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      if (viewMode === 'day') {
        next.setDate(next.getDate() + 1);
      } else if (viewMode === 'week') {
        next.setDate(next.getDate() + 7);
      } else if (viewMode === 'month') {
        next.setMonth(next.getMonth() + 1);
      } else if (viewMode === 'year') {
        next.setFullYear(next.getFullYear() + 1);
      }
      return next;
    });
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  // Transaction delete handler
  const handleDeleteTransaction = async () => {
    if (!transactionToDelete) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/transactions/${transactionToDelete._id}`);
      setTransactionToDelete(null);
      fetchCalendarData();
    } catch (err) {
      console.error('Error deleting transaction:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Formatted Title for the current view
  const periodTitle = useMemo(() => {
    if (viewMode === 'day') {
      return selectedDate.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
    if (viewMode === 'week') {
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      return `${start.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
      })} – ${end.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })}`;
    }
    if (viewMode === 'month') {
      return selectedDate.toLocaleDateString('en-GB', {
        month: 'long',
        year: 'numeric',
      });
    }
    return `Year ${selectedDate.getFullYear()} Financial Overview`;
  }, [viewMode, selectedDate, dateRange]);

  // Generate Week Days for Week View
  const weekDays = useMemo(() => {
    if (viewMode !== 'week' && viewMode !== 'day') return [];
    const curr = new Date(selectedDate);
    const day = curr.getDay();
    const diffToMonday = curr.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(curr.setDate(diffToMonday));

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dISO = formatDateISO(d);

      // Filter txs on this day
      const dayTxs = transactions.filter((t) => {
        const tDate = t.date ? formatDateISO(new Date(t.date)) : '';
        return tDate === dISO;
      });

      const dayInc = dayTxs
        .filter((t) => t.type === 'Income')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      const dayExp = dayTxs
        .filter((t) => t.type === 'Expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      days.push({
        date: d,
        iso: dISO,
        dayName: d.toLocaleDateString('en-GB', { weekday: 'short' }),
        dayNum: d.getDate(),
        isToday: dISO === '2026-09-22',
        isSelected: dISO === formatDateISO(selectedDate),
        txCount: dayTxs.length,
        income: dayInc,
        expenses: dayExp,
      });
    }
    return days;
  }, [selectedDate, viewMode, transactions]);

  // Generate Month Matrix for Month View
  const monthDays = useMemo(() => {
    if (viewMode !== 'month') return [];
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sun
    const totalDays = new Date(year, month + 1, 0).getDate();

    const cells = [];
    // Blank days before the 1st
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ dayNum: null, iso: null });
    }
    // Days 1..totalDays
    for (let d = 1; d <= totalDays; d++) {
      const dateObj = new Date(year, month, d);
      const iso = formatDateISO(dateObj);
      const dayTxs = transactions.filter((t) => {
        const tDate = t.date ? formatDateISO(new Date(t.date)) : '';
        return tDate === iso;
      });
      const dayInc = dayTxs
        .filter((t) => t.type === 'Income')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      const dayExp = dayTxs
        .filter((t) => t.type === 'Expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      cells.push({
        dayNum: d,
        iso,
        dateObj,
        isToday: iso === '2026-09-22',
        isSelected: iso === formatDateISO(selectedDate),
        txCount: dayTxs.length,
        income: dayInc,
        expenses: dayExp,
      });
    }
    return cells;
  }, [selectedDate, viewMode, transactions]);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-10">
        <MobileNav />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                <CalendarDays className="w-7 h-7 text-blue-600 stroke-[2.2]" />
                <span>Financial Calendar</span>
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Plan, track, and filter income and expenses across days, weeks, and years.
              </p>
            </div>

            {/* Quick Add Button */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setTransactionToEdit(null);
                  setIsAddModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-200 transition active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Transaction</span>
              </button>
            </div>
          </div>

          {/* Interactive Calendar Controls Bar */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* View Mode Selector: Day | Week | Month | Year */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl w-full md:w-auto overflow-x-auto">
              {(
                [
                  { id: 'day', label: 'Day View' },
                  { id: 'week', label: 'Week View' },
                  { id: 'month', label: 'Month View' },
                  { id: 'year', label: 'Year View' },
                ] as const
              ).map((mode) => {
                const isActive = viewMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setViewMode(mode.id)}
                    className={`flex-1 sm:flex-initial py-2 px-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30 ring-1 ring-blue-500/40'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    {mode.label}
                  </button>
                );
              })}
            </div>

            {/* Previous, Today, Next Navigation Controls */}
            <div className="flex items-center justify-between md:justify-end gap-2.5">
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-bold border border-slate-200 rounded-xl transition shadow-sm active:scale-95"
                title="Previous period"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                type="button"
                onClick={handleToday}
                className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs sm:text-sm font-bold border border-blue-200 rounded-xl transition shadow-sm"
              >
                Today
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-bold border border-slate-200 rounded-xl transition shadow-sm active:scale-95"
                title="Next period"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Period Banner */}
          <div className="bg-gradient-to-r from-blue-900 via-[#0B132B] to-slate-900 text-white rounded-3xl p-5 sm:p-6 mb-6 shadow-md border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300 block">
                Active Calendar Period ({viewMode.toUpperCase()})
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5 tracking-tight">
                {periodTitle}
              </h2>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs text-slate-300 block font-medium">Recorded Volume</span>
              <span className="text-lg font-extrabold text-blue-200">
                {metrics.count} {metrics.count === 1 ? 'Transaction' : 'Transactions'}
              </span>
            </div>
          </div>

          {/* Live Financial Totals for Selected Period */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricCard
              title="Period Income"
              amount={metrics.income}
              variant="income"
              icon={TrendingUp}
              subtitle="All registered inflows"
            />
            <MetricCard
              title="Period Expenses"
              amount={metrics.expenses}
              variant="expense"
              icon={TrendingDown}
              subtitle="Total outflows"
            />
            <MetricCard
              title="Net Cash Flow"
              amount={metrics.net}
              variant="balance"
              icon={Scale}
              subtitle="Income minus expenses"
            />
            <MetricCard
              title="Transactions Count"
              amount={metrics.count}
              currency=""
              variant="transfer"
              icon={Receipt}
              subtitle="Active records"
            />
          </div>

          {/* VIEW RENDERERS */}
          {loading ? (
            <div className="p-16 text-center text-slate-400 flex flex-col items-center gap-2 bg-white rounded-3xl border border-slate-100">
              <RefreshCw className="w-7 h-7 animate-spin text-blue-600" />
              <span className="text-sm font-semibold">Updating financial calendar...</span>
            </div>
          ) : (
            <>
              {/* ----------------- 1. DAY VIEW ----------------- */}
              {viewMode === 'day' && (
                <div className="space-y-6">
                  {/* Quick Days Strip to select adjacent days */}
                  <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-sm flex items-center gap-2 overflow-x-auto">
                    {weekDays.map((d) => (
                      <button
                        key={d.iso}
                        type="button"
                        onClick={() => setSelectedDate(new Date(d.date))}
                        className={`flex-1 min-w-[70px] py-2.5 px-2 rounded-xl text-center transition-all ${
                          d.isSelected
                            ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-900/30'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 font-medium'
                        }`}
                      >
                        <span className="text-[10px] uppercase block tracking-wider opacity-80">
                          {d.dayName}
                        </span>
                        <span className="text-base font-extrabold block">{d.dayNum}</span>
                        {d.txCount > 0 && (
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold inline-block mt-0.5 ${
                              d.isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {d.txCount} tx
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Day Transactions List */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          Transactions for {selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </h3>
                        <p className="text-xs text-slate-400">
                          Individual items posted on this specific day
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setTransactionToEdit(null);
                          setIsAddModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>Add on this day</span>
                      </button>
                    </div>

                    {transactions.length === 0 ? (
                      <div className="text-center py-12 px-4">
                        <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h4 className="text-base font-bold text-slate-700">No Transactions Found</h4>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                          There are no financial records recorded on this day. You can record income or an expense below.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setTransactionToEdit(null);
                            setIsAddModalOpen(true);
                          }}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-200 transition"
                        >
                          + Record Transaction for Today
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {transactions.map((tx) => {
                          const isInc = tx.type === 'Income';
                          const isTrans = tx.type === 'Transfer';
                          const categoryName =
                            typeof tx.categoryId === 'object' && tx.categoryId
                              ? (tx.categoryId as any).name
                              : isTrans
                              ? 'Transfer'
                              : 'General';
                          const accountName =
                            typeof tx.accountId === 'object' && tx.accountId
                              ? (tx.accountId as any).name
                              : 'Account';

                          return (
                            <div
                              key={tx._id}
                              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 px-3 rounded-2xl transition"
                            >
                              <div className="flex items-center gap-3.5">
                                <div
                                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                                    isInc
                                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                      : isTrans
                                      ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                      : 'bg-rose-50 text-rose-600 border border-rose-100'
                                  }`}
                                >
                                  {isInc ? (
                                    <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                                  ) : isTrans ? (
                                    <ArrowLeftRight className="w-5 h-5 stroke-[2.5]" />
                                  ) : (
                                    <ArrowDownRight className="w-5 h-5 stroke-[2.5]" />
                                  )}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 text-sm">
                                    {tx.description}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
                                    <span className="inline-flex items-center gap-1 font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                      <Building2 className="w-3 h-3 text-slate-500" />
                                      {accountName}
                                    </span>
                                    <span>•</span>
                                    <span className="inline-flex items-center gap-1 font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                                      <Tag className="w-3 h-3 text-blue-500" />
                                      {categoryName}
                                    </span>
                                    {tx.notes && (
                                      <>
                                        <span>•</span>
                                        <span className="italic text-slate-500">{tx.notes}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-4 pl-12 sm:pl-0">
                                <div className="text-right">
                                  <span
                                    className={`font-black text-sm sm:text-base ${
                                      isInc
                                        ? 'text-emerald-600'
                                        : isTrans
                                        ? 'text-blue-600'
                                        : 'text-rose-600'
                                    }`}
                                  >
                                    {isInc ? '+' : isTrans ? '' : '-'}LKR{' '}
                                    {tx.amount.toLocaleString()}
                                  </span>
                                </div>

                                {/* Standard Action Buttons with Icons and Labels */}
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTransactionToEdit(tx);
                                      setIsAddModalOpen(true);
                                    }}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 text-xs font-semibold transition"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setTransactionToDelete(tx)}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ----------------- 2. WEEK VIEW ----------------- */}
              {viewMode === 'week' && (
                <div className="space-y-6">
                  {/* 7-Day Visual Week Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                    {weekDays.map((d) => (
                      <div
                        key={d.iso}
                        onClick={() => setSelectedDate(new Date(d.date))}
                        className={`p-4 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
                          d.isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-400/40'
                            : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm text-slate-800'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span
                              className={`font-bold uppercase tracking-wider ${
                                d.isSelected ? 'text-blue-200' : 'text-slate-400'
                              }`}
                            >
                              {d.dayName}
                            </span>
                            {d.isToday && (
                              <span
                                className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                                  d.isSelected
                                    ? 'bg-white text-blue-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                Today
                              </span>
                            )}
                          </div>
                          <span className="text-2xl font-black block">{d.dayNum}</span>
                        </div>

                        <div className="mt-4 pt-2 border-t border-slate-100/30 text-[11px] space-y-1">
                          <div className="flex justify-between items-center">
                            <span className={d.isSelected ? 'text-blue-100' : 'text-slate-400'}>
                              In:
                            </span>
                            <span className={d.isSelected ? 'font-bold text-white' : 'font-bold text-emerald-600'}>
                              {d.income > 0 ? `+${d.income.toLocaleString()}` : '0'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className={d.isSelected ? 'text-blue-100' : 'text-slate-400'}>
                              Out:
                            </span>
                            <span className={d.isSelected ? 'font-bold text-rose-200' : 'font-bold text-rose-600'}>
                              {d.expenses > 0 ? `-${d.expenses.toLocaleString()}` : '0'}
                            </span>
                          </div>
                          <div className="pt-1 text-center">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                                d.isSelected
                                  ? 'bg-white/20 text-white'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {d.txCount} Records
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Week Transactions List */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          All Transactions in this Week
                        </h3>
                        <p className="text-xs text-slate-400">
                          {periodTitle} • {transactions.length} records found
                        </p>
                      </div>
                    </div>

                    {transactions.length === 0 ? (
                      <div className="text-center py-10 text-slate-400 text-xs">
                        No transactions recorded throughout this 7-day period.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {transactions.map((tx) => {
                          const isInc = tx.type === 'Income';
                          const isTrans = tx.type === 'Transfer';
                          const categoryName =
                            typeof tx.categoryId === 'object' && tx.categoryId
                              ? (tx.categoryId as any).name
                              : isTrans
                              ? 'Transfer'
                              : 'General';
                          const formattedDate = tx.date
                            ? new Date(tx.date).toLocaleDateString('en-GB', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                              })
                            : '';

                          return (
                            <div
                              key={tx._id}
                              className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded-xl transition"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                    isInc
                                      ? 'bg-emerald-50 text-emerald-600'
                                      : isTrans
                                      ? 'bg-blue-50 text-blue-600'
                                      : 'bg-rose-50 text-rose-600'
                                  }`}
                                >
                                  {isInc ? (
                                    <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                                  ) : isTrans ? (
                                    <ArrowLeftRight className="w-4 h-4 stroke-[2.5]" />
                                  ) : (
                                    <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
                                  )}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 text-sm">
                                    {tx.description}
                                  </div>
                                  <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                                    <span className="font-semibold text-slate-600">{formattedDate}</span>
                                    <span>•</span>
                                    <span className="text-blue-600 font-semibold">{categoryName}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <span
                                  className={`font-black text-sm ${
                                    isInc
                                      ? 'text-emerald-600'
                                      : isTrans
                                      ? 'text-blue-600'
                                      : 'text-rose-600'
                                  }`}
                                >
                                  {isInc ? '+' : isTrans ? '' : '-'}LKR {tx.amount.toLocaleString()}
                                </span>

                                <div className="hidden sm:flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTransactionToEdit(tx);
                                      setIsAddModalOpen(true);
                                    }}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                                    title="Edit"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setTransactionToDelete(tx)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ----------------- 3. MONTH VIEW ----------------- */}
              {viewMode === 'month' && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Monthly Calendar Grid – {periodTitle}
                      </h3>
                      <p className="text-xs text-slate-400">
                        Click on any day to inspect its full transactions or switch to Day View
                      </p>
                    </div>
                  </div>

                  {/* Day Names Header */}
                  <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs uppercase tracking-wider text-slate-400 pb-2 mb-2 border-b border-slate-100">
                    <span>Sun</span>
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                  </div>

                  {/* 35/42 Cell Month Grid */}
                  <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                    {monthDays.map((cell, idx) => {
                      if (!cell.dayNum) {
                        return (
                          <div
                            key={`empty-${idx}`}
                            className="min-h-[70px] sm:min-h-[90px] rounded-2xl bg-slate-50/40 border border-transparent"
                          />
                        );
                      }

                      return (
                        <div
                          key={cell.iso}
                          onClick={() => {
                            setSelectedDate(cell.dateObj);
                            setViewMode('day');
                          }}
                          className={`min-h-[70px] sm:min-h-[90px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                            cell.isSelected
                              ? 'bg-blue-50 border-blue-400 shadow-sm ring-2 ring-blue-400/30'
                              : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs sm:text-sm font-extrabold ${
                                cell.isToday
                                  ? 'w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center'
                                  : 'text-slate-800'
                              }`}
                            >
                              {cell.dayNum}
                            </span>
                            {cell.txCount > 0 && (
                              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded-md">
                                {cell.txCount}
                              </span>
                            )}
                          </div>

                          <div className="space-y-0.5 text-[9px] sm:text-[10px]">
                            {cell.income > 0 && (
                              <div className="text-emerald-700 font-bold truncate">
                                +LKR {(cell.income / 1000).toFixed(0)}k
                              </div>
                            )}
                            {cell.expenses > 0 && (
                              <div className="text-rose-600 font-bold truncate">
                                -LKR {(cell.expenses / 1000).toFixed(0)}k
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ----------------- 4. YEAR VIEW ----------------- */}
              {viewMode === 'year' && (
                <div className="space-y-6">
                  {/* 12 Months Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {yearTrends.map((m, idx) => {
                      const net = (m.income || 0) - (m.expenses || 0);
                      const isPositive = net >= 0;

                      return (
                        <div
                          key={m.month}
                          onClick={() => {
                            const newD = new Date(selectedDate.getFullYear(), idx, 1);
                            setSelectedDate(newD);
                            setViewMode('month');
                          }}
                          className="bg-white rounded-3xl p-5 border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition">
                                {m.monthFull || m.month}
                              </h4>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isPositive
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-rose-50 text-rose-700'
                                }`}
                              >
                                {isPositive ? 'Surplus' : 'Deficit'}
                              </span>
                            </div>

                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400 font-medium">Income:</span>
                                <span className="font-extrabold text-emerald-600">
                                  LKR {(m.income || 0).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400 font-medium">Expenses:</span>
                                <span className="font-extrabold text-rose-600">
                                  LKR {(m.expenses || 0).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between items-center pt-2 border-t border-slate-100 font-bold">
                                <span className="text-slate-700">Net Flow:</span>
                                <span
                                  className={isPositive ? 'text-blue-700' : 'text-rose-600'}
                                >
                                  {isPositive ? '+' : ''}LKR {net.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-blue-600 font-bold">
                            <span>Open Month View</span>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Add / Edit Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setTransactionToEdit(null);
        }}
        onSuccess={() => {
          setIsAddModalOpen(false);
          setTransactionToEdit(null);
          fetchCalendarData();
        }}
        transactionToEdit={transactionToEdit}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(transactionToDelete)}
        title="Delete Transaction?"
        message={`Are you sure you want to delete "${transactionToDelete?.description}"? This action will immediately recalculate all calendar metrics.`}
        confirmLabel="Delete Transaction"
        cancelLabel="Cancel"
        isDangerous={true}
        loading={deleteLoading}
        onConfirm={handleDeleteTransaction}
        onCancel={() => setTransactionToDelete(null)}
      />
    </div>
  );
}
