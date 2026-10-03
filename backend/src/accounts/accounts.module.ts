import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Account, AccountSchema } from './schemas/account.schema';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { Transaction, TransactionSchema } from '../transactions/schemas/transaction.schema';
import { Budget, BudgetSchema } from '../budgets/schemas/budget.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Account.name, schema: AccountSchema },
      { name: Transaction.name, schema: TransactionSchema },
      { name: Budget.name, schema: BudgetSchema },
    ]),
  ],
  providers: [AccountsService],
  controllers: [AccountsController],
  exports: [AccountsService, MongooseModule],
})
export class AccountsModule {}
