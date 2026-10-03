import { IsDateString, IsIn, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateTransactionDto {
  @IsNotEmpty()
  @IsString()
  accountId: string;

  @IsOptional()
  @IsString()
  transferToAccountId?: string;

  @IsNotEmpty()
  @IsIn(['Income', 'Expense', 'Transfer'])
  type: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
