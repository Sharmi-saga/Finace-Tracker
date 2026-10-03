import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  async findAll(@CurrentUser('userId') userId: string) {
    return this.accountsService.findAll(userId);
  }

  @Get(':id')
  async findOne(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Query('month') month?: string,
  ) {
    return this.accountsService.findOne(id, userId, month);
  }

  @Post()
  async create(@CurrentUser('userId') userId: string, @Body() dto: CreateAccountDto) {
    return this.accountsService.create(userId, dto);
  }

  @Patch(':id')
  async update(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.accountsService.update(id, userId, dto);
  }

  @Patch(':id/status')
  async toggleStatus(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.accountsService.toggleStatus(id, userId);
  }

  @Delete(':id')
  async delete(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.accountsService.delete(id, userId);
  }
}
