import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Budget, BudgetSchema } from './schemas/budget.schema';
import { BudgetsService } from './budgets.service';
import { BudgetsController } from './budgets.controller';
import { Transaction, TransactionSchema } from '../transactions/schemas/transaction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Budget.name, schema: BudgetSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
  ],
  providers: [BudgetsService],
  controllers: [BudgetsController],
  exports: [BudgetsService, MongooseModule],
})
export class BudgetsModule {}
