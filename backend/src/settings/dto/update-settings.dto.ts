import { IsOptional, IsString } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  dateFormat?: string;

  @IsOptional()
  @IsString()
  defaultCurrency?: string;

  @IsOptional()
  @IsString()
  dashboardStartPage?: string;
}
