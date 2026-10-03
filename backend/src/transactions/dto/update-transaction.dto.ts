import { IsDateString, IsIn, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class UpdateTransactionDto {
  @IsOptional()
  @IsString()
  accountId?: string;

  @IsOptional()
  @IsString()
  transferToAccountId?: string;

  @IsOptional()
  @IsIn(['Income', 'Expense', 'Transfer'])
  type?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
