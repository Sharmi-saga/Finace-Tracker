export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  profileImage?: string;
  defaultCurrency: string;
  dateFormat: string;
  dashboardStartPage: string;
  monthlyTarget?: number;
  yearlyTarget?: number;
};

export type Account = {
  _id: string;
  userId: string;
  name: string;
  type: 'Personal' | 'Business';
  currency: string;
  description: string;
  icon: string;
  status: 'Active' | 'Inactive';
  income?: number;
  expenses?: number;
  balance?: number;
  netRemaining?: number;
  createdAt: string;
  updatedAt: string;
};

export type Category = {
  _id: string;
  userId?: string;
  name: string;
  type: 'Income' | 'Expense' | 'Both';
  icon: string;
  color: string;
};

export type Transaction = {
  _id: string;
  userId: string;
  accountId: Account | string;
  transferToAccountId?: Account | string;
  type: 'Income' | 'Expense' | 'Transfer';
  categoryId?: Category | string;
  amount: number;
  description: string;
  date: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type TransactionListResponse = {
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  metrics: {
    totalIncome: number;
    totalExpenses: number;
    totalTransfers: number;
    currentBalance: number;
  };
};

export type Budget = {
  _id: string;
  userId: string;
  type: 'Category' | 'Account';
  accountId?: Account | string;
  categoryId?: Category | string;
  period: string;
  amount: number;
  notes?: string;
  alertEnabled: boolean;
  alertThreshold: number;
  spent?: number;
  remaining?: number;
  percentage?: number;
  status?: string;
  isAlert?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BudgetReview = {
  period: string;
  totalBudget: number;
  totalSpent: number;
  remainingBudget: number;
  achievement: number;
  message: string;
  accountBudgets: Budget[];
  categoryBudgets: Budget[];
};

export type ReportSummary = {
  period: string;
  totalIncome: number;
  totalExpenses: number;
  totalTransfers: number;
  netRemaining: number;
  averageSpend: number;
  monthlyTarget: number;
  yearlyTarget: number;
  targetAchieved: number;
  targetRemaining: number;
  yearlyIncome: number;
  yearlyTargetAchieved: number;
  yearlyTargetRemaining: number;
  spendingDays: number;
};

export type ExpenseBreakdownItem = {
  categoryId: string;
  categoryName: string;
  color: string;
  icon: string;
  amount: number;
  count: number;
  percentage: number;
};

export type MonthlyIncomeExpense = {
  month: string;
  monthFull: string;
  income: number;
  expenses: number;
  netRemaining: number;
};

export type AccountSummaryItem = {
  id: string;
  name: string;
  type: string;
  currency: string;
  icon: string;
  income: number;
  expenses: number;
  netRemaining: number;
  status: string;
};

export type MonthlySummaryItem = {
  month: string;
  income: number;
  expenses: number;
  netRemaining: number;
  budgetUsed: string;
  totalBudget: number;
};
