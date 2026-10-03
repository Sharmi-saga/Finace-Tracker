import { Module } from '@nestjs/common';
import { ExportsService } from './exports.service';
import { ExportsController } from './exports.controller';
import { ReportsModule } from '../reports/reports.module';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [ReportsModule, TransactionsModule],
  providers: [ExportsService],
  controllers: [ExportsController],
})
export class ExportsModule {}
