import { IsBoolean, IsIn, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreateBudgetDto {
  @IsNotEmpty()
  @IsIn(['Category', 'Account'])
  type: string;

  @IsOptional()
  @IsString()
  accountId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsNotEmpty()
  @IsString()
  period: string; // e.g. "September 2026"

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  alertEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  alertThreshold?: number;
}
