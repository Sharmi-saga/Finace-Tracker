import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Budget, BudgetDocument } from './schemas/budget.schema';
import { Transaction, TransactionDocument } from '../transactions/schemas/transaction.schema';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectModel(Budget.name) private budgetModel: Model<BudgetDocument>,
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
  ) {}

  async findAll(userId: string, period?: string) {
    const userObjectId = new Types.ObjectId(userId);
    const query: any = { userId: userObjectId };
    if (period && period !== 'all') {
      const rangeParts = period.split('|');
      if (rangeParts.length === 3 && rangeParts[0] === 'year') {
        const year = new Date(`${rangeParts[1]}T00:00:00`).getFullYear();
        const monthPattern = 'Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?';
        query.$or = [
          { period: { $regex: `^(?:${monthPattern})[\\s-]+${year}$`, $options: 'i' } },
          { period: { $regex: `^${year}-(?:0[1-9]|1[0-2])$` } },
          { period: { $regex: `^year\\|${year}-` } },
          { period: String(year) },
        ];
      } else {
        query.period = period;
      }
    }

    const budgets = await this.budgetModel
      .find(query)
      .populate('accountId', 'name type currency icon')
      .populate('categoryId', 'name icon color type')
      .sort({ createdAt: -1 })
      .exec();

    // Dynamically compute spent and status for each budget
    const enriched = await Promise.all(
      budgets.map(async (b) => {
        const spent = await this.calculateSpent(userId, b);
        const remaining = b.amount - spent;
        const percentage = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;

        let status = 'On Track';
        if (percentage === 0) status = 'Not Started';
        else if (percentage < 80) status = 'On Track';
        else if (percentage <= 100) status = 'High Usage';
        else status = 'Over Budget';

        const isAlert = b.alertEnabled && percentage >= (b.alertThreshold || 80);

        return {
          ...b.toObject(),
          spent,
          remaining,
          percentage,
          status,
          isAlert,
        };
      }),
    );

    return enriched;
  }

  async getReview(userId: string, period: string = `${new Date().toLocaleString('en-US', { month: 'long' })} ${new Date().getFullYear()}`, startDate?: string, endDate?: string) {
    const userObjectId = new Types.ObjectId(userId);
    const budgets = await this.findAll(userId, period);

    // Filter account budgets or category budgets to find totalBudget
    const categoryBudgets = budgets.filter((b) => b.type === 'Category');
    const accountBudgets = budgets.filter((b) => b.type === 'Account');

    // Total budget: prefer account budgets sum, or category budgets sum, or total sum
    const yearRange = period.split('|');
    const isYear = yearRange.length === 3 && yearRange[0] === 'year';
    const totalBudget = isYear
      ? this.sumYearBudgets(budgets)
      : accountBudgets.length > 0
        ? accountBudgets.reduce((acc, curr) => acc + curr.amount, 0)
        : categoryBudgets.length > 0
          ? categoryBudgets.reduce((acc, curr) => acc + curr.amount, 0)
          : budgets.reduce((acc, curr) => acc + curr.amount, 0);

    // Total actual spent from transactions in this period or custom range
    let dateFilter: any = {};
    if (startDate || endDate) {
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
    } else {
      const range = this.parseMonthRange(period);
      dateFilter = { $gte: range.start, $lte: range.end };
    }

    const spentAgg = await this.transactionModel.aggregate([
      {
        $match: {
          userId: userObjectId,
          type: 'Expense',
          date: dateFilter,
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const totalSpent = spentAgg[0]?.total || 0;
    const remainingBudget = totalBudget - totalSpent;
    const achievement = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

    let message = `You're ${achievement}% towards your monthly budget target. Keep going! You're on track.`;
    if (achievement >= 100) {
      message = `You've utilized 100%+ of your monthly budget. Watch out for additional expenses!`;
    } else if (achievement >= 80) {
      message = `High budget utilization at ${achievement}%. Stay disciplined for the rest of the month.`;
    }

    return {
      period,
      totalBudget,
      totalSpent,
      remainingBudget,
      achievement,
      message,
      accountBudgets,
      categoryBudgets,
    };
  }

  async findOne(id: string, userId: string) {
    const budget = await this.budgetModel
      .findOne({ _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) })
      .populate('accountId', 'name type currency icon')
      .populate('categoryId', 'name icon color type')
      .exec();

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    const spent = await this.calculateSpent(userId, budget);
    const remaining = budget.amount - spent;
    const percentage = budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0;

    return {
      ...budget.toObject(),
      spent,
      remaining,
      percentage,
    };
  }

  async create(userId: string, dto: CreateBudgetDto) {
    const budget = new this.budgetModel({
      ...dto,
      userId: new Types.ObjectId(userId),
      accountId: dto.accountId ? new Types.ObjectId(dto.accountId) : undefined,
      categoryId: dto.categoryId ? new Types.ObjectId(dto.categoryId) : undefined,
    });
    const saved = await budget.save();
    return this.findOne(saved._id.toString(), userId);
  }

  async update(id: string, userId: string, dto: UpdateBudgetDto) {
    const updateData: any = { ...dto };
    if (dto.accountId !== undefined) {
      updateData.accountId = dto.accountId ? new Types.ObjectId(dto.accountId) : null;
    }
    if (dto.categoryId !== undefined) {
      updateData.categoryId = dto.categoryId ? new Types.ObjectId(dto.categoryId) : null;
    }

    const budget = await this.budgetModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
      { $set: updateData },
      { new: true },
    );

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    return this.findOne(id, userId);
  }

  async delete(id: string, userId: string) {
    const res = await this.budgetModel.findOneAndDelete({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });
    if (!res) {
      throw new NotFoundException('Budget not found');
    }
    return { message: 'Budget deleted successfully' };
  }

  private async calculateSpent(userId: string, budget: BudgetDocument): Promise<number> {
    const range = this.parseMonthRange(budget.period);
    const match: any = {
      userId: new Types.ObjectId(userId),
      type: 'Expense',
      date: { $gte: range.start, $lte: range.end },
    };

    const accId = (budget.accountId as any)?._id || budget.accountId;
    if (budget.type === 'Account' && accId) {
      match.accountId = new Types.ObjectId(accId.toString());
    }
    const catId = (budget.categoryId as any)?._id || budget.categoryId;
    if (budget.type === 'Category' && catId) {
      match.categoryId = new Types.ObjectId(catId.toString());
    }

    const agg = await this.transactionModel.aggregate([
      { $match: match },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    return agg[0]?.total || 0;
  }

  private sumYearBudgets(
    budgets: Pick<Budget, 'type' | 'accountId' | 'categoryId' | 'period' | 'amount'>[],
  ): number {
    const totalsByTarget = new Map<string, { annual: number; monthly: number }>();
    for (const budget of budgets) {
      const targetId = budget.type === 'Account'
        ? ((budget.accountId as any)?._id || budget.accountId)?.toString()
        : ((budget.categoryId as any)?._id || budget.categoryId)?.toString();
      if (!targetId) continue;
      const key = `${budget.type}:${targetId}`;
      const totals = totalsByTarget.get(key) || { annual: 0, monthly: 0 };
      if (budget.period.startsWith('year|')) {
        totals.annual += budget.amount;
      } else {
        totals.monthly += budget.amount;
      }
      totalsByTarget.set(key, totals);
    }
    return Array.from(totalsByTarget.values()).reduce(
      (total, value) => total + (value.annual > 0 ? value.annual : value.monthly),
      0,
    );
  }

  private parseMonthRange(periodStr: string) {
    const rangeParts = periodStr.split('|');
    if (
      rangeParts.length === 3 &&
      ['day', 'week', 'year', 'custom'].includes(rangeParts[0]) &&
      /^\d{4}-\d{2}-\d{2}$/.test(rangeParts[1]) &&
      /^\d{4}-\d{2}-\d{2}$/.test(rangeParts[2])
    ) {
      const start = new Date(`${rangeParts[1]}T00:00:00`);
      const end = new Date(`${rangeParts[2]}T23:59:59.999`);
      return { start, end };
    }

    const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    let year = new Date().getFullYear();
    let monthIndex = new Date().getMonth();

    if (periodStr.includes('-')) {
      const parts = periodStr.split('-');
      year = parseInt(parts[0], 10);
      monthIndex = parseInt(parts[1], 10) - 1;
    } else {
      const parts = periodStr.toLowerCase().split(' ');
      const mIdx = months.indexOf(parts[0]);
      if (mIdx !== -1) monthIndex = mIdx;
      if (parts[1]) year = parseInt(parts[1], 10);
    }

    const start = new Date(year, monthIndex, 1);
    const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }
}
