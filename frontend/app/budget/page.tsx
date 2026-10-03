'use client';

import React, { useEffect, useState } from 'react';
import {
  PlusCircle,
  PiggyBank,
  TrendingDown,
  Scale,
  AlertTriangle,
  Pencil,
  Trash2,
  Calendar,
  Layers,
  Building2,
  RefreshCw,
} from 'lucide-react';
import Sidebar from '../../components/layout/Sidebar';
import MobileNav from '../../components/layout/MobileNav';
import Header from '../../components/layout/Header';
import MetricCard from '../../components/ui/MetricCard';
import AchievementRing from '../../components/ui/AchievementRing';
import StatusBadge from '../../components/ui/StatusBadge';
import SetBudgetModal from '../../components/modals/SetBudgetModal';
import ConfirmDialog from '../../components/modals/ConfirmDialog';
import api from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { Budget, BudgetReview } from '../../types';

export default function BudgetPage() {
  const { selectedMonth, dateFilter } = useAuth();

  const [review, setReview] = useState<BudgetReview | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isSetModalOpen, setIsSetModalOpen] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<Budget | null>(null);
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchBudgets();
  }, [selectedMonth, dateFilter]);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFilter?.startDate && dateFilter?.endDate) {
        params.append('startDate', dateFilter.startDate);
        params.append('endDate', dateFilter.endDate);
      }
      const period = dateFilter && dateFilter.mode !== 'month'
        ? `${dateFilter.mode}|${dateFilter.startDate}|${dateFilter.endDate}`
        : dateFilter?.month || selectedMonth;
      params.append('period', period);

      const [reviewRes, listRes] = await Promise.all([
        api.get(`/budgets/review?${params.toString()}`),
        api.get(`/budgets?${params.toString()}`),
      ]);
      setReview(reviewRes.data);
      setBudgets(listRes.data);
    } catch (err) {
      console.error('Error fetching budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (b: Budget) => {
    setBudgetToEdit(b);
    setIsSetModalOpen(true);
  };

  const budgetDefaultPeriod = dateFilter?.mode === 'year'
    ? `year|${dateFilter.startDate}|${dateFilter.endDate}`
    : dateFilter?.mode && dateFilter.mode !== 'month'
      ? `${dateFilter.mode}|${dateFilter.startDate}|${dateFilter.endDate}`
      : selectedMonth;

  const handleDeleteConfirm = async () => {
    if (!budgetToDelete) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/budgets/${budgetToDelete._id}`);
      setBudgetToDelete(null);
      fetchBudgets();
    } catch (err) {
      console.error('Error deleting budget:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const accountBudgets = budgets.filter((b) => b.type === 'Account');
  const categoryBudgets = budgets.filter((b) => b.type === 'Category');

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-10">
        <MobileNav />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Header */}
          <Header
            title="Budget"
            subtitle="Plan and control your monthly spending."
            rightAction={
              <button
                onClick={() => {
                  setBudgetToEdit(null);
                  setIsSetModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-200 transition"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Set Budget</span>
              </button>
            }
          />

          {loading ? (
            <div className="p-16 text-center text-slate-400 flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
              <span className="text-sm font-medium">Loading budget data...</span>
            </div>
          ) : (
            <>
              {/* Section 1: Budget Review & Achieved */}
              <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] mb-8">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                  {/* Left: Info & Metrics */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                        Monthly Spending Control
                      </span>
                      <h2 className="text-xl lg:text-2xl font-bold text-slate-900 mt-0.5">
                        Budget Review &amp; Achieved
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">
                        Tracking expenditure against active target ceilings for {dateFilter?.label || selectedMonth}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                      <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block">
                          Total Budget
                        </span>
                        <span className="text-xl font-extrabold text-slate-900 mt-1 block">
                          LKR {(review?.totalBudget || 0).toLocaleString()}
                        </span>
                      </div>

                      <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 block">
                          Total Spent
                        </span>
                        <span className="text-xl font-extrabold text-slate-900 mt-1 block">
                          LKR {(review?.totalSpent || 0).toLocaleString()}
                        </span>
                      </div>

                      <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
                          Remaining Budget
                        </span>
                        <span className="text-xl font-extrabold text-slate-900 mt-1 block">
                          LKR {(review?.remainingBudget || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-600 font-medium">
                      {review?.message || 'Set a budget to see spending progress for this period.'}
                    </div>
                  </div>

                  {/* Right: Circular Ring */}
                  {/* <div className="flex flex-col items-center justify-center p-4 bg-slate-50/60 rounded-3xl border border-slate-100 min-w-[200px]">
                    <AchievementRing
                      percentage={review?.achievement ?? 0}
                      size={150}
                      strokeWidth={14}
                      label="Budget used"
                      sublabel="spent / budget"
                      color={
                        (review?.achievement || 0) >= 100
                          ? '#EF4444'
                          : (review?.achievement || 0) >= 80
                          ? '#F59E0B'
                          : '#2563EB'
                      }
                      trackColor="#DBEAFE"
                    />
                    <span className="text-xs font-bold text-slate-700 mt-2">
                      {review?.achievement ?? 0}% of budget used
                    </span>
                  </div> */}
                </div>
              </div>

              {/* Section 2: Monthly Budget Overview (by Account) */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Monthly Budget Overview
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Account spending limits</p>
                  </div>
                </div>

                {accountBudgets.length === 0 ? (
                  <div className="bg-white rounded-3xl p-8 text-center border border-slate-100">
                    <p className="text-xs text-slate-400">No account budgets set for this month.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {accountBudgets.map((b: any) => {
                      const accName = b.accountId?.name || 'Account';
                      const pct = b.percentage || 0;
                      return (
                        <div
                          key={b._id}
                          className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.03)] flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-bold text-slate-900 text-sm">{accName}</h3>
                              <StatusBadge status={b.status || 'On Track'} />
                            </div>

                            {/* Percentage & Progress */}
                            <div className="flex items-baseline justify-between mb-1.5">
                              <span className="text-2xl font-black text-slate-900">{pct}%</span>
                              {b.isAlert && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>Alert</span>
                                </span>
                              )}
                            </div>

                            <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden mb-4">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  pct >= 100
                                    ? 'bg-rose-500'
                                    : pct >= 80
                                    ? 'bg-amber-500'
                                    : 'bg-purple-600'
                                }`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>

                            <div className="space-y-1.5 text-xs pt-2 border-t border-slate-100">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Budget:</span>
                                <span className="font-bold text-slate-800">
                                  LKR {b.amount.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Spent:</span>
                                <span className="font-bold text-rose-600">
                                  LKR {(b.spent || 0).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Remaining:</span>
                                <span className="font-bold text-emerald-600">
                                  LKR {(b.remaining || 0).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-slate-100">
                            <button
                              onClick={() => handleEditClick(b)}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-lg transition"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => setBudgetToDelete(b)}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Section 3: Category Budgets */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Category Budgets</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Limits by spending category</p>
                  </div>
                </div>

                {categoryBudgets.length === 0 ? (
                  <div className="bg-white rounded-3xl p-8 text-center border border-slate-100">
                    <p className="text-xs text-slate-400">No category budgets defined for this month.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {categoryBudgets.map((b: any) => {
                      const catName = b.categoryId?.name || 'Category';
                      const pct = b.percentage || 0;
                      return (
                        <div
                          key={b._id}
                          className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.03)] flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-bold text-slate-900 text-sm">{catName}</h3>
                              <StatusBadge status={b.status || 'On Track'} />
                            </div>

                            <div className="flex items-baseline justify-between mb-1.5">
                              <span className="text-2xl font-black text-slate-900">{pct}%</span>
                              {b.isAlert && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>Alert</span>
                                </span>
                              )}
                            </div>

                            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mb-4">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  pct >= 100
                                    ? 'bg-rose-500'
                                    : pct >= 80
                                    ? 'bg-amber-500'
                                    : 'bg-purple-600'
                                }`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>

                            <div className="space-y-1 text-xs pt-2 border-t border-slate-100">
                              <div className="flex justify-between">
                                <span className="text-slate-400">Budget:</span>
                                <span className="font-bold text-slate-800">
                                  LKR {b.amount.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Spent:</span>
                                <span className="font-bold text-rose-600">
                                  LKR {(b.spent || 0).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Remaining:</span>
                                <span className="font-bold text-emerald-600">
                                  LKR {(b.remaining || 0).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-slate-100">
                            <button
                              onClick={() => handleEditClick(b)}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-lg transition"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => setBudgetToDelete(b)}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Set / Edit Budget Modal */}
      <SetBudgetModal
        isOpen={isSetModalOpen}
        onClose={() => {
          setIsSetModalOpen(false);
          setBudgetToEdit(null);
        }}
        onSuccess={fetchBudgets}
        budgetToEdit={budgetToEdit}
        defaultPeriod={budgetDefaultPeriod}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!budgetToDelete}
        title="Delete Budget?"
        message="Are you sure you want to delete this budget ceiling? This will remove the threshold alert."
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setBudgetToDelete(null)}
        loading={deleteLoading}
      />
    </div>
  );
}
