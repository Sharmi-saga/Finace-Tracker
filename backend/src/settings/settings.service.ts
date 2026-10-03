import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Setting, SettingDocument } from './schemas/setting.schema';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(Setting.name) private settingModel: Model<SettingDocument>,
  ) {}

  async getSettings(userId: string) {
    const userObjectId = new Types.ObjectId(userId);
    let setting = await this.settingModel.findOne({ userId: userObjectId }).exec();
    if (!setting) {
      setting = new this.settingModel({
        userId: userObjectId,
        dateFormat: 'DD MMM YYYY',
        defaultCurrency: 'LKR',
        dashboardStartPage: 'Dashboard',
      });
      await setting.save();
    }
    return setting;
  }

  async updateSettings(userId: string, dto: UpdateSettingsDto) {
    const userObjectId = new Types.ObjectId(userId);
    let setting = await this.settingModel.findOneAndUpdate(
      { userId: userObjectId },
      { $set: dto },
      { new: true, upsert: true },
    );
    return setting;
  }
}
