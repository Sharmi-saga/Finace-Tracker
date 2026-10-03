import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BudgetDocument = Budget & Document;

@Schema({ timestamps: true })
export class Budget {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: ['Category', 'Account'] })
  type: string;

  @Prop({ type: Types.ObjectId, ref: 'Account', required: false, index: true })
  accountId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: false, index: true })
  categoryId?: Types.ObjectId;

  @Prop({ required: true, trim: true, index: true })
  period: string; // e.g. "September 2026" or "2026-09"

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ default: '' })
  notes: string;

  @Prop({ default: true })
  alertEnabled: boolean;

  @Prop({ default: 80 })
  alertThreshold: number;
}

export const BudgetSchema = SchemaFactory.createForClass(Budget);
BudgetSchema.index({ userId: 1, period: 1 });
BudgetSchema.index({ userId: 1, type: 1, period: 1 });
