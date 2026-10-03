import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Category {
  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  userId?: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, enum: ['Income', 'Expense', 'Both'], default: 'Expense' })
  type: string;

  @Prop({ default: 'Tag' })
  icon: string;

  @Prop({ default: '#8B5CF6' })
  color: string;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
CategorySchema.index({ userId: 1, name: 1 });
