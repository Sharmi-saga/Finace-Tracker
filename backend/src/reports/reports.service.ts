import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transaction, TransactionDocument } from '../transactions/schemas/transaction.schema';
import { Account, AccountDocument } from '../accounts/schemas/account.schema';
import { Budget, BudgetDocument } from '../budgets/schemas/budget.schema';
import { Category, CategoryDocument } from '../categories/schemas/category.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectModel(Account.name) private accountModel: Model<AccountDocument>,
    @InjectModel(Budget.name) private budgetModel: Model<BudgetDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async getSummary(userId: string, query: { month?: string; accountId?: string; startDate?: string; endDate?: string }) {
    const userObjectId = new Types.ObjectId(userId);
    const match: any = { userId: userObjectId };

    const fallbackMonth = query.startDate && query.endDate
      ? `${new Date(query.startDate).toLocaleString('en-US', { month: 'long' })} ${new Date(query.startDate).getFullYear()}`
      : query.month || `${new Date().toLocaleString('en-US', { month: 'long' })} ${new Date().getFullYear()}`;

    if (query.accountId && query.accountId !== 'all') {
      const accId = new Types.ObjectId(query.accountId);
      match.$or = [{ accountId: accId }, { transferToAccountId: accId }];
    }

    if (query.startDate || query.endDate) {
      match.date = this.getDateRange(query.startDate, query.endDate);
    } else if (query.month && query.month !== 'all') {
      const range = this.parseMonthRange(query.month || fallbackMonth);
      match.date = { $gte: range.start, $lte: range.end };
    }

    // Aggregate income, expenses, transfers
    const agg = await this.transactionModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    let totalIncome = 0;
    let totalExpenses = 0;
    let totalTransfers = 0;

    for (const item of agg) {
      if (item._id === 'Income') totalIncome = item.total;
      if (item._id === 'Expense') totalExpenses = item.total;
      if (item._id === 'Transfer') totalTransfers = item.total;
    }

    const netRemaining = totalIncome - totalExpenses;

    // Calculate distinct spending days for accurate Average Spend
    const expenseDaysAgg = await this.transactionModel.aggregate([
      { $match: { ...match, type: 'Expense' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        },
      },
      { $count: 'spendingDays' },
    ]);
    const spendingDays = expenseDaysAgg[0]?.spendingDays || 1;
    const averageSpend = totalExpenses > 0 ? Math.round(totalExpenses / (spendingDays || 1)) : 0;

    const user = await this.userModel.findById(userObjectId).select('monthlyTarget yearlyTarget').exec();
    const monthlyTarget = user?.monthlyTarget || 0;
    const yearlyTarget = user?.yearlyTarget || 0;
    const year = query.startDate
      ? new Date(query.startDate).getFullYear()
      : new Date().getFullYear();
    const yearlyIncomeAgg = await this.transactionModel.aggregate([
      {
        $match: {
          userId: userObjectId,
          type: 'Income',
          date: {
            $gte: new Date(year, 0, 1),
            $lte: new Date(year, 11, 31, 23, 59, 59, 999),
          },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const yearlyIncome = yearlyIncomeAgg[0]?.total || 0;
    const isFullYearFilter =
      query.startDate === `${year}-01-01` && query.endDate === `${year}-12-31`;
    const activeTarget = isFullYearFilter ? yearlyTarget : monthlyTarget;
    const activeIncome = isFullYearFilter ? yearlyIncome : totalIncome;
    const targetAchieved = activeTarget > 0 ? Math.round((activeIncome / activeTarget) * 100) : 0;
    const targetRemaining = Math.max(0, activeTarget - activeIncome);

    return {
      period: query.month || fallbackMonth,
      totalIncome,
      totalExpenses,
      totalTransfers,
      netRemaining,
      averageSpend,
      monthlyTarget,
      yearlyTarget,
      targetAchieved,
      targetRemaining,
      yearlyIncome,
      yearlyTargetAchieved: yearlyTarget > 0 ? Math.round((yearlyIncome / yearlyTarget) * 100) : 0,
      yearlyTargetRemaining: Math.max(0, yearlyTarget - yearlyIncome),
      spendingDays,
    };
  }

  async getIncomeExpenses(
    userId: string,
    query: { year?: string; accountId?: string; startDate?: string; endDate?: string },
  ) {
    const userObjectId = new Types.ObjectId(userId);
    const year = Number.parseInt(query.year || '', 10) || new Date().getFullYear();
    const start = query.startDate ? this.parseDateInput(query.startDate) : new Date(year, 0, 1);
    const end = query.endDate
      ? this.parseDateInput(query.endDate, true)
      : new Date(year, 11, 31, 23, 59, 59, 999);

    const match: any = {
      userId: userObjectId,
      date: { $gte: start, $lte: end },
    };

    if (query.accountId && query.accountId !== 'all') {
      const accId = new Types.ObjectId(query.accountId);
      match.$or = [{ accountId: accId }, { transferToAccountId: accId }];
    }

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const agg = await this.transactionModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            year: { $year: { date: '$date', timezone } },
            month: { $month: { date: '$date', timezone } },
            type: '$type',
          },
          total: { $sum: '$amount' },
        },
      },
    ]);

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const result = [];
    const bucket = new Date(start.getFullYear(), start.getMonth(), 1);
    const lastBucket = new Date(end.getFullYear(), end.getMonth(), 1);
    while (bucket <= lastBucket) {
      const bucketYear = bucket.getFullYear();
      const bucketMonth = bucket.getMonth() + 1;
      const incItem = agg.find((a) => a._id.year === bucketYear && a._id.month === bucketMonth && a._id.type === 'Income');
      const expItem = agg.find((a) => a._id.year === bucketYear && a._id.month === bucketMonth && a._id.type === 'Expense');
      const inc = incItem?.total || 0;
      const exp = expItem?.total || 0;
      result.push({
        month: `${monthShort[bucket.getMonth()]} ${String(bucketYear).slice(-2)}`,
        monthFull: `${monthNames[bucket.getMonth()]} ${bucketYear}`,
        income: inc,
        expenses: exp,
        netRemaining: inc - exp,
      });
      bucket.setMonth(bucket.getMonth() + 1);
    }

    return result;
  }

  async getExpenseBreakdown(userId: string, query: { month?: string; accountId?: string; startDate?: string; endDate?: string }) {
    const userObjectId = new Types.ObjectId(userId);
    const match: any = { userId: userObjectId, type: 'Expense' };

    if (query.accountId && query.accountId !== 'all') {
      match.accountId = new Types.ObjectId(query.accountId);
    }

    if (query.startDate || query.endDate) {
      match.date = this.getDateRange(query.startDate, query.endDate);
    } else {
      const range = this.parseMonthRange(query.month || `${new Date().toLocaleString('en-US', { month: 'long' })} ${new Date().getFullYear()}`);
      match.date = { $gte: range.start, $lte: range.end };
    }

    const agg = await this.transactionModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$categoryId',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const totalExpense = agg.reduce((acc, curr) => acc + curr.total, 0);

    const categories = await this.categoryModel.find().exec();
    const catMap = new Map<string, any>();
    for (const c of categories) {
      catMap.set(c._id.toString(), c);
    }

    const items = agg.map((item) => {
      const catId = item._id ? item._id.toString() : 'other';
      const cat = catMap.get(catId);
      const percentage = totalExpense > 0 ? Math.round((item.total / totalExpense) * 100) : 0;
      return {
        categoryId: catId,
        categoryName: cat?.name || 'Other',
        color: cat?.color || '#8B5CF6',
        icon: cat?.icon || 'Tag',
        amount: item.total,
        count: item.count,
        percentage,
      };
    });

    return {
      period: query.month || `${new Date().toLocaleString('en-US', { month: 'long' })} ${new Date().getFullYear()}`,
      totalExpenses: totalExpense,
      breakdown: items,
    };
  }

  async getAccountSummary(userId: string, queryParam?: string | { month?: string; startDate?: string; endDate?: string }) {
    const userObjectId = new Types.ObjectId(userId);
    const accounts = await this.accountModel.find({ userId: userObjectId }).exec();
    
    let dateFilter: any = {};
    if (typeof queryParam === 'object' && (queryParam?.startDate || queryParam?.endDate)) {
      dateFilter = this.getDateRange(queryParam.startDate, queryParam.endDate);
    } else {
      const monthStr = typeof queryParam === 'string' ? queryParam : (queryParam?.month || `${new Date().toLocaleString('en-US', { month: 'long' })} ${new Date().getFullYear()}`);
      const range = this.parseMonthRange(monthStr);
      dateFilter = { $gte: range.start, $lte: range.end };
    }

    const summaries = await Promise.all(
      accounts.map(async (acc) => {
        const accId = acc._id;

        const incomeAgg = await this.transactionModel.aggregate([
          {
            $match: {
              userId: userObjectId,
              accountId: accId,
              type: 'Income',
              date: dateFilter,
            },
          },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const income = incomeAgg[0]?.total || 0;

        const expenseAgg = await this.transactionModel.aggregate([
          {
            $match: {
              userId: userObjectId,
              accountId: accId,
              type: 'Expense',
              date: dateFilter,
            },
          },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const expenses = expenseAgg[0]?.total || 0;
        const netRemaining = income - expenses;

        let status = 'On Track';
        if (expenses > income && income > 0) {
          status = 'Over Budget';
        } else if (expenses > 0 && income === 0) {
          status = 'Deficit';
        } else if (income === 0 && expenses === 0) {
          status = 'Inactive';
        }

        return {
          id: acc._id,
          name: acc.name,
          type: acc.type,
          currency: acc.currency,
          icon: acc.icon,
          income,
          expenses,
          netRemaining,
          status,
        };
      }),
    );

    return summaries;
  }

  async getMonthlySummary(userId: string, yearStr: string = String(new Date().getFullYear())) {
    const userObjectId = new Types.ObjectId(userId);
    const year = parseInt(yearStr, 10) || new Date().getFullYear();

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const results = await Promise.all(
      monthNames.map(async (monthName, index) => {
        const periodStr = `${monthName} ${year}`;
        const start = new Date(year, index, 1);
        const end = new Date(year, index + 1, 0, 23, 59, 59, 999);

        const agg = await this.transactionModel.aggregate([
          {
            $match: {
              userId: userObjectId,
              date: { $gte: start, $lte: end },
            },
          },
          {
            $group: {
              _id: '$type',
              total: { $sum: '$amount' },
            },
          },
        ]);

        let income = 0;
        let expenses = 0;
        for (const item of agg) {
          if (item._id === 'Income') income = item.total;
          if (item._id === 'Expense') expenses = item.total;
        }

        // Check budget for that month
        const budgetAgg = await this.budgetModel.aggregate([
          { $match: { userId: userObjectId, period: periodStr } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const totalBudget = budgetAgg[0]?.total || 500000;
        const budgetUsed = totalBudget > 0 ? `${Math.round((expenses / totalBudget) * 100)}%` : '0%';

        return {
          month: periodStr,
          income,
          expenses,
          netRemaining: income - expenses,
          budgetUsed,
          totalBudget,
        };
      }),
    );

    return results;
  }

  private parseMonthRange(monthStr: string) {
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    let year = new Date().getFullYear();
    let monthIndex = new Date().getMonth();

    if (monthStr.includes('-')) {
      const parts = monthStr.split('-');
      year = parseInt(parts[0], 10) || new Date().getFullYear();
      monthIndex = (parseInt(parts[1], 10) || new Date().getMonth() + 1) - 1;
    } else {
      const parts = monthStr.toLowerCase().split(' ');
      const mIdx = months.indexOf(parts[0]);
      if (mIdx !== -1) monthIndex = mIdx;
      if (parts[1]) year = parseInt(parts[1], 10) || new Date().getFullYear();
    }

    const start = new Date(year, monthIndex, 1);
    const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }

  private getDateRange(startDate?: string, endDate?: string) {
    const range: { $gte?: Date; $lte?: Date } = {};
    if (startDate) range.$gte = this.parseDateInput(startDate);
    if (endDate) range.$lte = this.parseDateInput(endDate, true);
    return range;
  }

  private parseDateInput(value: string, endOfDay = false) {
    const [year, month, day] = value.split('-').map(Number);
    return endOfDay
      ? new Date(year, month - 1, day, 23, 59, 59, 999)
      : new Date(year, month - 1, day);
  }
}
