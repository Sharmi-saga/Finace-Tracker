import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AccountDocument = Account & Document;

@Schema({ timestamps: true })
export class Account {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, enum: ['Personal', 'Business'], default: 'Personal' })
  type: string;

  @Prop({ required: true, default: 'LKR', uppercase: true })
  currency: string;

  @Prop({ default: '', maxlength: 100 })
  description: string;

  @Prop({ default: 'Wallet' })
  icon: string;

  @Prop({ required: true, enum: ['Active', 'Inactive'], default: 'Active' })
  status: string;
}

export const AccountSchema = SchemaFactory.createForClass(Account);
AccountSchema.index({ userId: 1, name: 1 });
