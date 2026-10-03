'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  TrendingDown,
  Scale,
  CreditCard,
  RefreshCw,
  Filter,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import Sidebar from '../../components/layout/Sidebar';
import MobileNav from '../../components/layout/MobileNav';
import Header from '../../components/layout/Header';
import MetricCard from '../../components/ui/MetricCard';
import StatusBadge from '../../components/ui/StatusBadge';
import api from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import {
  Account,
  ReportSummary,
  ExpenseBreakdownItem,
  MonthlyIncomeExpense,
  AccountSummaryItem,
  MonthlySummaryItem,
} from '../../types';

export default function ReportsPage() {
  const { selectedMonth, dateFilter } = useAuth();

  const [selectedAccount, setSelectedAccount] = useState('all');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [incomeExpenses, setIncomeExpenses] = useState<MonthlyIncomeExpense[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<ExpenseBreakdownItem[]>([]);
  const [totalExpense, setTotalExpense] = useState(0);
  const [accountSummary, setAccountSummary] = useState<AccountSummaryItem[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummaryItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [chartError, setChartError] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const reportRequestId = useRef(0);

  useEffect(() => {
    api.get('/accounts').then((res) => setAccounts(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [selectedMonth, dateFilter, selectedAccount]);

  const fetchReportData = async () => {
    const requestId = ++reportRequestId.current;
    setLoading(true);
    setChartError(false);
    try {
      const params = new URLSearchParams();
      if (selectedAccount !== 'all') params.append('accountId', selectedAccount);
      if (dateFilter?.startDate && dateFilter?.endDate) {
        params.append('startDate', dateFilter.startDate);
        params.append('endDate', dateFilter.endDate);
      }
      params.append('month', dateFilter?.month || selectedMonth);

      const selectedYear = dateFilter?.startDate
        ? Number(dateFilter.startDate.slice(0, 4))
        : new Date().getFullYear();
      const chartParams = new URLSearchParams({ year: String(selectedYear) });
      if (dateFilter?.startDate) chartParams.append('startDate', dateFilter.startDate);
      if (dateFilter?.endDate) chartParams.append('endDate', dateFilter.endDate);
      if (selectedAccount !== 'all') chartParams.append('accountId', selectedAccount);
      const [sumRes, barRes, pieRes, accSumRes, monthSumRes] = await Promise.all([
        api.get(`/reports/summary?${params.toString()}`),
        api.get(`/reports/income-expenses?${chartParams.toString()}`),
        api.get(`/reports/expense-breakdown?${params.toString()}`),
        api.get(`/reports/account-summary?${params.toString()}`),
        api.get(`/reports/monthly-summary?year=${selectedYear}`),
      ]);

      if (requestId !== reportRequestId.current) return;
      setSummary(sumRes.data);
      setIncomeExpenses(barRes.data);
      setExpenseBreakdown(pieRes.data.breakdown || []);
      setTotalExpense(pieRes.data.totalExpenses || 0);
      setAccountSummary(accSumRes.data);
      setMonthlySummary(monthSumRes.data);
    } catch (err) {
      console.error('Error fetching report data:', err);
      if (requestId === reportRequestId.current) {
        setIncomeExpenses([]);
        setChartError(true);
      }
    } finally {
      if (requestId === reportRequestId.current) setLoading(false);
    }
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      const dateLabel = dateFilter?.label || selectedMonth;
      const startDate = dateFilter?.startDate || undefined;
      const endDate = dateFilter?.endDate || undefined;
      const reportPeriod = startDate && endDate ? `${startDate}|${endDate}` : dateLabel;
      const accParam = selectedAccount !== 'all' ? `&accountId=${selectedAccount}` : '';
      const rangeParam = startDate && endDate ? `&startDate=${startDate}&endDate=${endDate}` : '';
      const res = await api.get(
        `/exports/report/pdf?month=${encodeURIComponent(reportPeriod)}${rangeParam}${accParam}`,
        { responseType: 'blob' },
      );
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Finance-Report-${dateLabel.replace(/\s+/g, '-')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      const dateLabel = dateFilter?.label || selectedMonth;
      const startDate = dateFilter?.startDate || undefined;
      const endDate = dateFilter?.endDate || undefined;
      const reportPeriod = startDate && endDate ? `${startDate}|${endDate}` : dateLabel;
      const accParam = selectedAccount !== 'all' ? `&accountId=${selectedAccount}` : '';
      const rangeParam = startDate && endDate ? `&startDate=${startDate}&endDate=${endDate}` : '';
      const res = await api.get(
        `/exports/report/excel?month=${encodeURIComponent(reportPeriod)}${rangeParam}${accParam}`,
        {
          responseType: 'blob',
        },
      );
      const url = window.URL.createObjectURL(
        new Blob([res.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
      );
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Finance-Report-${dateLabel.replace(/\s+/g, '-')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to export Excel:', err);
    } finally {
      setExportingExcel(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-10">
        <MobileNav />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Header */}
          <Header
            title="Reports"
            subtitle="Review your income, expenses and overall financial performance."
            rightAction={
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportPdf}
                  disabled={exportingPdf}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs sm:text-sm font-bold shadow-sm transition disabled:opacity-50"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>{exportingPdf ? 'Exporting...' : 'Export PDF'}</span>
                </button>
                <button
                  onClick={handleExportExcel}
                  disabled={exportingExcel}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-200 transition disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>{exportingExcel ? 'Exporting...' : 'Export Excel'}</span>
                </button>
              </div>
            }
          />

          {/* Account Filter Dropdown */}
          <div className="flex items-center gap-3 mb-6 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm max-w-sm">
            <Filter className="w-4 h-4 text-blue-600 ml-1" />
            <span className="text-xs font-bold text-slate-500">Filter Account:</span>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold text-slate-800 outline-none cursor-pointer flex-1"
            >
              <option value="all">All Accounts</option>
              {accounts.map((acc) => (
                <option key={acc._id} value={acc._id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="p-16 text-center text-slate-400 flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
              <span className="text-sm font-medium">Generating financial reports...</span>
            </div>
          ) : (
            <>
              {/* Report Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <MetricCard
                  title="Total Income"
                  amount={summary?.totalIncome || 0}
                  variant="income"
                  icon={TrendingUp}
                  subtitle={dateFilter?.label || selectedMonth}
                />
                <MetricCard
                  title="Total Expenses"
                  amount={summary?.totalExpenses || 0}
                  variant="expense"
                  icon={TrendingDown}
                  subtitle={dateFilter?.label || selectedMonth}
                />
                <MetricCard
                  title="Net Remaining"
                  amount={summary?.netRemaining || 0}
                  variant="balance"
                  icon={Scale}
                  subtitle="Income - Expenses"
                />
                <MetricCard
                  title="Average Spend"
                  amount={summary?.averageSpend || 0}
                  variant="neutral"
                  icon={CreditCard}
                  subtitle="Per spending day"
                />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Bar Chart: Income vs Expenses (2 cols) */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                  <div>
                    <h2 className="text-base lg:text-lg font-bold text-slate-900">
                      Income vs Expenses
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {dateFilter?.label || selectedMonth} cashflow performance
                    </p>
                  </div>

                  <div className="h-72 w-full mt-4">
                    {chartError ? (
                      <div className="h-full flex items-center justify-center text-sm text-rose-500">
                        Unable to load chart data. Please try again.
                      </div>
                    ) : incomeExpenses.some((item) => item.income > 0 || item.expenses > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={incomeExpenses}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                          <XAxis
                            dataKey="month"
                            stroke="#94A3B8"
                            fontSize={11}
                            tickLine={false}
                            axisLine={{ stroke: '#E2E8F0' }}
                          />
                          <YAxis
                            stroke="#94A3B8"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(val) => `${val / 1000}k`}
                          />
                          <Tooltip
                            formatter={(value: any) => [`LKR ${Number(value).toLocaleString()}`]}
                            contentStyle={{
                              backgroundColor: '#FFFFFF',
                              borderRadius: '1rem',
                              border: '1px solid #E2E8F0',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                            }}
                          />
                          <Legend
                            wrapperStyle={{ paddingTop: '10px' }}
                            iconType="circle"
                            formatter={(value) => (
                              <span className="text-xs font-semibold text-slate-600">{value}</span>
                            )}
                          />
                          <Bar
                            dataKey="income"
                            name="Income"
                            fill="#10B981"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={28}
                          />
                          <Bar
                            dataKey="expenses"
                            name="Expenses"
                            fill="#F43F5E"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={28}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-sm text-slate-400">
                        No income or expenses for this date range.
                      </div>
                    )}
                  </div>
                </div>

                {/* Donut Chart: Expense Breakdown (1 col) */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] flex flex-col justify-between">
                  <div>
                    <h2 className="text-base lg:text-lg font-bold text-slate-900">
                      Expense Breakdown
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Category allocation for {dateFilter?.label || selectedMonth}
                    </p>
                  </div>

                  <div className="h-56 relative flex items-center justify-center my-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseBreakdown}
                          dataKey="amount"
                          nameKey="categoryName"
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={90}
                          paddingAngle={3}
                        >
                          {expenseBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any) => [`LKR ${Number(value).toLocaleString()}`]}
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Donut Center */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                        Total
                      </span>
                      <span className="text-base font-extrabold text-slate-900">
                        LKR {totalExpense.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Legend list */}
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {expenseBreakdown.map((item) => (
                      <div
                        key={item.categoryId}
                        className="flex items-center justify-between text-xs py-0.5"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="font-semibold text-slate-700 truncate max-w-[120px]">
                            {item.categoryName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-slate-400">{item.percentage}%</span>
                          <span className="font-bold text-slate-900">
                            LKR {item.amount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section: Account Summary Table / Cards */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] mb-8">
                <div className="mb-4">
                  <h2 className="text-base lg:text-lg font-bold text-slate-900">Account Summary</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Individual account performance for {dateFilter?.label || selectedMonth}
                  </p>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="py-3 px-5">Account</th>
                        <th className="py-3 px-5 text-right">Income</th>
                        <th className="py-3 px-5 text-right">Expenses</th>
                        <th className="py-3 px-5 text-right">Net Remaining</th>
                        <th className="py-3 px-5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {accountSummary.map((acc) => (
                        <tr key={acc.id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3 px-5 font-bold text-slate-900">
                            <div className="flex items-center gap-2">
                              <span>{acc.name}</span>
                              <span className="text-[10px] text-slate-400 font-normal px-1.5 py-0.5 rounded bg-slate-100">
                                {acc.type}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-5 text-right font-bold text-emerald-600">
                            LKR {acc.income.toLocaleString()}
                          </td>
                          <td className="py-3 px-5 text-right font-bold text-rose-600">
                            LKR {acc.expenses.toLocaleString()}
                          </td>
                          <td className="py-3 px-5 text-right font-extrabold text-slate-900">
                            LKR {acc.netRemaining.toLocaleString()}
                          </td>
                          <td className="py-3 px-5 text-center">
                            <StatusBadge status={acc.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {accountSummary.map((acc) => (
                    <div
                      key={acc.id}
                      className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">{acc.name}</span>
                        <StatusBadge status={acc.status} />
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-slate-200/60">
                        <div>
                          <span className="text-slate-400 text-[10px] block">Income</span>
                          <span className="font-bold text-emerald-600">
                            {acc.income.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Expenses</span>
                          <span className="font-bold text-rose-600">
                            {acc.expenses.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Net</span>
                          <span className="font-extrabold text-slate-900">
                            {acc.netRemaining.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section: Monthly Summary */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)]">
                <div className="mb-4">
                  <h2 className="text-base lg:text-lg font-bold text-slate-900">Monthly Summary</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{new Date().getFullYear()} month-by-month financial trail</p>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="py-3 px-5">Month</th>
                        <th className="py-3 px-5 text-right">Income</th>
                        <th className="py-3 px-5 text-right">Expenses</th>
                        <th className="py-3 px-5 text-right">Net Remaining</th>
                        <th className="py-3 px-5 text-center">Budget Used</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {monthlySummary.map((m) => (
                        <tr key={m.month} className="hover:bg-slate-50/60 transition">
                          <td className="py-3 px-5 font-bold text-slate-900">{m.month}</td>
                          <td className="py-3 px-5 text-right font-bold text-emerald-600">
                            LKR {m.income.toLocaleString()}
                          </td>
                          <td className="py-3 px-5 text-right font-bold text-rose-600">
                            LKR {m.expenses.toLocaleString()}
                          </td>
                          <td className="py-3 px-5 text-right font-extrabold text-slate-900">
                            LKR {m.netRemaining.toLocaleString()}
                          </td>
                          <td className="py-3 px-5 text-center">
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              {m.budgetUsed}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {monthlySummary.map((m) => (
                    <div
                      key={m.month}
                      className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">{m.month}</span>
                        <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                          {m.budgetUsed}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-slate-200/60">
                        <div>
                          <span className="text-slate-400 text-[10px] block">Income</span>
                          <span className="font-bold text-emerald-600">
                            {m.income.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Expenses</span>
                          <span className="font-bold text-rose-600">
                            {m.expenses.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Net</span>
                          <span className="font-extrabold text-slate-900">
                            {m.netRemaining.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
