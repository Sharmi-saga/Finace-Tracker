import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsIn(['Personal', 'Business'])
  type?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsIn(['Active', 'Inactive'])
  status?: string;
}
