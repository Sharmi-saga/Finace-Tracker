import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { FilterTransactionDto } from './dto/filter-transaction.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  async findAll(
    @CurrentUser('userId') userId: string,
    @Query() filter: FilterTransactionDto,
  ) {
    return this.transactionsService.findAll(userId, filter);
  }

  @Get(':id')
  async findOne(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.transactionsService.findOne(id, userId);
  }

  @Post()
  async create(@CurrentUser('userId') userId: string, @Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(userId, dto);
  }

  @Patch(':id')
  async update(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.transactionsService.update(id, userId, dto);
  }

  @Delete(':id')
  async delete(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.transactionsService.delete(id, userId);
  }
}
