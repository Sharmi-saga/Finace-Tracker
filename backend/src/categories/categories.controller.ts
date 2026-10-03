import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async findAll(@CurrentUser('userId') userId: string) {
    return this.categoriesService.findAll(userId);
  }

  @Post()
  async create(@CurrentUser('userId') userId: string, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(userId, dto);
  }

  @Patch(':id')
  async update(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateCategoryDto>,
  ) {
    return this.categoriesService.update(id, userId, dto);
  }

  @Delete(':id')
  async delete(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.categoriesService.delete(id, userId);
  }
}
