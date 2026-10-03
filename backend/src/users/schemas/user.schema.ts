import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ default: 'Founder / CEO' })
  role: string;

  @Prop({ default: '' })
  profileImage: string;

  @Prop({ default: 'LKR' })
  defaultCurrency: string;

  @Prop({ default: 'DD MMM YYYY' })
  dateFormat: string;

  @Prop({ default: 'Dashboard' })
  dashboardStartPage: string;

  @Prop({ default: 0, min: 0 })
  monthlyTarget: number;

  @Prop({ default: 0, min: 0 })
  yearlyTarget: number;

  @Prop()
  resetToken?: string;

  @Prop()
  resetTokenExpires?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
