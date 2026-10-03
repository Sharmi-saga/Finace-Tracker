import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  async findAll(userId: string) {
    const userObjectId = new Types.ObjectId(userId);
    return this.categoryModel
      .find({
        $or: [{ userId: userObjectId }, { userId: null }, { userId: { $exists: false } }],
      })
      .sort({ name: 1 })
      .exec();
  }

  async findById(id: string, userId: string) {
    const category = await this.categoryModel.findOne({
      _id: new Types.ObjectId(id),
      $or: [{ userId: new Types.ObjectId(userId) }, { userId: null }, { userId: { $exists: false } }],
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async create(userId: string, dto: CreateCategoryDto) {
    const created = new this.categoryModel({
      ...dto,
      userId: new Types.ObjectId(userId),
    });
    return created.save();
  }

  async update(id: string, userId: string, dto: Partial<CreateCategoryDto>) {
    const category = await this.categoryModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
      { $set: dto },
      { new: true },
    );
    if (!category) {
      throw new NotFoundException('Category not found or not editable');
    }
    return category;
  }

  async delete(id: string, userId: string) {
    const res = await this.categoryModel.findOneAndDelete({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });
    if (!res) {
      throw new NotFoundException('Category not found or cannot be deleted');
    }
    return { message: 'Category deleted successfully' };
  }
}
