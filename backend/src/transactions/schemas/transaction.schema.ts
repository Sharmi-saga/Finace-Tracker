import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Account', required: true, index: true })
  accountId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Account', required: false, index: true })
  transferToAccountId?: Types.ObjectId;

  @Prop({ required: true, enum: ['Income', 'Expense', 'Transfer'] })
  type: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: false, index: true })
  categoryId?: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ required: true, default: Date.now, index: true })
  date: Date;

  @Prop({ default: '' })
  notes: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ userId: 1, accountId: 1 });
TransactionSchema.index({ userId: 1, type: 1 });
TransactionSchema.index({ userId: 1, categoryId: 1 });
