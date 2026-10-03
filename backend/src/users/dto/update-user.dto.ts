import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  profileImage?: string;

  @IsOptional()
  @IsString()
  defaultCurrency?: string;

  @IsOptional()
  @IsString()
  dateFormat?: string;

  @IsOptional()
  @IsString()
  dashboardStartPage?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyTarget?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  yearlyTarget?: number;
}
