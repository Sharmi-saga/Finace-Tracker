import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(userData: Partial<User>): Promise<UserDocument> {
    const user = new this.userModel(userData);
    return user.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).select('-passwordHash').exec();
  }

  async findByIdWithPassword(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByResetToken(token: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        resetToken: token,
        resetTokenExpires: { $gt: new Date() },
      })
      .exec();
  }

  async update(id: string, updateDto: UpdateUserDto): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { $set: updateDto }, { new: true })
      .select('-passwordHash')
      .exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async save(user: UserDocument): Promise<UserDocument> {
    return user.save();
  }
}
