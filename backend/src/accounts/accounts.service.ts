import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Account, AccountDocument } from './schemas/account.schema';
import { Transaction, TransactionDocument } from '../transactions/schemas/transaction.schema';
import { Budget, BudgetDocument } from '../budgets/schemas/budget.schema';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
  constructor(
    @InjectModel(Account.name) private accountModel: Model<AccountDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
    @InjectModel(Budget.name) private budgetModel: Model<BudgetDocument>,
  ) {}

  async findAll(userId: string) {
    const userObjectId = new Types.ObjectId(userId);
    const accounts = await this.accountModel.find({ userId: userObjectId }).sort({ createdAt: 1 }).exec();

    // Calculate dynamic metrics for each account
    const accountsWithMetrics = await Promise.all(
      accounts.map(async (acc) => {
        const metrics = await this.getAccountMetrics(userId, acc._id.toString());
        return {
          ...acc.toObject(),
          income: metrics.income,
          expenses: metrics.expenses,
          balance: metrics.balance,
        };
      }),
    );

    return accountsWithMetrics;
  }

  async findOne(id: string, userId: string, monthStr?: string) {
    const userObjectId = new Types.ObjectId(userId);
    const accObjectId = new Types.ObjectId(id);

    const account = await this.accountModel.findOne({
      _id: accObjectId,
      userId: userObjectId,
    });
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    // Lifetime metrics for overall balance
    const lifetimeMetrics = await this.getAccountMetrics(userId, id);

    // Month metrics for active period
    const effectiveMonth = monthStr || 'September 2026';
    const monthMetrics = await this.getAccountMetrics(userId, id, effectiveMonth);

    // Budget for this account in the requested month
    const budget = await this.budgetModel.findOne({
      userId: userObjectId,
      type: 'Account',
      accountId: accObjectId,
      period: effectiveMonth,
    });

    const budgetAmount = budget ? budget.amount : (monthMetrics.income > 0 ? monthMetrics.income : 0);
    const spent = monthMetrics.expenses;
    const remaining = budget ? (budget.amount - spent) : (monthMetrics.income - spent);
    const utilization = budgetAmount > 0 ? Math.round((spent / budgetAmount) * 100) : 0;

    return {
      ...account.toObject(),
      balance: lifetimeMetrics.balance,
      income: monthMetrics.income,
      expenses: monthMetrics.expenses,
      netRemaining: monthMetrics.income - monthMetrics.expenses,
      budgetAmount,
      spent,
      remaining,
      utilization,
    };
  }

  async create(userId: string, dto: CreateAccountDto) {
    const account = new this.accountModel({
      ...dto,
      userId: new Types.ObjectId(userId),
    });
    return account.save();
  }

  async update(id: string, userId: string, dto: UpdateAccountDto) {
    const account = await this.accountModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
      { $set: dto },
      { new: true },
    );
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    return account;
  }

  async toggleStatus(id: string, userId: string) {
    const account = await this.accountModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    account.status = account.status === 'Active' ? 'Inactive' : 'Active';
    return account.save();
  }

  async delete(id: string, userId: string) {
    // Also remove or flag associated transactions
    const account = await this.accountModel.findOneAndDelete({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    // Delete transactions associated with this account
    await this.transactionModel.deleteMany({
      userId: new Types.ObjectId(userId),
      $or: [{ accountId: new Types.ObjectId(id) }, { transferToAccountId: new Types.ObjectId(id) }],
    });

    return { message: 'Account and associated transactions deleted successfully' };
  }

  async getAccountMetrics(userId: string, accountId: string, monthStr?: string) {
    const userObjectId = new Types.ObjectId(userId);
    const accObjectId = new Types.ObjectId(accountId);

    const matchConditions: any = { userId: userObjectId };
    if (monthStr) {
      // monthStr like "2026-09" or "September 2026"
      const dateRange = this.parseMonthRange(monthStr);
      if (dateRange) {
        matchConditions.date = { $gte: dateRange.start, $lte: dateRange.end };
      }
    }

    // Income
    const incomeAgg = await this.transactionModel.aggregate([
      {
        $match: {
          ...matchConditions,
          accountId: accObjectId,
          type: 'Income',
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const income = incomeAgg[0]?.total || 0;

    // Expenses
    const expenseAgg = await this.transactionModel.aggregate([
      {
        $match: {
          ...matchConditions,
          accountId: accObjectId,
          type: 'Expense',
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const expenses = expenseAgg[0]?.total || 0;

    // Transfers out
    const transferOutAgg = await this.transactionModel.aggregate([
      {
        $match: {
          ...matchConditions,
          accountId: accObjectId,
          type: 'Transfer',
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const transfersOut = transferOutAgg[0]?.total || 0;

    // Transfers in
    const transferInAgg = await this.transactionModel.aggregate([
      {
        $match: {
          ...matchConditions,
          transferToAccountId: accObjectId,
          type: 'Transfer',
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const transfersIn = transferInAgg[0]?.total || 0;

    const balance = income - expenses + transfersIn - transfersOut;

    return {
      income,
      expenses,
      transfersIn,
      transfersOut,
      balance,
    };
  }

  private parseMonthRange(monthStr: string) {
    // E.g. "September 2026" or "2026-09"
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    let year = 2026;
    let monthIndex = 8; // September default

    if (monthStr.includes('-')) {
      const parts = monthStr.split('-');
      year = parseInt(parts[0], 10);
      monthIndex = parseInt(parts[1], 10) - 1;
    } else {
      const parts = monthStr.toLowerCase().split(' ');
      const mIdx = months.indexOf(parts[0]);
      if (mIdx !== -1) monthIndex = mIdx;
      if (parts[1]) year = parseInt(parts[1], 10);
    }

    const start = new Date(year, monthIndex, 1);
    const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }
}
