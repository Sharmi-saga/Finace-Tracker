import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SettingDocument = Setting & Document;

@Schema({ timestamps: true })
export class Setting {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true, index: true })
  userId: Types.ObjectId;

  @Prop({ default: 'DD MMM YYYY' })
  dateFormat: string;

  @Prop({ default: 'LKR' })
  defaultCurrency: string;

  @Prop({ default: 'Dashboard' })
  dashboardStartPage: string;
}

export const SettingSchema = SchemaFactory.createForClass(Setting);
