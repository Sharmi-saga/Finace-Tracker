import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getSettings(@CurrentUser('userId') userId: string) {
    return this.settingsService.getSettings(userId);
  }

  @Patch()
  async updateSettings(
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateSettingsDto,
  ) {
    return this.settingsService.updateSettings(userId, dto);
  }
}
