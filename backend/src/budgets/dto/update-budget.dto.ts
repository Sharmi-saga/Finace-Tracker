import { IsBoolean, IsIn, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class UpdateBudgetDto {
  @IsOptional()
  @IsIn(['Category', 'Account'])
  type?: string;

  @IsOptional()
  @IsString()
  accountId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  period?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

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
