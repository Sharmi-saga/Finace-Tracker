import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('budgets')
@UseGuards(JwtAuthGuard)
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  async findAll(@CurrentUser('userId') userId: string, @Query('period') period?: string) {
    return this.budgetsService.findAll(userId, period);
  }

  @Get('review')
  async getReview(
    @CurrentUser('userId') userId: string,
    @Query('period') period?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.budgetsService.getReview(userId, period, startDate, endDate);
  }

  @Get(':id')
  async findOne(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.budgetsService.findOne(id, userId);
  }

  @Post()
  async create(@CurrentUser('userId') userId: string, @Body() dto: CreateBudgetDto) {
    return this.budgetsService.create(userId, dto);
  }

  @Patch(':id')
  async update(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBudgetDto,
  ) {
    return this.budgetsService.update(id, userId, dto);
  }

  @Delete(':id')
  async delete(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.budgetsService.delete(id, userId);
  }
}
