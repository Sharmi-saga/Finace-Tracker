import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ExportsService } from './exports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('exports')
@UseGuards(JwtAuthGuard)
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get('report/pdf')
  async exportPdf(
    @CurrentUser('userId') userId: string,
    @Query('month') month: string,
    @Query('accountId') accountId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response,
  ) {
    const period = month || (startDate && endDate ? `${startDate}|${endDate}` : 'September 2026');
    const buffer = await this.exportsService.generatePdf(userId, { month: period, accountId, startDate, endDate });
    const filename = `Finance-Tracker-Report-${period.replace(/\s+/g, '-').replace(/\|/g, '_')}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('report/excel')
  async exportExcel(
    @CurrentUser('userId') userId: string,
    @Query('month') month: string,
    @Query('accountId') accountId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response,
  ) {
    const period = month || (startDate && endDate ? `${startDate}|${endDate}` : 'September 2026');
    const buffer = await this.exportsService.generateExcel(userId, { month: period, accountId, startDate, endDate });
    const filename = `Finance-Tracker-Report-${period.replace(/\s+/g, '-').replace(/\|/g, '_')}.xlsx`;

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}
