import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  async getSummary(
    @CurrentUser('userId') userId: string,
    @Query('month') month?: string,
    @Query('accountId') accountId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getSummary(userId, { month, accountId, startDate, endDate });
  }

  @Get('income-expenses')
  async getIncomeExpenses(
    @CurrentUser('userId') userId: string,
    @Query('year') year?: string,
    @Query('accountId') accountId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getIncomeExpenses(userId, { year, accountId, startDate, endDate });
  }

  @Get('expense-breakdown')
  async getExpenseBreakdown(
    @CurrentUser('userId') userId: string,
    @Query('month') month?: string,
    @Query('accountId') accountId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getExpenseBreakdown(userId, { month, accountId, startDate, endDate });
  }

  @Get('account-summary')
  async getAccountSummary(
    @CurrentUser('userId') userId: string,
    @Query('month') month?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getAccountSummary(userId, { month, startDate, endDate });
  }

  @Get('monthly-summary')
  async getMonthlySummary(
    @CurrentUser('userId') userId: string,
    @Query('year') year?: string,
  ) {
    return this.reportsService.getMonthlySummary(userId, year);
  }
}
