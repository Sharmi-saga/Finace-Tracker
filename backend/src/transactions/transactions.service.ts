import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { FilterTransactionDto } from './dto/filter-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
  ) {}

  async findAll(userId: string, filter: FilterTransactionDto) {
    const userObjectId = new Types.ObjectId(userId);
    const query: any = { userId: userObjectId };

    if (filter.search && filter.search.trim() !== '') {
      const searchRegex = new RegExp(filter.search.trim(), 'i');
      query.$or = [{ description: searchRegex }, { notes: searchRegex }];
    }

    if (filter.accountId && filter.accountId !== 'all') {
      const accId = new Types.ObjectId(filter.accountId);
      query.$or = [{ accountId: accId }, { transferToAccountId: accId }];
    }

    if (filter.type && filter.type !== 'all') {
      query.type = filter.type;
    }

    if (filter.categoryId && filter.categoryId !== 'all') {
      query.categoryId = new Types.ObjectId(filter.categoryId);
    }

    // Month or Date Range filter
    let dateFilter: any = {};
    if (filter.startDate || filter.endDate) {
      if (filter.startDate) dateFilter.$gte = new Date(filter.startDate);
      if (filter.endDate) {
        const end = new Date(filter.endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
    } else if (filter.month && filter.month !== 'all') {
      const range = this.parseMonthRange(filter.month);
      if (range) {
        dateFilter = { $gte: range.start, $lte: range.end };
      }
    }

    if (Object.keys(dateFilter).length > 0) {
      query.date = dateFilter;
    }

    const page = parseInt(filter.page || '1', 10);
    const limit = parseInt(filter.limit || '10', 10);
    const skip = (page - 1) * limit;

    const sortBy = filter.sortBy || 'date';
    const sortOrder = filter.sortOrder === 'asc' ? 1 : -1;
    const sortObj: any = { [sortBy]: sortOrder };
    if (sortBy !== '_id') {
      sortObj._id = -1;
    }

    const [transactions, total] = await Promise.all([
      this.transactionModel
        .find(query)
        .populate('accountId', 'name type currency icon')
        .populate('transferToAccountId', 'name type currency icon')
        .populate('categoryId', 'name icon color type')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.transactionModel.countDocuments(query).exec(),
    ]);

    // Calculate aggregated metrics for the current filtered scope (or month)
    const metricsMatch: any = { userId: userObjectId };
    if (query.date) {
      metricsMatch.date = query.date;
    }
    if (filter.accountId && filter.accountId !== 'all') {
      metricsMatch.$or = [{ accountId: new Types.ObjectId(filter.accountId) }, { transferToAccountId: new Types.ObjectId(filter.accountId) }];
    }

    const metricsAgg = await this.transactionModel.aggregate([
      { $match: metricsMatch },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
        },
      },
    ]);

    let totalIncome = 0;
    let totalExpenses = 0;
    let totalTransfers = 0;

    for (const item of metricsAgg) {
      if (item._id === 'Income') totalIncome = item.total;
      if (item._id === 'Expense') totalExpenses = item.total;
      if (item._id === 'Transfer') totalTransfers = item.total;
    }

    const currentBalance = totalIncome - totalExpenses;

    return {
      data: transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      metrics: {
        totalIncome,
        totalExpenses,
        totalTransfers,
        currentBalance,
      },
    };
  }

  async findOne(id: string, userId: string) {
    const transaction = await this.transactionModel
      .findOne({ _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) })
      .populate('accountId', 'name type currency icon')
      .populate('transferToAccountId', 'name type currency icon')
      .populate('categoryId', 'name icon color type')
      .exec();

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }
    return transaction;
  }

  async create(userId: string, dto: CreateTransactionDto) {
    const created = new this.transactionModel({
      ...dto,
      userId: new Types.ObjectId(userId),
      accountId: new Types.ObjectId(dto.accountId),
      transferToAccountId: dto.transferToAccountId ? new Types.ObjectId(dto.transferToAccountId) : undefined,
      categoryId: dto.categoryId ? new Types.ObjectId(dto.categoryId) : undefined,
      date: new Date(dto.date),
    });

    const saved = await created.save();
    return this.findOne(saved._id.toString(), userId);
  }

  async update(id: string, userId: string, dto: UpdateTransactionDto) {
    const updateData: any = { ...dto };
    if (dto.accountId) updateData.accountId = new Types.ObjectId(dto.accountId);
    if (dto.transferToAccountId !== undefined) {
      updateData.transferToAccountId = dto.transferToAccountId ? new Types.ObjectId(dto.transferToAccountId) : null;
    }
    if (dto.categoryId !== undefined) {
      updateData.categoryId = dto.categoryId ? new Types.ObjectId(dto.categoryId) : null;
    }
    if (dto.date) updateData.date = new Date(dto.date);

    const transaction = await this.transactionModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
      { $set: updateData },
      { new: true },
    );

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return this.findOne(id, userId);
  }

  async delete(id: string, userId: string) {
    const res = await this.transactionModel.findOneAndDelete({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });
    if (!res) {
      throw new NotFoundException('Transaction not found');
    }
    return { message: 'Transaction deleted successfully' };
  }

  public parseMonthRange(monthStr: string) {
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    let year = 2026;
    let monthIndex = 8; // September

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
